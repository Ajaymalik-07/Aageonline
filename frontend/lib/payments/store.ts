/**
 * AageOnline — Authoritative Payment Order Domain Store
 * Orchestrates:
 * - PaymentOrder lifecycle & state transitions
 * - PayU integration & checkout generation
 * - Webhook processing & reverse-hash verification
 * - Duplicate event protection & idempotency boundary
 * - Security audit trails
 *
 * CRITICAL INVARIANT:
 * Payment verification executes ZERO ranking mutation and ZERO PositionHistory creation.
 */
import { createHash } from 'crypto';
import type {
  CancelPaymentOrderInput,
  CreatePaymentOrderInput,
  PaymentOrder,
  PaymentOrderStatus,
  PaymentOrderResult,
  PaymentProviderEvent,
} from '../../types/payment.ts';
import { assertAuthorized } from '../auth/rbac.ts';
import { getMembership } from '../memberships/store.ts';
import { getBidIntentInternal, getBidIntentInternalAsync } from '../bid-intent/store.ts';
import { recordAuditEvent } from '../audit/store.ts';
import {
  PaymentAmountMismatchError,
  PaymentBidIntentCancelledError,
  PaymentBidIntentExpiredError,
  PaymentBidIntentNotFoundError,
  PaymentBidIntentNotPayableError,
  PaymentCurrencyMismatchError,
  PaymentIdempotencyKeyRequiredError,
  PaymentIdempotencyKeyReusedError,
  PaymentOrderNotCancellableError,
  PaymentOrderNotFoundError,
  PaymentWebhookInvalidError,
  UnauthorizedPaymentAccessError,
  UnauthenticatedPaymentError,
} from './errors.ts';
import { validatePaymentAmount } from './money.ts';
import { defaultPayUGateway } from './payu/adapter.ts';
import { evaluatePaymentTransition } from './state-machine.ts';
import {
  assertProductionPersistence,
  isDatabaseConfigured,
  isProductionPersistenceRequired,
} from '../db/guard.ts';
import { PostgresPaymentRepository } from '../db/repositories/payment-repository.ts';

interface PaymentIdempotencyRecord {
  actorUserId: string;
  businessId: string;
  bidIntentId: string;
  paymentOrderId: string;
  createdAt: string;
}

const PAYMENT_ORDERS_STORE: Map<string, PaymentOrder> = new Map();
const PAYMENT_IDEMPOTENCY_STORE: Map<string, PaymentIdempotencyRecord> = new Map();
const PROVIDER_EVENTS_STORE: Map<string, PaymentProviderEvent> = new Map();
const paymentRepo = new PostgresPaymentRepository();

function paymentIdempotencyScopeKey(
  actorUserId: string,
  businessId: string,
  bidIntentId: string,
  idempotencyKey: string
): string {
  return `${actorUserId}:::${businessId}:::${bidIntentId}:::${idempotencyKey.trim()}`;
}

