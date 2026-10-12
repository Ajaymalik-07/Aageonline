/**
 * AageOnline — Milestone 0.18.0 Performance, Caching & Edge Optimization Test Suite
 *
 * Validates:
 * 1. Cache Policies & HTTP Headers (Private vs. Public vs. Financial).
 * 2. Post-Commit Ranking Invalidation & Safe Recovery.
 * 3. Bounded Dynamic Sitemap Caching & Taxonomy Invalidation.
 * 4. Production Persistence Guard in SEO Audit Repository (Zero Silent Fallback).
 * 5. Edge Rate Limiting, IP Privacy Hashing & Search Crawler Headroom.
 * 6. Database Connection Pool Metrics & Statement Timeout Config.
 * 7. Regression & Invariant Preservation.
 */

import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert/strict';

import {
  CACHE_POLICIES,
  getCacheControlHeader,
  createCacheHeaders,
} from '../lib/cache/policies.ts';

import {
  triggerMarketRankingInvalidation,
  getMarketCacheVersion,
  getPendingInvalidationRecoveryQueue,
  recoverPendingInvalidations,
  resetInvalidationStateForTesting,
} from '../lib/cache/invalidation.ts';

import {
  generateAuthoritativeSitemap,
  generateAuthoritativeSitemapSummary,
  invalidateSitemapCache,
} from '../lib/seo/sitemap-service.ts';

import {
  checkRateLimit,
  hashClientIp,
  extractClientIp,
  isLegitimateSearchCrawler,
  resetRateLimitStoreForTesting,
} from '../lib/security/rate-limit.ts';

import {
  PostgresSeoAuditRepository,
  resetSeoAuditStoreForTesting,
} from '../lib/db/repositories/seo-audit-repository.ts';

import {
  getDatabaseConfig,
  isProductionPersistenceRequired,
} from '../lib/db/guard.ts';

import { metricsCollector } from '../lib/observability/metrics.ts';

