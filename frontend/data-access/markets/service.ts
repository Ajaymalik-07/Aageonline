/**
 * AageOnline — Market Domain Service & Data Source Contract
 *
 * Defines the abstract MarketDataSource contract and the MarketService
 * orchestrator that the UI and Server Components consume.
 */

import type {
  MarketSearchParams,
  MarketSearchResult,
  MarketSummary,
  PaginatedResponse,
  PaginationParams,
} from '../types.ts';

export interface MarketDataSource {
  getPublishedMarkets(params?: MarketSearchParams): Promise<PaginatedResponse<MarketSummary>>;
  getPublishedMarketBySlug(slug: string): Promise<MarketSummary | null>;
  getPublishedMarketsByLocation(
    locationSlug: string,
    params?: PaginationParams
  ): Promise<PaginatedResponse<MarketSummary>>;
  getPublishedMarketsByCategory(
    categorySlug: string,
    params?: PaginationParams
  ): Promise<PaginatedResponse<MarketSummary>>;
  searchPublishedMarkets(query: string): Promise<MarketSearchResult[]>;
  getPublishedMarketCount(): Promise<number>;
}

export class MarketService {
  private readonly dataSource: MarketDataSource;

  constructor(dataSource: MarketDataSource) {
    this.dataSource = dataSource;
  }

  async getPublishedMarkets(
    params?: MarketSearchParams
  ): Promise<PaginatedResponse<MarketSummary>> {
    return this.dataSource.getPublishedMarkets(params);
  }

  async getPublishedMarketBySlug(slug: string): Promise<MarketSummary | null> {
    return this.dataSource.getPublishedMarketBySlug(slug);
  }

  async getPublishedMarketsByLocation(
    locationSlug: string,
    params?: PaginationParams
  ): Promise<PaginatedResponse<MarketSummary>> {
    return this.dataSource.getPublishedMarketsByLocation(locationSlug, params);
  }

  async getPublishedMarketsByCategory(
    categorySlug: string,
    params?: PaginationParams
  ): Promise<PaginatedResponse<MarketSummary>> {
    return this.dataSource.getPublishedMarketsByCategory(categorySlug, params);
  }

  async searchPublishedMarkets(query: string): Promise<MarketSearchResult[]> {
    return this.dataSource.searchPublishedMarkets(query);
  }

  async getPublishedMarketCount(): Promise<number> {
    return this.dataSource.getPublishedMarketCount();
  }
}
