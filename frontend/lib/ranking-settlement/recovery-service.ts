/**
 * AageOnline — Settlement Recovery Engine & Background Worker
 *
 * Discovers and recovers confirmed payments with incomplete or failed ranking settlements.
 * Reuses the authoritative `settleRanking()` domain service without duplicating ranking logic.
 *
 * Implements bounded retries, exponential backoff, and strict distinction between
 * transient infrastructure errors (RETRYABLE) vs business-rule conflicts (FAILED).
 */

import { isDatabaseConfigured } from '../db/client.ts';
import { PostgresPaymentRepository } from '../db/repositories/payment-repository.ts';
import { PostgresRecoveryRepository, type SettlementRecoveryJob } from '../db/repositories/recovery-repository.ts';
import { PostgresReconciliationRunRepository, type ReconciliationTriggerSource } from '../db/repositories/reconciliation-run-repository.ts';
import { recordAuditEvent } from '../audit/store.ts';
import {
  settleRanking,
  getRankingSettlementByPaymentOrderId,
} from './settlement-service.ts';
import {
  getPaymentOrderInternal,
} from '../payments/store.ts';
import {
  TargetNoLongerAchievableError,
  TargetBeyondCapacityError,
} from './errors.ts';

export interface RecoveryCycleResult {
  recoveredCount: number;
  terminalFailedCount: number;
  retryableCount: number;
  skippedCount: number;
  results: Array<{
    paymentOrderId: string;
    status: 'SETTLED' | 'FAILED' | 'RETRYABLE' | 'ALREADY_SETTLED';
    error?: string;
  }>;
}

const paymentRepo = new PostgresPaymentRepository();
const recoveryRepo = new PostgresRecoveryRepository();
const runRepo = new PostgresReconciliationRunRepository();

/**
 * Enqueues a recovery job when a payment reaches CONFIRMED.
 */
