/**
 * AageOnline — Public Categories Directory & Reusable Category Page Test Suite
 *
 * Verifies typed category domain contracts, local adapter, service delegation,
 * deterministic ordering, dynamic market aggregation, unknown category discovery,
 * and regression resilience.
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import {
  categoryService,
  LocalCategoryDataSource,
  marketService,
  createCategoryService,
} from '../data-access/index.ts';
import type { CategorySummary } from '../data-access/types.ts';
import {
  createMarket,
  getAllMarkets,
} from '../lib/taxonomy/markets.ts';
import {
  createCategory,
  getAllCategories,
} from '../lib/taxonomy/categories.ts';
import {
  recordDiscoveryRequest,
  getDiscoveryRequestsByType,
  resetDiscoveryStoreForTesting,
} from '../lib/taxonomy/discovery.ts';

describe('Categories Directory & Reusable Category Page Architecture', () => {
  // -------------------------------------------------------------------------
  // 1. Typed Public Category Contract Invariants
  // -------------------------------------------------------------------------
  describe('1. Typed Public Category Contract Invariants', () => {
    it('should conform to the public-safe CategorySummary schema', async () => {
      const categories = await categoryService.getPublishedCategories();
      assert.ok(categories.length >= 2, 'Must have at least Interior Designers and Restaurants pre-seeded');

      for (const cat of categories) {
        // Required identification & routing
        assert.ok(typeof cat.id === 'string' && cat.id.startsWith('cat-'), 'Valid category ID');
        assert.ok(typeof cat.name === 'string' && cat.name.length > 0, 'Non-empty name');
        assert.ok(typeof cat.slug === 'string' && /^[a-z0-9-]+$/.test(cat.slug), 'URL-safe slug');
        assert.equal(cat.publicUrl, `/categories/${cat.slug}`, 'publicUrl must match /categories/:slug format');

        // Status & Public Metrics
        assert.equal(cat.status, 'PUBLISHED', 'Publication status must be PUBLISHED');
        assert.ok(typeof cat.marketCount === 'number' && cat.marketCount > 0, 'marketCount > 0');
        assert.equal(cat.marketCount, cat.activeMarketCount, 'activeMarketCount alias match');

        // Private/sensitive leakage check
        const anyCat = cat as any;
        assert.equal(anyCat.secretKey, undefined, 'No secret leakage');
        assert.equal(anyCat.biddingWallet, undefined, 'No wallet concept');
        assert.equal(anyCat.adminNotes, undefined, 'No admin notes exposed');
      }
    });

    it('should sort published categories deterministically (marketCount desc, then name asc)', async () => {
      const categories = await categoryService.getPublishedCategories();
      for (let i = 0; i < categories.length - 1; i++) {
        const curr = categories[i];
        const next = categories[i + 1];

        if (curr.activeMarketCount === next.activeMarketCount) {
          assert.ok(
            curr.name.localeCompare(next.name) <= 0,
            `Expected alphabetical order for tied count: ${curr.name} <= ${next.name}`
          );
        } else {
          assert.ok(
            curr.activeMarketCount > next.activeMarketCount,
            `Expected marketCount desc: ${curr.activeMarketCount} > ${next.activeMarketCount}`
          );
        }
      }
    });
  });

  // -------------------------------------------------------------------------
  // 2. Category Resolution & Routing Contracts
  // -------------------------------------------------------------------------
  describe('2. Category Page Slug Resolution (/categories/[category])', () => {
    it('should resolve canonical published category slugs (/categories/interior-designers, /categories/restaurants)', async () => {
      const interior = await categoryService.getPublishedCategoryBySlug('interior-designers');
      assert.ok(interior, 'Interior Designers must resolve');
      assert.equal(interior.name, 'Interior Designers');
      assert.equal(interior.publicUrl, '/categories/interior-designers');

      const restaurants = await categoryService.getPublishedCategoryBySlug('restaurants');
      assert.ok(restaurants, 'Restaurants must resolve');
      assert.equal(restaurants.name, 'Restaurants');
      assert.equal(restaurants.publicUrl, '/categories/restaurants');
    });

    it('should resolve known category aliases to canonical published category', async () => {
      const dining = await categoryService.getPublishedCategoryBySlug('dining');
      assert.ok(dining, 'Alias "dining" must resolve to canonical Restaurants');
      assert.equal(dining.slug, 'restaurants');

      const homeInterior = await categoryService.getPublishedCategoryBySlug('home interior');
      assert.ok(homeInterior, 'Alias "home interior" must resolve to canonical Interior Designers');
      assert.equal(homeInterior.slug, 'interior-designers');
    });

    it('should return null for non-existent or unlisted categories', async () => {
      const unknown = await categoryService.getPublishedCategoryBySlug('plumbers');
      assert.equal(unknown, null, 'Unlisted category Plumbers must return null');

      const gibberish = await categoryService.getPublishedCategoryBySlug('invalid-cat-xyz');
      assert.equal(gibberish, null, 'Gibberish category must return null');
    });
  });

  // -------------------------------------------------------------------------
  // 3. Dynamic Category → Market & Location Derivation (Section 63 Invariant)
  // -------------------------------------------------------------------------
  describe('3. Dynamic Category → Market & Location Behavior', () => {
    it('should strictly derive locations on a category page from published markets in that category', async () => {
      const markets = await marketService.getPublishedMarketsByCategory('interior-designers');
      assert.ok(markets.data.length >= 3, 'Interior Designers has at least 3 seed markets (Jaipur, Delhi, Mumbai)');

      // Verify unique locations
      const cities = Array.from(new Set(markets.data.map((m) => m.cityName)));
      assert.ok(cities.includes('Jaipur'));
      assert.ok(cities.includes('Delhi'));
      assert.ok(cities.includes('Mumbai'));
      assert.equal(new Set(cities).size, cities.length, 'No duplicate cities');
    });

    it('should dynamically reflect newly published markets on Category Page without code change', async () => {
      // 1. Initial market count for Interior Designers
      const initialMarkets = await marketService.getPublishedMarketsByCategory('interior-designers');
      const initialCount = initialMarkets.data.length;

      // 2. Publish Hisar x Interior Designers market dynamically
      createMarket({
        id: 'mkt-hisar-interior-test-suite',
        cityId: 'city-hisar',
        categoryId: 'cat-interior-designers',
        slug: 'hisar/interior-designers',
        status: 'PUBLISHED',
        publicationStatus: 'PUBLISHED',
        indexabilityStatus: 'INDEXABLE',
        contentStatus: 'READY',
        totalBusinesses: 4,
        activePositions: 2,
        topQualifyingAmountMinor: 1400000,
      });

      // 3. Re-query market service for Interior Designers
      const updatedMarkets = await marketService.getPublishedMarketsByCategory('interior-designers');
      assert.equal(
        updatedMarkets.data.length,
        initialCount + 1,
        'Interior Designers market count must automatically increase by 1'
      );

      const hasHisar = updatedMarkets.data.some((m) => m.citySlug === 'hisar');
      assert.ok(hasHisar, 'Newly published Hisar market must be returned dynamically');

      // 4. Verify categoryService automatically reflects updated market count
      const updatedCategory = await categoryService.getPublishedCategoryBySlug('interior-designers');
      assert.ok(updatedCategory);
      assert.equal(
        updatedCategory.activeMarketCount,
        initialCount + 1,
        'activeMarketCount must reflect the newly published market'
      );
    });

    it('should make an emerging category dynamically available when published with a market', async () => {
      // 1. Create a category
      const archCategory = createCategory({
        id: 'cat-architects-test-suite',
        name: 'Commercial Architects',
        slug: 'commercial-architects',
        description: 'Architectural planning and structural design',
        status: 'ACTIVE',
      });

      // 2. Publish Mumbai x Commercial Architects market
      createMarket({
        id: 'mkt-mumbai-architects-test',
        cityId: 'city-mumbai',
        categoryId: archCategory.id,
        slug: 'mumbai/commercial-architects',
        status: 'PUBLISHED',
        publicationStatus: 'PUBLISHED',
        indexabilityStatus: 'INDEXABLE',
        contentStatus: 'READY',
        totalBusinesses: 6,
        activePositions: 3,
        topQualifyingAmountMinor: 2200000,
      });

      // 3. Query categoryService - Commercial Architects should now resolve as a published category!
      const arch = await categoryService.getPublishedCategoryBySlug('commercial-architects');
      assert.ok(arch, 'Commercial Architects must now resolve as a published category');
      assert.equal(arch.name, 'Commercial Architects');
      assert.equal(arch.activeMarketCount, 1);
      assert.equal(arch.publicUrl, '/categories/commercial-architects');

      // 4. Commercial Architects must appear in published categories list
      const published = await categoryService.getPublishedCategories();
      assert.ok(published.some((c) => c.slug === 'commercial-architects'), 'Must appear in directory list');
    });
  });

  // -------------------------------------------------------------------------
  // 4. Category Search & Discovery Integration
  // -------------------------------------------------------------------------
  describe('4. Category Search & Unknown Category Discovery', () => {
    it('should find published categories by name query', async () => {
      const results = await categoryService.searchPublishedCategories('Interior');
      assert.ok(results.length >= 1);
      assert.equal(results[0].name, 'Interior Designers');
      assert.equal(results[0].found, true);
    });

    it('should return found: false with query for unknown categories to trigger discovery', async () => {
      const results = await categoryService.searchPublishedCategories('Plumbers');
      assert.ok(results.length >= 1);
      assert.equal(results[0].found, false);
      assert.equal(results[0].marketCount, 0);
    });

    it('should record and deduplicate discovery request for unlisted category', () => {
      resetDiscoveryStoreForTesting();

      const req1 = recordDiscoveryRequest({
        rawInput: 'Plumbers',
        requestType: 'CATEGORY',
        clientId: 'test-client-cat-1',
      });

      assert.ok(req1.id);
      assert.equal(req1.requestCount, 1);
      assert.equal(req1.requestType, 'CATEGORY');

      // Second request for same category
      const req2 = recordDiscoveryRequest({
        rawInput: 'plumbers',
        requestType: 'CATEGORY',
        clientId: 'test-client-cat-1',
      });

      assert.equal(req2.id, req1.id, 'Duplicate query must share identical discovery ID');
      assert.equal(req2.requestCount, 2, 'requestCount must increment to 2');

      const allCatRequests = getDiscoveryRequestsByType('CATEGORY');
      assert.equal(allCatRequests.length, 1, 'Zero duplicate records created');
    });
  });

  // -------------------------------------------------------------------------
  // 5. Related Categories
  // -------------------------------------------------------------------------
  describe('5. Related Categories Aggregation', () => {
    it('should return other published categories excluding current category', async () => {
      const related = await categoryService.getRelatedCategories('interior-designers', 4);
      assert.ok(!related.some((c) => c.slug === 'interior-designers'), 'Must exclude current category');
      assert.ok(related.length >= 1, 'Must return other published categories');
    });
  });

  // -------------------------------------------------------------------------
  // 6. Regression Protection: Six Market Pages, /markets & /locations
  // -------------------------------------------------------------------------
  describe('6. Regression Safeguards', () => {
    it('should ensure all six production seed markets remain published and valid', async () => {
      const seedSlugs = [
        'jaipur/interior-designers',
        'delhi/interior-designers',
        'mumbai/interior-designers',
        'jaipur/restaurants',
        'delhi/restaurants',
        'mumbai/restaurants',
      ];

      for (const slug of seedSlugs) {
        const market = await marketService.getPublishedMarketBySlug(slug);
        assert.ok(market, `Seed market ${slug} must resolve`);
        assert.equal(market.publicationStatus, 'PUBLISHED');
        assert.equal(market.publicUrl, `/${slug}`);
      }
    });

    it('should ensure /categories directory count remains accurate and non-zero', async () => {
      const count = await categoryService.getPublishedCategoryCount();
      assert.ok(count >= 2, `Expected at least 2 published categories, found ${count}`);
    });
  });
});
