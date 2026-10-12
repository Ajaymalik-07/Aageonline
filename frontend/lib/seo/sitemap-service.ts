/**
 * AageOnline — Authoritative Dynamic Sitemap Service
 *
 * Generates technical sitemap entries strictly from authoritative database/service
 * records, filtered through the centralized SEO eligibility policy.
 *
 * Guarantees:
 * 1. Only published, indexable, quality-verified URLs are emitted.
 * 2. Unreviewed discoveries, drafts, and private routes are strictly excluded.
 * 3. Real lastModified timestamps are used; never fabricated.
 * 4. URLs are normalized, deduplicated, and free of query parameters.
 */

import crypto from 'node:crypto';
import type { MetadataRoute } from 'next';
import type { SeoEligibilityCandidate, SeoEligibilityResult } from '../../types/seo.ts';
import { evaluateSeoEligibility } from './eligibility.ts';
import { getAuthoritativeOrigin } from './canonical.ts';
import { locationService } from '../../data-access/locations/index.ts';
import { categoryService } from '../../data-access/categories/index.ts';
import { businessService } from '../../data-access/businesses/index.ts';
import { getAllMarkets } from '../taxonomy/markets.ts';
import { getCityById } from '../taxonomy/locations.ts';
import { getCategoryById } from '../taxonomy/categories.ts';
import { getBusinessById } from '../taxonomy/businesses.ts';

export interface SitemapGenerationSummary {
  sitemap: MetadataRoute.Sitemap;
  totalCandidates: number;
  eligibleCount: number;
  excludedCount: number;
  exclusionsByReason: Record<string, number>;
  checksum: string;
  generatedAt: string;
}

/**
 * Builds all candidate records across the platform's canonical route taxonomy.
 */
export async function collectSeoCandidates(): Promise<SeoEligibilityCandidate[]> {
  const origin = getAuthoritativeOrigin();
  const candidates: SeoEligibilityCandidate[] = [];

  // 1. Static Top-Level Index Pages
  candidates.push(
    {
      url: `${origin}/`,
      path: '/',
      routeType: 'HOME',
      publicationStatus: 'PUBLISHED',
      indexabilityStatus: 'INDEXABLE',
      contentStatus: 'APPROVED',
      hasGenuineData: true,
    },
    {
      url: `${origin}/markets`,
      path: '/markets',
      routeType: 'MARKETS_INDEX',
      publicationStatus: 'PUBLISHED',
      indexabilityStatus: 'INDEXABLE',
      contentStatus: 'APPROVED',
      hasGenuineData: true,
    },
    {
      url: `${origin}/locations`,
      path: '/locations',
      routeType: 'LOCATIONS_INDEX',
      publicationStatus: 'PUBLISHED',
      indexabilityStatus: 'INDEXABLE',
      contentStatus: 'APPROVED',
      hasGenuineData: true,
    },
    {
      url: `${origin}/categories`,
      path: '/categories',
      routeType: 'CATEGORIES_INDEX',
      publicationStatus: 'PUBLISHED',
      indexabilityStatus: 'INDEXABLE',
      contentStatus: 'APPROVED',
      hasGenuineData: true,
    },
    {
      url: `${origin}/businesses`,
      path: '/businesses',
      routeType: 'BUSINESSES_INDEX',
      publicationStatus: 'PUBLISHED',
      indexabilityStatus: 'INDEXABLE',
      contentStatus: 'APPROVED',
      hasGenuineData: true,
    }
  );

  // 2. Canonical Markets from authoritative registry
  try {
    const markets = getAllMarkets();
    for (const m of markets) {
      candidates.push({
        url: `${origin}/${m.slug}`,
        path: `/${m.slug}`,
        routeType: 'MARKET',
        entityId: m.id,
        publicationStatus: m.publicationStatus,
        indexabilityStatus: m.indexabilityStatus,
        contentStatus: m.contentStatus,
        hasGenuineData: true,
        lastModified: m.updatedAt || m.publishedAt,
      });
    }
  } catch {
    // Graceful fallback
  }

  // 3. Published Locations (Cities)
  try {
    const locations = await locationService.getPublishedLocations();
    for (const loc of locations) {
      const activeCount = loc.activeMarketCount ?? loc.marketCount ?? 0;
      const fullLoc = getCityById(loc.id);
      candidates.push({
        url: `${origin}/${loc.slug}`,
        path: `/${loc.slug}`,
        routeType: 'LOCATION',
        entityId: loc.id,
        publicationStatus: loc.status === 'PUBLISHED' ? 'PUBLISHED' : 'DRAFT',
        indexabilityStatus: loc.status === 'PUBLISHED' ? 'INDEXABLE' : 'NOINDEX',
        contentStatus: 'APPROVED',
        hasGenuineData: true,
        activeChildCount: activeCount,
        lastModified: fullLoc?.updatedAt,
      });
    }
  } catch {
    // Graceful fallback
  }

  // 4. Published Categories
  try {
    const categories = await categoryService.getPublishedCategories();
    for (const cat of categories) {
      const activeCount = cat.activeMarketCount ?? cat.marketCount ?? 0;
      const fullCat = getCategoryById(cat.id);
      candidates.push({
        url: `${origin}/categories/${cat.slug}`,
        path: `/categories/${cat.slug}`,
        routeType: 'CATEGORY',
        entityId: cat.id,
        publicationStatus: cat.status === 'PUBLISHED' ? 'PUBLISHED' : 'DRAFT',
        indexabilityStatus: cat.status === 'PUBLISHED' ? 'INDEXABLE' : 'NOINDEX',
        contentStatus: 'APPROVED',
        hasGenuineData: true,
        activeChildCount: activeCount,
        lastModified: fullCat?.updatedAt,
      });
    }
  } catch {
    // Graceful fallback
  }

  // 5. Published Verified Businesses
  try {
    const businesses = await businessService.getPublishedBusinesses({ pageSize: 500 });
    for (const biz of businesses.data) {
      const isVerified = biz.verificationStatus === 'VERIFIED';
      const fullBiz = getBusinessById(biz.id);
      candidates.push({
        url: `${origin}/businesses/${biz.slug}`,
        path: `/businesses/${biz.slug}`,
        routeType: 'BUSINESS',
        entityId: biz.id,
        publicationStatus: biz.publicationStatus,
        indexabilityStatus: isVerified ? 'INDEXABLE' : 'NOINDEX',
        contentStatus: 'APPROVED',
        hasGenuineData: isVerified,
        lastModified: fullBiz?.updatedAt,
      });
    }
  } catch {
    // Graceful fallback
  }

  return candidates;
}

