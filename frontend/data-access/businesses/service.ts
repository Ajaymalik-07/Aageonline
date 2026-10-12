/**
 * AageOnline — Business Domain Service & Contract
 */

import type {
  BusinessProfile,
  BusinessSearchParams,
  BusinessSearchResult,
  BusinessSummary,
  PaginatedResponse,
} from '../types.ts';

export interface BusinessDataSource {
  getPublishedBusinesses(params?: BusinessSearchParams): Promise<PaginatedResponse<BusinessSummary>>;
  getPublishedBusinessBySlug(slug: string): Promise<BusinessProfile | null>;
  searchPublishedBusinesses(query: string): Promise<BusinessSearchResult[]>;
  getPublishedBusinessCount(): Promise<number>;
}

export class BusinessService {
  private readonly dataSource: BusinessDataSource;

  constructor(dataSource: BusinessDataSource) {
    this.dataSource = dataSource;
  }

  async getPublishedBusinesses(params?: BusinessSearchParams): Promise<PaginatedResponse<BusinessSummary>> {
    return this.dataSource.getPublishedBusinesses(params);
  }

  async getPublishedBusinessBySlug(slug: string): Promise<BusinessProfile | null> {
    return this.dataSource.getPublishedBusinessBySlug(slug);
  }

  async searchPublishedBusinesses(query: string): Promise<BusinessSearchResult[]> {
    return this.dataSource.searchPublishedBusinesses(query);
  }

  async getPublishedBusinessCount(): Promise<number> {
    return this.dataSource.getPublishedBusinessCount();
  }
}
