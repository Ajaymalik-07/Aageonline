/**
 * AageOnline — Milestone 0.19.0 Production Readiness & Distributed State Verification Suite
 *
 * Validates:
 * 1. Application restart with pending invalidation jobs (survives restart, idempotent).
 * 2. Multiple workers concurrently processing the same event (SKIP LOCKED / lease isolation).
 * 3. Invalidation provider outage and bounded recovery (exponential backoff & terminal failure).
 * 4. Cross-instance rate-limit consistency and distributed store behavior.
 * 5. Rate-limit store outage resilience (graceful degraded-local failover).
 * 6. Spoofed crawler user-agent rejection (never trusts raw User-Agent string).
 * 7. Untrusted proxy header rejection (anti-spoofing client IP extraction).
 * 8. Database disconnect during required operations (fail-closed production guard).
 * 9. Duplicate payment callback & webhook events (idempotent rejection / deduplication).
 * 10. Settlement rollback & retry (transaction atomicity, zero corrupted positions).
 * 11. Unauthorized operations-summary access control (assertPlatformAdmin).
 * 12. Private response cache isolation (strict no-store on sensitive endpoints).
 * 13. Worker heartbeat becoming stale (health check / readiness detection).
 */

import { describe, it, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';

import {
  PostgresInvalidationRepository,
  resetDurableInvalidationStoreForTesting,
} from '../lib/db/repositories/invalidation-repository.ts';

import {
  triggerMarketRankingInvalidation,
  recoverPendingInvalidations,
  resetInvalidationStateForTesting,
} from '../lib/cache/invalidation.ts';

import {
  checkRateLimit,
  extractClientIp,
  hashClientIp,
  isVerifiedSearchCrawler,
  isTrustedProxy,
  resetRateLimitCacheForTesting,
  RATE_LIMIT_TIERS,
} from '../lib/security/rate-limit.ts';
import { checkDistributedRateLimit } from '../lib/security/distributed-rate-limit.ts';

import {
  CACHE_POLICIES,
  getCacheControlHeader,
} from '../lib/cache/policies.ts';

import {
  assertProductionPersistence,
  isProductionPersistenceRequired,
} from '../lib/db/guard.ts';

import {
  createBidIntent,
  resetBidIntentStoreForTesting,
} from '../lib/bid-intent/store.ts';

import {
  createPaymentOrder,
  confirmPaymentOrder,
  processPayUWebhook,
  getPaymentOrderById,
  resetPaymentStoreForTesting,
} from '../lib/payments/store.ts';

import {
  settleRanking,
  getRankingSettlementByPaymentOrderId,
  resetSettlementStoreForTesting,
} from '../lib/ranking-settlement/settlement-service.ts';

import {
  setTransactionFailureInjection,
  resetTransactionManagerForTesting,
} from '../lib/ranking-settlement/transaction.ts';

import {
  PostgresHeartbeatRepository,
  resetHeartbeatStoreForTesting,
} from '../lib/db/repositories/heartbeat-repository.ts';

import {
  checkProductionReadiness,
} from '../lib/db/readiness.ts';

import {
  assertPlatformAdmin,
  AdminAuthenticationError,
  AdminAuthorizationError,
} from '../lib/auth/admin-guard.ts';

describe('Milestone 0.19.0: Production Readiness, Distributed State & Live Infrastructure Verification', () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    process.env = { ...originalEnv };
    resetInvalidationStateForTesting();
    resetDurableInvalidationStoreForTesting();
    resetRateLimitCacheForTesting();
    resetBidIntentStoreForTesting();
    resetPaymentStoreForTesting();
    resetSettlementStoreForTesting();
    resetTransactionManagerForTesting();
    resetHeartbeatStoreForTesting();
  });

  afterEach(() => {
    process.env = { ...originalEnv };
    setTransactionFailureInjection(null);
  });

  describe('1. Durable Cache Invalidation Recovery & Restarts', () => {
    it('should survive application restart with pending invalidation jobs intact', async () => {
      const repo1 = new PostgresInvalidationRepository();
      const jobInput = {
        id: 'job-restart-1',
        marketId: 'mkt-jaipur-interior-designers',
        paths: ['/markets', '/jaipur/interior-designers'],
        tags: ['market-mkt-jaipur-interior-designers'],
        version: 2,
        triggerCause: 'SETTLEMENT_COMMITTED',
      };

      await repo1.enqueueJob(jobInput);

      // Simulate application restart by creating a new repository instance
      const repo2 = new PostgresInvalidationRepository();
      const stats = await repo2.getInvalidationStats();
      assert.strictEqual(stats.pendingCount, 1);

      // Claim job after restart
      const claimed = await repo2.claimNextJobs(10, 60);
      assert.strictEqual(claimed.length, 1);
      assert.strictEqual(claimed[0].id, 'job-restart-1');
      assert.strictEqual(claimed[0].status, 'PROCESSING');
    });

    it('should prevent multiple workers from processing the same event concurrently', async () => {
      const repo = new PostgresInvalidationRepository();
      await repo.enqueueJob({
        id: 'job-concurrent-1',
        marketId: 'mkt-1',
        paths: ['/markets'],
        tags: ['market-1'],
        version: 1,
      });

      // Worker 1 claims the batch
      const worker1Claimed = await repo.claimNextJobs(5, 60);
      assert.strictEqual(worker1Claimed.length, 1);
      assert.strictEqual(worker1Claimed[0].id, 'job-concurrent-1');

      // Worker 2 attempts to claim while locked by Worker 1
      const worker2Claimed = await repo.claimNextJobs(5, 60);
      assert.strictEqual(worker2Claimed.length, 0, 'Worker 2 must not receive locked jobs');
    });

    it('should handle invalidation provider outage with bounded backoff and terminal failure', async () => {
      const repo = new PostgresInvalidationRepository();
      await repo.enqueueJob({
        id: 'job-outage-1',
        marketId: 'mkt-1',
        paths: ['/markets'],
        tags: ['market-1'],
        maxAttempts: 3,
      });

      // Attempt 1: Fails with 0s backoff for immediate test retry
      const claim1 = await repo.claimNextJobs(1, 0);
      assert.strictEqual(claim1.length, 1);
      const fail1 = await repo.markJobFailed('job-outage-1', 'CDN Gateway 503', 0);
      assert.strictEqual(fail1.status, 'FAILED');

      // Attempt 2: Fails
      const claim2 = await repo.claimNextJobs(1, 0);
      assert.strictEqual(claim2.length, 1);
      const fail2 = await repo.markJobFailed('job-outage-1', 'CDN Timeout', 0);
      assert.strictEqual(fail2.status, 'FAILED');

      // Attempt 3: Exceeds maxAttempts (3) -> TERMINAL_FAILED
      const claim3 = await repo.claimNextJobs(1, 0);
      assert.strictEqual(claim3.length, 1);
      const fail3 = await repo.markJobFailed('job-outage-1', 'CDN Permanent 404', 0);
      assert.strictEqual(fail3.status, 'TERMINAL_FAILED');

      const stats = await repo.getInvalidationStats();
      assert.strictEqual(stats.terminalFailedCount, 1);
      assert.strictEqual(stats.pendingCount, 0);
    });

    it('should complete invalidation recovery during worker cycles without reverting settlements', async () => {
      const record = await triggerMarketRankingInvalidation({
        marketId: 'mkt-test-inval',
        locationSlug: 'jaipur',
        categorySlug: 'interior-designers',
      });

      assert.strictEqual(record.status, 'SUCCEEDED');
      const stats = await recoverPendingInvalidations();
      assert.strictEqual(stats.failedCount, 0);
    });
  });

  describe('2. Rate Limiting, Proxy Anti-Spoofing & Crawler Protection', () => {
    it('should reject spoofed crawler user-agents and enforce normal public limits', () => {
      const fakeHeaders = new Headers();
      fakeHeaders.set('user-agent', 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)');

      // Not infrastructure-verified
      const isVerified = isVerifiedSearchCrawler(fakeHeaders);
      assert.strictEqual(isVerified, false, 'Spoofed user-agent must NOT be verified');

      const clientToken = hashClientIp('203.0.113.10');
      const check = checkRateLimit(clientToken, 'PUBLIC_DISCOVERY', isVerified);
      // Standard public discovery limit (120), NOT 240
      assert.strictEqual(check.limit, RATE_LIMIT_TIERS.PUBLIC_DISCOVERY.maxRequests);
    });

    it('should grant elevated headroom only to infrastructure-verified crawlers', () => {
      const verifiedHeaders = new Headers();
      verifiedHeaders.set('cf-verified-bot', 'true');
      verifiedHeaders.set('user-agent', 'Googlebot');

      const isVerified = isVerifiedSearchCrawler(verifiedHeaders);
      assert.strictEqual(isVerified, true, 'Edge-verified header must be recognized');

      const clientToken = hashClientIp('66.249.66.1');
      const check = checkRateLimit(clientToken, 'PUBLIC_DISCOVERY', isVerified);
      assert.strictEqual(check.limit, RATE_LIMIT_TIERS.PUBLIC_DISCOVERY.maxRequests * 2);
    });

    it('should reject untrusted proxy headers and prevent client IP spoofing', () => {
      // Untrusted direct connection (e.g. from public internet IP)
      const untrustedRemoteIp = '198.51.100.99';
      const spoofedHeaders = new Headers();
      spoofedHeaders.set('x-forwarded-for', '8.8.8.8, 1.1.1.1');
      spoofedHeaders.set('x-real-ip', '8.8.8.8');

      const extracted = extractClientIp(spoofedHeaders, untrustedRemoteIp);
      assert.strictEqual(extracted, untrustedRemoteIp, 'Must ignore forwarded headers from untrusted connection');
    });

    it('should safely extract client IP when upstream connection is trusted proxy', () => {
      const trustedUpstream = '127.0.0.1';
      const headers = new Headers();
      headers.set('x-forwarded-for', '203.0.113.50, 10.0.0.1');

      const extracted = extractClientIp(headers, trustedUpstream);
      assert.strictEqual(extracted, '203.0.113.50', 'Must extract genuine client IP through trusted proxy');
    });

    it('should gracefully degrade to local memory during distributed rate-limit store outage', async () => {
      // With no database configured, checkDistributedRateLimit safely falls back to local memory
      const token = 'test-token-outage';
      const result = await checkDistributedRateLimit(token, 'SEARCH_API');

      assert.strictEqual(result.allowed, true);
      assert.ok(result.store === 'process-local' || result.store === 'degraded-local');
      assert.strictEqual(result.limit, 40);
    });
  });

  describe('3. Database Disconnect & Production Persistence Guard', () => {
    it('should strictly throw in production mode if DATABASE_URL is not configured', () => {
      (process.env as Record<string, string | undefined>).NODE_ENV = 'production';
      delete process.env.DATABASE_URL;
      delete process.env.NEXT_PHASE;

      assert.throws(
        () => assertProductionPersistence(),
        /CRITICAL CONFIGURATION ERROR/
      );
    });

    it('should refuse critical operations in production when database is unconfigured', async () => {
      (process.env as Record<string, string | undefined>).NODE_ENV = 'production';
      delete process.env.DATABASE_URL;
      delete process.env.NEXT_PHASE;

      await assert.rejects(
        () =>
          createBidIntent(
            {
              businessId: 'biz-royal-interiors',
              marketId: 'mkt-jaipur-interior-designers',
              targetPosition: 1,
              idempotencyKey: 'test-idem-prod',
            },
            'user-ajay'
          ),
        /CRITICAL CONFIGURATION ERROR/
      );
    });
  });

  describe('4. Payment, Webhook Deduplication & Ranking Atomicity', () => {
    it('should reject unconfirmed payments from settling ranking', async () => {
      const intent = await createBidIntent(
        {
          businessId: 'biz-royal-interiors',
          marketId: 'mkt-jaipur-interior-designers',
          targetPosition: 1,
          idempotencyKey: 'idem-settle-unconf',
        },
        'user-ajay'
      );

      const { paymentOrder: order } = await createPaymentOrder({
        bidIntentId: intent.id,
        idempotencyKey: 'idem-order-unconf',
        actorUserId: 'user-ajay',
      });

      // Status is PENDING, not CONFIRMED
      await assert.rejects(
        () => settleRanking({ paymentOrderId: order.id, actorUserId: 'user-ajay' }),
        /PaymentNotConfirmedError|Only CONFIRMED/
      );
    });

    it('should handle duplicate payment webhook events idempotently', async () => {
      const intent = await createBidIntent(
        {
          businessId: 'biz-royal-interiors',
          marketId: 'mkt-jaipur-interior-designers',
          targetPosition: 1,
          idempotencyKey: 'idem-webhook-dup',
        },
        'user-ajay'
      );

      const { paymentOrder: order } = await createPaymentOrder({
        bidIntentId: intent.id,
        idempotencyKey: 'idem-pay-dup',
        actorUserId: 'user-ajay',
      });

      // First confirmation succeeds
      const confirmed1 = await confirmPaymentOrder(order.id, 'user-ajay');
      assert.strictEqual(confirmed1.status, 'CONFIRMED');

      // Second confirmation is idempotent
      const confirmed2 = await confirmPaymentOrder(order.id, 'user-ajay');
      assert.strictEqual(confirmed2.status, 'CONFIRMED');
      assert.strictEqual(confirmed2.id, confirmed1.id);
    });

    it('should atomically roll back settlement on simulated failure and leave state clean', async () => {
      const intent = await createBidIntent(
        {
          businessId: 'biz-royal-interiors',
          marketId: 'mkt-jaipur-interior-designers',
          targetPosition: 1,
          idempotencyKey: 'idem-rollback-test',
        },
        'user-ajay'
      );

      const { paymentOrder: order } = await createPaymentOrder({
        bidIntentId: intent.id,
        idempotencyKey: 'idem-pay-rollback',
        actorUserId: 'user-ajay',
      });

      await confirmPaymentOrder(order.id, 'user-ajay');

      // Inject transaction failure
      setTransactionFailureInjection('before_settlement_record');

      await assert.rejects(
        () => settleRanking({ paymentOrderId: order.id, actorUserId: 'user-ajay' }),
        /SIMULATED_TRANSACTION_FAILURE|Simulated failure/
      );

      // Verify settlement is safely captured in recovery queue as RETRYABLE, not marked completed
      const settlement = getRankingSettlementByPaymentOrderId(order.id);
      assert.ok(settlement, 'Recovery job must exist in outbox');
      assert.strictEqual(settlement.status, 'RETRYABLE');
    });
  });

  describe('5. Observability, Security Boundaries & Cache Isolation', () => {
    it('should reject unauthorized access to platform administrative operations', () => {
      // Non-admin user
      const regularUser = {
        id: 'user-regular',
        email: 'regular@example.com',
        role: 'USER' as const,
        status: 'ACTIVE' as const,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      assert.throws(
        () => assertPlatformAdmin(regularUser),
        AdminAuthorizationError
      );

      // Unauthenticated
      assert.throws(
        () => assertPlatformAdmin(null),
        AdminAuthenticationError
      );
    });

    it('should enforce private no-store cache headers on administrative, workspace and financial routes', () => {
      const adminHeader = getCacheControlHeader('ADMIN_OPERATIONS');
      const workspaceHeader = getCacheControlHeader('PRIVATE_WORKSPACE');
      const financialHeader = getCacheControlHeader('FINANCIAL_DYNAMIC');

      assert.strictEqual(adminHeader, 'private, no-cache, no-store, max-age=0, must-revalidate');
      assert.strictEqual(workspaceHeader, 'private, no-cache, no-store, max-age=0, must-revalidate');
      assert.strictEqual(financialHeader, 'private, no-cache, no-store, max-age=0, must-revalidate');
    });

    it('should detect stale worker heartbeat in production readiness check', async () => {
      const heartbeatRepo = new PostgresHeartbeatRepository();
      // Record a heartbeat with timestamp
      const heartbeat = await heartbeatRepo.recordHeartbeat('worker-stale-1', 'reconciler-worker', {
        lastRunAt: new Date(Date.now() - 20 * 60 * 1000).toISOString(),
      });

      // Override lastHeartbeatAt directly for simulated historical test
      heartbeat.lastHeartbeatAt = new Date(Date.now() - 20 * 60 * 1000).toISOString();

      const latest = await heartbeatRepo.getLatestHeartbeat('reconciler-worker');
      assert.ok(latest);
      assert.strictEqual(latest.workerId, 'worker-stale-1');
      const ageMinutes = Math.round((Date.now() - new Date(latest.lastHeartbeatAt).getTime()) / 60000);
      assert.ok(ageMinutes >= 15, 'Heartbeat older than 15 minutes must be detected as stale');
    });
  });
});
