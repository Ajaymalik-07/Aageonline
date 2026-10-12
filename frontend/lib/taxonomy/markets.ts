/**
 * AageOnline — Market Registry
 * Authoritative registry and services for Market entities (City + Category = Market).
 * Enforces composite uniqueness on (cityId, categoryId), lifecycle states,
 * and pre-seeds the six production markets.
 */

import type { MarketEntity } from '../../types/taxonomy';
import { getCityById } from './locations.ts';
import { getCategoryById } from './categories.ts';

const MARKETS_STORE: Map<string, MarketEntity> = new Map([
  [
    'mkt-jaipur-interior-designers',
    {
      id: 'mkt-jaipur-interior-designers',
      cityId: 'city-jaipur',
      categoryId: 'cat-interior-designers',
      slug: 'jaipur/interior-designers',
      status: 'PUBLISHED',
      publicationStatus: 'PUBLISHED',
      indexabilityStatus: 'INDEXABLE',
      contentStatus: 'APPROVED',
      totalBusinesses: 48,
      activePositions: 8,
      topQualifyingAmountMinor: 2600000,
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
      publishedAt: '2026-01-01T00:00:00.000Z',
    },
  ],
  [
    'mkt-delhi-interior-designers',
    {
      id: 'mkt-delhi-interior-designers',
      cityId: 'city-delhi',
      categoryId: 'cat-interior-designers',
      slug: 'delhi/interior-designers',
      status: 'PUBLISHED',
      publicationStatus: 'PUBLISHED',
      indexabilityStatus: 'INDEXABLE',
      contentStatus: 'APPROVED',
      totalBusinesses: 64,
      activePositions: 8,
      topQualifyingAmountMinor: 3400000,
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
      publishedAt: '2026-01-01T00:00:00.000Z',
    },
  ],
  [
    'mkt-mumbai-interior-designers',
    {
      id: 'mkt-mumbai-interior-designers',
      cityId: 'city-mumbai',
      categoryId: 'cat-interior-designers',
      slug: 'mumbai/interior-designers',
      status: 'PUBLISHED',
      publicationStatus: 'PUBLISHED',
      indexabilityStatus: 'INDEXABLE',
      contentStatus: 'APPROVED',
      totalBusinesses: 78,
      activePositions: 8,
      topQualifyingAmountMinor: 4500000,
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
      publishedAt: '2026-01-01T00:00:00.000Z',
    },
  ],
  [
    'mkt-jaipur-restaurants',
    {
      id: 'mkt-jaipur-restaurants',
      cityId: 'city-jaipur',
      categoryId: 'cat-restaurants',
      slug: 'jaipur/restaurants',
      status: 'PUBLISHED',
      publicationStatus: 'PUBLISHED',
      indexabilityStatus: 'INDEXABLE',
      contentStatus: 'APPROVED',
      totalBusinesses: 52,
      activePositions: 8,
      topQualifyingAmountMinor: 2800000,
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
      publishedAt: '2026-01-01T00:00:00.000Z',
    },
  ],
  [
    'mkt-delhi-restaurants',
    {
      id: 'mkt-delhi-restaurants',
      cityId: 'city-delhi',
      categoryId: 'cat-restaurants',
      slug: 'delhi/restaurants',
      status: 'PUBLISHED',
      publicationStatus: 'PUBLISHED',
      indexabilityStatus: 'INDEXABLE',
      contentStatus: 'APPROVED',
      totalBusinesses: 85,
      activePositions: 8,
      topQualifyingAmountMinor: 4800000,
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
      publishedAt: '2026-01-01T00:00:00.000Z',
    },
  ],
  [
    'mkt-mumbai-restaurants',
    {
      id: 'mkt-mumbai-restaurants',
      cityId: 'city-mumbai',
      categoryId: 'cat-restaurants',
      slug: 'mumbai/restaurants',
      status: 'PUBLISHED',
      publicationStatus: 'PUBLISHED',
      indexabilityStatus: 'INDEXABLE',
      contentStatus: 'APPROVED',
      totalBusinesses: 92,
      activePositions: 8,
      topQualifyingAmountMinor: 5200000,
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
      publishedAt: '2026-01-01T00:00:00.000Z',
    },
  ],
]);

export function getAllMarkets(): MarketEntity[] {
  return Array.from(MARKETS_STORE.values());
}

export function getMarketById(id: string): MarketEntity | undefined {
  return MARKETS_STORE.get(id);
}

export function getMarketBySlug(slug: string): MarketEntity | undefined {
  const normalized = slug.trim().toLowerCase().replace(/^\/+|\/+$/g, '');
  return Array.from(MARKETS_STORE.values()).find((m) => m.slug === normalized);
}

export function getMarketByCityAndCategory(
  cityId: string,
  categoryId: string
): MarketEntity | undefined {
  return Array.from(MARKETS_STORE.values()).find(
    (m) => m.cityId === cityId && m.categoryId === categoryId
  );
}

export function createMarket(
  data: Omit<MarketEntity, 'createdAt' | 'updatedAt'>
): MarketEntity {
  const city = getCityById(data.cityId);
  if (!city) {
    throw new Error(`Cannot create market: City "${data.cityId}" does not exist.`);
  }

  const category = getCategoryById(data.categoryId);
  if (!category) {
    throw new Error(`Cannot create market: Category "${data.categoryId}" does not exist.`);
  }

  // Enforce composite uniqueness: cityId + categoryId
  const existingPair = getMarketByCityAndCategory(data.cityId, data.categoryId);
  if (existingPair) {
    throw new Error(
      `Market for City "${city.name}" and Category "${category.name}" already exists with ID "${existingPair.id}".`
    );
  }

  const expectedSlug = `${city.slug}/${category.slug}`;
  const now = new Date().toISOString();

  const newMarket: MarketEntity = {
    ...data,
    id: data.id || `mkt-${city.slug}-${category.slug}`,
    slug: expectedSlug,
    createdAt: now,
    updatedAt: now,
    publishedAt: data.publicationStatus === 'PUBLISHED' ? now : undefined,
  };

  MARKETS_STORE.set(newMarket.id, newMarket);
  return newMarket;
}

export function updateMarket(
  id: string,
  updates: Partial<Omit<MarketEntity, 'id' | 'cityId' | 'categoryId' | 'createdAt'>>
): MarketEntity {
  const existing = MARKETS_STORE.get(id);
  if (!existing) {
    throw new Error(`Market with ID "${id}" does not exist.`);
  }

  const now = new Date().toISOString();
  let publishedAt = existing.publishedAt;

  if (
    updates.publicationStatus === 'PUBLISHED' &&
    existing.publicationStatus !== 'PUBLISHED'
  ) {
    publishedAt = now;
  }

  const updated: MarketEntity = {
    ...existing,
    ...updates,
    publishedAt,
    updatedAt: now,
  };

  MARKETS_STORE.set(id, updated);
  return updated;
}
