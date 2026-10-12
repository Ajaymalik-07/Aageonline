/**
 * AageOnline — Remote API Business Data Source Adapter
 *
 * Implements BusinessDataSource by consuming the REST API contracts.
 * Strictly validates responses and throws ServiceUnavailableError upon failure.
 */

import type { BusinessDataSource } from './service.ts';
import { ServiceUnavailableError } from '../types.ts';
import type {
  BusinessProfile,
  BusinessSearchParams,
  BusinessSearchResult,
  BusinessSummary,
  PaginatedResponse,
} from '../types.ts';

export class ApiBusinessDataSource implements BusinessDataSource {
  private readonly baseUrl: string;

  constructor(baseUrl: string = '') {
    this.baseUrl = baseUrl;
  }

  private resolveUrl(path: string): string {
    if (path.startsWith('http://') || path.startsWith('https://')) {
      return path;
    }
    const base =
      this.baseUrl ||
      (typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000');
    return `${base.replace(/\/$/, '')}${path}`;
  }

  async getPublishedBusinesses(
    params: BusinessSearchParams = {}
  ): Promise<PaginatedResponse<BusinessSummary>> {
    const qs = new URLSearchParams();
    if (params.page) qs.set('page', params.page.toString());
    if (params.pageSize) qs.set('pageSize', params.pageSize.toString());
    if (params.query) qs.set('search', params.query);
    if (params.categorySlug) qs.set('category', params.categorySlug);
    if (params.locationSlug) qs.set('location', params.locationSlug);
    if (params.verificationStatus) qs.set('verification', params.verificationStatus);

    const url = this.resolveUrl(`/api/businesses?${qs.toString()}`);
    try {
      const res = await fetch(url, {
        headers: { Accept: 'application/json' },
        next: { revalidate: 60 },
      });

      if (!res.ok) {
        throw new ServiceUnavailableError(`Business API returned HTTP ${res.status}`);
      }

      const json = await res.json();
      if (!Array.isArray(json.data) || !json.pagination) {
        throw new ServiceUnavailableError('Invalid response shape from Business API');
      }

      return json;
    } catch (err: unknown) {
      if (err instanceof ServiceUnavailableError) throw err;
      throw new ServiceUnavailableError(
        `Failed to reach Business API: ${err instanceof Error ? err.message : 'Network error'}`
      );
    }
  }

  async getPublishedBusinessBySlug(slug: string): Promise<BusinessProfile | null> {
    const url = this.resolveUrl(`/api/businesses?slug=${encodeURIComponent(slug)}`);
    try {
      const res = await fetch(url, {
        headers: { Accept: 'application/json' },
        next: { revalidate: 60 },
      });

      if (res.status === 404) return null;
      if (!res.ok) {
        throw new ServiceUnavailableError(`Business API returned HTTP ${res.status}`);
      }

      const json = await res.json();
      return json.data || null;
    } catch (err: unknown) {
      if (err instanceof ServiceUnavailableError) throw err;
      throw new ServiceUnavailableError(
        `Failed to reach Business profile API: ${err instanceof Error ? err.message : 'Network error'}`
      );
    }
  }

  async searchPublishedBusinesses(query: string): Promise<BusinessSearchResult[]> {
    const qs = new URLSearchParams({ search: query });
    const url = this.resolveUrl(`/api/businesses?${qs.toString()}`);

    try {
      const res = await fetch(url, {
        headers: { Accept: 'application/json' },
      });

      if (!res.ok) {
        throw new ServiceUnavailableError(`Business API returned HTTP ${res.status}`);
      }

      const json = await res.json();
      if (!Array.isArray(json.data)) return [];

      return json.data.map((b: BusinessSummary) => ({
        type: 'BUSINESS',
        id: b.id,
        name: b.name,
        slug: b.slug,
        description: b.description,
        primaryCategory: b.primaryCategory?.name,
        primaryLocation: b.primaryLocation?.name,
        publicUrl: b.publicUrl,
        isVerified: b.verificationStatus === 'VERIFIED',
        found: true,
        query,
      }));
    } catch (err: unknown) {
      if (err instanceof ServiceUnavailableError) throw err;
      throw new ServiceUnavailableError(
        `Failed to reach Business search API: ${err instanceof Error ? err.message : 'Network error'}`
      );
    }
  }

  async getPublishedBusinessCount(): Promise<number> {
    const res = await this.getPublishedBusinesses({ pageSize: 1 });
    return res.pagination.total;
  }
}
