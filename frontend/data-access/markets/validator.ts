/**
 * AageOnline — Market Public Contract Validator & Boundary
 *
 * Enforces schema integrity, public-safe field filtering, and invariant checks
 * before data enters the public UI layer. Rejects malformed or non-published payloads.
 */

import { DataValidationError } from '../types.ts';
import type {
  MarketSummary,
  PaginatedResponse,
  PaginationMeta,
} from '../types.ts';

/**
 * Validates a single MarketSummary record.
 * Throws DataValidationError if the payload violates domain invariants.
 */
export function validateMarketSummary(raw: unknown): MarketSummary {
  if (!raw || typeof raw !== 'object') {
    throw new DataValidationError('Market record must be a non-null object', { raw });
  }

  const record = raw as Record<string, unknown>;

  // Essential string identities
  if (!record.id || typeof record.id !== 'string') {
    throw new DataValidationError('Market record missing or invalid "id"', { id: record.id });
  }
  if (!record.slug || typeof record.slug !== 'string' || !record.slug.includes('/')) {
    throw new DataValidationError('Market record missing or invalid "slug"', { slug: record.slug });
  }
  if (!record.cityName || typeof record.cityName !== 'string') {
    throw new DataValidationError('Market record missing or invalid "cityName"', { cityName: record.cityName });
  }
  if (!record.citySlug || typeof record.citySlug !== 'string') {
    throw new DataValidationError('Market record missing or invalid "citySlug"', { citySlug: record.citySlug });
  }
  if (!record.categoryName || typeof record.categoryName !== 'string') {
    throw new DataValidationError('Market record missing or invalid "categoryName"', { categoryName: record.categoryName });
  }
  if (!record.categorySlug || typeof record.categorySlug !== 'string') {
    throw new DataValidationError('Market record missing or invalid "categorySlug"', { categorySlug: record.categorySlug });
  }

  // Publication Status Invariant: Only PUBLISHED markets may be exposed to the public UI
  if (record.publicationStatus !== 'PUBLISHED') {
    throw new DataValidationError(
      `Market "${record.slug}" is not published. Found status: "${record.publicationStatus}"`,
      { slug: record.slug, publicationStatus: record.publicationStatus }
    );
  }

  // Metrics validation
  const metrics = (record.relevantPublicMetrics || {}) as Record<string, unknown>;
  const totalBusinesses =
    typeof metrics.totalBusinesses === 'number' && metrics.totalBusinesses >= 0
      ? Math.floor(metrics.totalBusinesses)
      : undefined;
  const activePositions =
    typeof metrics.activePositions === 'number' && metrics.activePositions >= 0
      ? Math.floor(metrics.activePositions)
      : undefined;
  const topQualifyingAmountMinor =
    typeof metrics.topQualifyingAmountMinor === 'number' && metrics.topQualifyingAmountMinor >= 0
      ? Math.floor(metrics.topQualifyingAmountMinor)
      : undefined;

  return {
    id: record.id,
    slug: record.slug,
    cityId: typeof record.cityId === 'string' ? record.cityId : '',
    cityName: record.cityName,
    citySlug: record.citySlug,
    stateId: typeof record.stateId === 'string' ? record.stateId : '',
    stateName: typeof record.stateName === 'string' ? record.stateName : '',
    countryName: typeof record.countryName === 'string' ? record.countryName : 'India',
    categoryId: typeof record.categoryId === 'string' ? record.categoryId : '',
    categoryName: record.categoryName,
    categorySlug: record.categorySlug,
    publicUrl: typeof record.publicUrl === 'string' && record.publicUrl.startsWith('/')
      ? record.publicUrl
      : `/${record.slug}`,
    publicationStatus: 'PUBLISHED',
    relevantPublicMetrics: {
      totalBusinesses,
      activePositions,
      topQualifyingAmountMinor,
    },
    publishedAt: typeof record.publishedAt === 'string' ? record.publishedAt : undefined,
  };
}

/**
 * Validates a paginated response wrapper and all nested market records.
 */
export function validatePaginatedMarketResponse(
  raw: unknown
): PaginatedResponse<MarketSummary> {
  if (!raw || typeof raw !== 'object') {
    throw new DataValidationError('API response must be a non-null object', { raw });
  }

  const envelope = raw as Record<string, unknown>;
  if (!Array.isArray(envelope.data)) {
    throw new DataValidationError('API response missing "data" array', { envelope });
  }

  const validatedData: MarketSummary[] = envelope.data.map((item, idx) => {
    try {
      return validateMarketSummary(item);
    } catch (err: unknown) {
      throw new DataValidationError(
        `Invalid market record at index ${idx}: ${err instanceof Error ? err.message : 'Unknown'}`,
        { index: idx, item }
      );
    }
  });

  const rawPagination = (envelope.pagination || {}) as Record<string, unknown>;
  const total = typeof rawPagination.total === 'number' ? rawPagination.total : validatedData.length;
  const page = typeof rawPagination.page === 'number' ? rawPagination.page : 1;
  const pageSize = typeof rawPagination.pageSize === 'number' ? rawPagination.pageSize : validatedData.length || 24;
  const totalPages = typeof rawPagination.totalPages === 'number'
    ? rawPagination.totalPages
    : Math.max(1, Math.ceil(total / (pageSize || 1)));

  const pagination: PaginationMeta = {
    page,
    pageSize,
    total,
    totalPages,
    hasNextPage: Boolean(rawPagination.hasNextPage ?? page < totalPages),
    hasPrevPage: Boolean(rawPagination.hasPrevPage ?? page > 1),
  };

  return {
    data: validatedData,
    pagination,
  };
}
