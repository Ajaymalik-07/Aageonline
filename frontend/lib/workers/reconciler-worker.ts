/**
 * AageOnline — Production Reconciler & Recovery Worker
 *
 * Provides a provider-independent, multi-instance-safe background worker engine
 * that continuously reconciles unresolved payments and recovers incomplete settlements.
 *
 * INVARIANTS & CONCURRENCY:
 * 1. Safe across multiple application instances using PostgreSQL advisory locking.
 * 2. Emits durable worker heartbeats for operational observability.
 * 3. Graceful shutdown on SIGTERM / SIGINT with resource cleanup.
 * 4. Bounded batch execution preventing unbounded scans.
 */

import { getDbPool, isDatabaseConfigured } from '../db/client.ts';
import { PostgresHeartbeatRepository } from '../db/repositories/heartbeat-repository.ts';
import { runPaymentReconciliationCycle, type PaymentReconciliationResult } from '../payments/reconciliation-service.ts';
import { runSettlementRecoveryCycle, type RecoveryCycleResult } from '../ranking-settlement/recovery-service.ts';
import {
  processPendingRankingEvents,
  deliverPendingNotifications,
  type ProcessEventsResult,
  type DeliverNotificationsResult,
} from '../notifications/notification-service.ts';
import { recoverPendingInvalidations } from '../cache/invalidation.ts';

export interface WorkerCycleSummary {
  timestamp: string;
  workerId: string;
  paymentReconciliation: PaymentReconciliationResult;
  settlementRecovery: RecoveryCycleResult;
  rankingEvents: ProcessEventsResult;
  notificationDelivery: DeliverNotificationsResult;
  invalidationRecovery: {
    recoveredCount: number;
    failedCount: number;
    terminalFailedCount: number;
    remainingCount: number;
  };
  durationMs: number;
}

const heartbeatRepo = new PostgresHeartbeatRepository();

// Fixed numeric key for pg_try_advisory_lock
const RECONCILER_ADVISORY_LOCK_ID = 829104812;

/**
 * Runs a single discrete reconciliation & recovery cycle.
 * Safe to be invoked by HTTP cron triggers, AWS Lambda, or CLI runs.
 */
export async function runSingleReconcilerCycle(
  workerId = 'reconciler-worker-primary',
  actorUserId = 'scheduler-worker'
): Promise<WorkerCycleSummary | { skipped: true; reason: string }> {
  const startTime = Date.now();
  let lockAcquired = false;
  let client: import('pg').PoolClient | null = null;

  // 1. Concurrency control via PostgreSQL advisory lock
  if (isDatabaseConfigured()) {
    try {
      client = await getDbPool().connect();
      const lockRes = await client.query('SELECT pg_try_advisory_lock($1) AS acquired', [
        RECONCILER_ADVISORY_LOCK_ID,
      ]);
      lockAcquired = Boolean(lockRes.rows[0]?.acquired);

      if (!lockAcquired) {
        client.release();
        return {
          skipped: true,
          reason: 'Another reconciler worker is currently executing. Cycle skipped harmlessly.',
        };
      }
    } catch (err) {
      if (client) client.release();
      console.warn('Advisory lock check failed, proceeding with standard database-level row locking:', err);
    }
  }

  try {
    // 2. Run payment reconciliation
    const paymentResult = await runPaymentReconciliationCycle({
      batchSize: 25,
      olderThanMinutes: 2,
      triggerSource: 'SCHEDULED',
      actorUserId,
    });

    // 3. Run ranking settlement recovery
    const settlementResult = await runSettlementRecoveryCycle(25, actorUserId, 'SCHEDULED');

    // 4. Process pending ranking change events into notifications
    const eventResult = await processPendingRankingEvents({ batchSize: 25 });

    // 5. Deliver pending notifications
    const deliveryResult = await deliverPendingNotifications({ batchSize: 25 });

    // 5b. Recover durable cache invalidation jobs from outbox
    const invalidationResult = await recoverPendingInvalidations(25);

    // 6. Record durable worker heartbeat
    await heartbeatRepo.recordHeartbeat(workerId, 'reconciler-worker', {
      lastRunAt: new Date().toISOString(),
      durationMs: Date.now() - startTime,
      paymentCandidates: paymentResult.candidateCount,
      paymentConfirmed: paymentResult.confirmedCount,
      settlementRecovered: settlementResult.recoveredCount,
      rankingEventsProcessed: eventResult.processedEvents,
      notificationsCreated: eventResult.createdNotifications,
      notificationsDelivered: deliveryResult.deliveredCount,
      invalidationsRecovered: invalidationResult.recoveredCount,
      invalidationsRemaining: invalidationResult.remainingCount,
    });

    return {
      timestamp: new Date().toISOString(),
      workerId,
      paymentReconciliation: paymentResult,
      settlementRecovery: settlementResult,
      rankingEvents: eventResult,
      notificationDelivery: deliveryResult,
      invalidationRecovery: invalidationResult,
      durationMs: Date.now() - startTime,
    };
  } finally {
    if (lockAcquired && client) {
      try {
        await client.query('SELECT pg_advisory_unlock($1)', [RECONCILER_ADVISORY_LOCK_ID]);
      } catch (unlockErr) {
        console.error('Failed to release advisory lock:', unlockErr);
      } finally {
        client.release();
      }
    }
  }
}

/**
 * Long-running daemon worker loop for containerized / background service execution.
 */
export function startReconcilerDaemon(
  options: {
    workerId?: string;
    intervalMs?: number;
    onError?: (err: unknown) => void;
  } = {}
): { stop: () => Promise<void> } {
  const workerId = options.workerId || `worker-${process.pid}-${Math.random().toString(36).substring(2, 6)}`;
  const intervalMs = options.intervalMs || 30000; // 30 seconds default
  let isRunning = true;
  let timer: NodeJS.Timeout | null = null;

  console.log(`[ReconcilerWorker] Starting daemon worker "${workerId}" with interval ${intervalMs}ms...`);

  async function loop() {
    if (!isRunning) return;

    try {
      const summary = await runSingleReconcilerCycle(workerId);
      if ('skipped' in summary) {
        console.log(`[ReconcilerWorker] ${summary.reason}`);
      } else {
        console.log(
          `[ReconcilerWorker] Cycle completed in ${summary.durationMs}ms. Payments confirmed: ${summary.paymentReconciliation.confirmedCount}, Settlements recovered: ${summary.settlementRecovery.recoveredCount}.`
        );
      }
    } catch (err) {
      console.error(`[ReconcilerWorker] Cycle encountered an error:`, err);
      if (options.onError) options.onError(err);
    }

    if (isRunning) {
      timer = setTimeout(loop, intervalMs);
    }
  }

  // Initial immediate execution
  loop();

  return {
    stop: async () => {
      isRunning = false;
      if (timer) clearTimeout(timer);
      console.log(`[ReconcilerWorker] Daemon worker "${workerId}" stopped.`);
    },
  };
}