function generateCollisionResistantId(prefix: string): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`;
}

function computePayloadHash(payload: Record<string, string>): string {
  const sorted = Object.keys(payload)
    .sort()
    .map((k) => `${k}=${payload[k]}`)
    .join('&');
  return createHash('sha256').update(sorted).digest('hex');
}

/**
 * Creates or retrieves an existing PaymentOrder for an authenticated BidIntent.
 */
export async function createPaymentOrder(
  input: CreatePaymentOrderInput,
  clockNow: Date = new Date()
): Promise<PaymentOrderResult> {
  assertProductionPersistence();

  // 1. Authentication
  if (!input.actorUserId) {
    throw new UnauthenticatedPaymentError();
  }

  // 2. Idempotency Key Validation
  if (!input.idempotencyKey || input.idempotencyKey.trim().length === 0) {
    throw new PaymentIdempotencyKeyRequiredError();
  }

  // 3. Load & Validate BidIntent (durable async lookup)
  const intent = (await getBidIntentInternalAsync(input.bidIntentId, clockNow)) || getBidIntentInternal(input.bidIntentId, clockNow);
  if (!intent) {
    throw new PaymentBidIntentNotFoundError(input.bidIntentId);
  }

  // 4. Object-Level Business Authorization & RBAC
  const membership = getMembership(intent.businessId, input.actorUserId);
  if (!membership || membership.status !== 'ACTIVE') {
    throw new UnauthorizedPaymentAccessError('User does not belong to the business associated with this BidIntent.');
  }

  assertAuthorized(membership, 'paymentOrder.create');

  // 5. Lifecycle Invariants on BidIntent
  if (intent.status === 'CANCELLED') {
    throw new PaymentBidIntentCancelledError(intent.id);
  }

  const expiresAtMs = new Date(intent.expiresAt).getTime();
  if (intent.status === 'EXPIRED' || clockNow.getTime() >= expiresAtMs) {
    throw new PaymentBidIntentExpiredError(intent.id, intent.expiresAt);
  }

  if (intent.status !== 'PENDING_PAYMENT') {
    throw new PaymentBidIntentNotPayableError(intent.id, intent.status);
  }

  // 6. Strict Whole-Rupee Amount & Currency Derivation
  const { amountMinor, amountRupees } = validatePaymentAmount(intent.qualifyingAmountMinor, intent.currency);

  // 7. Scoped Idempotency Resolution (PostgreSQL check first if configured)
  const scopeKey = paymentIdempotencyScopeKey(
    input.actorUserId,
    intent.businessId,
    intent.id,
    input.idempotencyKey
  );

  if (isDatabaseConfigured()) {
    try {
      const existingDbOrder = await paymentRepo.findIdempotentOrder(
        input.actorUserId,
        intent.businessId,
        intent.id,
        input.idempotencyKey
      );
      if (existingDbOrder) {
        recordAuditEvent('PAYMENT_ORDER_REUSED', 'PaymentOrder', existingDbOrder.id, input.actorUserId, {
          bidIntentId: intent.id,
          businessId: intent.businessId,
          idempotencyKey: input.idempotencyKey,
        });

        const checkout = await defaultPayUGateway.generateCheckout(existingDbOrder, {
          name: input.customerName || 'Business Member',
          email: input.customerEmail || 'billing@aageonline.com',
          phone: input.customerPhone || '9999999999',
        });

        PAYMENT_ORDERS_STORE.set(existingDbOrder.id, existingDbOrder);
        return {
          paymentOrder: { ...existingDbOrder },
          checkout,
        };
      }
    } catch (err) {
      if (isProductionPersistenceRequired()) {
        throw err;
      }
    }
  }

  const existingRecord = PAYMENT_IDEMPOTENCY_STORE.get(scopeKey);
  if (existingRecord) {
    const existingOrder = PAYMENT_ORDERS_STORE.get(existingRecord.paymentOrderId);
    if (existingOrder) {
      // Return existing order + checkout without creating new entities
      recordAuditEvent('PAYMENT_ORDER_REUSED', 'PaymentOrder', existingOrder.id, input.actorUserId, {
        bidIntentId: intent.id,
        businessId: intent.businessId,
        idempotencyKey: input.idempotencyKey,
      });

      const checkout = await defaultPayUGateway.generateCheckout(existingOrder, {
        name: input.customerName || 'Business Member',
        email: input.customerEmail || 'billing@aageonline.com',
        phone: input.customerPhone || '9999999999',
      });

      return {
        paymentOrder: { ...existingOrder },
        checkout,
      };
    }
  }

  // Check for idempotency key collisions across different intents
  for (const [existingKey, record] of PAYMENT_IDEMPOTENCY_STORE.entries()) {
    if (
      existingKey.endsWith(`:::${input.idempotencyKey.trim()}`) &&
      (record.actorUserId !== input.actorUserId ||
        record.businessId !== intent.businessId ||
        record.bidIntentId !== intent.id)
    ) {
      throw new PaymentIdempotencyKeyReusedError(
        input.idempotencyKey,
        'Key has already been utilized for a different user, business, or intent.'
      );
    }
  }

  // 8. Construct New PaymentOrder
  const nowIso = clockNow.toISOString();
  const orderId = generateCollisionResistantId('po');
  const providerTransactionId = `txn_${clockNow.getTime()}_${Math.random().toString(36).substring(2, 8)}`;

  const newOrder: PaymentOrder = {
    id: orderId,
    bidIntentId: intent.id,
    businessId: intent.businessId,
    marketId: intent.marketId,
    createdByUserId: input.actorUserId,
    membershipId: membership.id,
    provider: 'PAYU',
    providerTransactionId,
    amountMinor,
    amountRupees,
    currency: 'INR',
    status: 'CREATED',
    idempotencyKey: input.idempotencyKey,
    createdAt: nowIso,
    updatedAt: nowIso,
  };

  // Generate PayU Hosted Checkout payload
  const checkout = await defaultPayUGateway.generateCheckout(newOrder, {
    name: input.customerName || 'Business Member',
    email: input.customerEmail || 'billing@aageonline.com',
    phone: input.customerPhone || '9999999999',
  });

  // Advance state to PENDING now that checkout has been prepared
  newOrder.status = 'PENDING';

  // 9. Durable Persistence in PostgreSQL
  if (isDatabaseConfigured()) {
    try {
      await paymentRepo.createPaymentOrder(newOrder);
    } catch (err) {
      if (isProductionPersistenceRequired()) {
        throw err;
      }
    }
  }

  // Commit to In-Memory Stores
  PAYMENT_ORDERS_STORE.set(newOrder.id, newOrder);
  PAYMENT_IDEMPOTENCY_STORE.set(scopeKey, {
    actorUserId: input.actorUserId,
    businessId: intent.businessId,
    bidIntentId: intent.id,
    paymentOrderId: newOrder.id,
    createdAt: nowIso,
  });

  // 10. Audit Logging
  recordAuditEvent('PAYMENT_ORDER_CREATED', 'PaymentOrder', newOrder.id, input.actorUserId, {
    bidIntentId: intent.id,
    businessId: intent.businessId,
    provider: 'PAYU',
    providerTransactionId,
    amountMinor,
    amountRupees,
    currency: 'INR',
  });

  return {
    paymentOrder: { ...newOrder },
    checkout,
  };
}

/**
 * Retrieves a PaymentOrder by its associated BidIntent ID (synchronous).
 */
export function getPaymentOrderByBidIntentId(
  bidIntentId: string,
  actorUserId?: string
): PaymentOrder | undefined {
  if (!actorUserId) {
    throw new UnauthenticatedPaymentError();
  }

  const intent = getBidIntentInternal(bidIntentId);
  if (!intent) {
    throw new PaymentBidIntentNotFoundError(bidIntentId);
  }

  const membership = getMembership(intent.businessId, actorUserId);
  if (!membership || membership.status !== 'ACTIVE') {
    throw new UnauthorizedPaymentAccessError('User does not have access to this business.');
  }

  assertAuthorized(membership, 'paymentOrder.view');

  for (const order of PAYMENT_ORDERS_STORE.values()) {
    if (order.bidIntentId === bidIntentId) {
      return { ...order };
    }
  }

  return undefined;
}

/**
 * Retrieves a PaymentOrder by its associated BidIntent ID with PostgreSQL persistence.
 */
export async function getPaymentOrderByBidIntentIdAsync(
  bidIntentId: string,
  actorUserId?: string
): Promise<PaymentOrder | undefined> {
  if (!actorUserId) {
    throw new UnauthenticatedPaymentError();
  }

  const intent = (await getBidIntentInternalAsync(bidIntentId)) || getBidIntentInternal(bidIntentId);
  if (!intent) {
    throw new PaymentBidIntentNotFoundError(bidIntentId);
  }

  const membership = getMembership(intent.businessId, actorUserId);
  if (!membership || membership.status !== 'ACTIVE') {
    throw new UnauthorizedPaymentAccessError('User does not have access to this business.');
  }

  assertAuthorized(membership, 'paymentOrder.view');

  if (isDatabaseConfigured()) {
    try {
      const dbOrder = await paymentRepo.getPaymentOrderByBidIntentId(bidIntentId);
      if (dbOrder) {
        PAYMENT_ORDERS_STORE.set(dbOrder.id, dbOrder);
        return { ...dbOrder };
      }
    } catch (err) {
      if (isProductionPersistenceRequired()) {
        throw err;
      }
    }
  }

  return getPaymentOrderByBidIntentId(bidIntentId, actorUserId);
}

/**
 * Retrieves a PaymentOrder by its primary ID (synchronous).
 */
export function getPaymentOrderById(
  id: string,
  actorUserId?: string
): PaymentOrder {
  if (!actorUserId) {
    throw new UnauthenticatedPaymentError();
  }

  const order = PAYMENT_ORDERS_STORE.get(id);
  if (!order) {
    throw new PaymentOrderNotFoundError(id);
  }

  const membership = getMembership(order.businessId, actorUserId);
  if (!membership || membership.status !== 'ACTIVE') {
    throw new UnauthorizedPaymentAccessError('User does not have access to this payment order.');
  }

  assertAuthorized(membership, 'paymentOrder.view');

  return { ...order };
}

/**
 * Retrieves a PaymentOrder by its primary ID with durable PostgreSQL persistence.
 */
export async function getPaymentOrderByIdAsync(
  id: string,
  actorUserId?: string
): Promise<PaymentOrder> {
  if (!actorUserId) {
    throw new UnauthenticatedPaymentError();
  }

  let order: PaymentOrder | null = null;
  if (isDatabaseConfigured()) {
    try {
      order = await paymentRepo.getPaymentOrderById(id);
      if (order) {
        PAYMENT_ORDERS_STORE.set(order.id, order);
      }
    } catch (err) {
      if (isProductionPersistenceRequired()) {
        throw err;
      }
    }
  }

  if (!order) {
    order = PAYMENT_ORDERS_STORE.get(id) || null;
  }

  if (!order) {
    throw new PaymentOrderNotFoundError(id);
  }

  const membership = getMembership(order.businessId, actorUserId);
  if (!membership || membership.status !== 'ACTIVE') {
    throw new UnauthorizedPaymentAccessError('User does not have access to this payment order.');
  }

  assertAuthorized(membership, 'paymentOrder.view');

  return { ...order };
}

/**
 * Explicitly cancels an active, unconfirmed PaymentOrder (synchronous).
 */
export function cancelPaymentOrder(
  input: CancelPaymentOrderInput,
  clockNow: Date = new Date()
): PaymentOrder {
  if (!input.actorUserId) {
    throw new UnauthenticatedPaymentError();
  }

  const order = PAYMENT_ORDERS_STORE.get(input.paymentOrderId);
  if (!order) {
    throw new PaymentOrderNotFoundError(input.paymentOrderId);
  }

  const membership = getMembership(order.businessId, input.actorUserId);
  if (!membership || membership.status !== 'ACTIVE') {
    throw new UnauthorizedPaymentAccessError('User is not authorized for this business.');
  }

  assertAuthorized(membership, 'paymentOrder.cancel');

  const transition = evaluatePaymentTransition(order.status, 'CANCELLED', input.reason);
  if (transition.type === 'CONTRADICTORY') {
    throw transition.error;
  }

  order.status = 'CANCELLED';
  order.updatedAt = clockNow.toISOString();
  order.failureReason = input.reason || 'Cancelled by business administrator.';

  if (isDatabaseConfigured()) {
    paymentRepo.updatePaymentOrderStatus(order.id, 'CANCELLED').catch((err) => {
      console.error('Failed to asynchronously update payment order status in PostgreSQL:', err);
    });
  }

  recordAuditEvent('PAYMENT_CANCELLED', 'PaymentOrder', order.id, input.actorUserId, {
    businessId: order.businessId,
    bidIntentId: order.bidIntentId,
    reason: input.reason,
  });

  return { ...order };
}

/**
 * Explicitly cancels an active, unconfirmed PaymentOrder with durable PostgreSQL persistence.
 */
export async function cancelPaymentOrderAsync(
  input: CancelPaymentOrderInput,
  clockNow: Date = new Date()
): Promise<PaymentOrder> {
  if (!input.actorUserId) {
    throw new UnauthenticatedPaymentError();
  }

  let order: PaymentOrder | null = null;
  if (isDatabaseConfigured()) {
    try {
      order = await paymentRepo.getPaymentOrderById(input.paymentOrderId);
      if (order) {
        PAYMENT_ORDERS_STORE.set(order.id, order);
      }
    } catch (err) {
      if (isProductionPersistenceRequired()) {
        throw err;
      }
    }
  }

  if (!order) {
    order = PAYMENT_ORDERS_STORE.get(input.paymentOrderId) || null;
  }

  if (!order) {
    throw new PaymentOrderNotFoundError(input.paymentOrderId);
  }

  const membership = getMembership(order.businessId, input.actorUserId);
  if (!membership || membership.status !== 'ACTIVE') {
    throw new UnauthorizedPaymentAccessError('User is not authorized for this business.');
  }

  assertAuthorized(membership, 'paymentOrder.cancel');

  const transition = evaluatePaymentTransition(order.status, 'CANCELLED', input.reason);
  if (transition.type === 'CONTRADICTORY') {
    throw transition.error;
  }

  order.status = 'CANCELLED';
  order.updatedAt = clockNow.toISOString();
  order.failureReason = input.reason || 'Cancelled by business administrator.';

  if (isDatabaseConfigured()) {
    try {
      await paymentRepo.updatePaymentOrderStatus(order.id, 'CANCELLED');
    } catch (err) {
      if (isProductionPersistenceRequired()) {
        throw err;
      }
    }
  }

  PAYMENT_ORDERS_STORE.set(order.id, order);

  recordAuditEvent('PAYMENT_CANCELLED', 'PaymentOrder', order.id, input.actorUserId, {
    businessId: order.businessId,
    bidIntentId: order.bidIntentId,
    reason: input.reason,
  });

  return { ...order };
}

/**
 * Processes incoming PayU Webhook or Server Callback.
 *
 * CRITICAL SCOPE GUARANTEE:
 * Does NOT mutate ranking, does NOT touch MarketParticipation, does NOT create PositionHistory.
 */
export async function processPayUWebhook(
  payload: Record<string, string>,
  clockNow: Date = new Date()
): Promise<{ processed: boolean; orderId?: string; status: PaymentOrderStatus; isDuplicate: boolean }> {
  assertProductionPersistence();

  const payloadHash = computePayloadHash(payload);
  const nowIso = clockNow.toISOString();

  // 1. Duplicate Event Fingerprint Check (PostgreSQL first if configured)
  if (isDatabaseConfigured()) {
    try {
      const existingDbEvent = await paymentRepo.findEventByFingerprint('PAYU', payloadHash);
      if (existingDbEvent && existingDbEvent.processingStatus === 'PROCESSED') {
        return {
          processed: true,
          orderId: existingDbEvent.paymentOrderId || undefined,
          status: 'SUCCEEDED',
          isDuplicate: true,
        };
      }
    } catch (err) {
      if (isProductionPersistenceRequired()) {
        throw err;
      }
    }
  }

  const existingEvent = PROVIDER_EVENTS_STORE.get(payloadHash);
  if (existingEvent && existingEvent.processingStatus === 'PROCESSED') {
    return {
      processed: true,
      orderId: existingEvent.paymentOrderId || undefined,
      status: 'SUCCEEDED',
      isDuplicate: true,
    };
  }

  // Record initial receipt of provider event
  const eventId = generateCollisionResistantId('pve');
  const providerEvent: PaymentProviderEvent = {
    id: eventId,
    provider: 'PAYU',
    eventType: payload.status || 'unknown',
    providerTransactionId: payload.txnid,
    payloadHash,
    receivedAt: nowIso,
    processingStatus: 'RECEIVED',
    metadata: {
      status: payload.status,
      mihpayid: payload.mihpayid,
      amount: payload.amount,
    },
  };

  if (isDatabaseConfigured()) {
    try {
      await paymentRepo.recordProviderEvent(providerEvent);
    } catch (err) {
      if (isProductionPersistenceRequired()) {
        throw err;
      }
    }
  }

  PROVIDER_EVENTS_STORE.set(payloadHash, providerEvent);

  // 2. Cryptographic Reverse-Hash Verification
  const verification = await defaultPayUGateway.verifyWebhook(payload);

  if (!verification.isValid) {
    providerEvent.processingStatus = 'REJECTED';
    if (isDatabaseConfigured()) {
      await paymentRepo.updateEventStatus(providerEvent.id, 'REJECTED').catch(() => {});
    }
    recordAuditEvent('PAYMENT_WEBHOOK_REJECTED', 'PaymentProviderEvent', eventId, undefined, {
      reason: verification.errorMessage || 'Invalid reverse hash signature',
      txnid: payload.txnid,
    });
    throw new PaymentWebhookInvalidError(verification.errorMessage || 'Signature check failed');
  }

  // 3. Locate Matching PaymentOrder by txnid
  const txnid = verification.providerTransactionId;
  if (!txnid) {
    throw new PaymentWebhookInvalidError('Missing providerTransactionId in verified webhook result.');
  }
  let targetOrder: PaymentOrder | undefined;

  if (isDatabaseConfigured()) {
    try {
      const dbTarget = await paymentRepo.getOrderByProviderTxnId(txnid);
      if (dbTarget) {
        targetOrder = dbTarget;
        PAYMENT_ORDERS_STORE.set(targetOrder.id, targetOrder);
      }
    } catch (err) {
      if (isProductionPersistenceRequired()) {
        throw err;
      }
    }
  }

  if (!targetOrder) {
    for (const order of PAYMENT_ORDERS_STORE.values()) {
      if (order.providerTransactionId === txnid) {
        targetOrder = order;
        break;
      }
    }
  }

  if (!targetOrder) {
    providerEvent.processingStatus = 'FAILED';
    if (isDatabaseConfigured()) {
      await paymentRepo.updateEventStatus(providerEvent.id, 'FAILED').catch(() => {});
    }
    throw new PaymentOrderNotFoundError(`No PaymentOrder matches PayU txnid "${txnid}".`);
  }

  providerEvent.paymentOrderId = targetOrder.id;

  // 4. Financial Amount and Currency Integrity Checks
  if (verification.amountMinor !== undefined && verification.amountMinor !== targetOrder.amountMinor) {
    providerEvent.processingStatus = 'FAILED';
    if (isDatabaseConfigured()) {
      await paymentRepo.updateEventStatus(providerEvent.id, 'FAILED').catch(() => {});
    }
    recordAuditEvent('PAYMENT_STATE_CONFLICT', 'PaymentOrder', targetOrder.id, undefined, {
      expectedMinor: targetOrder.amountMinor,
      receivedMinor: verification.amountMinor,
      txnid,
    });
    throw new PaymentAmountMismatchError(targetOrder.amountMinor, verification.amountMinor);
  }

  if (verification.currency && verification.currency !== targetOrder.currency) {
    providerEvent.processingStatus = 'FAILED';
    if (isDatabaseConfigured()) {
      await paymentRepo.updateEventStatus(providerEvent.id, 'FAILED').catch(() => {});
    }
    throw new PaymentCurrencyMismatchError(targetOrder.currency, verification.currency);
  }

  // 5. Evaluate State Transition
  const targetStatus: PaymentOrderStatus = verification.status === 'SUCCESS' ? 'SUCCEEDED' : 'FAILED';
  const transition = evaluatePaymentTransition(targetOrder.status, targetStatus);

  if (transition.type === 'DUPLICATE') {
    providerEvent.processingStatus = 'DUPLICATE';
    if (isDatabaseConfigured()) {
      await paymentRepo.updateEventStatus(providerEvent.id, 'DUPLICATE').catch(() => {});
    }
    return {
      processed: true,
      orderId: targetOrder.id,
      status: targetOrder.status,
      isDuplicate: true,
    };
  }

  if (transition.type === 'CONTRADICTORY') {
    providerEvent.processingStatus = 'FAILED';
    if (isDatabaseConfigured()) {
      await paymentRepo.updateEventStatus(providerEvent.id, 'FAILED').catch(() => {});
    }
    recordAuditEvent('PAYMENT_STATE_CONFLICT', 'PaymentOrder', targetOrder.id, undefined, {
      fromStatus: targetOrder.status,
      targetStatus,
      error: transition.error.message,
    });
    throw transition.error;
  }

  // 6. Mutate PaymentOrder State
  targetOrder.status = targetStatus;
  targetOrder.providerPaymentId = verification.providerPaymentId || targetOrder.providerPaymentId;
  targetOrder.updatedAt = nowIso;

  if (targetStatus === 'SUCCEEDED') {
    targetOrder.paidAt = nowIso;
    providerEvent.processingStatus = 'PROCESSED';
    providerEvent.processedAt = nowIso;

    if (isDatabaseConfigured()) {
      try {
        await paymentRepo.updatePaymentOrderStatus(targetOrder.id, 'SUCCEEDED', {
          paidAt: nowIso,
          providerPaymentId: targetOrder.providerPaymentId || undefined,
        });
        await paymentRepo.updateEventStatus(providerEvent.id, 'PROCESSED');
      } catch (err) {
        if (isProductionPersistenceRequired()) {
          throw err;
        }
      }
    }

    // Record verified payment audit event
    recordAuditEvent('PAYMENT_CONFIRMED', 'PaymentOrder', targetOrder.id, undefined, {
      businessId: targetOrder.businessId,
      bidIntentId: targetOrder.bidIntentId,
      provider: 'PAYU',
      providerTransactionId: targetOrder.providerTransactionId,
      providerPaymentId: targetOrder.providerPaymentId,
      amountRupees: targetOrder.amountRupees,
      amountMinor: targetOrder.amountMinor,
      currency: targetOrder.currency,
      paidAt: nowIso,
    });
  } else {
    targetOrder.failureReason = payload.error_Message || 'Payment declined by PayU.';
    providerEvent.processingStatus = 'PROCESSED';
    providerEvent.processedAt = nowIso;

    if (isDatabaseConfigured()) {
      try {
        await paymentRepo.updatePaymentOrderStatus(targetOrder.id, 'FAILED');
        await paymentRepo.updateEventStatus(providerEvent.id, 'PROCESSED');
      } catch (err) {
        if (isProductionPersistenceRequired()) {
          throw err;
        }
      }
    }

    recordAuditEvent('PAYMENT_FAILED', 'PaymentOrder', targetOrder.id, undefined, {
      businessId: targetOrder.businessId,
      bidIntentId: targetOrder.bidIntentId,
      provider: 'PAYU',
      providerTransactionId: targetOrder.providerTransactionId,
      reason: targetOrder.failureReason,
    });
  }

  // NOTICE: Zero ranking mutation executed!

  return {
    processed: true,
    orderId: targetOrder.id,
    status: targetOrder.status,
    isDuplicate: false,
  };
}

/**
 * Reconciles payment order via PayU Verify Payment API.
 */
export async function reconcilePaymentOrder(
  paymentOrderId: string,
  actorUserId?: string
): Promise<PaymentOrder> {
  assertProductionPersistence();

  const order = await getPaymentOrderByIdAsync(paymentOrderId, actorUserId);

  if (order.status === 'SUCCEEDED') {
    return order;
  }

  const verification = await defaultPayUGateway.verifyPayment(order.providerTransactionId);

  if (verification.status === 'SUCCESS') {
    if (verification.amountMinor === order.amountMinor) {
      order.status = 'CONFIRMED';
      order.providerPaymentId = verification.providerPaymentId || order.providerPaymentId;
      order.updatedAt = new Date().toISOString();
      order.paidAt = new Date().toISOString();

      if (isDatabaseConfigured()) {
        await paymentRepo.updatePaymentOrderStatus(order.id, 'CONFIRMED', {
          paidAt: order.paidAt,
          providerPaymentId: order.providerPaymentId || undefined,
        });
      }

      PAYMENT_ORDERS_STORE.set(order.id, order);

      recordAuditEvent('PAYMENT_CONFIRMED', 'PaymentOrder', order.id, actorUserId, {
        reconciliation: true,
        provider: 'PAYU',
        providerTransactionId: order.providerTransactionId,
      });
    }
  }

  return { ...order };
}

/**
 * Manually confirms a SUCCEEDED payment order for ranking settlement readiness (synchronous).
 */
export function confirmPaymentOrder(
  orderId: string,
  actorUserId?: string
): PaymentOrder {
  assertProductionPersistence();

  const order = PAYMENT_ORDERS_STORE.get(orderId);
  if (!order) {
    throw new PaymentOrderNotFoundError(orderId);
  }

  if (order.status === 'CONFIRMED') {
    return { ...order };
  }

  if (order.status !== 'SUCCEEDED' && order.status !== 'PENDING') {
    throw new Error(`Cannot confirm payment order with status "${order.status}". Must be PENDING or SUCCEEDED.`);
  }

  order.status = 'CONFIRMED';
  order.updatedAt = new Date().toISOString();
  if (!order.paidAt) {
    order.paidAt = new Date().toISOString();
  }

  if (isDatabaseConfigured()) {
    paymentRepo.updatePaymentOrderStatus(order.id, 'CONFIRMED', {
      paidAt: order.paidAt,
      providerPaymentId: order.providerPaymentId || undefined,
    }).catch((err) => {
      console.error('Failed to update payment order in DB:', err);
    });
  }

  recordAuditEvent('PAYMENT_CONFIRMED', 'PaymentOrder', order.id, actorUserId, {
    manualConfirmation: true,
    provider: 'PAYU',
    providerTransactionId: order.providerTransactionId,
  });

  return { ...order };
}

/**
 * Manually confirms a SUCCEEDED payment order with durable PostgreSQL persistence.
 */
export async function confirmPaymentOrderAsync(
  orderId: string,
  actorUserId?: string
): Promise<PaymentOrder> {
  assertProductionPersistence();

  let order: PaymentOrder | null = null;
  if (isDatabaseConfigured()) {
    try {
      order = await paymentRepo.getPaymentOrderById(orderId);
      if (order) {
        PAYMENT_ORDERS_STORE.set(order.id, order);
      }
    } catch (err) {
      if (isProductionPersistenceRequired()) {
        throw err;
      }
    }
  }

  if (!order) {
    order = PAYMENT_ORDERS_STORE.get(orderId) || null;
  }

  if (!order) {
    throw new PaymentOrderNotFoundError(orderId);
  }

  if (order.status === 'CONFIRMED') {
    return { ...order };
  }

  if (order.status !== 'SUCCEEDED' && order.status !== 'PENDING') {
    throw new Error(`Cannot confirm payment order with status "${order.status}". Must be PENDING or SUCCEEDED.`);
  }

  order.status = 'CONFIRMED';
  order.updatedAt = new Date().toISOString();
  if (!order.paidAt) {
    order.paidAt = new Date().toISOString();
  }

  if (isDatabaseConfigured()) {
    try {
      await paymentRepo.updatePaymentOrderStatus(order.id, 'CONFIRMED', {
        paidAt: order.paidAt,
        providerPaymentId: order.providerPaymentId || undefined,
      });
    } catch (err) {
      if (isProductionPersistenceRequired()) {
        throw err;
      }
    }
  }

  PAYMENT_ORDERS_STORE.set(order.id, order);

  recordAuditEvent('PAYMENT_CONFIRMED', 'PaymentOrder', order.id, actorUserId, {
    manualConfirmation: true,
    provider: 'PAYU',
    providerTransactionId: order.providerTransactionId,
  });

  return { ...order };
}

/**
 * Retrieves a PaymentOrder without RBAC checks for trusted internal server workflows (synchronous).
 */
export function getPaymentOrderInternal(id: string): PaymentOrder | undefined {
  const order = PAYMENT_ORDERS_STORE.get(id);
  return order ? { ...order } : undefined;
}

/**
 * Retrieves a PaymentOrder without RBAC checks with PostgreSQL persistence for trusted internal workflows.
 */
export async function getPaymentOrderInternalAsync(id: string): Promise<PaymentOrder | null> {
  if (isDatabaseConfigured()) {
    try {
      const dbOrder = await paymentRepo.getPaymentOrderById(id);
      if (dbOrder) {
        PAYMENT_ORDERS_STORE.set(dbOrder.id, dbOrder);
        return { ...dbOrder };
      }
    } catch (err) {
      if (isProductionPersistenceRequired()) {
        throw err;
      }
    }
  }

  const mem = PAYMENT_ORDERS_STORE.get(id);
  return mem ? { ...mem } : null;
}

/**
 * Returns all in-memory PaymentOrders for internal reconciliation sweep in dev/test mode.
 */
export function getAllPaymentOrdersInternal(): PaymentOrder[] {
  return Array.from(PAYMENT_ORDERS_STORE.values()).map((o) => ({ ...o }));
}

/**
 * Updates status of an in-memory PaymentOrder for internal reconciliation in dev/test mode.
 */
export function updatePaymentOrderStatusInternal(
  id: string,
  status: PaymentOrderStatus,
  fields?: { paidAt?: string; providerPaymentId?: string }
): void {
  const order = PAYMENT_ORDERS_STORE.get(id);
  if (order) {
    order.status = status;
    order.updatedAt = new Date().toISOString();
    if (fields?.paidAt) order.paidAt = fields.paidAt;
    if (fields?.providerPaymentId) order.providerPaymentId = fields.providerPaymentId;
  }
}

/**
 * Clears in-memory stores for unit testing.
 */
export function resetPaymentStoreForTesting(): void {
  PAYMENT_ORDERS_STORE.clear();
  PAYMENT_IDEMPOTENCY_STORE.clear();
  PROVIDER_EVENTS_STORE.clear();
}
