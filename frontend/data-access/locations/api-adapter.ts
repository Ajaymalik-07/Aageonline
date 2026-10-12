/**
 * AageOnline — Remote API Location Data Source Adapter
 *
 * Implements LocationDataSource by consuming the REST API contracts.
 * Strictly validates responses and throws ServiceUnavailableError upon failure.
 */

import type { LocationDataSource } from './service.ts';
import { ServiceUnavailableError } from '../types.ts';
import type {
  LocationSearchResult,
  LocationSummary,
  StateSummary,
} from '../types.ts';

export class ApiLocationDataSource implements LocationDataSource {
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

  async getPublishedLocations(): Promise<LocationSummary[]> {
    const url = this.resolveUrl('/api/locations');
    try {
      const res = await fetch(url, {
        headers: { Accept: 'application/json' },
        next: { revalidate: 120 },
      });

      if (!res.ok) {
        throw new ServiceUnavailableError(`Location API returned HTTP ${res.status}`);
      }

      const json = await res.json();
      if (!Array.isArray(json.data)) {
        throw new ServiceUnavailableError('Invalid response shape from Location API');
      }

      return json.data;
    } catch (err: unknown) {
      if (err instanceof ServiceUnavailableError) throw err;
      throw new ServiceUnavailableError(
        `Failed to reach Location API: ${err instanceof Error ? err.message : 'Network error'}`
      );
    }
  }

  async getPublishedLocationBySlug(slug: string): Promise<LocationSummary | null> {
    const all = await this.getPublishedLocations();
    return all.find((l) => l.slug.toLowerCase() === slug.toLowerCase()) || null;
  }

  async getPublishedLocationsByState(stateSlug: string): Promise<LocationSummary[]> {
    const all = await this.getPublishedLocations();
    return all.filter((l) => l.stateSlug.toLowerCase() === stateSlug.toLowerCase());
  }

  async getStatesWithPublishedLocations(): Promise<StateSummary[]> {
    const locations = await this.getPublishedLocations();
    const stateMap = new Map<string, StateSummary>();

    for (const loc of locations) {
      const existing = stateMap.get(loc.stateSlug);
      if (existing) {
        existing.locationCount += 1;
        existing.marketCount += loc.activeMarketCount;
      } else {
        stateMap.set(loc.stateSlug, {
          id: `state-${loc.stateSlug}`,
          name: loc.stateName,
          slug: loc.stateSlug,
          locationCount: 1,
          marketCount: loc.activeMarketCount,
        });
      }
    }

    return Array.from(stateMap.values());
  }

  async searchPublishedLocations(query: string): Promise<LocationSearchResult[]> {
    const qs = new URLSearchParams({ search: query });
    const url = this.resolveUrl(`/api/locations?${qs.toString()}`);

    try {
      const res = await fetch(url, {
        headers: { Accept: 'application/json' },
      });

      if (!res.ok) {
        throw new ServiceUnavailableError(`Location API returned HTTP ${res.status}`);
      }

      const json = await res.json();
      if (!Array.isArray(json.data)) return [];

      return json.data.map((l: LocationSummary) => ({
        type: 'LOCATION',
        id: l.id,
        name: l.name,
        slug: l.slug,
        stateName: l.stateName,
        countryName: l.countryName,
        marketCount: l.activeMarketCount,
        publicUrl: l.publicUrl,
        found: true,
        query,
      }));
    } catch (err: unknown) {
      if (err instanceof ServiceUnavailableError) throw err;
      throw new ServiceUnavailableError(
        `Failed to reach Location search API: ${err instanceof Error ? err.message : 'Network error'}`
      );
    }
  }

  async getRelatedLocations(currentSlug: string, limit = 4): Promise<LocationSummary[]> {
    const all = await this.getPublishedLocations();
    const current = all.find((l) => l.slug.toLowerCase() === currentSlug.toLowerCase());
    const others = all.filter((l) => l.slug.toLowerCase() !== currentSlug.toLowerCase());

    if (!current) return others.slice(0, limit);

    const sameState = others.filter((l) => l.stateSlug === current.stateSlug);
    const otherStates = others.filter((l) => l.stateSlug !== current.stateSlug);

    return [...sameState, ...otherStates].slice(0, limit);
  }

  async getPublishedLocationCount(): Promise<number> {
    const all = await this.getPublishedLocations();
    return all.length;
  }
}
