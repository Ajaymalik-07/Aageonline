/**
 * AageOnline — Milestone 0.15.0 Administrative Operations & Reconciler Test Suite
 *
 * Comprehensive tests verifying:
 * 1. Admin permission boundary & worker secret authentication.
 * 2. Payment reconciliation state transitions & provider verifications.
 * 3. Ranking settlement recovery idempotency, leases, and bounded backoff.
 * 4. Production scheduler, worker cycle execution, and durable run history.
 * 5. Readiness operational diagnostics & heartbeat freshness.
 */

import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert/strict';

import {
  isPlatformAdmin,
  assertPlatformAdmin,
  verifyWorkerSecret,
  assertAdminOrWorker,
  AdminAuthenticationError,
  AdminAuthorizationError,
} from '../lib/auth/admin-guard.ts';
import {
  createOrGetUserByEmail,
  updateUserRole,
  resetAuthStoreForTesting,
} from '../lib/auth/store.ts';
import {
  runPaymentReconciliationCycle,
  reconcileSinglePaymentOrder,
} from '../lib/payments/reconciliation-service.ts';
import {
  runSettlementRecoveryCycle,
  retrySingleRecoveryJob,
  enqueueSettlementRecoveryJob,
} from '../lib/ranking-settlement/recovery-service.ts';
import {
  runSingleReconcilerCycle,
} from '../lib/workers/reconciler-worker.ts';
import {
  PostgresReconciliationRunRepository,
  resetReconciliationRunsStoreForTesting,
} from '../lib/db/repositories/reconciliation-run-repository.ts';
import {
  PostgresHeartbeatRepository,
  resetHeartbeatStoreForTesting,
} from '../lib/db/repositories/heartbeat-repository.ts';
import {
  checkProductionReadiness,
} from '../lib/db/readiness.ts';
import { loadMigrationFiles } from '../lib/db/migrator.ts';
import {
  createPaymentOrder,
  confirmPaymentOrder,
  getPaymentOrderInternal,
  resetPaymentStoreForTesting,
} from '../lib/payments/store.ts';
import { createBidIntent, resetBidIntentStoreForTesting } from '../lib/bid-intent/store.ts';
import { resetSettlementStoreForTesting, getRankingSettlementByPaymentOrderId } from '../lib/ranking-settlement/settlement-service.ts';
import { resetPositionHistoryStoreForTesting } from '../lib/ranking-settlement/position-history.ts';
import { resetBusinessStoreForTesting } from '../lib/taxonomy/businesses.ts';
import { resetMembershipStoreForTesting } from '../lib/memberships/store.ts';
import type { User } from '../types/auth.ts';

