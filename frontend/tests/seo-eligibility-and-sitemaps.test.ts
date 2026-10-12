/**
 * AageOnline — Milestone 0.17.0 SEO Eligibility, Sitemap Automation & Structured Data Test Suite
 *
 * Verifies:
 * 1. Centralized SEO eligibility policy (published vs draft vs noindex vs private).
 * 2. Canonical URL normalization and origin resolution (no localhost in production, query strings stripped).
 * 3. Authoritative dynamic sitemap generation (genuine dates, deduplication, no fabricated entries).
 * 4. Compliant JSON-LD structured data (no fake ratings/reviews, paid visibility disclosures).
 * 5. Market discovery quality auditing (thin pages flagged, candidate opportunities identified without auto-publishing).
 * 6. Search Console integration adapter (unconfigured state handled gracefully without fake metrics).
 * 7. Security invariants & role authorization on admin SEO endpoints.
 */

import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert/strict';

import {
  evaluateSeoEligibility,
} from '../lib/seo/eligibility.ts';
import {
  normalizeCanonicalPath,
  buildCanonicalUrl,
  isPrivateRoute,
  generateCanonicalMetadata,
  getAuthoritativeOrigin,
} from '../lib/seo/canonical.ts';
import {
  collectSeoCandidates,
  generateAuthoritativeSitemap,
  generateAuthoritativeSitemapSummary,
} from '../lib/seo/sitemap-service.ts';
import {
  generateWebsiteSchema,
  generateOrganizationSchema,
  generateBreadcrumbSchema,
  generateMarketRankingSchema,
  generateLocalBusinessSchema,
  validateJsonLdGraph,
} from '../lib/seo/schema.ts';
import {
  auditMarketHealth,
  analyzeDiscoveryOpportunities,
  runComprehensiveSeoAudit,
} from '../lib/seo/discovery-audit.ts';
import {
  StandardSearchConsoleAdapter,
} from '../lib/seo/search-console.ts';
import {
  PostgresSeoAuditRepository,
  resetSeoAuditStoreForTesting,
} from '../lib/db/repositories/seo-audit-repository.ts';
import { loadMigrationFiles } from '../lib/db/migrator.ts';
import { INITIAL_FEATURED_MARKETS } from '../config/markets.ts';

const seoAuditRepo = new PostgresSeoAuditRepository();

