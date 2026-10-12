/**
 * AageOnline — Centralized Cache Policy Architecture
 * Milestone 0.18.0: Performance, Caching & Edge Optimization
 *
 * Defines explicit, typed cache-control headers and freshness lifecycles
 * for each data class in accordance with architectural invariants:
 * - Public static content: Long-lived immutable or day-level caching.
 * - Public taxonomy & discovery: Bounded caching with explicit revalidation.
 * - Public market rankings: Strict 60s freshness with post-settlement invalidation.
 * - Business workspace: Strictly private, no-store, user-scoped.
 * - Administrative operations: Strictly private, no-store.
 * - Dynamic financial & payments: Strictly private, no-store.
 */

export type CachePolicyName =
  | 'STATIC_IMMUTABLE'
  | 'PUBLIC_CONTENT'
  | 'PUBLIC_TAXONOMY'
  | 'PUBLIC_RANKING'
  | 'PUBLIC_SITEMAP'
  | 'PRIVATE_WORKSPACE'
  | 'ADMIN_OPERATIONS'
  | 'FINANCIAL_DYNAMIC';

export interface CachePolicyConfig {
  name: CachePolicyName;
  cacheControl: string;
  isPrivate: boolean;
  maxAgeSeconds: number;
  sMaxAgeSeconds?: number;
  staleWhileRevalidateSeconds?: number;
  description: string;
}

export const CACHE_POLICIES: Record<CachePolicyName, CachePolicyConfig> = {
  // A. Public Static Content (versioned assets, stable guides)
  STATIC_IMMUTABLE: {
    name: 'STATIC_IMMUTABLE',
    cacheControl: 'public, max-age=31536000, immutable',
    isPrivate: false,
    maxAgeSeconds: 31536000,
    description: 'Versioned static assets, fonts, and immutable scripts.',
  },
  PUBLIC_CONTENT: {
    name: 'PUBLIC_CONTENT',
    cacheControl: 'public, max-age=3600, stale-while-revalidate=86400',
    isPrivate: false,
    maxAgeSeconds: 3600,
    staleWhileRevalidateSeconds: 86400,
    description: 'Editorial brand content, general FAQs, and static company information.',
  },

  // B. Public Taxonomy & Discovery (locations, categories, market directories)
  PUBLIC_TAXONOMY: {
    name: 'PUBLIC_TAXONOMY',
    cacheControl: 'public, max-age=300, s-maxage=300, stale-while-revalidate=600',
    isPrivate: false,
    maxAgeSeconds: 300,
    sMaxAgeSeconds: 300,
    staleWhileRevalidateSeconds: 600,
    description: 'Published location hubs, category directories, and taxonomy listings.',
  },

  // C. Public Market Rankings (active ladders, competitive gap displays)
  PUBLIC_RANKING: {
    name: 'PUBLIC_RANKING',
    cacheControl: 'public, max-age=60, s-maxage=60, stale-while-revalidate=120',
    isPrivate: false,
    maxAgeSeconds: 60,
    sMaxAgeSeconds: 60,
    staleWhileRevalidateSeconds: 120,
    description: 'Live market ranking views. Maximum expected stale interval: 60 seconds.',
  },

  // Dynamic Sitemap
  PUBLIC_SITEMAP: {
    name: 'PUBLIC_SITEMAP',
    cacheControl: 'public, max-age=3600, s-maxage=3600, stale-while-revalidate=7200',
    isPrivate: false,
    maxAgeSeconds: 3600,
    sMaxAgeSeconds: 3600,
    staleWhileRevalidateSeconds: 7200,
    description: 'Dynamic XML sitemap. Revalidated on publication changes or hourly.',
  },

  // D. Business Workspace (private profiles, memberships, history, notifications)
  PRIVATE_WORKSPACE: {
    name: 'PRIVATE_WORKSPACE',
    cacheControl: 'private, no-cache, no-store, max-age=0, must-revalidate',
    isPrivate: true,
    maxAgeSeconds: 0,
    description: 'Authenticated tenant workspace data. Strictly forbidden from shared CDN caches.',
  },

  // E. Administrative Operations (reconciliation, recovery jobs, audit logs)
  ADMIN_OPERATIONS: {
    name: 'ADMIN_OPERATIONS',
    cacheControl: 'private, no-cache, no-store, max-age=0, must-revalidate',
    isPrivate: true,
    maxAgeSeconds: 0,
    description: 'Internal platform admin operations, readiness checks, and queue health.',
  },

  // F. Dynamic Financial & Payments (bid intents, PayU callbacks, settlement APIs)
  FINANCIAL_DYNAMIC: {
    name: 'FINANCIAL_DYNAMIC',
    cacheControl: 'private, no-cache, no-store, max-age=0, must-revalidate',
    isPrivate: true,
    maxAgeSeconds: 0,
    description: 'Payment orders, real-time pricing quotes, and ranking settlements.',
  },
};

/**
 * Returns the exact Cache-Control header string for a given policy.
 */
export function getCacheControlHeader(policy: CachePolicyName): string {
  return CACHE_POLICIES[policy].cacheControl;
}

/**
 * Applies the appropriate Cache-Control header to an existing Headers or Response object.
 */
export function applyCacheControlHeader(headers: Headers, policy: CachePolicyName): void {
  headers.set('Cache-Control', getCacheControlHeader(policy));
}

/**
 * Returns a new HeadersInit object containing the Cache-Control header.
 */
export function createCacheHeaders(policy: CachePolicyName): Record<string, string> {
  return {
    'Cache-Control': getCacheControlHeader(policy),
  };
}
