import type { CacheTier } from '../../types/api';

export interface CacheConfig {
  revalidate: number | false; // Seconds or false for indefinite
  tags?: string[];
  swr: boolean;
}

export const CACHE_POLICIES: Record<CacheTier, CacheConfig> = {
  STATIC: {
    revalidate: 86400, // 24 hours
    swr: true,
    tags: ['static-content', 'locations', 'categories'],
  },
  SEMI_DYNAMIC: {
    revalidate: 30, // 30 seconds
    swr: true,
    tags: ['rankings', 'market-spotlight'],
  },
  HIGHLY_DYNAMIC: {
    revalidate: 0, // Direct fetch / no cache
    swr: false,
    tags: ['bids', 'payments', 'transactions'],
  },
};

/**
 * Returns HTTP cache-control header value for route handlers or server responses.
 */
export function getCacheControlHeader(tier: CacheTier): string {
  switch (tier) {
    case 'STATIC':
      return 'public, max-age=3600, s-maxage=86400, stale-while-revalidate=604800';
    case 'SEMI_DYNAMIC':
      return 'public, max-age=15, s-maxage=30, stale-while-revalidate=60';
    case 'HIGHLY_DYNAMIC':
      return 'private, no-cache, no-store, must-revalidate';
  }
}
