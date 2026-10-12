/**
 * AageOnline — Remote API Category Data Source Adapter
 *
 * Implements CategoryDataSource by consuming the REST API contracts.
 * Strictly validates responses and throws ServiceUnavailableError upon failure.
 */

import type { CategoryDataSource } from './service.ts';
import { ServiceUnavailableError } from '../types.ts';
import type {
  CategorySearchResult,
  CategorySummary,
} from '../types.ts';

export class ApiCategoryDataSource implements CategoryDataSource {
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

  async getPublishedCategories(): Promise<CategorySummary[]> {
    const url = this.resolveUrl('/api/categories');
    try {
      const res = await fetch(url, {
        headers: { Accept: 'application/json' },
        next: { revalidate: 120 },
      });

      if (!res.ok) {
        throw new ServiceUnavailableError(`Category API returned HTTP ${res.status}`);
      }

      const json = await res.json();
      if (!Array.isArray(json.data)) {
        throw new ServiceUnavailableError('Invalid response shape from Category API');
      }

      return json.data;
    } catch (err: unknown) {
      if (err instanceof ServiceUnavailableError) throw err;
      throw new ServiceUnavailableError(
        `Failed to reach Category API: ${err instanceof Error ? err.message : 'Network error'}`
      );
    }
  }

  async getPublishedCategoryBySlug(slug: string): Promise<CategorySummary | null> {
    const all = await this.getPublishedCategories();
    return all.find((c) => c.slug.toLowerCase() === slug.toLowerCase()) || null;
  }

  async searchPublishedCategories(query: string): Promise<CategorySearchResult[]> {
    const qs = new URLSearchParams({ search: query });
    const url = this.resolveUrl(`/api/categories?${qs.toString()}`);

    try {
      const res = await fetch(url, {
        headers: { Accept: 'application/json' },
      });

      if (!res.ok) {
        throw new ServiceUnavailableError(`Category API returned HTTP ${res.status}`);
      }

      const json = await res.json();
      if (!Array.isArray(json.data)) return [];

      return json.data.map((c: CategorySummary) => ({
        type: 'CATEGORY',
        id: c.id,
        name: c.name,
        slug: c.slug,
        description: c.description,
        marketCount: c.activeMarketCount,
        publicUrl: c.publicUrl,
        found: true,
        query,
      }));
    } catch (err: unknown) {
      if (err instanceof ServiceUnavailableError) throw err;
      throw new ServiceUnavailableError(
        `Failed to reach Category search API: ${err instanceof Error ? err.message : 'Network error'}`
      );
    }
  }

  async getRelatedCategories(currentSlug: string, limit = 4): Promise<CategorySummary[]> {
    const all = await this.getPublishedCategories();
    return all.filter((c) => c.slug.toLowerCase() !== currentSlug.toLowerCase()).slice(0, limit);
  }

  async getPublishedCategoryCount(): Promise<number> {
    const all = await this.getPublishedCategories();
    return all.length;
  }
}
