/**
 * AageOnline — Data-Access Architecture & Public Domain Contract Test Suite
 *
 * Verifies the typed data-access layer, MarketService, LocationService,
 * CategoryService, DiscoveryService, validation boundary, and error handling.
 */

import { describe, it } from 'node:test';
import assert from 'node:assert';

import {
  marketService,
  locationService,
  categoryService,
  discoveryService,
  validateMarketSummary,
  validatePaginatedMarketResponse,
  DataValidationError,
  ServiceUnavailableError,
} from '../data-access/index.ts';
import { createMarket } from '../lib/taxonomy/markets.ts';

describe('Data-Access Architecture — MarketService Contracts', () => {
  it('returns paginated published markets conforming to MarketSummary schema', async () => {
    const res = await marketService.getPublishedMarkets({ page: 1, pageSize: 10 });
    assert.ok(res.data.length >= 6, 'Must return at least 6 initial published markets');
    assert.strictEqual(res.pagination.page, 1);
    assert.strictEqual(res.pagination.pageSize, 10);
    assert.ok(res.pagination.total >= 6);
    assert.strictEqual(typeof res.pagination.totalPages, 'number');
    assert.strictEqual(typeof res.pagination.hasNextPage, 'boolean');

    for (const m of res.data) {
      assert.ok(m.id, 'Market must have id');
      assert.ok(m.slug.includes('/'), 'Market slug must be location/category format');
      assert.ok(m.cityName, 'Market must have cityName');
      assert.ok(m.categoryName, 'Market must have categoryName');
      assert.strictEqual(m.publicationStatus, 'PUBLISHED');
      assert.strictEqual(m.publicUrl, `/${m.slug}`);
      assert.ok(m.relevantPublicMetrics, 'Market must have relevantPublicMetrics');
    }
  });

  it('strictly excludes non-published markets from public results', async () => {
    // Inject a draft market
    createMarket({
      id: 'mkt-test-delhi-dentists-draft',
      cityId: 'city-delhi',
      categoryId: 'cat-dentists',
      slug: 'delhi/dentists-draft',
      status: 'DRAFT',
      publicationStatus: 'DRAFT',
      indexabilityStatus: 'NOINDEX',
      contentStatus: 'DRAFT',
      totalBusinesses: 0,
      activePositions: 0,
      topQualifyingAmountMinor: 0,
    });

    const res = await marketService.getPublishedMarkets({ pageSize: 100 });
    const found = res.data.find((m) => m.id === 'mkt-test-delhi-dentists-draft');
    assert.strictEqual(found, undefined, 'Draft market must never appear in public domain data');
  });

  it('orders published markets deterministically by qualifying amount descending', async () => {
    const res = await marketService.getPublishedMarkets({
      sortBy: 'qualifying_amount_desc',
      pageSize: 50,
    });
    for (let i = 0; i < res.data.length - 1; i++) {
      const cur = res.data[i].relevantPublicMetrics.topQualifyingAmountMinor ?? 0;
      const next = res.data[i + 1].relevantPublicMetrics.topQualifyingAmountMinor ?? 0;
      assert.ok(cur >= next, `Market at ${i} amount (${cur}) must be >= next (${next})`);
    }
  });

  it('retrieves a single published market by slug', async () => {
    const market = await marketService.getPublishedMarketBySlug('jaipur/interior-designers');
    assert.ok(market, 'Must find jaipur/interior-designers');
    assert.strictEqual(market.cityName, 'Jaipur');
    assert.strictEqual(market.categoryName, 'Interior Designers');
    assert.strictEqual(market.publicationStatus, 'PUBLISHED');
  });

  it('returns null when querying non-existent or unpublished market slug', async () => {
    const notFound = await marketService.getPublishedMarketBySlug('tokyo/architects');
    assert.strictEqual(notFound, null);
  });
});

describe('Data-Access Architecture — Filters & Pagination', () => {
  it('filters markets by location slug', async () => {
    const res = await marketService.getPublishedMarkets({ locationSlug: 'jaipur' });
    assert.ok(res.data.length >= 2);
    for (const m of res.data) {
      assert.strictEqual(m.citySlug, 'jaipur');
    }
  });

  it('filters markets by category slug', async () => {
    const res = await marketService.getPublishedMarkets({ categorySlug: 'restaurants' });
    assert.ok(res.data.length >= 3);
    for (const m of res.data) {
      assert.strictEqual(m.categorySlug, 'restaurants');
    }
  });

  it('filters markets by combined location and category slugs', async () => {
    const res = await marketService.getPublishedMarkets({
      locationSlug: 'jaipur',
      categorySlug: 'restaurants',
    });
    assert.strictEqual(res.data.length, 1);
    assert.strictEqual(res.data[0].citySlug, 'jaipur');
    assert.strictEqual(res.data[0].categorySlug, 'restaurants');
  });

  it('returns empty data array for filter with no published markets', async () => {
    const res = await marketService.getPublishedMarkets({
      locationSlug: 'hisar',
      categorySlug: 'interior-designers',
    });
    assert.deepStrictEqual(res.data, []);
    assert.strictEqual(res.pagination.total, 0);
  });

  it('accurately respects pagination slices', async () => {
    const page1 = await marketService.getPublishedMarkets({ page: 1, pageSize: 2 });
    assert.strictEqual(page1.data.length, 2);
    assert.strictEqual(page1.pagination.page, 1);
    assert.strictEqual(page1.pagination.pageSize, 2);
    assert.strictEqual(page1.pagination.hasNextPage, true);
    assert.strictEqual(page1.pagination.hasPrevPage, false);

    const page2 = await marketService.getPublishedMarkets({ page: 2, pageSize: 2 });
    assert.strictEqual(page2.data.length, 2);
    assert.strictEqual(page2.pagination.page, 2);
    assert.strictEqual(page2.pagination.hasPrevPage, true);
    assert.notStrictEqual(page1.data[0].id, page2.data[0].id);
  });
});

