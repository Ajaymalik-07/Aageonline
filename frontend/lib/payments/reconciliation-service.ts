/**
 * AageOnline — Payment Reconciliation Engine
 *
 * Discovers unresolved payment orders and reconciles them against provider verification evidence.
 *
 * FINANCIAL INVARIANTS:
 * 1. Only independently verified provider responses can confirm a payment.
 * 2. Inconclusive or failed verification NEVER advances ranking.
 * 3. Never call PayU inside a ranking settlement database transaction.
 * 4. Amount and currency must match expected values exactly.
 * 5. Successful reconciliation enqueues idempotent settlement recovery.
 */

import { isDatabaseConfigured, assertProductionPersistence } from '../db/client.ts';
import { PostgresPaymentRepository } from '../db/repositories/payment-repository.ts';
import { PostgresReconciliationRunRepository, type ReconciliationTriggerSource } from '../db/repositories/reconciliation-run-repository.ts';
import { verifyPayUPayment } from './payu/verification.ts';
import { evaluatePaymentTransition } from './state-machine.ts';
import { enqueueSettlementRecoveryJob } from '../ranking-settlement/recovery-service.ts';
import { recordAuditEvent } from '../audit/store.ts';
import type { PaymentOrder, PaymentOrderStatus } from '../../types/payment.ts';
import {
  getPaymentOrderInternal,
  updatePaymentOrderStatusInternal,
  getAllPaymentOrdersInternal,
  confirmPaymentOrderAsync,
} from './store.ts';

export interface PaymentReconciliationResult {
  runId: string;
  candidateCount: number;
  confirmedCount: number;
  failedCount: number;
  inconclusiveCount: number;
  details: Array<{
    paymentOrderId: string;
    providerTransactionId?: string;
    outcome: 'CONFIRMED' | 'FAILED' | 'INCONCLUSIVE' | 'ALREADY_FINAL' | 'AMOUNT_MISMATCH';
    error?: string;
  }>;
}

const paymentRepo = new PostgresPaymentRepository();
const runRepo = new PostgresReconciliationRunRepository();

/**
 * Runs a bounded payment reconciliation cycle across unresolved orders.
 */
