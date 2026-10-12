/**
 * AageOnline — Local Location Data Source Adapter
 *
 * Implements LocationDataSource directly on top of the in-memory canonical
 * taxonomy and market stores. Enforces publication rules and provides deterministic ordering.
 */

import type { LocationDataSource } from './service.ts';
import type {
  LocationSearchResult,
  LocationSummary,
  StateSummary,
} from '../types.ts';
import { getAllMarkets } from '../../lib/taxonomy/markets.ts';
import {
  getCityById,
  getCityBySlug,
  getStateById,
  getStateBySlug,
  getAllCities,
} from '../../lib/taxonomy/locations.ts';
import { canonicalizeText } from '../../lib/taxonomy/normalization.ts';

export class LocalLocationDataSource implements LocationDataSource {
  async getPublishedLocations(): Promise<LocationSummary[]> {
    const publishedMarkets = getAllMarkets().filter(
      (m) => m.publicationStatus === 'PUBLISHED' && m.status === 'PUBLISHED'
    );

    const cityMarketCounts = new Map<string, number>();
    for (const m of publishedMarkets) {
      cityMarketCounts.set(m.cityId, (cityMarketCounts.get(m.cityId) || 0) + 1);
    }

    const locations: LocationSummary[] = [];
    for (const [cityId, count] of cityMarketCounts.entries()) {
      const city = getCityById(cityId);
      if (!city || city.status !== 'ACTIVE') continue;
      const state = getStateById(city.stateId);

      locations.push({
        id: city.id,
        name: city.name,
        slug: city.slug,
        state: state?.name || '',
        stateName: state?.name || '',
        stateSlug: state?.slug || '',
        country: 'India',
        countryName: 'India',
        countrySlug: 'india',
        status: 'PUBLISHED',
        marketCount: count,
        activeMarketCount: count,
        publicUrl: `/${city.slug}`,
      });
    }

    // Deterministic ordering: published market count descending, then alphabetical by name
    locations.sort((a, b) => {
      if (b.activeMarketCount !== a.activeMarketCount) {
        return b.activeMarketCount - a.activeMarketCount;
      }
      return a.name.localeCompare(b.name);
    });

    return locations;
  }

  async getPublishedLocationBySlug(slug: string): Promise<LocationSummary | null> {
    const normalized = slug.trim().toLowerCase();
    const published = await this.getPublishedLocations();

    // 1. Direct slug match on published location
    const exact = published.find((l) => l.slug.toLowerCase() === normalized);
    if (exact) return exact;

    // 2. Alias resolution via canonical city taxonomy
    const taxonomyCity = getCityBySlug(normalized) || getAllCities().find(
      (c) => (c.aliases || []).map((a) => a.toLowerCase()).includes(normalized)
    );

    if (taxonomyCity) {
      const matchedPublished = published.find((l) => l.id === taxonomyCity.id);
      if (matchedPublished) return matchedPublished;
    }

    return null;
  }

  async getPublishedLocationsByState(stateSlug: string): Promise<LocationSummary[]> {
    const normalized = stateSlug.trim().toLowerCase();
    const all = await this.getPublishedLocations();
    return all.filter((l) => l.stateSlug.toLowerCase() === normalized);
  }

  async getStatesWithPublishedLocations(): Promise<StateSummary[]> {
    const locations = await this.getPublishedLocations();
    const stateMap = new Map<string, { id: string; name: string; slug: string; locationCount: number; marketCount: number }>();

    for (const loc of locations) {
      const existing = stateMap.get(loc.stateSlug);
      if (existing) {
        existing.locationCount += 1;
        existing.marketCount += loc.activeMarketCount;
      } else {
        const stateObj = getStateBySlug(loc.stateSlug);
        stateMap.set(loc.stateSlug, {
          id: stateObj?.id || `state-${loc.stateSlug}`,
          name: loc.stateName,
          slug: loc.stateSlug,
          locationCount: 1,
          marketCount: loc.activeMarketCount,
        });
      }
    }

    const states = Array.from(stateMap.values());
    states.sort((a, b) => {
      if (b.marketCount !== a.marketCount) {
        return b.marketCount - a.marketCount;
      }
      return a.name.localeCompare(b.name);
    });

    return states;
  }

  async searchPublishedLocations(query: string): Promise<LocationSearchResult[]> {
    const q = canonicalizeText(query);
    if (!q) return [];

    const published = await this.getPublishedLocations();
    const results: LocationSearchResult[] = [];

    // Check published locations first
    for (const loc of published) {
      const nameMatch = canonicalizeText(loc.name).includes(q);
      const stateMatch = canonicalizeText(loc.stateName).includes(q);
      const slugMatch = loc.slug.toLowerCase().includes(q);

      if (nameMatch || stateMatch || slugMatch) {
        results.push({
          type: 'LOCATION',
          id: loc.id,
          name: loc.name,
          slug: loc.slug,
          stateName: loc.stateName,
          countryName: loc.countryName,
          marketCount: loc.activeMarketCount,
          publicUrl: loc.publicUrl,
          found: true,
          query,
        });
      }
    }

    // If no published location matched, check taxonomy for unlisted/pending cities
    if (results.length === 0) {
      const unlistedCity = getAllCities().find(
        (c) =>
          canonicalizeText(c.name).includes(q) ||
          (c.aliases || []).some((a) => canonicalizeText(a).includes(q))
      );

      if (unlistedCity) {
        const state = getStateById(unlistedCity.stateId);
        results.push({
          type: 'LOCATION',
          id: unlistedCity.id,
          name: unlistedCity.name,
          slug: unlistedCity.slug,
          stateName: state?.name,
          countryName: 'India',
          marketCount: 0,
          found: false,
          query,
        });
      } else {
        // Entirely unknown location
        results.push({
          type: 'LOCATION',
          name: query.trim(),
          marketCount: 0,
          found: false,
          query,
        });
      }
    }

    return results;
  }

  async getRelatedLocations(currentSlug: string, limit = 4): Promise<LocationSummary[]> {
    const current = await this.getPublishedLocationBySlug(currentSlug);
    const all = await this.getPublishedLocations();
    const others = all.filter((l) => l.slug.toLowerCase() !== currentSlug.toLowerCase());

    if (!current) return others.slice(0, limit);

    // Prioritize same state first, then others by market count
    const sameState = others.filter((l) => l.stateSlug === current.stateSlug);
    const otherStates = others.filter((l) => l.stateSlug !== current.stateSlug);

    return [...sameState, ...otherStates].slice(0, limit);
  }

  async getPublishedLocationCount(): Promise<number> {
    const published = await this.getPublishedLocations();
    return published.length;
  }
}
