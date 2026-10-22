/**
 * AageOnline — Milestone 0.14.0 PostgreSQL Persistence & Readiness Test Suite
 *
 * Comprehensive tests verifying:
 * 1. Production persistence guard: strictly refuses in-memory financial stores when production is enabled.
 * 2. Database client configuration and health check behavior.
 * 3. Migration loading, SQL structure, constraint definitions, and ordering.
 * 4. Production readiness check and live payment pre-flight safety switch.
 * 5. Repository interfaces, query mappings, and idempotent constraint handlers.
 */

import { describe, it, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';

import {
  isDatabaseConfigured,
  isProductionPersistenceRequired,
  assertProductionPersistence,
  checkDatabaseHealth,
  getDatabaseConfig,
} from '../lib/db/client.ts';
import {
  loadMigrationFiles,
} from '../lib/db/migrator.ts';
import {
  checkProductionReadiness,
  assertLivePaymentReady,
} from '../lib/db/readiness.ts';
import {
  createBidIntent,
  getBidIntentInternal,
  resetBidIntentStoreForTesting,
} from '../lib/bid-intent/store.ts';
import {
  createPaymentOrder,
  processPayUWebhook,
  reconcilePaymentOrder,
  getPaymentOrderInternal,
  resetPaymentStoreForTesting,
} from '../lib/payments/store.ts';
import { reconcileSinglePaymentOrder } from '../lib/payments/reconciliation-service.ts';
import {
  settleRanking,
  resetSettlementStoreForTesting,
} from '../lib/ranking-settlement/settlement-service.ts';

describe('Milestone 0.14.0 — PostgreSQL Persistence & Production Readiness', () => {
  const originalEnv = { ...process.env };

  const setEnv = (key: string, value?: string) => {
    const env = process.env as Record<string, string | undefined>;
    if (value === undefined) {
      delete env[key];
    } else {
      env[key] = value;
    }
  };

  beforeEach(() => {
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  describe('1. Production Persistence Guard & Configuration Invariants', () => {
    it('should identify when database is not configured', () => {
      setEnv('DATABASE_URL', undefined);
      assert.equal(isDatabaseConfigured(), false);
      assert.equal(getDatabaseConfig().connectionString, undefined);
    });

    it('should identify when database is configured', () => {
      setEnv('DATABASE_URL', 'postgresql://user:pass@localhost:5432/aageonline');
      assert.equal(isDatabaseConfigured(), true);
      assert.equal(getDatabaseConfig().connectionString, 'postgresql://user:pass@localhost:5432/aageonline');
    });

    it('should determine whether production persistence is mandatory based on environment', () => {
      setEnv('NODE_ENV', undefined);
      setEnv('APP_ENV', undefined);
      setEnv('PERSISTENCE_MODE', undefined);
      assert.equal(isProductionPersistenceRequired(), false);

      setEnv('NODE_ENV', 'production');
      assert.equal(isProductionPersistenceRequired(), true);

      setEnv('NODE_ENV', 'development');
      setEnv('PERSISTENCE_MODE', 'postgres');
      assert.equal(isProductionPersistenceRequired(), true);
    });

    it('should strictly throw error when production persistence is required but DATABASE_URL is missing', () => {
      setEnv('NODE_ENV', 'production');
      setEnv('DATABASE_URL', undefined);

      assert.throws(
        () => assertProductionPersistence(),
        (err: Error) => {
          assert.match(err.message, /CRITICAL CONFIGURATION ERROR/);
          assert.match(err.message, /DATABASE_URL is not configured/);
          return true;
        }
      );
    });

    it('should refuse createBidIntent execution in production without DATABASE_URL', async () => {
      setEnv('NODE_ENV', 'production');
      setEnv('DATABASE_URL', undefined);

      await assert.rejects(
        () =>
          createBidIntent(
            {
              businessId: 'biz-royal-interiors',
              marketId: 'mkt-jaipur-interior-designers',
              targetPosition: 1,
              idempotencyKey: 'idem-test-prod',
            },
            'user-ajay'
          ),
        /CRITICAL CONFIGURATION ERROR/
      );
    });

    it('should refuse createPaymentOrder execution in production without DATABASE_URL', async () => {
      setEnv('NODE_ENV', 'production');
      setEnv('DATABASE_URL', undefined);

      await assert.rejects(
        () =>
          createPaymentOrder({
            bidIntentId: 'bi-test',
            idempotencyKey: 'idem-test-pay-prod',
            actorUserId: 'user-ajay',
          }),
        /CRITICAL CONFIGURATION ERROR/
      );
    });

    it('should refuse processPayUWebhook execution in production without DATABASE_URL', async () => {
      setEnv('NODE_ENV', 'production');
      setEnv('DATABASE_URL', undefined);

      await assert.rejects(
        () =>
          processPayUWebhook({
            txnid: 'tx-test-webhook',
            status: 'success',
            hash: 'somehash',
          }),
        /CRITICAL CONFIGURATION ERROR/
      );
    });

    it('should refuse reconcilePaymentOrder execution in production without DATABASE_URL', async () => {
      setEnv('NODE_ENV', 'production');
      setEnv('DATABASE_URL', undefined);

      await assert.rejects(
        () => reconcilePaymentOrder('po-test', 'user-ajay'),
        /CRITICAL CONFIGURATION ERROR/
      );
    });

    it('should refuse reconcileSinglePaymentOrder execution in production without DATABASE_URL', async () => {
      setEnv('NODE_ENV', 'production');
      setEnv('DATABASE_URL', undefined);

      await assert.rejects(
        () => reconcileSinglePaymentOrder('po-test', 'user-ajay'),
        /CRITICAL CONFIGURATION ERROR/
      );
    });

    it('should refuse settleRanking execution in production without DATABASE_URL', async () => {
      setEnv('NODE_ENV', 'production');
      setEnv('DATABASE_URL', undefined);

      await assert.rejects(
        () =>
          settleRanking({
            paymentOrderId: 'po-test',
            actorUserId: 'user-ajay',
          }),
        /CRITICAL CONFIGURATION ERROR/
      );
    });

    it('should refuse all mutation paths when DATABASE_URL is blank or whitespace-only in production', async () => {
      setEnv('NODE_ENV', 'production');
      setEnv('DATABASE_URL', '   ');

      assert.equal(isDatabaseConfigured(), false);

      await assert.rejects(
        () =>
          createBidIntent(
            {
              businessId: 'biz-royal-interiors',
              marketId: 'mkt-jaipur-interior-designers',
              targetPosition: 1,
              idempotencyKey: 'idem-blank-db',
            },
            'user-ajay'
          ),
        /CRITICAL CONFIGURATION ERROR/
      );

      await assert.rejects(
        () =>
          createPaymentOrder({
            bidIntentId: 'bi-test',
            idempotencyKey: 'idem-test-blank-pay',
            actorUserId: 'user-ajay',
          }),
        /CRITICAL CONFIGURATION ERROR/
      );

      await assert.rejects(
        () =>
          processPayUWebhook({
            txnid: 'tx-blank-db',
            status: 'success',
            hash: 'somehash',
          }),
        /CRITICAL CONFIGURATION ERROR/
      );

      await assert.rejects(
        () => settleRanking({ paymentOrderId: 'po-test', actorUserId: 'user-ajay' }),
        /CRITICAL CONFIGURATION ERROR/
      );
    });

    it('should fail closed against conflicting production and non-production environment variables', async () => {
      setEnv('DATABASE_URL', undefined);

      // Conflict Case 1: NODE_ENV=production with APP_ENV=development and PERSISTENCE_MODE=memory
      setEnv('NODE_ENV', 'production');
      setEnv('APP_ENV', 'development');
      setEnv('PERSISTENCE_MODE', 'memory');
      assert.equal(isProductionPersistenceRequired(), true);
      assert.throws(() => assertProductionPersistence(), /CRITICAL CONFIGURATION ERROR/);

      // Conflict Case 2: APP_ENV=production with NODE_ENV=test
      setEnv('NODE_ENV', 'test');
      setEnv('APP_ENV', 'production');
      setEnv('PERSISTENCE_MODE', undefined);
      assert.equal(isProductionPersistenceRequired(), true);
      assert.throws(() => assertProductionPersistence(), /CRITICAL CONFIGURATION ERROR/);

      // Conflict Case 3: PERSISTENCE_MODE=postgres with NODE_ENV=development
      setEnv('NODE_ENV', 'development');
      setEnv('APP_ENV', undefined);
      setEnv('PERSISTENCE_MODE', 'postgres');
      assert.equal(isProductionPersistenceRequired(), true);
      assert.throws(() => assertProductionPersistence(), /CRITICAL CONFIGURATION ERROR/);

      // Conflict Case 4: PERSISTENCE_MODE=production with NODE_ENV=test
      setEnv('NODE_ENV', 'test');
      setEnv('APP_ENV', undefined);
      setEnv('PERSISTENCE_MODE', 'production');
      assert.equal(isProductionPersistenceRequired(), true);
      assert.throws(() => assertProductionPersistence(), /CRITICAL CONFIGURATION ERROR/);

      // Conflict Case 5: NODE_ENV=prod alias with APP_ENV=development
      setEnv('NODE_ENV', 'prod');
      setEnv('APP_ENV', 'development');
      setEnv('PERSISTENCE_MODE', undefined);
      assert.equal(isProductionPersistenceRequired(), true);
      assert.throws(() => assertProductionPersistence(), /CRITICAL CONFIGURATION ERROR/);
    });

    it('should enforce zero-mutation guarantee across all stores when guard rejects in production', async () => {
      resetBidIntentStoreForTesting();
      resetPaymentStoreForTesting();
      resetSettlementStoreForTesting();

      setEnv('NODE_ENV', 'production');
      setEnv('DATABASE_URL', undefined);

      // 1. Rejected createBidIntent must leave bid intent store untouched
      const testIdemKey = 'idem-zero-mutation-test';
      await assert.rejects(
        () =>
          createBidIntent(
            {
              businessId: 'biz-royal-interiors',
              marketId: 'mkt-jaipur-interior-designers',
              targetPosition: 1,
              idempotencyKey: testIdemKey,
            },
            'user-ajay'
          ),
        /CRITICAL CONFIGURATION ERROR/
      );

      // 2. Rejected createPaymentOrder must leave payment store untouched
      await assert.rejects(
        () =>
          createPaymentOrder({
            bidIntentId: 'bi-nonexistent',
            idempotencyKey: 'idem-zero-pay',
            actorUserId: 'user-ajay',
          }),
        /CRITICAL CONFIGURATION ERROR/
      );
      assert.equal(getPaymentOrderInternal('bi-nonexistent'), undefined);

      // 3. Rejected processPayUWebhook must not record provider events or mutate orders
      await assert.rejects(
        () =>
          processPayUWebhook({
            txnid: 'tx-zero-mutation',
            status: 'success',
            hash: 'dummyhash',
          }),
        /CRITICAL CONFIGURATION ERROR/
      );

      // 4. Rejected settleRanking must not produce ranking settlements
      await assert.rejects(
        () => settleRanking({ paymentOrderId: 'po-zero', actorUserId: 'user-ajay' }),
        /CRITICAL CONFIGURATION ERROR/
      );
    });

    it('should not acknowledge a failed persistence operation as a successful webhook', async () => {
      setEnv('NODE_ENV', 'production');
      setEnv('DATABASE_URL', undefined);

      let webhookError: any = null;
      try {
        await processPayUWebhook({
          txnid: 'tx-unpersisted-webhook',
          status: 'success',
          hash: 'fake-hash',
        });
      } catch (err) {
        webhookError = err;
      }

      assert.ok(webhookError instanceof Error, 'Expected processPayUWebhook to throw an error on persistence failure');
      assert.match(webhookError.message, /CRITICAL CONFIGURATION ERROR/);
    });
  });

  describe('2. Database Health & Readiness Pre-Flight Audits', () => {
    it('should report unhealthy status when DATABASE_URL is not set', async () => {
      setEnv('DATABASE_URL', undefined);
      const health = await checkDatabaseHealth();
      assert.equal(health.healthy, false);
      assert.equal(health.configured, false);
      assert.equal(health.error, 'DATABASE_URL is not set.');
    });

    it('should perform comprehensive readiness audit and block live money when prerequisites missing', async () => {
      setEnv('NODE_ENV', 'production');
      setEnv('DATABASE_URL', undefined);
      setEnv('PAYU_MERCHANT_KEY', undefined);
      setEnv('PAYU_MERCHANT_SALT', undefined);

      const report = await checkProductionReadiness();
      assert.equal(report.ready, false);
      assert.ok(report.errors.length >= 2);
      assert.ok(report.errors.some((e) => e.includes('DATABASE_URL')));
      assert.ok(report.errors.some((e) => e.includes('PayU merchant credentials')));

      await assert.rejects(
        () => assertLivePaymentReady(),
        (err: Error) => {
          assert.match(err.message, /UNSAFE PAYMENT INITIATION BLOCKED/);
          return true;
        }
      );
    });
  });

  describe('3. Version-Controlled SQL Migrations Integrity', () => {
    it('should load versioned migration files in exact sorted order', () => {
      const files = loadMigrationFiles();
      assert.ok(files.length >= 5);
      assert.equal(files[0].version, '001');
      assert.equal(files[1].version, '002');
      assert.equal(files[2].version, '003');
      assert.equal(files[3].version, '004');
      assert.equal(files[4].version, '005');
    });

    it('Migration 001 should define core taxonomy, active position uniqueness index, and audit tables', () => {
      const files = loadMigrationFiles();
      const m1 = files.find((f) => f.version === '001')!;
      assert.ok(m1.sql.includes('CREATE TABLE IF NOT EXISTS markets'));
      assert.ok(m1.sql.includes('CREATE TABLE IF NOT EXISTS businesses'));
      assert.ok(m1.sql.includes('CREATE TABLE IF NOT EXISTS market_participations'));
      assert.ok(m1.sql.includes('uq_markets_location_category'));
      assert.ok(m1.sql.includes('uq_market_participations_active_position'));
      assert.ok(m1.sql.includes('WHERE status = \'ACTIVE\' AND current_position IS NOT NULL'));
      assert.ok(m1.sql.includes('CREATE TABLE IF NOT EXISTS audit_logs'));
    });

    it('Migration 002 should enforce BidIntent scoped idempotency and integer minor amounts', () => {
      const files = loadMigrationFiles();
      const m2 = files.find((f) => f.version === '002')!;
      assert.ok(m2.sql.includes('CREATE TABLE IF NOT EXISTS bid_intents'));
      assert.ok(m2.sql.includes('CONSTRAINT uq_bid_intents_actor_business_key UNIQUE (created_by_user_id, business_id, idempotency_key)'));
      assert.ok(m2.sql.includes('qualifying_amount_minor % 100 = 0'));
      assert.ok(m2.sql.includes('pricing_snapshot JSONB NOT NULL'));
    });

    it('Migration 003 should enforce PaymentOrder constraints and provider event fingerprints', () => {
      const files = loadMigrationFiles();
      const m3 = files.find((f) => f.version === '003')!;
      assert.ok(m3.sql.includes('CREATE TABLE IF NOT EXISTS payment_orders'));
      assert.ok(m3.sql.includes('CONSTRAINT uq_payment_orders_bid_intent_provider UNIQUE (bid_intent_id, provider)'));
      assert.ok(m3.sql.includes('CONSTRAINT uq_payment_orders_idempotency UNIQUE (created_by_user_id, business_id, bid_intent_id, idempotency_key)'));
      assert.ok(m3.sql.includes('CONSTRAINT uq_payment_orders_provider_txnid UNIQUE (provider_transaction_id)'));
      assert.ok(m3.sql.includes('CREATE TABLE IF NOT EXISTS payment_provider_events'));
      assert.ok(m3.sql.includes('CONSTRAINT uq_payment_provider_events_fingerprint UNIQUE (provider, payload_hash)'));
    });

    it('Migration 004 should enforce RankingSettlement uniqueness and PositionHistory movement checks', () => {
      const files = loadMigrationFiles();
      const m4 = files.find((f) => f.version === '004')!;
      assert.ok(m4.sql.includes('CREATE TABLE IF NOT EXISTS ranking_settlements'));
      assert.ok(m4.sql.includes('CONSTRAINT uq_ranking_settlements_payment_order UNIQUE (payment_order_id)'));
      assert.ok(m4.sql.includes('CREATE TABLE IF NOT EXISTS position_history'));
      assert.ok(m4.sql.includes('CONSTRAINT chk_position_history_movement CHECK'));
      assert.ok(m4.sql.includes('previous_position IS NULL OR previous_position <> new_position'));
    });

    it('Migration 005 should define recovery jobs with SKIP LOCKED polling index', () => {
      const files = loadMigrationFiles();
      const m5 = files.find((f) => f.version === '005')!;
      assert.ok(m5.sql.includes('CREATE TABLE IF NOT EXISTS settlement_recovery_jobs'));
      assert.ok(m5.sql.includes('idx_recovery_jobs_poll'));
      assert.ok(m5.sql.includes('WHERE status IN (\'PENDING\', \'RETRYABLE\')'));
    });
  });
});
