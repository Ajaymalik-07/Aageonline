/**
 * AageOnline — SEO Discovery Quality & Route Audit Engine
 *
 * Automates content quality verification, taxonomy relationship validation,
 * thin-content detection, candidate market discovery analysis, and internal link auditing.
 *
 * Invariants:
 * 1. Automation flags issues for human/admin review; NEVER auto-publishes unreviewed discoveries.
 * 2. Unreviewed or unverified locations/categories remain discovery records.
 * 3. Never fabricate content to pass quality gates.
 */

import crypto from 'node:crypto';
import type { SeoAuditFinding, SeoAuditRun, SeoExclusionReason } from '../../types/seo.ts';
import { collectSeoCandidates } from './sitemap-service.ts';
import { evaluateSeoEligibility } from './eligibility.ts';
import { getAllMarkets, getMarketById } from '../taxonomy/markets.ts';
import { getCityById, getAllCities } from '../taxonomy/locations.ts';
import { getCategoryById, getAllCategories } from '../taxonomy/categories.ts';
import { getAllDiscoveryRequests } from '../taxonomy/discovery.ts';

export interface CandidateMarketOpportunity {
  cityId: string;
  cityName: string;
  categoryId: string;
  categoryName: string;
  proposedSlug: string;
  discoveryRequestCount: number;
}

/**
 * Audits an individual market for content completeness, taxonomy integrity, and SEO health.
 */
export function auditMarketHealth(marketId: string): SeoAuditFinding[] {
  const findings: SeoAuditFinding[] = [];
  const market = getMarketById(marketId);

  if (!market) {
    findings.push({
      severity: 'CRITICAL',
      category: 'TAXONOMY',
      url: `/${marketId}`,
      message: `Market entity "${marketId}" does not exist in canonical registry.`,
      entityId: marketId,
    });
    return findings;
  }

  const city = getCityById(market.cityId);
  const category = getCategoryById(market.categoryId);

  if (!city) {
    findings.push({
      severity: 'CRITICAL',
      category: 'TAXONOMY',
      url: `/${market.slug}`,
      message: `Market references nonexistent city "${market.cityId}".`,
      entityId: market.id,
    });
  }

  if (!category) {
    findings.push({
      severity: 'CRITICAL',
      category: 'TAXONOMY',
      url: `/${market.slug}`,
      message: `Market references nonexistent category "${market.categoryId}".`,
      entityId: market.id,
    });
  }

  // Canonical slug alignment check
  if (city && category) {
    const expectedSlug = `${city.slug}/${category.slug}`;
    if (market.slug !== expectedSlug) {
      findings.push({
        severity: 'WARNING',
        category: 'CANONICAL',
        url: `/${market.slug}`,
        message: `Market slug "${market.slug}" does not match canonical pattern "${expectedSlug}".`,
        entityId: market.id,
      });
    }
  }

  // Thin content check
  if (market.publicationStatus === 'PUBLISHED' && market.totalBusinesses === 0) {
    findings.push({
      severity: 'WARNING',
      category: 'CONTENT_QUALITY',
      url: `/${market.slug}`,
      message: 'Published market contains 0 participating businesses (thin page risk).',
      entityId: market.id,
    });
  }

  // Content completeness check
  if (market.publicationStatus === 'PUBLISHED' && market.contentStatus !== 'APPROVED') {
    findings.push({
      severity: 'WARNING',
      category: 'CONTENT_QUALITY',
      url: `/${market.slug}`,
      message: `Published market has contentStatus "${market.contentStatus}". Review required prior to indexation.`,
      entityId: market.id,
    });
  }

  return findings;
}

/**
 * Analyzes discovery requests to safely identify candidate markets
 * from already approved cities and categories, without auto-publishing.
 */
