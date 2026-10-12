/**
 * AageOnline — Market Directory Query Service
 *
 * Provides read-only, public-safe queries over the Market Registry.
 * All results respect the publication + indexability lifecycle invariants.
 *
 * Public visibility rule:
 *   publicationStatus === 'PUBLISHED' && status === 'PUBLISHED'
 */

import { getAllMarkets } from './markets.ts';
import { getCityById, getStateById, getAllCities } from './locations.ts';
import { getCategoryById, getAllCategories } from './categories.ts';
import { findMatchingCity, findMatchingCategory, canonicalizeText } from './normalization.ts';
import type { MarketEntity, City, StateRegion, CategoryHierarchy } from '../../types/taxonomy';

// ---------------------------------------------------------------------------
// Shaped result types
// ---------------------------------------------------------------------------

export interface PublishedMarketCard {
  marketId: string;
  slug: string;
  href: string;
  cityId: string;
  cityName: string;
  citySlug: string;
  stateId: string;
  stateName: string;
  categoryId: string;
  categoryName: string;
  categorySlug: string;
  totalBusinesses: number | undefined;
  activePositions: number | undefined;
  topQualifyingAmountMinor: number | undefined;
  publishedAt: string | undefined;
}

export interface LocationGroup {
  cityId: string;
  cityName: string;
  citySlug: string;
  stateName: string;
  marketCount: number;
}

export interface CategoryGroup {
  categoryId: string;
  categoryName: string;
  categorySlug: string;
  marketCount: number;
}

export interface MarketSearchResult {
  type: 'MARKET' | 'CITY' | 'CATEGORY';
  label: string;
  sublabel?: string;
  href?: string;
  marketCard?: PublishedMarketCard;
  citySlug?: string;
  categorySlug?: string;
  found: boolean;
}

// ---------------------------------------------------------------------------
// Internal helper
// ---------------------------------------------------------------------------

function isPublic(m: MarketEntity): boolean {
  return m.publicationStatus === 'PUBLISHED' && m.status === 'PUBLISHED';
}

function toCard(
  m: MarketEntity,
  city: City,
  state: StateRegion,
  category: CategoryHierarchy
): PublishedMarketCard {
  return {
    marketId: m.id,
    slug: m.slug,
    href: `/${m.slug}`,
    cityId: city.id,
    cityName: city.name,
    citySlug: city.slug,
    stateId: state.id,
    stateName: state.name,
    categoryId: category.id,
    categoryName: category.name,
    categorySlug: category.slug,
    totalBusinesses: m.totalBusinesses,
    activePositions: m.activePositions,
    topQualifyingAmountMinor: m.topQualifyingAmountMinor,
    publishedAt: m.publishedAt,
  };
}

function resolveCard(m: MarketEntity): PublishedMarketCard | null {
  const city = getCityById(m.cityId);
  const category = getCategoryById(m.categoryId);
  if (!city) return null;
  const state = getStateById(city.stateId);
  if (!state || !category) return null;
  return toCard(m, city, state, category);
}

// ---------------------------------------------------------------------------
// Public queries
// ---------------------------------------------------------------------------

/**
 * Return all published markets as directory cards,
 * ordered by topQualifyingAmountMinor descending.
 */
export function getPublishedMarkets(
  opts: { limit?: number; offset?: number } = {}
): PublishedMarketCard[] {
  const all = getAllMarkets()
    .filter(isPublic)
    .sort((a, b) => (b.topQualifyingAmountMinor ?? 0) - (a.topQualifyingAmountMinor ?? 0));

  const cards: PublishedMarketCard[] = [];
  for (const m of all) {
    const card = resolveCard(m);
    if (card) cards.push(card);
  }

  const { limit, offset = 0 } = opts;
  return limit !== undefined ? cards.slice(offset, offset + limit) : cards.slice(offset);
}

/**
 * Count of all published markets.
 */
export function getPublishedMarketCount(): number {
  return getAllMarkets().filter(isPublic).length;
}

/**
 * Return published markets grouped by unique cities,
 * ordered by city market count descending.
 */
export function getPublishedLocations(): LocationGroup[] {
  const all = getAllMarkets().filter(isPublic);
  const cityMap = new Map<string, LocationGroup>();

  for (const m of all) {
    const city = getCityById(m.cityId);
    if (!city) continue;
    const state = getStateById(city.stateId);
    if (!state) continue;

    if (!cityMap.has(city.id)) {
      cityMap.set(city.id, {
        cityId: city.id,
        cityName: city.name,
        citySlug: city.slug,
        stateName: state.name,
        marketCount: 0,
      });
    }
    cityMap.get(city.id)!.marketCount++;
  }

  return Array.from(cityMap.values()).sort((a, b) => b.marketCount - a.marketCount);
}

/**
 * Return published markets grouped by unique categories,
 * ordered by category market count descending.
 */
export function getPublishedCategories(): CategoryGroup[] {
  const all = getAllMarkets().filter(isPublic);
  const catMap = new Map<string, CategoryGroup>();

  for (const m of all) {
    const cat = getCategoryById(m.categoryId);
    if (!cat) continue;

    if (!catMap.has(cat.id)) {
      catMap.set(cat.id, {
        categoryId: cat.id,
        categoryName: cat.name,
        categorySlug: cat.slug,
        marketCount: 0,
      });
    }
    catMap.get(cat.id)!.marketCount++;
  }

  return Array.from(catMap.values()).sort((a, b) => b.marketCount - a.marketCount);
}

/**
 * Filter published markets by location slug and/or category slug.
 */
