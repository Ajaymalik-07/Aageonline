/**
 * AageOnline — Remote API Market Data Source Adapter
 *
 * Implements MarketDataSource by consuming the REST API contracts.
 * Strictly validates all received payloads and throws ServiceUnavailableError
 * upon network or protocol errors, preventing silent zero-data failure states.
 */

import type { MarketDataSource } from './service.ts';
import { ServiceUnavailableError } from '../types.ts';
import type {
  MarketSearchParams,
  MarketSearchResult,
  MarketSummary,
  PaginatedResponse,
  PaginationParams,
} from '../types.ts';
import { validateMarketSummary, validatePaginatedMarketResponse } from './validator.ts';

export class ApiMarketDataSource implements MarketDataSource {
  private readonly baseUrl: string;

  constructor(baseUrl: string = '') {
    this.baseUrl = baseUrl;
  }

  private resolveUrl(path: string): string {
    if (path.startsWith('http://') || path.startsWith('https://')) {
      return path;
    }
    const base = this.baseUrl || (typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000');
    return `${base.replace(/\/$/, '')}${path}`;
  }

  async getPublishedMarkets(
    params: MarketSearchParams = {}
  ): Promise<PaginatedResponse<MarketSummary>> {
    const qs = new URLSearchParams();
    if (params.page) qs.set('page', String(params.page));
    if (params.pageSize) qs.set('pageSize', String(params.pageSize));
    if (params.locationSlug) qs.set('location', params.locationSlug);
    if (params.categorySlug) qs.set('category', params.categorySlug);
    if (params.sortBy) qs.set('sortBy', params.sortBy);

    const url = this.resolveUrl(`/api/markets?${qs.toString()}`);

    try {
      const res = await fetch(url, {
        headers: { Accept: 'application/json' },
        next: { revalidate: 60 },
      });

      if (!res.ok) {
        throw new ServiceUnavailableError(`Market API returned HTTP ${res.status}`);
      }

      const json = await res.json();
      return validatePaginatedMarketResponse(json);
    } catch (err: unknown) {
      if (err instanceof ServiceUnavailableError) throw err;
      throw new ServiceUnavailableError(
        `Failed to reach Market API: ${err instanceof Error ? err.message : 'Network error'}`
      );
    }
  }

  async getPublishedMarketBySlug(slug: string): Promise<MarketSummary | null> {
    const [citySlug, categorySlug] = slug.split('/');
    if (!citySlug || !categorySlug) return null;

    const res = await this.getPublishedMarkets({
      locationSlug: citySlug,
      categorySlug: categorySlug,
      pageSize: 1,
    });

    const match = res.data.find((m) => m.slug.toLowerCase() === slug.toLowerCase());
    return match || null;
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
    const qs = new URLSearchParams({ q: query });
    const url = this.resolveUrl(`/api/markets/search?${qs.toString()}`);

    try {
      const res = await fetch(url, {
        headers: { Accept: 'application/json' },
      });

      if (!res.ok) {
        throw new ServiceUnavailableError(`Market Search API returned HTTP ${res.status}`);
      }

      const json = await res.json();
      if (!Array.isArray(json.results)) {
        return [];
      }

      return json.results.map((r: any) => ({
        type: r.type,
        label: r.label,
        sublabel: r.sublabel,
        href: r.href,
        market: r.marketCard ? validateMarketSummary(r.marketCard) : undefined,
        citySlug: r.citySlug,
        categorySlug: r.categorySlug,
        found: r.found ?? true,
      }));
    } catch (err: unknown) {
      if (err instanceof ServiceUnavailableError) throw err;
      throw new ServiceUnavailableError(
        `Search API unreachable: ${err instanceof Error ? err.message : 'Unknown'}`
      );
    }
  }

  async getPublishedMarketCount(): Promise<number> {
    const res = await this.getPublishedMarkets({ pageSize: 1 });
    return res.pagination.total;
  }
}
