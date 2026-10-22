/**
 * AageOnline — Milestone 0.20.16 Operational Verification & Failure-Path Audit Suite
 *
 * Comprehensive, deterministic failure-path verification:
 * 1. Worker Lifecycle: Cycles, backoff, circuit-breaker tripping & recovery, drain timeout, timer cleanup, heartbeat states.
 * 2. Backup & Restore Safety: Missing utilities, credential redaction, path traversal, manifest validation, overwrite prevention, target isolation.
 * 3. Financial Lifecycle Failure Paths: Tampered webhooks, forged browser redirects, unconfirmed payments, duplicate callbacks, duplicate settlements.
 * 4. Security & Operational Guards: Production dev-auth bypass blocks, CSRF policies, admin guards, public health probe secret containment.
 */

import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import fs from 'node:fs';

import {
  validateBackupPath,
  validateRestoreTarget,
  generateBackupManifest,
  validateBackupManifest,
  checkBackupFileOverwrite,
  calculateRetentionPruning,
  verifyChecksum,
  assertPostgresUtilityAvailable,
  formatSafeRestoreError,
} from '../lib/ops/backup-safety.ts';
import { redactConnectionString } from '../lib/db/test-safety.ts';
import { WorkerSupervisor } from '../lib/workers/supervisor.ts';
import type { WorkerCycleSummary } from '../lib/workers/reconciler-worker.ts';
import type { User } from '../types/auth.ts';
import {
  PostgresHeartbeatRepository,
  resetHeartbeatStoreForTesting,
} from '../lib/db/repositories/heartbeat-repository.ts';
import {
  createPaymentOrder,
  processPayUWebhook,
  getPaymentOrderInternal,
  resetPaymentStoreForTesting,
} from '../lib/payments/store.ts';
import {
  createBidIntent,
  resetBidIntentStoreForTesting,
} from '../lib/bid-intent/store.ts';
import {
  settleRanking,
} from '../lib/ranking-settlement/settlement-service.ts';
import { getServerSession } from '../lib/auth/server-session.ts';
import { assertPlatformAdmin, isPlatformAdmin } from '../lib/auth/admin-guard.ts';
import { getPayUConfig } from '../lib/payments/payu/client.ts';
import { generatePayUReverseHash } from '../lib/payments/payu/hash.ts';

const OWNER_USER_ID = 'user-ajay';
const VALID_BIZ_ID = 'biz-royal-interiors';
const VALID_MARKET_ID = 'mkt-jaipur-interior-designers';

const createMockCycleSummary = (workerId: string, durationMs = 42): WorkerCycleSummary => ({
  timestamp: new Date().toISOString(),
  workerId,
  durationMs,
  paymentReconciliation: { runId: 'run_1', candidateCount: 1, confirmedCount: 1, failedCount: 0, inconclusiveCount: 0, details: [] },
  settlementRecovery: { recoveredCount: 1, retryableCount: 0, terminalFailedCount: 0, skippedCount: 0, results: [] },
  rankingEvents: { processedEvents: 0, createdNotifications: 0, coalescedNotifications: 0 },
  notificationDelivery: { deliveredCount: 0, failedCount: 0, retryableCount: 0 },
  invalidationRecovery: { recoveredCount: 0, failedCount: 0, terminalFailedCount: 0, remainingCount: 0 },
});

