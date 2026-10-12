/**
 * AageOnline — Local Market Data Source Adapter
 *
 * Implements MarketDataSource directly on top of the in-memory authoritative
 * Taxonomy & Market Registry. Enforces publication rules and validates contracts.
 */

import type { MarketDataSource } from './service.ts';
import type {
  MarketSearchParams,
  MarketSearchResult,
  MarketSummary,
  PaginatedResponse,
  PaginationParams,
} from '../types.ts';
import { validateMarketSummary } from './validator.ts';
import { getAllMarkets } from '../../lib/taxonomy/markets.ts';
import { getCityById, getStateById } from '../../lib/taxonomy/locations.ts';
import { getCategoryById } from '../../lib/taxonomy/categories.ts';
import { searchPublishedMarkets as searchDirectoryMarkets } from '../../lib/taxonomy/market-directory.ts';
import type { MarketEntity } from '../../types/taxonomy.ts';

function toMarketSummary(m: MarketEntity): MarketSummary {
  const city = getCityById(m.cityId);
  const category = getCategoryById(m.categoryId);
  const state = city ? getStateById(city.stateId) : undefined;

  const raw = {
    id: m.id,
    slug: m.slug,
    cityId: m.cityId,
    cityName: city?.name || 'Unknown City',
    citySlug: city?.slug || '',
    stateId: state?.id || '',
    stateName: state?.name || '',
    countryName: 'India',
    categoryId: m.categoryId,
    categoryName: category?.name || 'Unknown Category',
    categorySlug: category?.slug || '',
    publicUrl: `/${m.slug}`,
    publicationStatus: m.publicationStatus,
    relevantPublicMetrics: {
      totalBusinesses: m.totalBusinesses,
      activePositions: m.activePositions,
      topQualifyingAmountMinor: m.topQualifyingAmountMinor,
    },
    publishedAt: m.createdAt,
  };

  return validateMarketSummary(raw);
}

export class LocalMarketDataSource implements MarketDataSource {
  async getPublishedMarkets(
    params: MarketSearchParams = {}
  ): Promise<PaginatedResponse<MarketSummary>> {
    const {
      locationSlug,
      categorySlug,
      sortBy = 'qualifying_amount_desc',
      page = 1,
      pageSize = 24,
    } = params;

    // Filter strictly by publication lifecycle status
    let published = getAllMarkets()
      .filter((m) => m.publicationStatus === 'PUBLISHED' && m.status === 'PUBLISHED')
      .map(toMarketSummary);

    if (locationSlug) {
      const loc = locationSlug.toLowerCase().trim();
      published = published.filter((m) => m.citySlug === loc);
    }

    if (categorySlug) {
      const cat = categorySlug.toLowerCase().trim();
      published = published.filter((m) => m.categorySlug === cat);
    }

    // Deterministic sorting
    if (sortBy === 'qualifying_amount_desc') {
      published.sort((a, b) => {
        const amtA = a.relevantPublicMetrics.topQualifyingAmountMinor ?? 0;
        const amtB = b.relevantPublicMetrics.topQualifyingAmountMinor ?? 0;
        return amtB - amtA;
      });
    } else if (sortBy === 'alphabetical') {
      published.sort((a, b) => a.slug.localeCompare(b.slug));
    } else if (sortBy === 'recent') {
      published.sort((a, b) => {
        const dateA = a.publishedAt ? new Date(a.publishedAt).getTime() : 0;
        const dateB = b.publishedAt ? new Date(b.publishedAt).getTime() : 0;
        return dateB - dateA;
      });
    }

    // Pagination slice
    const total = published.length;
    const safePage = Math.max(1, page);
    const safePageSize = Math.max(1, Math.min(100, pageSize));
    const totalPages = Math.max(1, Math.ceil(total / safePageSize));
    const offset = (safePage - 1) * safePageSize;
    const data = published.slice(offset, offset + safePageSize);

    return {
      data,
      pagination: {
        page: safePage,
        pageSize: safePageSize,
        total,
        totalPages,
        hasNextPage: safePage < totalPages,
        hasPrevPage: safePage > 1,
      },
    };
  }

  async getPublishedMarketBySlug(slug: string): Promise<MarketSummary | null> {
    const normalized = slug.toLowerCase().trim();
    const market = getAllMarkets().find(
      (m) =>
        m.slug.toLowerCase() === normalized &&
        m.publicationStatus === 'PUBLISHED' &&
        m.status === 'PUBLISHED'
    );
    if (!market) return null;
    return toMarketSummary(market);
  }

  async getPublishedMarketsByLocation(
    locationSlug: string,
    params: PaginationParams = {}
  ): Promise<PaginatedResponse<MarketSummary>> {
    return this.getPublishedMarkets({ ...params, locationSlug });
  }

  async getPublishedMarketsByCategory(
    categorySlug: string,
    params: PaginationParams = {}
  ): Promise<PaginatedResponse<MarketSummary>> {
    return this.getPublishedMarkets({ ...params, categorySlug });
  }

  async searchPublishedMarkets(query: string): Promise<MarketSearchResult[]> {
    const rawResults = searchDirectoryMarkets(query);
    return rawResults.map((r) => {
      let mappedMarket: MarketSummary | undefined;
      if (r.marketCard) {
        mappedMarket = {
          id: r.marketCard.marketId,
          slug: r.marketCard.slug,
          cityId: r.marketCard.cityId,
          cityName: r.marketCard.cityName,
          citySlug: r.marketCard.citySlug,
          stateId: r.marketCard.stateId,
          stateName: r.marketCard.stateName,
          countryName: 'India',
          categoryId: r.marketCard.categoryId,
          categoryName: r.marketCard.categoryName,
          categorySlug: r.marketCard.categorySlug,
          publicUrl: r.marketCard.href,
          publicationStatus: 'PUBLISHED',
          relevantPublicMetrics: {
            totalBusinesses: r.marketCard.totalBusinesses,
            activePositions: r.marketCard.activePositions,
            topQualifyingAmountMinor: r.marketCard.topQualifyingAmountMinor,
          },
          publishedAt: r.marketCard.publishedAt,
        };
      }

      return {
        type: r.type,
        label: r.label,
        sublabel: r.sublabel,
        href: r.href,
        market: mappedMarket,
        citySlug: r.citySlug,
        categorySlug: r.categorySlug,
        found: r.found,
      };
    });
  }

  async getPublishedMarketCount(): Promise<number> {
    return getAllMarkets().filter(
      (m) => m.publicationStatus === 'PUBLISHED' && m.status === 'PUBLISHED'
    ).length;
  }
}