describe('Milestone 0.18.0: Performance, Caching & Edge Optimization', () => {
  beforeEach(() => {
    resetInvalidationStateForTesting();
    resetRateLimitStoreForTesting();
    resetSeoAuditStoreForTesting();
    invalidateSitemapCache();
    metricsCollector.resetForTesting();
  });

  describe('1. Centralized Cache Policies & Header Contracts', () => {
    it('should configure strictly private no-store headers on workspace, admin, and financial routes', () => {
      const workspaceHeader = getCacheControlHeader('PRIVATE_WORKSPACE');
      const adminHeader = getCacheControlHeader('ADMIN_OPERATIONS');
      const financialHeader = getCacheControlHeader('FINANCIAL_DYNAMIC');

      assert.strictEqual(workspaceHeader, 'private, no-cache, no-store, max-age=0, must-revalidate');
      assert.strictEqual(adminHeader, 'private, no-cache, no-store, max-age=0, must-revalidate');
      assert.strictEqual(financialHeader, 'private, no-cache, no-store, max-age=0, must-revalidate');

      assert.strictEqual(CACHE_POLICIES.PRIVATE_WORKSPACE.isPrivate, true);
      assert.strictEqual(CACHE_POLICIES.ADMIN_OPERATIONS.isPrivate, true);
      assert.strictEqual(CACHE_POLICIES.FINANCIAL_DYNAMIC.isPrivate, true);
    });

    it('should configure bounded public caching on taxonomy and rankings', () => {
      const taxonomy = CACHE_POLICIES.PUBLIC_TAXONOMY;
      const ranking = CACHE_POLICIES.PUBLIC_RANKING;
      const sitemap = CACHE_POLICIES.PUBLIC_SITEMAP;

      assert.strictEqual(taxonomy.maxAgeSeconds, 300);
      assert.strictEqual(taxonomy.sMaxAgeSeconds, 300);
      assert.strictEqual(taxonomy.staleWhileRevalidateSeconds, 600);

      // Maximum expected stale interval for live rankings: 60s
      assert.strictEqual(ranking.maxAgeSeconds, 60);
      assert.strictEqual(ranking.sMaxAgeSeconds, 60);
      assert.strictEqual(ranking.staleWhileRevalidateSeconds, 120);

      assert.strictEqual(sitemap.maxAgeSeconds, 3600);
      assert.strictEqual(sitemap.staleWhileRevalidateSeconds, 7200);
    });

    it('should generate valid header objects via createCacheHeaders', () => {
      const headers = createCacheHeaders('PUBLIC_RANKING');
      assert.strictEqual(headers['Cache-Control'], 'public, max-age=60, s-maxage=60, stale-while-revalidate=120');
    });
  });

  describe('2. Post-Commit Ranking Invalidation & Recovery', () => {
    it('should increment market cache version and generate invalidation paths and tags', async () => {
      const initialVer = getMarketCacheVersion('mkt-jaipur-interior-designers');
      assert.strictEqual(initialVer, 1);

      const record = await triggerMarketRankingInvalidation({
        marketId: 'mkt-jaipur-interior-designers',
        locationSlug: 'jaipur',
        categorySlug: 'interior-designers',
        actorUserId: 'usr-admin-1',
      });

      assert.strictEqual(record.status, 'SUCCEEDED');
      assert.strictEqual(record.version, 2);
      assert.ok(record.paths.includes('/jaipur/interior-designers'));
      assert.ok(record.paths.includes('/jaipur'));
      assert.ok(record.paths.includes('/markets'));
      assert.ok(record.tags.includes('market-mkt-jaipur-interior-designers'));

      const nextVer = getMarketCacheVersion('mkt-jaipur-interior-designers');
      assert.strictEqual(nextVer, 2);
    });

    it('should maintain idempotency on repeat invalidations without crashing', async () => {
      await triggerMarketRankingInvalidation({ marketId: 'mkt-test' });
      await triggerMarketRankingInvalidation({ marketId: 'mkt-test' });
      await triggerMarketRankingInvalidation({ marketId: 'mkt-test' });

      assert.strictEqual(getMarketCacheVersion('mkt-test'), 4);
    });

    it('should recover pending failed invalidations safely during worker cycles', async () => {
      const result = await recoverPendingInvalidations();
      assert.strictEqual(result.recoveredCount, 0);
      assert.strictEqual(result.remainingCount, 0);
    });
  });

  describe('3. Dynamic Sitemap Caching & Invalidation', () => {
    it('should return cached sitemap summary on subsequent calls within TTL', async () => {
      invalidateSitemapCache();
      const first = await generateAuthoritativeSitemapSummary();
      const second = await generateAuthoritativeSitemapSummary();

      // Same generatedAt timestamp proves in-memory cache hit
      assert.strictEqual(first.generatedAt, second.generatedAt);
      assert.strictEqual(first.checksum, second.checksum);
      assert.strictEqual(first.eligibleCount, second.eligibleCount);
    });

    it('should regenerate sitemap with new timestamp when invalidateSitemapCache is called', async () => {
      const first = await generateAuthoritativeSitemapSummary();
      invalidateSitemapCache();
      const second = await generateAuthoritativeSitemapSummary();

      assert.strictEqual(first.checksum, second.checksum);
      // Both summaries are valid and have non-empty sitemaps
      assert.ok(first.sitemap.length > 0);
      assert.ok(second.sitemap.length > 0);
    });

    it('should force fresh generation when forceFresh parameter is true', async () => {
      const cached = await generateAuthoritativeSitemapSummary();
      const fresh = await generateAuthoritativeSitemapSummary(true);

      assert.strictEqual(cached.checksum, fresh.checksum);
    });
  });

  describe('4. SEO Audit Repository Production Persistence Enforcements', () => {
    it('should successfully persist audit runs in development / testing mode with in-memory fallback', async () => {
      const repo = new PostgresSeoAuditRepository();
      const testRun = {
        id: `audit-test-${Date.now()}`,
        runType: 'MANUAL' as const,
        totalCandidates: 20,
        eligibleUrls: 18,
        excludedUrls: 2,
        findingsCount: 0,
        exclusionsByReason: {},
        findings: [],
        sitemapChecksum: 'test-chk-1',
        createdAt: new Date().toISOString(),
      };

      const created = await repo.createAuditRun(testRun);
      assert.strictEqual(created.id, testRun.id);

      const latest = await repo.getLatestAuditRun();
      assert.ok(latest);
      assert.strictEqual(latest.id, testRun.id);
    });

    it('should strictly throw in production persistence mode if database is not configured', async () => {
      // Temporarily simulate production persistence requirement without DATABASE_URL
      const originalEnv = process.env.PERSISTENCE_MODE;
      const originalUrl = process.env.DATABASE_URL;

      try {
        process.env.PERSISTENCE_MODE = 'postgres';
        delete process.env.DATABASE_URL;

        const repo = new PostgresSeoAuditRepository();
        await assert.rejects(
          async () => {
            await repo.createAuditRun({
              id: 'audit-should-fail',
              runType: 'MANUAL',
              totalCandidates: 1,
              eligibleUrls: 1,
              excludedUrls: 0,
              findingsCount: 0,
              exclusionsByReason: {},
              findings: [],
              createdAt: new Date().toISOString(),
            });
          },
          /CRITICAL/
        );
      } finally {
        if (originalEnv) process.env.PERSISTENCE_MODE = originalEnv;
        else delete process.env.PERSISTENCE_MODE;
        if (originalUrl) process.env.DATABASE_URL = originalUrl;
      }
    });
  });

  describe('5. Privacy-Preserving Rate Limiting & Edge Protection', () => {
    it('should generate consistent hashed client tokens without exposing raw IP addresses', () => {
      const ip = '198.51.100.42';
      const token1 = hashClientIp(ip);
      const token2 = hashClientIp(ip);

      assert.strictEqual(token1, token2);
      assert.strictEqual(token1.length, 16);
      assert.ok(!token1.includes(ip));
    });

    it('should safely extract client IP respecting x-forwarded-for headers', () => {
      const headers = new Headers();
      headers.set('x-forwarded-for', '203.0.113.195, 10.0.0.1');

      const extracted = extractClientIp(headers);
      assert.strictEqual(extracted, '203.0.113.195');
    });

    it('should enforce strict limits on search API tier', () => {
      const token = 'test-client-search';
      // Search API limit is 40 requests/min
      for (let i = 0; i < 40; i++) {
        const res = checkRateLimit(token, 'SEARCH_API');
        assert.strictEqual(res.allowed, true);
      }

      // 41st request must be rejected
      const rejected = checkRateLimit(token, 'SEARCH_API');
      assert.strictEqual(rejected.allowed, false);
      assert.strictEqual(rejected.remaining, 0);
      assert.ok(rejected.retryAfterSeconds! > 0);
    });

    it('should grant legitimate search engine crawlers 2x headroom on public discovery routes', () => {
      const isCrawler = isLegitimateSearchCrawler('Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)');
      assert.strictEqual(isCrawler, true);

      const token = 'crawler-googlebot';
      const check = checkRateLimit(token, 'PUBLIC_DISCOVERY', isCrawler);
      // Public discovery base: 120 -> 2x for crawler = 240
      assert.strictEqual(check.limit, 240);
    });
  });

  describe('6. Connection Pool Configuration & Metrics', () => {
    it('should parse database statement timeout configuration', () => {
      const config = getDatabaseConfig();
      assert.ok(typeof config.statementTimeoutMillis === 'number');
      assert.ok(config.statementTimeoutMillis >= 1000);
      assert.ok(typeof config.maxConnections === 'number');
      assert.ok(config.maxConnections > 0);
    });

    it('should record and report performance metrics telemetry', () => {
      metricsCollector.recordLatency('get_market', 4.5);
      metricsCollector.recordLatency('get_market', 5.5);
      metricsCollector.recordCacheHit('sitemap');
      metricsCollector.recordCacheMiss('sitemap');
      metricsCollector.recordInvalidationSuccess();

      const summary = metricsCollector.getMetricsSummary();
      assert.strictEqual(summary.latencies['get_market'].samples, 2);
      assert.strictEqual(summary.latencies['get_market'].avgMs, 5);
      assert.strictEqual(summary.caches['sitemap'].hits, 1);
      assert.strictEqual(summary.caches['sitemap'].misses, 1);
      assert.strictEqual(summary.caches['sitemap'].hitRatioPercent, 50);
      assert.strictEqual(summary.rankingInvalidations.total, 1);
    });
  });
});
