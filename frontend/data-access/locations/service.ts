/**
 * AageOnline — Location Domain Service & Contract
 */

import type {
  LocationSearchResult,
  LocationSummary,
  StateSummary,
} from '../types.ts';

export interface LocationDataSource {
  getPublishedLocations(): Promise<LocationSummary[]>;
  getPublishedLocationBySlug(slug: string): Promise<LocationSummary | null>;
  getPublishedLocationsByState(stateSlug: string): Promise<LocationSummary[]>;
  getStatesWithPublishedLocations(): Promise<StateSummary[]>;
  searchPublishedLocations(query: string): Promise<LocationSearchResult[]>;
  getRelatedLocations(currentSlug: string, limit?: number): Promise<LocationSummary[]>;
  getPublishedLocationCount(): Promise<number>;
}

export class LocationService {
  private readonly dataSource: LocationDataSource;

  constructor(dataSource: LocationDataSource) {
    this.dataSource = dataSource;
  }

  async getPublishedLocations(): Promise<LocationSummary[]> {
    return this.dataSource.getPublishedLocations();
  }

  async getPublishedLocationBySlug(slug: string): Promise<LocationSummary | null> {
    return this.dataSource.getPublishedLocationBySlug(slug);
  }

  async getPublishedLocationsByState(stateSlug: string): Promise<LocationSummary[]> {
    return this.dataSource.getPublishedLocationsByState(stateSlug);
  }

  async getStatesWithPublishedLocations(): Promise<StateSummary[]> {
    return this.dataSource.getStatesWithPublishedLocations();
  }

  async searchPublishedLocations(query: string): Promise<LocationSearchResult[]> {
    return this.dataSource.searchPublishedLocations(query);
  }

  async getRelatedLocations(currentSlug: string, limit?: number): Promise<LocationSummary[]> {
    return this.dataSource.getRelatedLocations(currentSlug, limit);
  }

  async getPublishedLocationCount(): Promise<number> {
    return this.dataSource.getPublishedLocationCount();
  }
}