describe('Data-Access Architecture — Search Contracts', () => {
  it('resolves city searches through canonical service', async () => {
    const results = await marketService.searchPublishedMarkets('Jaipur');
    assert.ok(results.length > 0);
    const city = results.find((r) => r.type === 'CITY');
    assert.ok(city, 'City suggestion must be present');
    assert.strictEqual(city.citySlug, 'jaipur');
  });

  it('resolves category searches through canonical service', async () => {
    const results = await marketService.searchPublishedMarkets('Interior Designers');
    assert.ok(results.length > 0);
    const cat = results.find((r) => r.type === 'CATEGORY');
    assert.ok(cat, 'Category suggestion must be present');
  });

  it('resolves combined city + category query directly to MarketSummary', async () => {
    const results = await marketService.searchPublishedMarkets('Delhi Restaurants');
    assert.ok(results.length > 0);
    const marketMatch = results.find(
      (r) => r.type === 'MARKET' && r.market?.slug === 'delhi/restaurants'
    );
    assert.ok(marketMatch, 'Should resolve Delhi Restaurants market');
    assert.strictEqual(marketMatch.market?.publicationStatus, 'PUBLISHED');
  });

  it('returns empty array for unknown searches', async () => {
    const results = await marketService.searchPublishedMarkets('Mars Astronauts');
    assert.deepStrictEqual(results, []);
  });
});

describe('Data-Access Architecture — Location & Category Services', () => {
  it('dynamically aggregates published locations', async () => {
    const locations = await locationService.getPublishedLocations();
    assert.ok(locations.length >= 3);
    for (const loc of locations) {
      assert.ok(loc.id);
      assert.ok(loc.name);
      assert.ok(loc.slug);
      assert.ok(loc.marketCount >= 1);
    }
  });

  it('dynamically aggregates published categories', async () => {
    const categories = await categoryService.getPublishedCategories();
    assert.ok(categories.length >= 2);
    for (const cat of categories) {
      assert.ok(cat.id);
      assert.ok(cat.name);
      assert.ok(cat.slug);
      assert.ok(cat.marketCount >= 1);
    }
  });
});

describe('Data-Access Architecture — Discovery Service', () => {
  it('submits discovery requests and increments request count on repeats', async () => {
    const res1 = await discoveryService.submitDiscoveryRequest({
      rawInput: 'Pune Web Developers',
      requestType: 'MARKET',
    });
    assert.strictEqual(res1.success, true);
    assert.ok(res1.id);
    assert.strictEqual(res1.requestCount, 1);

    const res2 = await discoveryService.submitDiscoveryRequest({
      rawInput: 'Pune Web Developers',
      requestType: 'MARKET',
    });
    assert.strictEqual(res2.id, res1.id, 'Duplicate request must update existing record');
    assert.strictEqual(res2.requestCount, 2, 'Request count must increment');
  });
});

describe('Data-Access Architecture — Validation Boundary & Invariants', () => {
  it('rejects malformed market payloads without id or slug', () => {
    assert.throws(() => {
      validateMarketSummary({
        cityName: 'Jaipur',
        categoryName: 'Restaurants',
      });
    }, DataValidationError);
  });

  it('rejects payloads where publicationStatus is not PUBLISHED', () => {
    assert.throws(() => {
      validateMarketSummary({
        id: 'mkt-draft',
        slug: 'jaipur/draft',
        cityName: 'Jaipur',
        citySlug: 'jaipur',
        categoryName: 'Draft Cat',
        categorySlug: 'draft-cat',
        publicationStatus: 'DRAFT',
      });
    }, /is not published/);
  });

  it('validates and sanitizes a valid API response envelope', () => {
    const envelope = {
      data: [
        {
          id: 'mkt-1',
          slug: 'jaipur/restaurants',
          cityId: 'c1',
          cityName: 'Jaipur',
          citySlug: 'jaipur',
          stateId: 's1',
          stateName: 'Rajasthan',
          countryName: 'India',
          categoryId: 'cat1',
          categoryName: 'Restaurants',
          categorySlug: 'restaurants',
          publicUrl: '/jaipur/restaurants',
          publicationStatus: 'PUBLISHED',
          relevantPublicMetrics: {
            totalBusinesses: 45,
            activePositions: 8,
            topQualifyingAmountMinor: 3200000,
          },
        },
      ],
      pagination: {
        page: 1,
        pageSize: 10,
        total: 1,
        totalPages: 1,
        hasNextPage: false,
        hasPrevPage: false,
      },
    };

    const validated = validatePaginatedMarketResponse(envelope);
    assert.strictEqual(validated.data.length, 1);
    assert.strictEqual(validated.data[0].slug, 'jaipur/restaurants');
    assert.strictEqual(validated.pagination.total, 1);
  });

  it('rejects invalid paginated envelopes missing data array', () => {
    assert.throws(() => {
      validatePaginatedMarketResponse({ pagination: {} });
    }, DataValidationError);
  });

  it('confirms ServiceUnavailableError represents network/API failure rather than zero data', () => {
    const error = new ServiceUnavailableError('Network disconnected');
    assert.strictEqual(error.name, 'ServiceUnavailableError');
    assert.strictEqual(error.message, 'Network disconnected');
  });
});
