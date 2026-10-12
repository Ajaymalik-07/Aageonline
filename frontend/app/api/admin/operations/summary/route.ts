/**
 * AageOnline — Admin Operations Overview Summary API
 * Milestone 0.19.0: Production Readiness, Distributed State & Live Infrastructure Verification
 *
 * GET /api/admin/operations/summary
 *
 * Returns operational metrics, queue health, worker heartbeat, and readiness status.
 * Requires platform administrator authorization.
 */

import { NextResponse } from 'next/server';
import { authService } from '../../../../../data-access/auth/index.ts';
import { assertPlatformAdmin } from '../../../../../lib/auth/admin-guard.ts';
import { checkProductionReadiness } from '../../../../../lib/db/readiness.ts';
import { PostgresPaymentRepository } from '../../../../../lib/db/repositories/payment-repository.ts';
import { PostgresRecoveryRepository } from '../../../../../lib/db/repositories/recovery-repository.ts';
import { PostgresReconciliationRunRepository } from '../../../../../lib/db/repositories/reconciliation-run-repository.ts';
import { PostgresHeartbeatRepository } from '../../../../../lib/db/repositories/heartbeat-repository.ts';
import { PostgresRankingChangeEventRepository } from '../../../../../lib/db/repositories/ranking-change-event-repository.ts';
import { PostgresNotificationRepository } from '../../../../../lib/db/repositories/notification-repository.ts';
import { PostgresSeoAuditRepository } from '../../../../../lib/db/repositories/seo-audit-repository.ts';
import { PostgresInvalidationRepository } from '../../../../../lib/db/repositories/invalidation-repository.ts';
import { isDatabaseConfigured } from '../../../../../lib/db/client.ts';
import { getAllPaymentOrdersInternal } from '../../../../../lib/payments/store.ts';
import { metricsCollector } from '../../../../../lib/observability/metrics.ts';

const paymentRepo = new PostgresPaymentRepository();
const recoveryRepo = new PostgresRecoveryRepository();
const runRepo = new PostgresReconciliationRunRepository();
const heartbeatRepo = new PostgresHeartbeatRepository();
const rankingEventRepo = new PostgresRankingChangeEventRepository();
const notificationRepo = new PostgresNotificationRepository();
const seoAuditRepo = new PostgresSeoAuditRepository();
const invalidationRepo = new PostgresInvalidationRepository();

export async function GET() {
  try {
    const user = await authService.getCurrentUser().catch(() => null);
    assertPlatformAdmin(user);

    const readiness = await checkProductionReadiness();

    let paymentStats = {
      unresolvedCount: 0,
      awaitingVerificationCount: 0,
      confirmedUnsettledCount: 0,
      oldestUnresolvedAgeMinutes: 0,
    };

    let recoveryStats = {
      pendingCount: 0,
      retryableCount: 0,
      terminalFailedCount: 0,
      processingCount: 0,
      overdueEligibleCount: 0,
      oldestOverdueMinutes: 0,
    };

    if (isDatabaseConfigured()) {
      paymentStats = await paymentRepo.getPaymentOperationalStats();
      recoveryStats = await recoveryRepo.getRecoveryStats();
    } else {
      // In-memory fallback
      const orders = getAllPaymentOrdersInternal();
      const unresolved = orders.filter((o) => o.status === 'PENDING' || o.status === 'CREATED');
      const awaiting = orders.filter((o) => o.status === 'PENDING');
      const confirmed = orders.filter((o) => o.status === 'CONFIRMED');

      paymentStats = {
        unresolvedCount: unresolved.length,
        awaitingVerificationCount: awaiting.length,
        confirmedUnsettledCount: confirmed.length,
        oldestUnresolvedAgeMinutes: unresolved.length > 0 ? 5 : 0,
      };
    }

    const latestPaymentRun = await runRepo.getLatestSuccessfulRun('PAYMENT_RECONCILIATION');
    const latestSettlementRun = await runRepo.getLatestSuccessfulRun('SETTLEMENT_RECOVERY');
    const latestHeartbeat = await heartbeatRepo.getLatestHeartbeat('reconciler-worker');

    const notifStatsRaw = await notificationRepo.getOperationalStats();
    const pendingEventsCount = await rankingEventRepo.getPendingCount();
    const notificationStats = {
      ...notifStatsRaw,
      pendingEventsCount,
    };

    const seoStats = await seoAuditRepo.getOperationalSummary();
    const invalidationStats = await invalidationRepo.getInvalidationStats();
    const performanceMetrics = metricsCollector.getMetricsSummary();

    return NextResponse.json(
      {
        data: {
          timestamp: new Date().toISOString(),
          paymentStats,
          recoveryStats,
          invalidationStats,
          notificationStats,
          seoStats,
          performanceMetrics,
          latestPaymentRun,
          latestSettlementRun,
          latestHeartbeat,
          readiness,
        },
      },
      {
        headers: {
          'Cache-Control': 'private, no-cache, no-store, max-age=0, must-revalidate',
        },
      }
    );
  } catch (err: unknown) {
    const errorObj = err as { statusCode?: number; code?: string; message?: string };
    const statusCode = errorObj.statusCode || 500;
    return NextResponse.json(
      {
        error: {
          code: errorObj.code || 'OPERATIONS_SUMMARY_FAILED',
          message: errorObj.message || 'Failed to retrieve operations summary.',
        },
      },
      { status: statusCode }
    );
  }
}