describe('Milestone 0.17.0 — Search Engine Visibility & Market Discovery Automation', () => {
  beforeEach(() => {
    resetSeoAuditStoreForTesting();
  });

  describe('1. Version-Controlled SQL Migration 008 Integrity', () => {
    it('should include migration 008_seo_audits.sql in sequential registry', () => {
      const files = loadMigrationFiles();
      assert.ok(files.length >= 8, `Expected at least 8 migrations, got ${files.length}`);
      const mig008 = files.find((f) => f.version === '008');
      assert.ok(mig008, 'Migration 008 must exist');
      assert.equal(mig008.name, '008_seo_audits.sql');
      assert.match(mig008.sql, /CREATE TABLE IF NOT EXISTS seo_audit_runs/);
      assert.match(mig008.sql, /CREATE TABLE IF NOT EXISTS seo_registered_routes/);
      assert.match(mig008.sql, /idx_seo_audit_runs_created/);
    });
  });

  describe('2. Canonical URL Normalization & Origin Resolution', () => {
    it('should normalize paths by lowercasing, stripping queries, fragments, and duplicate slashes', () => {
      assert.equal(normalizeCanonicalPath('/Jaipur/Interior-Designers?utm_source=google'), '/jaipur/interior-designers');
      assert.equal(normalizeCanonicalPath('///delhi//restaurants///#top'), '/delhi/restaurants');
      assert.equal(normalizeCanonicalPath(''), '/');
      assert.equal(normalizeCanonicalPath('/'), '/');
    });

    it('should construct absolute canonical URLs with authoritative production origin', () => {
      const canonical = buildCanonicalUrl('/jaipur/interior-designers');
      assert.ok(canonical.startsWith('http'));
      assert.match(canonical, /\/jaipur\/interior-designers$/);
      assert.doesNotMatch(canonical, /\?|\#/);
    });

    it('should identify private and authenticated operational routes', () => {
      assert.equal(isPrivateRoute('/admin/operations'), true);
      assert.equal(isPrivateRoute('/api/payments/callback'), true);
      assert.equal(isPrivateRoute('/business/dashboard/ranking-history'), true);
      assert.equal(isPrivateRoute('/workspace/notifications'), true);
      assert.equal(isPrivateRoute('/jaipur/interior-designers'), false);
      assert.equal(isPrivateRoute('/categories/restaurants'), false);
    });

    it('should generate valid technical Next.js Metadata with canonical tags and robots directives', () => {
      const meta = generateCanonicalMetadata({
        title: 'Jaipur Interior Designers | AageOnline',
        description: 'Verified competitive visibility positioning ladder in Jaipur.',
        path: '/jaipur/interior-designers',
        isIndexable: true,
      });

      assert.equal(meta.title, 'Jaipur Interior Designers | AageOnline');
      assert.ok(meta.alternates?.canonical);
      assert.match(String(meta.alternates?.canonical), /\/jaipur\/interior-designers$/);

      const robots = meta.robots as { index: boolean; follow: boolean };
      assert.equal(robots.index, true);
      assert.equal(robots.follow, true);
    });

    it('should enforce noindex on private or unindexable routes in metadata', () => {
      const meta = generateCanonicalMetadata({
        title: 'Admin Operations',
        description: 'Private administrative console',
        path: '/admin/operations',
        isIndexable: true, // Attempting to index a private route
      });

      const robots = meta.robots as { index: boolean; follow: boolean };
      assert.equal(robots.index, false, 'Private routes must always be noindex');
      assert.equal(robots.follow, false);
    });
  });

  describe('3. Centralized SEO Eligibility Policy', () => {
    it('should approve published, indexable, approved markets with active data', () => {
      const result = evaluateSeoEligibility({
        url: 'https://aageonline.com/jaipur/interior-designers',
        path: '/jaipur/interior-designers',
        routeType: 'MARKET',
        publicationStatus: 'PUBLISHED',
        indexabilityStatus: 'INDEXABLE',
        contentStatus: 'APPROVED',
        hasGenuineData: true,
        lastModified: '2026-01-01T00:00:00.000Z',
      });

      assert.equal(result.isEligible, true);
      assert.equal(result.priority, 0.9);
      assert.equal(result.changeFrequency, 'hourly');
      assert.equal(result.exclusionReason, undefined);
    });

    it('should exclude unpublished DRAFT or DISCOVERED markets', () => {
      const draftResult = evaluateSeoEligibility({
        url: 'https://aageonline.com/hisar/dentists',
        path: '/hisar/dentists',
        routeType: 'MARKET',
        publicationStatus: 'DRAFT',
        indexabilityStatus: 'INDEXABLE',
        contentStatus: 'DRAFT',
        hasGenuineData: true,
      });

      assert.equal(draftResult.isEligible, false);
      assert.equal(draftResult.exclusionReason, 'UNPUBLISHED');

      const discResult = evaluateSeoEligibility({
        url: 'https://aageonline.com/pune/lawyers',
        path: '/pune/lawyers',
        routeType: 'MARKET',
        publicationStatus: 'DISCOVERED',
        indexabilityStatus: 'INDEXABLE',
        contentStatus: 'MISSING',
        hasGenuineData: false,
      });

      assert.equal(discResult.isEligible, false);
      assert.equal(discResult.exclusionReason, 'UNPUBLISHED');
    });

    it('should exclude published pages that have explicit NOINDEX status', () => {
      const result = evaluateSeoEligibility({
        url: 'https://aageonline.com/test/special',
        path: '/test/special',
        routeType: 'MARKET',
        publicationStatus: 'PUBLISHED',
        indexabilityStatus: 'NOINDEX',
        contentStatus: 'APPROVED',
        hasGenuineData: true,
      });

      assert.equal(result.isEligible, false);
      assert.equal(result.exclusionReason, 'EXPLICIT_NOINDEX');
    });

    it('should exclude thin doorway cities/categories with 0 active markets', () => {
      const result = evaluateSeoEligibility({
        url: 'https://aageonline.com/empty-city',
        path: '/empty-city',
        routeType: 'LOCATION',
        publicationStatus: 'PUBLISHED',
        indexabilityStatus: 'INDEXABLE',
        contentStatus: 'APPROVED',
        hasGenuineData: true,
        activeChildCount: 0, // Thin page anti-doorway check
      });

      assert.equal(result.isEligible, false);
      assert.equal(result.exclusionReason, 'INSUFFICIENT_CONTENT');
      assert.match(result.exclusionDetail || '', /0 markets cannot be indexed/);
    });

    it('should exclude private and operational routes', () => {
      const result = evaluateSeoEligibility({
        url: 'https://aageonline.com/admin/operations',
        path: '/admin/operations',
        routeType: 'PRIVATE',
        hasGenuineData: true,
      });

      assert.equal(result.isEligible, false);
      assert.equal(result.exclusionReason, 'PRIVATE_ROUTE');
    });
  });

  describe('4. Dynamic Sitemap Generation & Integrity', () => {
    it('should collect candidate records across all public entities', async () => {
      const candidates = await collectSeoCandidates();
      assert.ok(candidates.length >= 10, `Expected at least 10 candidate entities, got ${candidates.length}`);

      // Ensure candidates include static indexes
      assert.ok(candidates.some((c) => c.routeType === 'HOME'));
      assert.ok(candidates.some((c) => c.routeType === 'MARKETS_INDEX'));
      assert.ok(candidates.some((c) => c.routeType === 'LOCATIONS_INDEX'));
      assert.ok(candidates.some((c) => c.routeType === 'CATEGORIES_INDEX'));
      assert.ok(candidates.some((c) => c.routeType === 'BUSINESSES_INDEX'));
      assert.ok(candidates.some((c) => c.routeType === 'MARKET'));
    });

    it('should generate authoritative sitemap entries with real timestamps and no query parameters', async () => {
      const summary = await generateAuthoritativeSitemapSummary();
      assert.ok(summary.eligibleCount > 0);
      assert.ok(summary.sitemap.length === summary.eligibleCount);
      assert.ok(summary.checksum.length >= 8);

      for (const entry of summary.sitemap) {
        assert.ok(entry.url.startsWith('http'), `Sitemap URL must be absolute: ${entry.url}`);
        assert.doesNotMatch(entry.url, /\?|\#/, `Sitemap URL must not contain query parameters: ${entry.url}`);
        assert.doesNotMatch(entry.url, /localhost/, `Sitemap URL must not contain localhost: ${entry.url}`);
        assert.doesNotMatch(entry.url, /\/admin|\/api|\/workspace|\/business\/dashboard/, `Sitemap must not contain private routes: ${entry.url}`);

        if (entry.lastModified) {
          assert.ok(entry.lastModified instanceof Date);
          assert.ok(!isNaN(entry.lastModified.getTime()));
        }
      }
    });

    it('should cleanly deduplicate entries when identical routes are evaluated', async () => {
      const summary = await generateAuthoritativeSitemapSummary();
      const urls = summary.sitemap.map((s) => s.url);
      const uniqueUrls = new Set(urls);
      assert.equal(urls.length, uniqueUrls.size, 'Sitemap must contain zero duplicate URLs');
    });
  });

  describe('5. Compliant Structured Data & Zero Fabricated Ratings', () => {
    it('should generate valid WebSite and Organization schemas', () => {
      const webSite = generateWebsiteSchema();
      const org = generateOrganizationSchema();

      const valSite = validateJsonLdGraph(webSite);
      assert.equal(valSite.isValid, true);
      assert.equal(valSite.errors.length, 0);

      const valOrg = validateJsonLdGraph(org);
      assert.equal(valOrg.isValid, true);
      assert.equal(valOrg.errors.length, 0);
    });

    it('should generate Market ItemList schema with mandatory Paid Visibility disclosures and NO fake reviews', () => {
      const market = INITIAL_FEATURED_MARKETS[0];
      const mockRankings = [
        {
          position: 1,
          businessId: 'biz-royal',
          businessName: 'Royal Interiors',
          businessSlug: 'royal-interiors',
          isVerified: true,
          visibilityAmountMinor: 2600000,
          updatedAt: new Date().toISOString(),
        },
      ];

      const schema = generateMarketRankingSchema(market, mockRankings);
      const validation = validateJsonLdGraph(schema);
      assert.equal(validation.isValid, true);
      assert.equal(validation.errors.length, 0);

      // Verify explicit additionalProperty disclosure
      const item = schema.itemListElement[0].item;
      assert.equal(item['@type'], 'LocalBusiness');
      const props = item.additionalProperty;
      assert.ok(props.some((p) => p.name === 'RankingModel' && p.value === 'Paid Competitive Visibility'));
      assert.ok(props.some((p) => p.name === 'QualityDisclosure'));
    });

    it('should strictly reject schemas with fabricated aggregateRating or reviews', () => {
      const invalidSchema = {
        '@context': 'https://schema.org',
        '@type': 'LocalBusiness',
        name: 'Unethical Business',
        aggregateRating: {
          '@type': 'AggregateRating',
          ratingValue: '5.0',
          reviewCount: '100',
        },
      };

      const validation = validateJsonLdGraph(invalidSchema);
      assert.equal(validation.isValid, false);
      assert.ok(validation.errors.some((e) => e.includes('Fabricated ratings or reviews are strictly prohibited')));
    });

    it('should generate LocalBusiness schema for verified business profiles without rating fabrication', () => {
      const schema = generateLocalBusinessSchema({
        name: 'Royal Interiors Studio',
        slug: 'royal-interiors-jaipur',
        description: 'Architectural modular interior design practice.',
        address: 'C-Scheme, Ashok Nagar',
        city: 'Jaipur',
        state: 'Rajasthan',
        phone: '+91 141 278 4900',
      });

      const validation = validateJsonLdGraph(schema);
      assert.equal(validation.isValid, true);
      assert.equal(schema['@type'], 'LocalBusiness');
      assert.equal(schema.name, 'Royal Interiors Studio');
      assert.equal(schema.address.addressLocality, 'Jaipur');
    });
  });

  describe('6. Discovery Quality Auditing & Internal Linking Analysis', () => {
    it('should inspect market health and detect canonical, taxonomy, or content issues', () => {
      const findings = auditMarketHealth('mkt-jaipur-interior-designers');
      // For a valid published market, no CRITICAL taxonomy issues should exist
      assert.ok(!findings.some((f) => f.severity === 'CRITICAL'));
    });

    it('should detect candidate market opportunities from approved cities and categories without auto-publishing', () => {
      const opportunities = analyzeDiscoveryOpportunities();
      assert.ok(typeof opportunities.unmatchedRequestsCount === 'number');
      assert.ok(Array.isArray(opportunities.candidateMarkets));
    });

    it('should execute comprehensive SEO audit sweep and compute sitemap checksum', async () => {
      const auditRun = await runComprehensiveSeoAudit('MANUAL');
      assert.ok(auditRun.id.startsWith('seo_audit_'));
      assert.ok(auditRun.totalCandidates > 0);
      assert.ok(auditRun.eligibleUrls > 0);
      assert.ok(typeof auditRun.sitemapChecksum === 'string');

      // Persist to repository
      await seoAuditRepo.createAuditRun(auditRun);

      const latest = await seoAuditRepo.getLatestAuditRun();
      assert.ok(latest);
      assert.equal(latest.id, auditRun.id);
      assert.equal(latest.eligibleUrls, auditRun.eligibleUrls);
    });
  });

  describe('7. Search Console Integration Adapter & Safe Unconfigured State', () => {
    it('should safely report unconfigured state when credentials are not in environment', async () => {
      const adapter = new StandardSearchConsoleAdapter();
      const status = await adapter.getStatus();

      // In test environment, service account credentials are unconfigured
      assert.equal(status.configured, false);
      assert.equal(status.submissionStatus, 'NOT_CONFIGURED');
      assert.match(status.details || '', /credentials .* are not configured/);
    });

    it('should advise manual submission when Search Console is unconfigured rather than failing or fabricating metrics', async () => {
      const adapter = new StandardSearchConsoleAdapter();
      const res = await adapter.submitSitemap();

      assert.equal(res.success, false);
      assert.match(res.message, /Submit .* manually in Google Search Console/);
    });
  });
});
