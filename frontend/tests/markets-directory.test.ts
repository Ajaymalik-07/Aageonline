/**
 * AageOnline — Markets Directory Service & Query Test Suite
 *
 * Verifies public directory retrieval, location and category aggregation,
 * published-only filtering invariants, search resolution, and discovery gap classification.
 */

import { describe, it } from 'node:test';
import assert from 'node:assert';

import {
  getPublishedMarkets,
  getPublishedMarketCount,
  getPublishedLocations,
  getPublishedCategories,
  filterPublishedMarkets,
  searchPublishedMarkets,
  classifySearchGap,
} from '../lib/taxonomy/market-directory.ts';

import { createMarket } from '../lib/taxonomy/markets.ts';

describe('Markets Directory — Public Listing & Invariants', () => {
  it('retrieves all published markets from the dynamic registry', () => {
    const markets = getPublishedMarkets();
    assert.ok(markets.length >= 6, 'Must contain at least the 6 production markets');

    for (const m of markets) {
      assert.ok(m.marketId, 'Every card must have a marketId');
      assert.ok(m.cityName, 'Every card must have a cityName');
      assert.ok(m.categoryName, 'Every card must have a categoryName');
      assert.ok(m.href.startsWith('/'), 'href must start with /');
      assert.ok(m.href.includes(m.citySlug), 'href must include city slug');
      assert.ok(m.href.includes(m.categorySlug), 'href must include category slug');
    }
  });

  it('matches getPublishedMarketCount with getPublishedMarkets length', () => {
    const count = getPublishedMarketCount();
    const markets = getPublishedMarkets();
    assert.strictEqual(count, markets.length);
  });

  it('orders published markets by qualifying amount descending', () => {
    const markets = getPublishedMarkets();
    for (let i = 0; i < markets.length - 1; i++) {
      const current = markets[i].topQualifyingAmountMinor || 0;
      const next = markets[i + 1].topQualifyingAmountMinor || 0;
      assert.ok(
        current >= next,
        `Expected market at ${i} (${current}) >= market at ${i + 1} (${next})`
      );
    }
  });

  it('excludes non-published markets from public directory', () => {
    // Create an unapproved draft market
    const draftMarket = createMarket({
      id: 'mkt-delhi-dentists-draft',
      cityId: 'city-delhi',
      categoryId: 'cat-dentists',
      slug: 'delhi/dentists',
      status: 'DRAFT',
      publicationStatus: 'DRAFT',
      indexabilityStatus: 'NOINDEX',
      contentStatus: 'DRAFT',
      totalBusinesses: 0,
      activePositions: 0,
      topQualifyingAmountMinor: 0,
    });

    const publicMarkets = getPublishedMarkets();
    const found = publicMarkets.find((m) => m.marketId === draftMarket.id);
    assert.strictEqual(found, undefined, 'Draft / pending market must not appear in public directory');
  });
});

describe('Markets Directory — Location & Category Grouping', () => {
  it('aggregates published locations with correct market counts', () => {
    const locations = getPublishedLocations();
    assert.ok(locations.length >= 3, 'Must contain at least Jaipur, Delhi, Mumbai');

    const jaipur = locations.find((l) => l.citySlug === 'jaipur');
    assert.ok(jaipur, 'Jaipur must be present');
    assert.strictEqual(jaipur.cityName, 'Jaipur');
    assert.strictEqual(jaipur.stateName, 'Rajasthan');
    assert.ok(jaipur.marketCount >= 2, 'Jaipur must have at least 2 published markets');

    const delhi = locations.find((l) => l.citySlug === 'delhi');
    assert.ok(delhi, 'Delhi must be present');
    assert.ok(delhi.marketCount >= 2);

    const mumbai = locations.find((l) => l.citySlug === 'mumbai');
    assert.ok(mumbai, 'Mumbai must be present');
    assert.ok(mumbai.marketCount >= 2);
  });

  it('aggregates published categories with correct market counts', () => {
    const categories = getPublishedCategories();
    assert.ok(categories.length >= 2, 'Must contain at least Interior Designers and Restaurants');

    const interiors = categories.find((c) => c.categorySlug === 'interior-designers');
    assert.ok(interiors, 'Interior Designers must be present');
    assert.ok(interiors.marketCount >= 3, 'Interior Designers must span at least 3 cities');

    const restaurants = categories.find((c) => c.categorySlug === 'restaurants');
    assert.ok(restaurants, 'Restaurants must be present');
    assert.ok(restaurants.marketCount >= 3, 'Restaurants must span at least 3 cities');
  });
});

