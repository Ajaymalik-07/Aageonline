/**
 * AageOnline — Local Category Data Source Adapter
 *
 * Implements CategoryDataSource directly on top of the in-memory canonical
 * taxonomy and market stores. Enforces publication rules and provides deterministic ordering.
 */

import type { CategoryDataSource } from './service.ts';
import type {
  CategorySearchResult,
  CategorySummary,
} from '../types.ts';
import { getAllMarkets } from '../../lib/taxonomy/markets.ts';
import {
  getCategoryById,
  getCategoryBySlug,
  getAllCategories,
} from '../../lib/taxonomy/categories.ts';
import { canonicalizeText } from '../../lib/taxonomy/normalization.ts';

export class LocalCategoryDataSource implements CategoryDataSource {
  async getPublishedCategories(): Promise<CategorySummary[]> {
    const publishedMarkets = getAllMarkets().filter(
      (m) => m.publicationStatus === 'PUBLISHED' && m.status === 'PUBLISHED'
    );

    const categoryMarketCounts = new Map<string, number>();
    for (const m of publishedMarkets) {
      categoryMarketCounts.set(m.categoryId, (categoryMarketCounts.get(m.categoryId) || 0) + 1);
    }

    const categories: CategorySummary[] = [];
    for (const [categoryId, count] of categoryMarketCounts.entries()) {
      const cat = getCategoryById(categoryId);
      if (!cat || cat.status !== 'ACTIVE') continue;

      categories.push({
        id: cat.id,
        name: cat.name,
        slug: cat.slug,
        description: cat.description,
        status: 'PUBLISHED',
        marketCount: count,
        activeMarketCount: count,
        publicUrl: `/categories/${cat.slug}`,
      });
    }

    // Deterministic ordering: published market count descending, then alphabetical by name
    categories.sort((a, b) => {
      if (b.activeMarketCount !== a.activeMarketCount) {
        return b.activeMarketCount - a.activeMarketCount;
      }
      return a.name.localeCompare(b.name);
    });

    return categories;
  }

  async getPublishedCategoryBySlug(slug: string): Promise<CategorySummary | null> {
    const normalized = slug.trim().toLowerCase();
    const published = await this.getPublishedCategories();

    // 1. Direct slug match on published categories
    const exact = published.find((c) => c.slug.toLowerCase() === normalized);
    if (exact) return exact;

    // 2. Alias resolution via canonical category taxonomy
    const taxonomyCategory =
      getCategoryBySlug(normalized) ||
      getAllCategories().find((c) =>
        (c.aliases || []).map((a) => a.toLowerCase()).includes(normalized)
      );

    if (taxonomyCategory) {
      const matchedPublished = published.find((c) => c.id === taxonomyCategory.id);
      if (matchedPublished) return matchedPublished;
    }

    return null;
  }

  async searchPublishedCategories(query: string): Promise<CategorySearchResult[]> {
    const q = canonicalizeText(query);
    if (!q) return [];

    const published = await this.getPublishedCategories();
    const results: CategorySearchResult[] = [];

    // Check published categories first
    for (const cat of published) {
      const nameMatch = canonicalizeText(cat.name).includes(q);
      const slugMatch = cat.slug.toLowerCase().includes(q);
      const descMatch = cat.description ? canonicalizeText(cat.description).includes(q) : false;

      if (nameMatch || slugMatch || descMatch) {
        results.push({
          type: 'CATEGORY',
          id: cat.id,
          name: cat.name,
          slug: cat.slug,
          description: cat.description,
          marketCount: cat.activeMarketCount,
          publicUrl: cat.publicUrl,
          found: true,
          query,
        });
      }
    }

    // If no published category matched, check taxonomy for unlisted categories
    if (results.length === 0) {
      const unlistedCat = getAllCategories().find(
        (c) =>
          canonicalizeText(c.name).includes(q) ||
          (c.aliases || []).some((a) => canonicalizeText(a).includes(q))
      );

      if (unlistedCat) {
        results.push({
          type: 'CATEGORY',
          id: unlistedCat.id,
          name: unlistedCat.name,
          slug: unlistedCat.slug,
          description: unlistedCat.description,
          marketCount: 0,
          found: false,
          query,
        });
      } else {
        // Entirely unknown category
        results.push({
          type: 'CATEGORY',
          name: query.trim(),
          marketCount: 0,
          found: false,
          query,
        });
      }
    }

    return results;
  }

  async getRelatedCategories(currentSlug: string, limit = 4): Promise<CategorySummary[]> {
    const all = await this.getPublishedCategories();
    return all.filter((c) => c.slug.toLowerCase() !== currentSlug.toLowerCase()).slice(0, limit);
  }

  async getPublishedCategoryCount(): Promise<number> {
    const published = await this.getPublishedCategories();
    return published.length;
  }
}