export function filterPublishedMarkets(opts: {
  locationSlug?: string;
  categorySlug?: string;
}): PublishedMarketCard[] {
  const { locationSlug, categorySlug } = opts;
  const all = getPublishedMarkets();

  return all.filter((card) => {
    const matchLoc = !locationSlug || card.citySlug === locationSlug;
    const matchCat = !categorySlug || card.categorySlug === categorySlug;
    return matchLoc && matchCat;
  });
}

/**
 * Search published markets by a free-text query.
 *
 * Understands:
 *   - city name / alias   → "Jaipur"
 *   - category name/alias → "Interior Designers"
 *   - city + category     → "Jaipur Interior Designers"
 *
 * Returns structured results without fabricating data.
 */
export function searchPublishedMarkets(rawQuery: string): MarketSearchResult[] {
  const query = canonicalizeText(rawQuery);
  if (!query) return [];

  const results: MarketSearchResult[] = [];
  const seen = new Set<string>();

  // 1. Try city + category (two-token parse, most specific)
  const city = findMatchingCity(query);
  const category = findMatchingCategory(query);

  if (city && category) {
    // Direct market lookup
    const published = getPublishedMarkets();
    const match = published.find(
      (c) => c.cityId === city.id && c.categoryId === category.id
    );
    if (match && !seen.has(match.marketId)) {
      seen.add(match.marketId);
      results.push({
        type: 'MARKET',
        label: `${city.name} × ${category.name}`,
        sublabel: `Published Market`,
        href: `/${match.slug}`,
        marketCard: match,
        found: true,
      });
    }
  }

  // 2. If the whole query matches a city — list all its published markets
  if (city) {
    const cityMarkets = getPublishedMarkets().filter((c) => c.cityId === city.id);
    for (const m of cityMarkets) {
      if (!seen.has(m.marketId)) {
        seen.add(m.marketId);
        results.push({
          type: 'MARKET',
          label: `${m.cityName} × ${m.categoryName}`,
          sublabel: `Market in ${m.cityName}`,
          href: `/${m.slug}`,
          marketCard: m,
          found: true,
        });
      }
    }
    // City itself
    results.push({
      type: 'CITY',
      label: city.name,
      sublabel: `Explore markets in ${city.name}`,
      citySlug: city.slug,
      found: true,
    });
  }

  // 3. If the whole query matches a category — list all its published markets
  if (category) {
    const catMarkets = getPublishedMarkets().filter((c) => c.categoryId === category.id);
    for (const m of catMarkets) {
      if (!seen.has(m.marketId)) {
        seen.add(m.marketId);
        results.push({
          type: 'MARKET',
          label: `${m.cityName} × ${m.categoryName}`,
          sublabel: `Market for ${m.categoryName}`,
          href: `/${m.slug}`,
          marketCard: m,
          found: true,
        });
      }
    }
    // Category itself
    results.push({
      type: 'CATEGORY',
      label: category.name,
      sublabel: `Explore markets in ${category.name}`,
      categorySlug: category.slug,
      found: true,
    });
  }

  // 4. Fuzzy fallback — partial name matching against all published markets
  if (results.length === 0) {
    const published = getPublishedMarkets();
    for (const m of published) {
      const slug = `${m.cityName} ${m.categoryName}`.toLowerCase();
      if (slug.includes(query) || m.cityName.toLowerCase().includes(query) || m.categoryName.toLowerCase().includes(query)) {
        if (!seen.has(m.marketId)) {
          seen.add(m.marketId);
          results.push({
            type: 'MARKET',
            label: `${m.cityName} × ${m.categoryName}`,
            sublabel: 'Published Market',
            href: `/${m.slug}`,
            marketCard: m,
            found: true,
          });
        }
      }
    }
  }

  return results;
}

/**
 * Determine what kind of discovery gap exists for a given query.
 * Used to decide what discovery requests to submit when a market is not found.
 */
export function classifySearchGap(rawQuery: string): {
  hasCity: boolean;
  hasCategory: boolean;
  cityName?: string;
  categoryName?: string;
  cityId?: string;
  categoryId?: string;
} {
  const query = canonicalizeText(rawQuery);
  let city = findMatchingCity(query);
  let category = findMatchingCategory(query);

  if (!city) {
    const allCities = getAllCities();
    for (const c of allCities) {
      const cName = c.name.toLowerCase();
      const cSlug = c.slug.toLowerCase();
      const regex = new RegExp(`(^|\\s)${cName}(\\s|$)|(^|\\s)${cSlug}(\\s|$)`, 'i');
      if (regex.test(query)) {
        city = c;
        break;
      }
    }
  }

  if (!category) {
    const allCats = getAllCategories();
    for (const cat of allCats) {
      const catName = cat.name.toLowerCase();
      const catSlug = cat.slug.toLowerCase();
      const regex = new RegExp(`(^|\\s)${catName}(\\s|$)|(^|\\s)${catSlug}(\\s|$)`, 'i');
      if (regex.test(query)) {
        category = cat;
        break;
      }
      if (cat.aliases) {
        for (const alias of cat.aliases) {
          const aliasRegex = new RegExp(`(^|\\s)${alias.toLowerCase()}(\\s|$)`, 'i');
          if (aliasRegex.test(query)) {
            category = cat;
            break;
          }
        }
        if (category) break;
      }
    }
  }

  return {
    hasCity: !!city,
    hasCategory: !!category,
    cityName: city?.name,
    categoryName: category?.name,
    cityId: city?.id,
    categoryId: category?.id,
  };
}