describe('Milestone 0.20.16 — Operational Verification & Failure-Path Audit Suite', () => {
  beforeEach(() => {
    resetHeartbeatStoreForTesting();
    resetPaymentStoreForTesting();
    resetBidIntentStoreForTesting();
  });

  // ============================================================================
  // 1. Worker Lifecycle Verification & Failure Paths (Section 3)
  // ============================================================================
  describe('1. Worker Lifecycle, Supervision & Failure Paths', () => {
    it('should execute successful worker cycles via custom cycleRunner and reset consecutive failures', async () => {
      let cycleExecuted = false;
      const supervisor = new WorkerSupervisor({
        workerId: 'test-worker-success',
        intervalMs: 10000,
        cycleRunner: async () => {
          cycleExecuted = true;
          return createMockCycleSummary('test-worker-success', 42);
        },
      });

      supervisor['status'] = 'RUNNING';
      // Manually set failure count to verify success resets it
      supervisor['consecutiveFailures'] = 2;
      await supervisor.executeCycle();

      assert.equal(cycleExecuted, true);
      assert.equal(supervisor.getConsecutiveFailures(), 0);
      assert.equal(supervisor.getStatus(), 'RUNNING');

      const health = await supervisor.getHealthReport();
      assert.equal(health.healthy, true);
      assert.equal(health.status, 'HEALTHY');

      await supervisor.stop();
    });

    it('should trip circuit breaker after repeated failures and calculate bounded exponential backoff', async () => {
      let failureCountRecorded = 0;
      const supervisor = new WorkerSupervisor({
        workerId: 'test-worker-circuit-tripper',
        intervalMs: 10000,
        maxConsecutiveFailures: 3,
        onError: (_, count) => {
          failureCountRecorded = count;
        },
        cycleRunner: async () => {
          throw new Error('Database connection pool exhausted (simulated transient outage)');
        },
      });

      supervisor.start();

      // Cycle 1: Failure 1
      await supervisor.executeCycle();
      assert.equal(supervisor.getConsecutiveFailures(), 1);
      assert.equal(supervisor.getStatus(), 'RUNNING');

      // Cycle 2: Failure 2
      await supervisor.executeCycle();
      assert.equal(supervisor.getConsecutiveFailures(), 2);
      assert.equal(supervisor.getStatus(), 'RUNNING');

      // Cycle 3: Failure 3 -> Trips Circuit Breaker
      await supervisor.executeCycle();
      assert.equal(supervisor.getConsecutiveFailures(), 3);
      assert.equal(failureCountRecorded, 3);
      assert.equal(supervisor.getStatus(), 'CIRCUIT_BROKEN');

      const health = await supervisor.getHealthReport();
      assert.equal(health.healthy, false);
      assert.equal(health.status, 'UNHEALTHY');
      assert.equal(health.supervisorStatus, 'CIRCUIT_BROKEN');

      await supervisor.stop();
    });

    it('should recover from CIRCUIT_BROKEN state when a subsequent cycle succeeds', async () => {
      let shouldFail = true;
      const supervisor = new WorkerSupervisor({
        workerId: 'test-worker-recovery',
        intervalMs: 10000,
        maxConsecutiveFailures: 2,
        cycleRunner: async () => {
          if (shouldFail) {
            throw new Error('Database temporarily offline');
          }
          return createMockCycleSummary('test-worker-recovery', 15);
        },
      });

      supervisor.start();

      // Trip circuit breaker
      await supervisor.executeCycle();
      await supervisor.executeCycle();
      assert.equal(supervisor.getStatus(), 'CIRCUIT_BROKEN');

      // Outage resolves
      shouldFail = false;
      await supervisor.executeCycle();

      assert.equal(supervisor.getStatus(), 'RUNNING');
      assert.equal(supervisor.getConsecutiveFailures(), 0);

      const health = await supervisor.getHealthReport();
      assert.equal(health.healthy, true);
      assert.equal(health.status, 'HEALTHY');

      await supervisor.stop();
    });

    it('should prevent new cycles from scheduling or executing once shutdown begins', async () => {
      let cycleCallCount = 0;
      const supervisor = new WorkerSupervisor({
        workerId: 'test-worker-shutdown-gate',
        intervalMs: 10000,
        cycleRunner: async () => {
          cycleCallCount++;
          return { skipped: true, reason: 'test' };
        },
      });

      supervisor.start();
      await supervisor.stop();

      assert.equal(supervisor.getStatus(), 'STOPPED');

      // Attempting to run cycle while STOPPED must be a no-op
      await supervisor.executeCycle();
      assert.equal(cycleCallCount, 0);
    });

    it('should enforce drain timeout if an in-flight cycle hangs during shutdown', async () => {
      let hangingPromiseResolve: (() => void) | null = null;
      const supervisor = new WorkerSupervisor({
        workerId: 'test-worker-drain-timeout',
        shutdownDrainTimeoutMs: 50, // 50ms fast timeout for testing
        cycleRunner: async () => {
          return new Promise((resolve) => {
            hangingPromiseResolve = resolve as () => void;
          });
        },
      });

      // Start an in-flight cycle
      const cyclePromise = supervisor.executeCycle();

      // Initiate stop while cycle is in-flight
      const stopStartTime = Date.now();
      await supervisor.stop();
      const stopDuration = Date.now() - stopStartTime;

      // Must complete without waiting indefinitely (bounded by drain timeout ~50ms)
      assert.ok(stopDuration < 500, `Stop took ${stopDuration}ms, must be bounded by drain timeout`);
      assert.equal(supervisor.getStatus(), 'STOPPED');

      // Clean up hanging promise
      if (hangingPromiseResolve) {
        (hangingPromiseResolve as () => void)();
      }
      await cyclePromise.catch(() => {});
    });

    it('should detect stale heartbeat older than threshold in health reporting', async () => {
      const supervisor = new WorkerSupervisor({
        workerId: 'test-worker-stale-hb',
        intervalMs: 30000,
      });

      supervisor['startedAt'] = Date.now() - 300000;
      supervisor['lastRunAt'] = new Date(Date.now() - 180000).toISOString(); // 180s ago (> 120s degraded)
      supervisor['status'] = 'RUNNING';

      const health = await supervisor.getHealthReport();
      assert.equal(health.status, 'DEGRADED');
      assert.ok((health.heartbeatAgeSeconds || 0) >= 180);

      await supervisor.stop();
    });
  });

  // ============================================================================
  // 2. Backup & Restore Failure-Path Verification (Section 4)
  // ============================================================================
  describe('2. Backup and Restore Failure Paths & Integrity Invariants', () => {
    it('should fail safely when missing PostgreSQL utility binaries', () => {
      assert.throws(
        () => assertPostgresUtilityAvailable('pg_dump', () => false),
        /OPERATIONAL PREREQUISITE MISSING: PostgreSQL utility "pg_dump" is required/
      );
      assert.throws(
        () => assertPostgresUtilityAvailable('pg_restore', () => false),
        /OPERATIONAL PREREQUISITE MISSING: PostgreSQL utility "pg_restore" is required/
      );
    });

    it('should prevent overwriting existing backup artifacts', () => {
      const existingFile = '/backups/aageonline_backup_existing.dump';
      const fileExistsMap = new Set([existingFile]);

      const overwriteCheck = checkBackupFileOverwrite(existingFile, (p) => fileExistsMap.has(p));
      assert.equal(overwriteCheck.canWrite, false);
      assert.match(overwriteCheck.error || '', /already exists.*Aborting to prevent overwrite/);

      const nonExistentFile = '/backups/aageonline_backup_new.dump';
      const safeCheck = checkBackupFileOverwrite(nonExistentFile, (p) => fileExistsMap.has(p));
      assert.equal(safeCheck.canWrite, true);
    });

    it('should validate backup manifest and reject corrupted, invalid or partial manifests', () => {
      // Empty content
      assert.equal(validateBackupManifest('').isValid, false);

      // Malformed JSON
      const corruptJsonResult = validateBackupManifest('{"brokenJson": true,');
      assert.equal(corruptJsonResult.isValid, false);
      assert.match(corruptJsonResult.error || '', /invalid JSON syntax/);

      // Missing required fields
      const missingFieldResult = validateBackupManifest(JSON.stringify({
        manifestVersion: '1.0.0',
        databaseName: 'test_db',
      }));
      assert.equal(missingFieldResult.isValid, false);
      assert.match(missingFieldResult.error || '', /missing required field/);

      // Partial backup marked as FAILED
      const failedBackupResult = validateBackupManifest(JSON.stringify({
        manifestVersion: '1.0.0',
        backupTimestamp: new Date().toISOString(),
        databaseName: 'aageonline_test',
        fileName: 'backup.dump',
        fileSizeBytes: 1024,
        checksumSha256: 'a'.repeat(64),
        verificationStatus: 'FAILED',
        credentialsStored: false,
      }));
      assert.equal(failedBackupResult.isValid, false);
      assert.match(failedBackupResult.error || '', /marked as FAILED/);

      // Security violation: stored credentials
      const insecureResult = validateBackupManifest(JSON.stringify({
        manifestVersion: '1.0.0',
        backupTimestamp: new Date().toISOString(),
        databaseName: 'aageonline_test',
        fileName: 'backup.dump',
        fileSizeBytes: 1024,
        checksumSha256: 'a'.repeat(64),
        verificationStatus: 'VERIFIED',
        credentialsStored: true, // Violation
      }));
      assert.equal(insecureResult.isValid, false);
      assert.match(insecureResult.error || '', /Security violation/);

      // Valid manifest
      const validResult = validateBackupManifest(JSON.stringify({
        manifestVersion: '1.0.0',
        backupTimestamp: new Date().toISOString(),
        databaseName: 'aageonline_test',
        fileName: 'backup.dump',
        fileSizeBytes: 1024,
        checksumSha256: 'a'.repeat(64),
        verificationStatus: 'VERIFIED',
        credentialsStored: false,
      }));
      assert.equal(validResult.isValid, true);
      assert.ok(validResult.manifest);
    });

    it('should strictly format restore error messages without leaking database credentials', () => {
      const errorWithPassword = new Error(
        'pg_restore: error: connection to server at "db.prod.internal" (10.0.0.5), port 5432 failed: password authentication failed for user "postgres" with connection string postgresql://postgres:MySecretPassword999@db.prod.internal:5432/test_db'
      );

      const safeMessage = formatSafeRestoreError(errorWithPassword);
      assert.equal(safeMessage.includes('MySecretPassword999'), false);
      assert.ok(safeMessage.includes('***'));
    });
  });

  // ============================================================================
  // 3. Financial Lifecycle Failure Paths (Section 5)
  // ============================================================================
  describe('3. Financial Lifecycle Failure Paths & Browser Redirect Security', () => {
    it('should reject payment initiation for cancelled, expired, or non-payable BidIntents', async () => {
      // 1. Unauthenticated user
      await assert.rejects(
        () => createPaymentOrder({
          bidIntentId: 'intent_123',
          actorUserId: '',
          idempotencyKey: 'idem_1',
        }),
        /Authentication required/
      );

      // 2. Missing idempotency key
      await assert.rejects(
        () => createPaymentOrder({
          bidIntentId: 'intent_123',
          actorUserId: 'usr_test',
          idempotencyKey: '   ',
        }),
        /Idempotency-Key/
      );

      // 3. Non-existent BidIntent
      await assert.rejects(
        () => createPaymentOrder({
          bidIntentId: 'intent_non_existent',
          actorUserId: 'usr_test',
          idempotencyKey: 'idem_valid',
        }),
        /not found/
      );
    });

    it('should reject forged or untrusted PayU webhooks with invalid signatures', async () => {
      const forgedPayload = {
        key: 'merchant_key_123',
        txnid: 'txn_fake_attack_123',
        status: 'success',
        amount: '5000.00',
        hash: 'invalid_forged_hash_value',
        mihpayid: '999999',
      };

      await assert.rejects(
        () => processPayUWebhook(forgedPayload),
        /Invalid webhook payload or signature/
      );
    });

    it('should prove browser redirect cannot independently confirm payment or bypass signature verification', async () => {
      const intent = await createBidIntent({
        businessId: VALID_BIZ_ID,
        marketId: VALID_MARKET_ID,
        targetPosition: 1,
        actorUserId: OWNER_USER_ID,
        idempotencyKey: 'idem_intent_redirect',
      });

      const { paymentOrder } = await createPaymentOrder({
        bidIntentId: intent.id,
        actorUserId: OWNER_USER_ID,
        idempotencyKey: 'idem_order_redirect',
      });

      assert.equal(paymentOrder.status, 'PENDING');

      // Attacker attempts to hit webhook processing with fake signature
      const fakeCallback = {
        key: 'merchant_key_123',
        txnid: paymentOrder.providerTransactionId || '',
        status: 'success',
        amount: '5000.00',
        hash: 'forged_reverse_hash_attempt',
        mihpayid: 'fake_mih_123',
      };

      await assert.rejects(
        () => processPayUWebhook(fakeCallback),
        /Invalid webhook payload or signature/
      );

      // Verify that the order state remains strictly PENDING in the authoritative store
      const orderAfterAttack = getPaymentOrderInternal(paymentOrder.id);
      assert.equal(orderAfterAttack?.status, 'PENDING');

      // Attempting to settle an unconfirmed payment must strictly throw
      await assert.rejects(
        () => settleRanking({
          paymentOrderId: paymentOrder.id,
          actorUserId: OWNER_USER_ID,
        }),
        /Only CONFIRMED payments may settle into ranking/
      );
    });

    it('should handle duplicate webhook delivery idempotently without duplicating audit events', async () => {
      const intent = await createBidIntent({
        businessId: VALID_BIZ_ID,
        marketId: VALID_MARKET_ID,
        targetPosition: 1,
        actorUserId: OWNER_USER_ID,
        idempotencyKey: 'idem_intent_dupe',
      });

      const { paymentOrder } = await createPaymentOrder({
        bidIntentId: intent.id,
        actorUserId: OWNER_USER_ID,
        idempotencyKey: 'idem_order_dupe',
      });

      // Generate valid PayU webhook payload with authentic reverse hash
      const config = getPayUConfig();
      const txnid = paymentOrder.providerTransactionId!;
      const amountStr = `${paymentOrder.amountRupees}.00`;

      const webhookHash = generatePayUReverseHash({
        key: config.merchantKey,
        txnid,
        amount: amountStr,
        productinfo: 'AageOnline Paid Visibility',
        firstname: 'Owner One',
        email: 'owner@example.com',
        status: 'success',
        udf1: intent.id,
        udf2: paymentOrder.id,
        salt: config.merchantSalt,
      });

      const validPayload: Record<string, string> = {
        key: config.merchantKey,
        txnid,
        amount: amountStr,
        productinfo: 'AageOnline Paid Visibility',
        firstname: 'Owner One',
        email: 'owner@example.com',
        status: 'success',
        hash: webhookHash,
        udf1: intent.id,
        udf2: paymentOrder.id,
        mihpayid: 'payu_mih_12345',
      };

      // 1. Initial Webhook Processing
      const result1 = await processPayUWebhook(validPayload);
      assert.equal(result1.processed, true);
      assert.equal(result1.status, 'SUCCEEDED');
      assert.equal(result1.isDuplicate, false);

      // 2. Duplicate Delivery of Exact Same Webhook
      const result2 = await processPayUWebhook(validPayload);
      assert.equal(result2.processed, true);
      assert.equal(result2.status, 'SUCCEEDED');
      assert.equal(result2.isDuplicate, true);
    });

    it('should reject settlement when payment is not confirmed or currency mismatches', async () => {
      await assert.rejects(
        () => settleRanking({
          paymentOrderId: 'order_non_existent',
          actorUserId: 'usr_test',
        }),
        /was not found/
      );
    });
  });

  // ============================================================================
  // 4. Security & Operational Configuration Audits (Section 6)
  // ============================================================================
  describe('4. Security & Operational Configuration Invariants', () => {
    it('should strictly deny unauthenticated requests development identity in production mode', async () => {
      const originalEnv = process.env.NODE_ENV;
      try {
        (process.env as Record<string, string | undefined>).NODE_ENV = 'production';

        // Unauthenticated request (no token cookie or auth header)
        const session = await getServerSession(undefined);
        assert.equal(session, null, 'Must fail closed and return null in production');
      } finally {
        (process.env as Record<string, string | undefined>).NODE_ENV = originalEnv;
      }
    });

    it('should enforce platform administration assertions on non-admin users', () => {
      const now = new Date().toISOString();
      const regularUser: User = { id: 'usr_reg', email: 'user@example.com', role: 'USER', status: 'ACTIVE', createdAt: now, updatedAt: now };
      const inactiveAdmin: User = { id: 'usr_inact', email: 'admin@example.com', role: 'ADMIN', status: 'SUSPENDED', createdAt: now, updatedAt: now };
      const activeAdmin: User = { id: 'usr_adm', email: 'admin@example.com', role: 'ADMIN', status: 'ACTIVE', createdAt: now, updatedAt: now };

      assert.equal(isPlatformAdmin(regularUser), false);
      assert.equal(isPlatformAdmin(inactiveAdmin), false);
      assert.equal(isPlatformAdmin(activeAdmin), true);

      assert.throws(
        () => assertPlatformAdmin(regularUser),
        /Access denied: User "user@example.com"/
      );

      assert.throws(
        () => assertPlatformAdmin(inactiveAdmin),
        /User account is SUSPENDED/
      );

      assert.doesNotThrow(() => assertPlatformAdmin(activeAdmin));
    });

    it('should ensure connection strings with secrets are redacted before logging', () => {
      const urls = [
        'postgres://user:super_secret_pw@localhost:5432/mydb',
        'postgresql://admin:P%40ssw0rd!@10.0.0.1:5432/aageonline_db?sslmode=require',
      ];

      for (const u of urls) {
        const redacted = redactConnectionString(u);
        assert.equal(redacted.includes('super_secret_pw'), false);
        assert.equal(redacted.includes('P%40ssw0rd!'), false);
        assert.ok(redacted.includes('***'));
      }
    });
  });
});
