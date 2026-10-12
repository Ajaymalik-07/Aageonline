/**
 * AageOnline — Category Domain Service & Contract
 */

import type {
  CategorySearchResult,
  CategorySummary,
} from '../types.ts';

export interface CategoryDataSource {
  getPublishedCategories(): Promise<CategorySummary[]>;
  getPublishedCategoryBySlug(slug: string): Promise<CategorySummary | null>;
  searchPublishedCategories(query: string): Promise<CategorySearchResult[]>;
  getRelatedCategories(currentSlug: string, limit?: number): Promise<CategorySummary[]>;
  getPublishedCategoryCount(): Promise<number>;
}

export class CategoryService {
  private readonly dataSource: CategoryDataSource;

  constructor(dataSource: CategoryDataSource) {
    this.dataSource = dataSource;
  }

  async getPublishedCategories(): Promise<CategorySummary[]> {
    return this.dataSource.getPublishedCategories();
  }

  async getPublishedCategoryBySlug(slug: string): Promise<CategorySummary | null> {
    return this.dataSource.getPublishedCategoryBySlug(slug);
  }

  async searchPublishedCategories(query: string): Promise<CategorySearchResult[]> {
    return this.dataSource.searchPublishedCategories(query);
  }

  async getRelatedCategories(currentSlug: string, limit?: number): Promise<CategorySummary[]> {
    return this.dataSource.getRelatedCategories(currentSlug, limit);
  }

  async getPublishedCategoryCount(): Promise<number> {
    return this.dataSource.getPublishedCategoryCount();
  }
}