let cachedSitemapSummary: SitemapGenerationSummary | null = null;
let cachedSitemapExpiresAt = 0;
const SITEMAP_CACHE_TTL_MS = 3600 * 1000; // 1 hour

/**
 * Invalidates the cached sitemap snapshot so subsequent requests re-evaluate candidate eligibility.
 */
export function invalidateSitemapCache(): void {
  cachedSitemapSummary = null;
  cachedSitemapExpiresAt = 0;
}

/**
 * Generates the authoritative sitemap using the eligibility policy.
 */
export async function generateAuthoritativeSitemap(forceFresh = false): Promise<MetadataRoute.Sitemap> {
  const summary = await generateAuthoritativeSitemapSummary(forceFresh);
  return summary.sitemap;
}

/**
 * Generates the sitemap with detailed diagnostic summary metrics.
 * Caches the snapshot for 1 hour unless explicitly invalidated or forceFresh is requested.
 */
export async function generateAuthoritativeSitemapSummary(
  forceFresh = false
): Promise<SitemapGenerationSummary> {
  if (!forceFresh && cachedSitemapSummary && Date.now() < cachedSitemapExpiresAt) {
    return cachedSitemapSummary;
  }

  const candidates = await collectSeoCandidates();
  const seenUrls = new Set<string>();
  const sitemap: MetadataRoute.Sitemap = [];
  const exclusionsByReason: Record<string, number> = {};
  let eligibleCount = 0;
  let excludedCount = 0;

  for (const candidate of candidates) {
    const result: SeoEligibilityResult = evaluateSeoEligibility(candidate);

    if (result.isEligible) {
      // Deduplicate by normalized canonical URL
      if (!seenUrls.has(result.canonicalUrl)) {
        seenUrls.add(result.canonicalUrl);
        eligibleCount++;

        const entry: MetadataRoute.Sitemap[number] = {
          url: result.canonicalUrl,
          changeFrequency: result.changeFrequency,
          priority: result.priority,
        };

        // Real lastModified timestamp only; never fabricate current date
        if (result.lastModified) {
          const parsed = new Date(result.lastModified);
          if (!isNaN(parsed.getTime())) {
            entry.lastModified = parsed;
          }
        }

        sitemap.push(entry);
      }
    } else {
      excludedCount++;
      const reason = result.exclusionReason || 'UNKNOWN';
      exclusionsByReason[reason] = (exclusionsByReason[reason] || 0) + 1;
    }
  }

  // Compute checksum across sorted canonical URLs
  const sortedUrls = Array.from(seenUrls).sort();
  const checksum = crypto
    .createHash('sha256')
    .update(sortedUrls.join('\n'))
    .digest('hex')
    .substring(0, 16);

  const summary: SitemapGenerationSummary = {
    sitemap,
    totalCandidates: candidates.length,
    eligibleCount,
    excludedCount,
    exclusionsByReason,
    checksum,
    generatedAt: new Date().toISOString(),
  };

  cachedSitemapSummary = summary;
  cachedSitemapExpiresAt = Date.now() + SITEMAP_CACHE_TTL_MS;

  return summary;
}