export async function runPaymentReconciliationCycle(
  options: {
    batchSize?: number;
    olderThanMinutes?: number;
    triggerSource?: ReconciliationTriggerSource;
    actorUserId?: string;
  } = {}
): Promise<PaymentReconciliationResult> {
  assertProductionPersistence();

  const batchSize = Math.min(100, options.batchSize || 20);
  const olderThanMinutes = options.olderThanMinutes !== undefined ? options.olderThanMinutes : 2;
  const triggerSource = options.triggerSource || 'SCHEDULED';
  const actorUserId = options.actorUserId || 'system-reconciler-worker';

  const runId = `run_pay_rec_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;

  // 1. Create durable run record
  await runRepo.createRun({
    id: runId,
    runType: 'PAYMENT_RECONCILIATION',
    triggerSource,
    status: 'RUNNING',
    startedAt: new Date().toISOString(),
    candidateCount: 0,
    processedCount: 0,
    successfulCount: 0,
    retryableCount: 0,
    permanentFailedCount: 0,
    summary: {},
    actorUserId,
  });

  const result: PaymentReconciliationResult = {
    runId,
    candidateCount: 0,
    confirmedCount: 0,
    failedCount: 0,
    inconclusiveCount: 0,
    details: [],
  };

  try {
    // 2. Discover unresolved candidates
    let candidates: PaymentOrder[] = [];

    if (isDatabaseConfigured()) {
      candidates = await paymentRepo.getUnresolvedPayments(batchSize, olderThanMinutes);
    } else {
      // In-memory fallback for local dev / tests
      const now = Date.now();
      const cutoff = now - olderThanMinutes * 60 * 1000;
      candidates = getAllPaymentOrdersInternal()
        .filter((o) => (o.status === 'PENDING' || o.status === 'CREATED' || o.status === 'SUCCEEDED') && new Date(o.createdAt).getTime() <= cutoff)
        .slice(0, batchSize);
    }

    result.candidateCount = candidates.length;

    // 3. Process each candidate
    for (const order of candidates) {
      const outcome = await reconcileSingleOrderInternal(order, actorUserId);
      result.details.push({
        paymentOrderId: order.id,
        providerTransactionId: order.providerTransactionId,
        outcome: outcome.status,
        error: outcome.error,
      });

      if (outcome.status === 'CONFIRMED') {
        result.confirmedCount++;
      } else if (outcome.status === 'FAILED' || outcome.status === 'AMOUNT_MISMATCH') {
        result.failedCount++;
      } else if (outcome.status === 'INCONCLUSIVE') {
        result.inconclusiveCount++;
      }
    }

    // 4. Finalize run record
    await runRepo.completeRun(runId, {
      candidateCount: result.candidateCount,
      processedCount: result.details.length,
      successfulCount: result.confirmedCount,
      retryableCount: result.inconclusiveCount,
      permanentFailedCount: result.failedCount,
      summary: {
        confirmedCount: result.confirmedCount,
        failedCount: result.failedCount,
        inconclusiveCount: result.inconclusiveCount,
      },
    });

    return result;
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    await runRepo.failRun(runId, errorMsg);
    throw err;
  }
}

/**
 * Reconciles a single specific payment order on-demand (e.g. from admin control panel).
 */
export async function reconcileSinglePaymentOrder(
  paymentOrderId: string,
  actorUserId: string
): Promise<{
  paymentOrderId: string;
  outcome: 'CONFIRMED' | 'FAILED' | 'INCONCLUSIVE' | 'ALREADY_FINAL' | 'AMOUNT_MISMATCH';
  previousStatus: PaymentOrderStatus;
  newStatus: PaymentOrderStatus;
  error?: string;
}> {
  assertProductionPersistence();

  let order: PaymentOrder | null = null;

  if (isDatabaseConfigured()) {
    order = await paymentRepo.getPaymentOrderById(paymentOrderId);
  } else {
    order = getPaymentOrderInternal(paymentOrderId) || null;
  }

  if (!order) {
    throw new Error(`Payment order "${paymentOrderId}" not found.`);
  }

  const previousStatus = order.status;
  const outcome = await reconcileSingleOrderInternal(order, actorUserId);

  // Reload order to obtain new status
  let updatedOrder: PaymentOrder | null = null;
  if (isDatabaseConfigured()) {
    updatedOrder = await paymentRepo.getPaymentOrderById(paymentOrderId);
  } else {
    updatedOrder = getPaymentOrderInternal(paymentOrderId) || null;
  }

  return {
    paymentOrderId,
    outcome: outcome.status,
    previousStatus,
    newStatus: updatedOrder?.status || previousStatus,
    error: outcome.error,
  };
}

/**
 * Internal single order reconciliation handler.
 */
async function reconcileSingleOrderInternal(
  order: PaymentOrder,
  actorUserId: string
): Promise<{
  status: 'CONFIRMED' | 'FAILED' | 'INCONCLUSIVE' | 'ALREADY_FINAL' | 'AMOUNT_MISMATCH';
  error?: string;
}> {
  // If order was webhook-verified to SUCCEEDED, confirm it and enqueue settlement recovery
  if (order.status === 'SUCCEEDED') {
    const updated = await confirmPaymentOrderAsync(order.id, actorUserId);
    order = updated || order;
    await enqueueSettlementRecoveryJob(order.id, order.marketId, order.businessId);
    return { status: 'CONFIRMED' };
  }

  // If already in final state, no further reconciliation
  if (order.status === 'CONFIRMED' || order.status === 'FAILED' || order.status === 'CANCELLED') {
    return { status: 'ALREADY_FINAL' };
  }

  const txnid = order.providerTransactionId;
  if (!txnid || txnid.trim().length === 0) {
    return { status: 'INCONCLUSIVE', error: 'Missing provider transaction reference' };
  }

  // OUTSIDE any database ranking transaction, invoke provider verification
  const verification = await verifyPayUPayment(txnid);

  if (verification.status === 'SUCCESS') {
    // Financial amount and currency verification
    if (verification.amountMinor !== undefined && verification.amountMinor !== order.amountMinor) {
      recordAuditEvent('PAYMENT_RECONCILIATION_CONFLICT', 'PaymentOrder', order.id, actorUserId, {
        reason: 'Provider amount does not match expected amount',
        expectedMinor: order.amountMinor,
        providerMinor: verification.amountMinor,
        txnid,
      });
      return {
        status: 'AMOUNT_MISMATCH',
        error: `Amount mismatch: expected ${order.amountMinor} paise, provider reported ${verification.amountMinor} paise`,
      };
    }

    if (verification.currency && verification.currency !== order.currency) {
      return {
        status: 'AMOUNT_MISMATCH',
        error: `Currency mismatch: expected ${order.currency}, provider reported ${verification.currency}`,
      };
    }

    // Apply state transition
    const transition = evaluatePaymentTransition(order.status, 'CONFIRMED');
    if (transition.type === 'VALID') {
      const nowIso = new Date().toISOString();
      if (isDatabaseConfigured()) {
        await paymentRepo.updatePaymentOrderStatus(order.id, 'CONFIRMED', {
          paidAt: nowIso,
          providerPaymentId: verification.providerPaymentId || undefined,
        });
      } else {
        updatePaymentOrderStatusInternal(order.id, 'CONFIRMED', {
          paidAt: nowIso,
          providerPaymentId: verification.providerPaymentId || undefined,
        });
      }

      recordAuditEvent('PAYMENT_CONFIRMED_VIA_RECONCILIATION', 'PaymentOrder', order.id, actorUserId, {
        provider: 'PAYU',
        txnid,
        providerPaymentId: verification.providerPaymentId,
      });

      // Enqueue ranking recovery immediately
      await enqueueSettlementRecoveryJob(order.id, order.marketId, order.businessId);

      return { status: 'CONFIRMED' };
    } else if (transition.type === 'DUPLICATE') {
      return { status: 'ALREADY_FINAL' };
    } else {
      return { status: 'INCONCLUSIVE', error: transition.error.message };
    }
  } else if (verification.status === 'FAILURE') {
    // If provider explicitly confirms failure (and not network error)
    if (verification.rawStatus !== 'TIMEOUT' && verification.rawStatus !== 'NETWORK_ERROR') {
      const transition = evaluatePaymentTransition(order.status, 'FAILED');
      if (transition.type === 'VALID') {
        if (isDatabaseConfigured()) {
          await paymentRepo.updatePaymentOrderStatus(order.id, 'FAILED');
        } else {
          updatePaymentOrderStatusInternal(order.id, 'FAILED');
        }

        recordAuditEvent('PAYMENT_FAILED_VIA_RECONCILIATION', 'PaymentOrder', order.id, actorUserId, {
          provider: 'PAYU',
          txnid,
          rawStatus: verification.rawStatus,
        });

        return { status: 'FAILED' };
      }
    }

    // Transient failure (network/timeout) -> keep PENDING for next retry
    return { status: 'INCONCLUSIVE', error: `Provider returned transient failure: ${verification.rawStatus}` };
  } else {
    // PENDING or NOT_FOUND -> leave in unresolved state for next cycle
    return { status: 'INCONCLUSIVE', error: `Provider status is ${verification.status}` };
  }
}