describe('Markets Directory — Filtering', () => {
  it('filters markets by location slug', () => {
    const jaipurMarkets = filterPublishedMarkets({ locationSlug: 'jaipur' });
    assert.ok(jaipurMarkets.length >= 2);
    for (const m of jaipurMarkets) {
      assert.strictEqual(m.citySlug, 'jaipur');
    }
  });

  it('filters markets by category slug', () => {
    const restaurantMarkets = filterPublishedMarkets({ categorySlug: 'restaurants' });
    assert.ok(restaurantMarkets.length >= 3);
    for (const m of restaurantMarkets) {
      assert.strictEqual(m.categorySlug, 'restaurants');
    }
  });

  it('filters markets by combined location and category slugs', () => {
    const specific = filterPublishedMarkets({
      locationSlug: 'jaipur',
      categorySlug: 'restaurants',
    });
    assert.strictEqual(specific.length, 1);
    assert.strictEqual(specific[0].citySlug, 'jaipur');
    assert.strictEqual(specific[0].categorySlug, 'restaurants');
  });

  it('returns empty array when filter matches no published market', () => {
    const none = filterPublishedMarkets({
      locationSlug: 'kolkata',
      categorySlug: 'dentists',
    });
    assert.deepStrictEqual(none, []);
  });
});

describe('Markets Directory — Search Resolution', () => {
  it('resolves city name queries with city suggestions and associated markets', () => {
    const results = searchPublishedMarkets('Jaipur');
    assert.ok(results.length > 0);

    const cityMatch = results.find((r) => r.type === 'CITY');
    assert.ok(cityMatch, 'Should return a CITY result for Jaipur');
    assert.strictEqual(cityMatch.citySlug, 'jaipur');

    const marketMatches = results.filter((r) => r.type === 'MARKET');
    assert.ok(marketMatches.length >= 2, 'Should include Jaipur markets');
  });

  it('resolves category name queries with category suggestions and associated markets', () => {
    const results = searchPublishedMarkets('Interior Designers');
    assert.ok(results.length > 0);

    const catMatch = results.find((r) => r.type === 'CATEGORY');
    assert.ok(catMatch, 'Should return a CATEGORY result');

    const marketMatches = results.filter((r) => r.type === 'MARKET');
    assert.ok(marketMatches.length >= 3, 'Should include markets in this category');
  });

  it('resolves combined city + category queries directly to the market', () => {
    const results = searchPublishedMarkets('Mumbai Restaurants');
    assert.ok(results.length > 0);

    const exactMarket = results.find(
      (r) => r.type === 'MARKET' && r.marketCard?.href === '/mumbai/restaurants'
    );
    assert.ok(exactMarket, 'Should find Mumbai Restaurants market');
  });

  it('returns empty array for unknown market searches', () => {
    const results = searchPublishedMarkets('Atlantis Submarines');
    assert.deepStrictEqual(results, []);
  });
});

describe('Markets Directory — Discovery Gap Classification', () => {
  it('classifies missing category when city is known', () => {
    const gap = classifySearchGap('Jaipur Cardiologists');
    assert.strictEqual(gap.hasCity, true);
    assert.strictEqual(gap.cityName, 'Jaipur');
    assert.strictEqual(gap.hasCategory, false);
  });

  it('classifies missing city when category is known', () => {
    const gap = classifySearchGap('Chennai Restaurants');
    assert.strictEqual(gap.hasCity, false);
    assert.strictEqual(gap.hasCategory, true);
    assert.strictEqual(gap.categoryName, 'Restaurants');
  });

  it('classifies completely new city and category pair', () => {
    const gap = classifySearchGap('Patna Cardiologists');
    assert.strictEqual(gap.hasCity, false);
    assert.strictEqual(gap.hasCategory, false);
  });
});
