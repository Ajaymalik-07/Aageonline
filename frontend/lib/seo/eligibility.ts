/**
 * AageOnline — Centralized SEO Eligibility Policy Service
 *
 * Authoritative gatekeeper deciding whether a public page is eligible
 * for sitemap inclusion and search-engine indexation.
 *
 * Invariants:
 * 1. Publication and indexability are distinct decisions.
 * 2. Unreviewed discoveries and drafts are strictly non-indexable.
 * 3. Never fabricate content, ratings, or businesses to pass eligibility.
 * 4. Private and operational routes are excluded by design.
 */

import type {
  SeoEligibilityCandidate,
  SeoEligibilityResult,
  SeoExclusionReason,
} from '../../types/seo.ts';
import { buildCanonicalUrl, isPrivateRoute, normalizeCanonicalPath } from './canonical.ts';

/**
 * Standard priorities and change frequencies by route tier.
 */
const ROUTE_SEO_PROFILES: Record<
  SeoEligibilityCandidate['routeType'],
  { priority: number; changeFrequency: SeoEligibilityResult['changeFrequency'] }
> = {
  HOME: { priority: 1.0, changeFrequency: 'daily' },
  MARKETS_INDEX: { priority: 0.9, changeFrequency: 'daily' },
  LOCATIONS_INDEX: { priority: 0.8, changeFrequency: 'weekly' },
  CATEGORIES_INDEX: { priority: 0.8, changeFrequency: 'weekly' },
  BUSINESSES_INDEX: { priority: 0.8, changeFrequency: 'weekly' },
  MARKET: { priority: 0.9, changeFrequency: 'hourly' }, // Competitive ladder updates
  LOCATION: { priority: 0.8, changeFrequency: 'daily' },
  CATEGORY: { priority: 0.8, changeFrequency: 'daily' },
  BUSINESS: { priority: 0.7, changeFrequency: 'weekly' },
  PRIVATE: { priority: 0.0, changeFrequency: 'never' },
};

/**
 * Pure, deterministic evaluation of candidate URL eligibility for sitemaps and indexation.
 */
export function evaluateSeoEligibility(
  candidate: SeoEligibilityCandidate
): SeoEligibilityResult {
  const normalizedPath = normalizeCanonicalPath(candidate.path || candidate.url);
  const canonicalUrl = buildCanonicalUrl(normalizedPath);
  const profile = ROUTE_SEO_PROFILES[candidate.routeType] || {
    priority: 0.5,
    changeFrequency: 'weekly',
  };

  // 1. Private and operational routes are strictly non-indexable
  if (isPrivateRoute(normalizedPath) || candidate.routeType === 'PRIVATE') {
    return {
      isEligible: false,
      canonicalUrl,
      routeType: candidate.routeType,
      exclusionReason: 'PRIVATE_ROUTE',
      exclusionDetail: `Path "${normalizedPath}" is an internal or authenticated route.`,
      lastModified: candidate.lastModified,
      changeFrequency: 'never',
      priority: 0.0,
    };
  }

  // 2. Query string or non-canonical duplicate path check
  if (candidate.url && (candidate.url.includes('?') || candidate.url.includes('#'))) {
    return {
      isEligible: false,
      canonicalUrl,
      routeType: candidate.routeType,
      exclusionReason: 'CANONICAL_CONFLICT',
      exclusionDetail: `Candidate URL contains query strings or fragments. Use canonical path "${normalizedPath}".`,
      lastModified: candidate.lastModified,
      changeFrequency: profile.changeFrequency,
      priority: profile.priority,
    };
  }

  // 3. Static Top-Level Index Pages are always eligible if data is present
  if (
    candidate.routeType === 'HOME' ||
    candidate.routeType === 'MARKETS_INDEX' ||
    candidate.routeType === 'LOCATIONS_INDEX' ||
    candidate.routeType === 'CATEGORIES_INDEX' ||
    candidate.routeType === 'BUSINESSES_INDEX'
  ) {
    return {
      isEligible: true,
      canonicalUrl,
      routeType: candidate.routeType,
      lastModified: candidate.lastModified,
      changeFrequency: profile.changeFrequency,
      priority: profile.priority,
    };
  }

  // 4. Publication Status Gate
  if (candidate.publicationStatus !== 'PUBLISHED') {
    return {
      isEligible: false,
      canonicalUrl,
      routeType: candidate.routeType,
      exclusionReason: 'UNPUBLISHED',
      exclusionDetail: `Status is "${candidate.publicationStatus || 'UNKNOWN'}". Only PUBLISHED pages may be indexed.`,
      lastModified: candidate.lastModified,
      changeFrequency: profile.changeFrequency,
      priority: profile.priority,
    };
  }

  // 5. Explicit Indexability Gate (Separate from publication)
  if (candidate.indexabilityStatus === 'NOINDEX') {
    return {
      isEligible: false,
      canonicalUrl,
      routeType: candidate.routeType,
      exclusionReason: 'EXPLICIT_NOINDEX',
      exclusionDetail: 'Indexability status is explicitly set to NOINDEX.',
      lastModified: candidate.lastModified,
      changeFrequency: profile.changeFrequency,
      priority: profile.priority,
    };
  }

  // 6. Content Status Gate
  if (
    candidate.contentStatus === 'MISSING' ||
    candidate.contentStatus === 'DRAFT'
  ) {
    return {
      isEligible: false,
      canonicalUrl,
      routeType: candidate.routeType,
      exclusionReason: 'INSUFFICIENT_CONTENT',
      exclusionDetail: `ContentStatus "${candidate.contentStatus}" indicates incomplete or unreviewed copy.`,
      lastModified: candidate.lastModified,
      changeFrequency: profile.changeFrequency,
      priority: profile.priority,
    };
  }

  // 7. Underlying Data Completeness Gate
  if (!candidate.hasGenuineData) {
    return {
      isEligible: false,
      canonicalUrl,
      routeType: candidate.routeType,
      exclusionReason: 'MISSING_DATA',
      exclusionDetail: 'Page lacks genuine underlying records (e.g. unverified business or missing taxonomy relation).',
      lastModified: candidate.lastModified,
      changeFrequency: profile.changeFrequency,
      priority: profile.priority,
    };
  }

  // 8. Thin Category / Location Anti-Doorway Gate
  // A city or category with 0 active markets cannot be indexed as a doorway page
  if (
    (candidate.routeType === 'LOCATION' || candidate.routeType === 'CATEGORY') &&
    typeof candidate.activeChildCount === 'number' &&
    candidate.activeChildCount <= 0
  ) {
    return {
      isEligible: false,
      canonicalUrl,
      routeType: candidate.routeType,
      exclusionReason: 'INSUFFICIENT_CONTENT',
      exclusionDetail: `Active market count is ${candidate.activeChildCount}. Pages with 0 markets cannot be indexed.`,
      lastModified: candidate.lastModified,
      changeFrequency: profile.changeFrequency,
      priority: profile.priority,
    };
  }

  // Passed all gates: Eligible for sitemap and indexation
  return {
    isEligible: true,
    canonicalUrl,
    routeType: candidate.routeType,
    lastModified: candidate.lastModified,
    changeFrequency: profile.changeFrequency,
    priority: profile.priority,
  };
}