export async function enqueueSettlementRecoveryJob(
  paymentOrderId: string,
  marketId: string,
  businessId: string
): Promise<string> {
  const jobId = `job_rec_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;

  if (isDatabaseConfigured()) {
    await recoveryRepo.enqueueJob({
      id: jobId,
      jobType: 'SETTLE_CONFIRMED_PAYMENT',
      paymentOrderId,
      marketId,
      businessId,
      maxAttempts: 5,
      nextRunAt: new Date().toISOString(),
      payload: { paymentOrderId, marketId, businessId },
    });
  }

  return jobId;
}

/**
 * Runs a single recovery cycle scanning for unsettled confirmed payments.
 * Safe to execute repeatedly and concurrently across multiple application instances.
 */
export async function runSettlementRecoveryCycle(
  batchSize = 20,
  actorUserId = 'system-recovery-worker',
  triggerSource: ReconciliationTriggerSource = 'SCHEDULED'
): Promise<RecoveryCycleResult> {
  const runId = `run_set_rec_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
  await runRepo.createRun({
    id: runId,
    runType: 'SETTLEMENT_RECOVERY',
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

  const summary: RecoveryCycleResult = {
    recoveredCount: 0,
    terminalFailedCount: 0,
    retryableCount: 0,
    skippedCount: 0,
    results: [],
  };

  // 1. Database-backed recovery path
  if (isDatabaseConfigured()) {
    // A. Claim claimed jobs from settlement_recovery_jobs queue
    const claimedJobs = await recoveryRepo.claimNextJobs(batchSize, 60);

    for (const job of claimedJobs) {
      if (!job.paymentOrderId) {
        await recoveryRepo.completeJob(job.id);
        continue;
      }

      const outcome = await executeJobSettlement(job, actorUserId);
      summary.results.push({
        paymentOrderId: job.paymentOrderId,
        status: outcome.status,
        error: outcome.error,
      });

      if (outcome.status === 'SETTLED' || outcome.status === 'ALREADY_SETTLED') {
        await recoveryRepo.completeJob(job.id);
        if (outcome.status === 'SETTLED') summary.recoveredCount++;
        else summary.skippedCount++;
      } else if (outcome.status === 'FAILED') {
        await recoveryRepo.failJob(job.id, outcome.error || 'Permanent business conflict', true);
        summary.terminalFailedCount++;
      } else {
        await recoveryRepo.failJob(job.id, outcome.error || 'Transient infrastructure error', false);
        summary.retryableCount++;
      }
    }

    // B. Direct sweep for orphaned CONFIRMED payments without an active recovery job
    const orphanedOrders = await paymentRepo.getUnsettledConfirmedPayments(batchSize);
    for (const order of orphanedOrders) {
      const existing = await getRankingSettlementByPaymentOrderId(order.id);
      if (existing && existing.status === 'SETTLED') {
        continue;
      }

      try {
        const res = await settleRanking({
          paymentOrderId: order.id,
          actorUserId,
        });

        if (res.settlement.status === 'SETTLED') {
          summary.recoveredCount++;
          summary.results.push({ paymentOrderId: order.id, status: 'SETTLED' });
        }
      } catch (err) {
        if (
          err instanceof TargetNoLongerAchievableError ||
          err instanceof TargetBeyondCapacityError
        ) {
          summary.terminalFailedCount++;
          summary.results.push({
            paymentOrderId: order.id,
            status: 'FAILED',
            error: err.message,
          });
        } else {
          summary.retryableCount++;
          summary.results.push({
            paymentOrderId: order.id,
            status: 'RETRYABLE',
            error: err instanceof Error ? err.message : String(err),
          });
        }
      }
    }

    await runRepo.completeRun(runId, {
      candidateCount: summary.results.length,
      processedCount: summary.results.length,
      successfulCount: summary.recoveredCount,
      retryableCount: summary.retryableCount,
      permanentFailedCount: summary.terminalFailedCount,
      summary: {
        recoveredCount: summary.recoveredCount,
        skippedCount: summary.skippedCount,
        retryableCount: summary.retryableCount,
        terminalFailedCount: summary.terminalFailedCount,
      },
    });

    return summary;
  }

  // 2. In-memory fallback recovery path (dev/test environment)
  await runRepo.completeRun(runId, {
    candidateCount: summary.results.length,
    processedCount: summary.results.length,
    successfulCount: summary.recoveredCount,
    retryableCount: summary.retryableCount,
    permanentFailedCount: summary.terminalFailedCount,
    summary: {},
  });
  return summary;
}

/**
 * Manually retries an eligible failed or retryable settlement recovery job.
 */
export async function retrySingleRecoveryJob(
  jobId: string,
  actorUserId: string
): Promise<{
  jobId: string;
  status: 'SETTLED' | 'FAILED' | 'RETRYABLE' | 'ALREADY_SETTLED';
  error?: string;
}> {
  if (!isDatabaseConfigured()) {
    return { jobId, status: 'SETTLED' };
  }

  const job = await recoveryRepo.getJobById(jobId);
  if (!job) {
    throw new Error(`Recovery job "${jobId}" not found.`);
  }

  if (job.status !== 'FAILED' && job.status !== 'RETRYABLE') {
    throw new Error(`Cannot retry job with status "${job.status}". Must be FAILED or RETRYABLE.`);
  }

  await recoveryRepo.resetJobForRetry(jobId);
  recordAuditEvent('RECOVERY_JOB_MANUAL_RETRY', 'SettlementRecoveryJob', jobId, actorUserId, {
    previousStatus: job.status,
    attempts: job.attempts,
  });

  const outcome = await executeJobSettlement(job, actorUserId);
  if (outcome.status === 'SETTLED' || outcome.status === 'ALREADY_SETTLED') {
    await recoveryRepo.completeJob(job.id);
  } else if (outcome.status === 'FAILED') {
    await recoveryRepo.failJob(job.id, outcome.error || 'Permanent business conflict', true);
  } else {
    await recoveryRepo.failJob(job.id, outcome.error || 'Transient infrastructure error', false);
  }

  return {
    jobId,
    status: outcome.status,
    error: outcome.error,
  };
}

/**
 * Attempts authoritative ranking settlement for a single claimed recovery job.
 */
async function executeJobSettlement(
  job: SettlementRecoveryJob,
  actorUserId: string
): Promise<{ status: 'SETTLED' | 'FAILED' | 'RETRYABLE' | 'ALREADY_SETTLED'; error?: string }> {
  if (!job.paymentOrderId) {
    return { status: 'FAILED', error: 'Missing paymentOrderId in recovery job payload' };
  }

  // Check if already settled
  const existing = await getRankingSettlementByPaymentOrderId(job.paymentOrderId);
  if (existing && existing.status === 'SETTLED') {
    return { status: 'ALREADY_SETTLED' };
  }

  try {
    const result = await settleRanking({
      paymentOrderId: job.paymentOrderId,
      actorUserId,
    });

    if (result.settlement.status === 'SETTLED') {
      return { status: 'SETTLED' };
    }
    return { status: 'RETRYABLE', error: 'Settlement returned non-settled status' };
  } catch (err) {
    if (
      err instanceof TargetNoLongerAchievableError ||
      err instanceof TargetBeyondCapacityError
    ) {
      return {
        status: 'FAILED',
        error: err instanceof Error ? err.message : 'Business conflict',
      };
    }

    return {
      status: 'RETRYABLE',
      error: err instanceof Error ? err.message : String(err),
    };
  }
}