export function analyzeDiscoveryOpportunities(): {
  candidateMarkets: CandidateMarketOpportunity[];
  unmatchedRequestsCount: number;
} {
  const requests = getAllDiscoveryRequests();
  const existingMarkets = getAllMarkets();
  const existingMarketKeys = new Set(existingMarkets.map((m) => `${m.cityId}::${m.categoryId}`));

  const allCities = getAllCities();
  const allCategories = getAllCategories();

  const cityMap = new Map(allCities.map((c) => [c.id, c]));
  const catMap = new Map(allCategories.map((c) => [c.id, c]));

  const candidateMarkets: CandidateMarketOpportunity[] = [];
  let unmatchedRequestsCount = 0;

  for (const req of requests) {
    if (req.requestType === 'MARKET' && req.cityId && req.categoryId) {
      const pairKey = `${req.cityId}::${req.categoryId}`;
      if (!existingMarketKeys.has(pairKey)) {
        const city = cityMap.get(req.cityId);
        const cat = catMap.get(req.categoryId);

        if (city && cat) {
          candidateMarkets.push({
            cityId: city.id,
            cityName: city.name,
            categoryId: cat.id,
            categoryName: cat.name,
            proposedSlug: `${city.slug}/${cat.slug}`,
            discoveryRequestCount: req.requestCount,
          });
        } else {
          unmatchedRequestsCount++;
        }
      }
    } else {
      unmatchedRequestsCount++;
    }
  }

  return {
    candidateMarkets,
    unmatchedRequestsCount,
  };
}

/**
 * Executes a comprehensive SEO health and eligibility audit across all public routes.
 */
export async function runComprehensiveSeoAudit(
  runType: 'SCHEDULED' | 'MANUAL' = 'MANUAL'
): Promise<SeoAuditRun> {
  const candidates = await collectSeoCandidates();
  const findings: SeoAuditFinding[] = [];
  const exclusionsByReason: Record<SeoExclusionReason, number> = {
    UNPUBLISHED: 0,
    EXPLICIT_NOINDEX: 0,
    INSUFFICIENT_CONTENT: 0,
    MISSING_DATA: 0,
    PRIVATE_ROUTE: 0,
    CANONICAL_CONFLICT: 0,
    INVALID_TAXONOMY: 0,
  };

  let eligibleUrls = 0;
  let excludedUrls = 0;
  const eligiblePaths: string[] = [];

  for (const candidate of candidates) {
    const evalResult = evaluateSeoEligibility(candidate);

    if (evalResult.isEligible) {
      eligibleUrls++;
      eligiblePaths.push(candidate.path);
    } else {
      excludedUrls++;
      if (evalResult.exclusionReason) {
        exclusionsByReason[evalResult.exclusionReason] =
          (exclusionsByReason[evalResult.exclusionReason] || 0) + 1;
      }
    }

    // If candidate is a market, perform deep market health inspection
    if (candidate.routeType === 'MARKET' && candidate.entityId) {
      const marketFindings = auditMarketHealth(candidate.entityId);
      findings.push(...marketFindings);
    }
  }

  // Check for candidate discovery market opportunities
  const opportunities = analyzeDiscoveryOpportunities();
  if (opportunities.candidateMarkets.length > 0) {
    for (const opp of opportunities.candidateMarkets) {
      findings.push({
        severity: 'INFO',
        category: 'TAXONOMY',
        url: `/${opp.proposedSlug}`,
        message: `High-demand uncreated market opportunity: "${opp.cityName} · ${opp.categoryName}" (${opp.discoveryRequestCount} requests). Ready for admin review.`,
      });
    }
  }

  // Calculate sitemap checksum
  const sortedEligible = [...eligiblePaths].sort();
  const sitemapChecksum = crypto
    .createHash('sha256')
    .update(sortedEligible.join('\n'))
    .digest('hex')
    .substring(0, 16);

  const auditRun: SeoAuditRun = {
    id: `seo_audit_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`,
    runType,
    totalCandidates: candidates.length,
    eligibleUrls,
    excludedUrls,
    findingsCount: findings.length,
    exclusionsByReason,
    findings,
    sitemapChecksum,
    createdAt: new Date().toISOString(),
    completedAt: new Date().toISOString(),
  };

  return auditRun;
}