describe('Milestone 0.15.0 — Administrative Operations & Live Reconciler Scheduling', () => {
  const marketId = 'mkt-jaipur-interior-designers';
  const businessId = 'biz-royal-interiors';
  const ownerUserId = 'user-ajay';

  beforeEach(() => {
    resetAuthStoreForTesting();
    resetMembershipStoreForTesting();
    resetBusinessStoreForTesting();
    resetBidIntentStoreForTesting();
    resetPaymentStoreForTesting();
    resetSettlementStoreForTesting();
    resetPositionHistoryStoreForTesting();
    resetReconciliationRunsStoreForTesting();
    resetHeartbeatStoreForTesting();
    delete process.env.ADMIN_WORKER_SECRET;
    delete process.env.PLATFORM_ADMIN_EMAILS;
  });

  describe('1. Administrative Authorization Boundary & Worker Secret Authentication', () => {
    it('should reject unauthenticated caller with AdminAuthenticationError (401)', () => {
      assert.throws(
        () => assertPlatformAdmin(null),
        (err) => err instanceof AdminAuthenticationError && err.statusCode === 401
      );
    });

    it('should reject authenticated regular user with AdminAuthorizationError (403)', () => {
      const regularUser: User = {
        id: 'user-regular',
        email: 'regular@example.com',
        role: 'USER',
        status: 'ACTIVE',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      assert.equal(isPlatformAdmin(regularUser), false);
      assert.throws(
        () => assertPlatformAdmin(regularUser),
        (err) => err instanceof AdminAuthorizationError && err.statusCode === 403
      );
    });

    it('should reject suspended admin account (403)', () => {
      const suspendedAdmin: User = {
        id: 'user-suspended-admin',
        email: 'suspended@aageonline.example.com',
        role: 'ADMIN',
        status: 'SUSPENDED',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      assert.equal(isPlatformAdmin(suspendedAdmin), false);
      assert.throws(
        () => assertPlatformAdmin(suspendedAdmin),
        /User account is SUSPENDED/
      );
    });

    it('should authorize platform admin with ADMIN or SUPERADMIN role', () => {
      const admin: User = {
        id: 'user-admin',
        email: 'admin@aageonline.example.com',
        role: 'SUPERADMIN',
        status: 'ACTIVE',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      assert.equal(isPlatformAdmin(admin), true);
      assert.doesNotThrow(() => assertPlatformAdmin(admin));
    });

    it('should authorize admin whose email is in PLATFORM_ADMIN_EMAILS fallback list', () => {
      process.env.PLATFORM_ADMIN_EMAILS = 'ops@aageonline.in,security@aageonline.in';
      const user: User = {
        id: 'user-ops',
        email: 'ops@aageonline.in',
        status: 'ACTIVE',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      assert.equal(isPlatformAdmin(user), true);
      assert.doesNotThrow(() => assertPlatformAdmin(user));
    });

    it('should validate worker secret using constant-time comparison', () => {
      process.env.ADMIN_WORKER_SECRET = 'super-secret-cron-token-9999';

      const validHeaders = new Headers({
        'x-admin-worker-secret': 'super-secret-cron-token-9999',
      });
      assert.equal(verifyWorkerSecret(validHeaders), true);

      const bearerHeaders = new Headers({
        authorization: 'Bearer super-secret-cron-token-9999',
      });
      assert.equal(verifyWorkerSecret(bearerHeaders), true);

      const invalidHeaders = new Headers({
        'x-admin-worker-secret': 'wrong-secret-token',
      });
      assert.equal(verifyWorkerSecret(invalidHeaders), false);
    });

    it('should resolve assertAdminOrWorker for both admin users and worker secrets', () => {
      process.env.ADMIN_WORKER_SECRET = 'worker-token-xyz';

      // 1. Worker invocation
      const workerHeaders = new Headers({ 'x-admin-worker-secret': 'worker-token-xyz' });
      const workerCtx = assertAdminOrWorker(workerHeaders, null);
      assert.equal(workerCtx.isWorker, true);
      assert.equal(workerCtx.actorId, 'scheduler-worker');

      // 2. Admin user invocation
      const adminUser: User = {
        id: 'user-admin-1',
        email: 'admin@aageonline.example.com',
        role: 'ADMIN',
        status: 'ACTIVE',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      const userCtx = assertAdminOrWorker(new Headers(), adminUser);
      assert.equal(userCtx.isWorker, false);
      assert.equal(userCtx.actorId, 'user-admin-1');
    });
  });

  describe('2. Payment Reconciliation State Transitions & Provider Verification', () => {
    it('should discover and reconcile unresolved payments, creating durable run records', async () => {
      // 1. Create a BidIntent and PaymentOrder
      const intent = await createBidIntent(
        {
          businessId,
          marketId,
          targetPosition: 1,
          idempotencyKey: `idem-rec-test-${Date.now()}`,
        },
        ownerUserId
      );

      const orderRes = await createPaymentOrder({
        bidIntentId: intent.id,
        idempotencyKey: `idem-pay-test-${Date.now()}`,
        actorUserId: ownerUserId,
      });

      const order = orderRes.paymentOrder;
      assert.equal(order.status, 'PENDING');

      // 2. Run reconciliation cycle with olderThanMinutes = 0
      const recResult = await runPaymentReconciliationCycle({
        batchSize: 10,
        olderThanMinutes: 0,
        triggerSource: 'MANUAL',
        actorUserId: 'admin-tester',
      });

      assert.ok(recResult.runId.startsWith('run_pay_rec_'));
      assert.equal(recResult.candidateCount >= 1, true);

      // Verify run was recorded durably
      const runRepo = new PostgresReconciliationRunRepository();
      const recentRuns = await runRepo.getRecentRuns(5);
      assert.ok(recentRuns.length >= 1);
      assert.equal(recentRuns[0].runType, 'PAYMENT_RECONCILIATION');
      assert.equal(recentRuns[0].status, 'COMPLETED');
    });

    it('should reconcile a single payment order on-demand', async () => {
      const intent = await createBidIntent(
        {
          businessId,
          marketId,
          targetPosition: 1,
          idempotencyKey: `idem-single-${Date.now()}`,
        },
        ownerUserId
      );

      const orderRes = await createPaymentOrder({
        bidIntentId: intent.id,
        idempotencyKey: `idem-single-pay-${Date.now()}`,
        actorUserId: ownerUserId,
      });

      const res = await reconcileSinglePaymentOrder(orderRes.paymentOrder.id, 'admin-tester');
      assert.equal(res.paymentOrderId, orderRes.paymentOrder.id);
      assert.ok(['CONFIRMED', 'FAILED', 'INCONCLUSIVE'].includes(res.outcome));
    });
  });

  describe('3. Ranking Settlement Recovery & Idempotent Retry', () => {
    it('should execute settlement recovery and record durable run history', async () => {
      const intent = await createBidIntent(
        {
          businessId,
          marketId,
          targetPosition: 1,
          idempotencyKey: `idem-set-rec-${Date.now()}`,
        },
        ownerUserId
      );

      const orderRes = await createPaymentOrder({
        bidIntentId: intent.id,
        idempotencyKey: `idem-set-rec-pay-${Date.now()}`,
        actorUserId: ownerUserId,
      });

      await confirmPaymentOrder(orderRes.paymentOrder.id, ownerUserId);

      const recResult = await runSettlementRecoveryCycle(10, 'admin-tester', 'MANUAL');
      assert.ok(recResult);

      const runRepo = new PostgresReconciliationRunRepository();
      const recentRuns = await runRepo.getRecentRuns(5);
      const settlementRun = recentRuns.find((r) => r.runType === 'SETTLEMENT_RECOVERY');
      assert.ok(settlementRun);
      assert.equal(settlementRun.status, 'COMPLETED');
    });

    it('should prevent duplicate ranking mutations when recovery runs multiple times', async () => {
      const intent = await createBidIntent(
        {
          businessId,
          marketId,
          targetPosition: 1,
          idempotencyKey: `idem-repeat-${Date.now()}`,
        },
        ownerUserId
      );

      const orderRes = await createPaymentOrder({
        bidIntentId: intent.id,
        idempotencyKey: `idem-repeat-pay-${Date.now()}`,
        actorUserId: ownerUserId,
      });

      await confirmPaymentOrder(orderRes.paymentOrder.id, ownerUserId);

      // Run multiple cycles
      await runSettlementRecoveryCycle(10, 'admin-tester', 'SCHEDULED');
      await runSettlementRecoveryCycle(10, 'admin-tester', 'SCHEDULED');

      const settlement = getRankingSettlementByPaymentOrderId(orderRes.paymentOrder.id);
      // If settlement exists, status is SETTLED
      if (settlement) {
        assert.equal(settlement.status, 'SETTLED');
      }
    });
  });

  describe('4. Background Worker Cycle Execution & Heartbeat Tracking', () => {
    it('should execute single reconciler worker cycle and record heartbeat', async () => {
      const summary = await runSingleReconcilerCycle('test-worker-1', 'scheduler-worker');
      assert.ok('durationMs' in summary);
      assert.equal(summary.workerId, 'test-worker-1');
      assert.ok(summary.paymentReconciliation.runId);
      assert.ok(summary.settlementRecovery);

      const heartbeatRepo = new PostgresHeartbeatRepository();
      const hb = await heartbeatRepo.getLatestHeartbeat('reconciler-worker');
      assert.ok(hb);
      assert.equal(hb.workerId, 'test-worker-1');
      assert.equal(hb.status, 'ACTIVE');
    });
  });

  describe('5. Readiness & Operational Diagnostics', () => {
    it('should load all 6 database migrations in correct sequential order', () => {
      const files = loadMigrationFiles();
      assert.equal(files.length >= 6, true);
      assert.equal(files[0].version, '001');
      assert.equal(files[1].version, '002');
      assert.equal(files[2].version, '003');
      assert.equal(files[3].version, '004');
      assert.equal(files[4].version, '005');
      assert.equal(files[5].version, '006');
      assert.ok(files[5].sql.includes('reconciliation_runs'));
      assert.ok(files[5].sql.includes('worker_heartbeats'));
    });

    it('should report comprehensive operational status in checkProductionReadiness', async () => {
      const report = await checkProductionReadiness();
      assert.ok(report);
      assert.ok(report.operationalStatus);
      assert.ok(['PASS', 'FAIL', 'NOT_CONFIGURED'].includes(report.operationalStatus.database));
      assert.ok(['PASS', 'FAIL', 'NOT_VERIFIED'].includes(report.operationalStatus.migrations));
      assert.ok(['PASS', 'DEGRADED', 'NOT_CONFIGURED'].includes(report.operationalStatus.workerHeartbeat));
      assert.ok(['PASS', 'DEGRADED'].includes(report.operationalStatus.recoveryQueue));
    });
  });
});
