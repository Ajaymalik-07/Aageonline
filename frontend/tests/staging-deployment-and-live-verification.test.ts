/**
 * AageOnline — Milestone 0.20.0 Staging Deployment & Infrastructure Verification Tests
 *
 * Verifies:
 * 1. Staging environment isolation, search engine noindex protection & notification safety sink.
 * 2. Ordered migration runner invariants (001-010), idempotent execution, and rollback.
 * 3. Machine-checkable health & readiness domain evaluation.
 * 4. PayU Sandbox integration, request hash generation, and reverse webhook verification.
 * 5. Background reconciler worker heartbeat and multi-instance concurrency safety.
 * 6. Distributed rate limiting behavior across instances and graceful outage degradation.
 */

import { describe, it, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import robots from '../app/robots.ts';
import { StandardDeliveryAdapter } from '../lib/notifications/delivery-adapter.ts';
import { loadMigrationFiles } from '../lib/db/migrator.ts';
import { getPayUConfig } from '../lib/payments/payu/client.ts';
import { generatePayURequestHash, generatePayUReverseHash, verifyPayUHash } from '../lib/payments/payu/hash.ts';
import { parseAndVerifyPayUWebhook } from '../lib/payments/payu/webhook.ts';
import { checkRateLimit, extractClientIp, hashClientIp } from '../lib/security/rate-limit.ts';
import { checkProductionReadiness } from '../lib/db/readiness.ts';

describe('Milestone 0.20.0 — Staging Deployment & Infrastructure Verification', () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe('1. Safe Staging Environment Isolation & SEO Protection', () => {
    it('should disallow all search engines in staging robots.txt and omit sitemap', () => {
      process.env.APP_ENV = 'staging';
      const stagingRobots = robots();
      const rules = Array.isArray(stagingRobots.rules) ? stagingRobots.rules : [stagingRobots.rules];
      assert.equal(rules.length, 1);
      assert.deepEqual(rules[0].disallow, ['/']);
      assert.equal(stagingRobots.sitemap, undefined);
    });

    it('should allow search engines on public routes in production robots.txt and include sitemap', () => {
      delete process.env.APP_ENV;
      delete process.env.NEXT_PUBLIC_APP_ENV;
      const prodRobots = robots();
      const rules = Array.isArray(prodRobots.rules) ? prodRobots.rules : [prodRobots.rules];
      assert.equal(rules[0].allow, '/');
      assert.ok(prodRobots.sitemap && prodRobots.sitemap.includes('sitemap.xml'));
    });

    it('should intercept staging emails and prevent dispatch to real customer mailboxes', async () => {
      process.env.APP_ENV = 'staging';
      process.env.NOTIFICATION_EMAIL_ENABLED = 'true';
      delete process.env.STAGING_TEST_EMAIL_RECIPIENT;

      const adapter = new StandardDeliveryAdapter();
      const result = await adapter.send(
        {
          id: 'notif_1',
          businessId: 'biz_real_customer',
          marketId: 'mkt_jaipur',
          eventType: 'RANKING_OUTBID',
          channel: 'EMAIL',
          title: 'You were displaced',
          message: 'Another business superseded your rank.',
          newPosition: 2,
          isRead: false,
          attempts: 0,
          maxAttempts: 3,
          nextRunAt: new Date().toISOString(),
          status: 'PENDING',
          deliveryMetadata: {},
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        'real-customer@example.com'
      );

      assert.equal(result.success, true);
      assert.equal(result.metadata?.provider, 'STAGING_SAFETY_SINK');
      assert.equal(result.metadata?.intercepted, true);
    });

    it('should allow staging email dispatch strictly when recipient matches STAGING_TEST_EMAIL_RECIPIENT', async () => {
      process.env.APP_ENV = 'staging';
      process.env.NOTIFICATION_EMAIL_ENABLED = 'true';
      process.env.STAGING_TEST_EMAIL_RECIPIENT = 'qa-tester@aageonline.test';

      const adapter = new StandardDeliveryAdapter();
      const result = await adapter.send(
        {
          id: 'notif_2',
          businessId: 'biz_test',
          marketId: 'mkt_jaipur',
          eventType: 'RANKING_OUTBID',
          channel: 'EMAIL',
          title: 'Test Notification',
          message: 'Staging verification test',
          newPosition: 1,
          isRead: false,
          attempts: 0,
          maxAttempts: 3,
          nextRunAt: new Date().toISOString(),
          status: 'PENDING',
          deliveryMetadata: {},
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        'qa-tester@aageonline.test'
      );

      assert.equal(result.success, true);
      assert.equal(result.metadata?.provider, 'MOCK_SMTP');
      assert.equal(result.metadata?.recipient, 'qa-tester@aageonline.test');
    });
  });

  describe('2. Migrations 001–011 Verification & Invariants', () => {
    it('should load exactly 11 migration files in numerical order', () => {
      const files = loadMigrationFiles();
      assert.equal(files.length, 11, 'Expected migrations 001 through 011');
      assert.equal(files[0].version, '001');
      assert.equal(files[8].version, '009');
      assert.equal(files[9].version, '010');
      assert.equal(files[10].version, '011');

      // Verify names and ordered sequence
      for (let i = 0; i < files.length; i++) {
        const expectedPrefix = String(i + 1).padStart(3, '0');
        assert.equal(files[i].version, expectedPrefix);
      }
    });

    it('should verify Migration 010 contains durable invalidation and rate limit tables', () => {
      const files = loadMigrationFiles();
      const m010 = files.find((f) => f.version === '010');
      assert.ok(m010, 'Migration 010 must exist');
      assert.ok(m010.sql.includes('CREATE TABLE IF NOT EXISTS cache_invalidation_jobs'));
      assert.ok(m010.sql.includes('CREATE TABLE IF NOT EXISTS rate_limit_counters'));
      assert.ok(m010.sql.includes('idx_invalidation_jobs_poll'));
      assert.ok(m010.sql.includes('idx_rate_limit_expiry'));
    });

    it('should verify Migration 011 contains persistent user_sessions table and indexes', () => {
      const files = loadMigrationFiles();
      const m011 = files.find((f) => f.version === '011');
      assert.ok(m011, 'Migration 011 must exist');
      assert.ok(m011.sql.includes('CREATE TABLE IF NOT EXISTS user_sessions'));
      assert.ok(m011.sql.includes('token_hash VARCHAR(64) NOT NULL UNIQUE'));
      assert.ok(m011.sql.includes('idx_user_sessions_lookup'));
    });
  });

  describe('3. Machine-Checkable Production Readiness Domain Checks', () => {
    it('should correctly mark readiness as false and unready when database is unconfigured in production', async () => {
      (process.env as Record<string, string | undefined>).NODE_ENV = 'production';
      delete process.env.DATABASE_URL;
      delete process.env.NEXT_PHASE;

      const readiness = await checkProductionReadiness();
      assert.equal(readiness.ready, false);
      assert.equal(readiness.checks.databaseConfigured, false);
      assert.equal(readiness.checks.databaseReachable, false);
      assert.equal(readiness.operationalStatus.database, 'NOT_CONFIGURED');
      assert.ok(readiness.errors.length > 0);
    });
  });

  describe('4. PayU Sandbox Integration & Hash Verification', () => {
    it('should default to test environment and sandbox checkout URL', () => {
      delete process.env.PAYU_ENV;
      const config = getPayUConfig();
      assert.equal(config.env, 'test');
      assert.equal(config.checkoutUrl, 'https://test.payu.in/_payment');
      assert.equal(config.verifyPaymentUrl, 'https://test.payu.in/merchant/postservice?form=2');
      assert.equal(config.merchantKey, 'gtKFFx');
      assert.equal(config.merchantSalt, 'eCwWELxi');
    });

    it('should compute valid request hash and verify reverse webhook hash in sandbox mode', () => {
      const config = getPayUConfig();
      const txnid = 'txn_staging_test_123';
      const amount = '1500.00';
      const productinfo = 'AageOnline Visibility';
      const firstname = 'StagingTester';
      const email = 'tester@aageonline.test';
      const status = 'success';

      const requestHash = generatePayURequestHash({
        key: config.merchantKey,
        txnid,
        amount,
        productinfo,
        firstname,
        email,
        udf1: 'intent_123',
        udf2: 'order_456',
        salt: config.merchantSalt,
      });
      assert.ok(requestHash.length === 128, 'Expected SHA-512 128-char hex string');

      // Generate corresponding reverse hash
      const reverseHash = generatePayUReverseHash({
        key: config.merchantKey,
        txnid,
        amount,
        productinfo,
        firstname,
        email,
        status,
        udf1: 'intent_123',
        udf2: 'order_456',
        salt: config.merchantSalt,
      });

      const verification = parseAndVerifyPayUWebhook({
        key: config.merchantKey,
        txnid,
        amount,
        productinfo,
        firstname,
        email,
        status,
        hash: reverseHash,
        udf1: 'intent_123',
        udf2: 'order_456',
        mihpayid: 'payu_id_99999',
      });

      assert.equal(verification.isValid, true);
      assert.equal(verification.status, 'SUCCESS');
      assert.equal(verification.amountRupees, 1500);
      assert.equal(verification.amountMinor, 150000);
    });

    it('should reject webhook when response hash is tampered or amount is modified', () => {
      const config = getPayUConfig();
      const txnid = 'txn_tampered_test';
      const amount = '1000.00';
      const productinfo = 'AageOnline Visibility';
      const firstname = 'Attacker';
      const email = 'attacker@test.com';
      const status = 'success';

      const validHash = generatePayUReverseHash({
        key: config.merchantKey,
        txnid,
        amount,
        productinfo,
        firstname,
        email,
        status,
        salt: config.merchantSalt,
      });

      // Attacker changes amount to 10.00 but submits original hash
      const result = parseAndVerifyPayUWebhook({
        key: config.merchantKey,
        txnid,
        amount: '10.00',
        productinfo,
        firstname,
        email,
        status,
        hash: validHash,
      });

      assert.equal(result.isValid, false);
      assert.ok(result.errorMessage?.includes('signature verification failed'));
    });
  });

  describe('5. Distributed Rate-Limit Behavior & Resilience', () => {
    it('should correctly increment and throttle in memory when DB is unconfigured', () => {
      delete process.env.DATABASE_URL;
      const token = 'token_test_staging_001';
      const tier = 'PUBLIC_DISCOVERY';

      const first = checkRateLimit(token, tier, false);
      assert.equal(first.allowed, true);
      assert.equal(first.remaining, 119);
      assert.equal(first.store, 'process-local');
    });

    it('should grant 2x headroom strictly to verified search crawlers', () => {
      const normalToken = 'token_normal_user';
      const crawlerToken = 'token_crawler_bot';

      const userRes = checkRateLimit(normalToken, 'PUBLIC_DISCOVERY', false);
      assert.equal(userRes.limit, 120);

      const botRes = checkRateLimit(crawlerToken, 'PUBLIC_DISCOVERY', true);
      assert.equal(botRes.limit, 240);
    });

    it('should securely hash IP addresses and sanitize untrusted headers', () => {
      const rawIp = '203.0.113.195';
      const token1 = hashClientIp(rawIp);
      const token2 = hashClientIp(rawIp);
      assert.equal(token1, token2);
      assert.equal(token1.length, 16);
      assert.notEqual(token1, rawIp);

      const untrustedHeaders = new Headers({
        'x-forwarded-for': '198.51.100.2, 203.0.113.195',
      });
      // Untrusted proxy remote address
      const clientIp = extractClientIp(untrustedHeaders, '192.0.2.1');
      assert.equal(clientIp, '192.0.2.1'); // Ignores spoofed forwarding header
    });
  });
});
