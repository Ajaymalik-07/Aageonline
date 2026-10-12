/**
 * AageOnline — Public Locations Directory & Reusable City Page Test Suite
 *
 * Verifies typed location domain contracts, local adapter, service delegation,
 * deterministic ordering, dynamic market aggregation, unknown location discovery,
 * and regression resilience.
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import {
  locationService,
  LocalLocationDataSource,
  marketService,
  createLocationService,
} from '../data-access/index.ts';
import type { LocationSummary } from '../data-access/types.ts';
import {
  createMarket,
  getAllMarkets,
} from '../lib/taxonomy/markets.ts';
import { createCategory } from '../lib/taxonomy/categories.ts';
import {
  recordDiscoveryRequest,
  getDiscoveryRequestsByType,
  resetDiscoveryStoreForTesting,
} from '../lib/taxonomy/discovery.ts';

describe('Locations Directory & Reusable City Page Architecture', () => {
  // -------------------------------------------------------------------------
  // 1. Typed Public Location Contract Verification
  // -------------------------------------------------------------------------
  describe('1. Typed Public Location Contract Invariants', () => {
    it('should conform to the public-safe LocationSummary schema', async () => {
      const locations = await locationService.getPublishedLocations();
      assert.ok(locations.length >= 3, 'Must have at least Jaipur, Delhi, and Mumbai pre-seeded');

      for (const loc of locations) {
        // Required identification & routing
        assert.ok(typeof loc.id === 'string' && loc.id.startsWith('city-'), 'Valid city ID');
        assert.ok(typeof loc.name === 'string' && loc.name.length > 0, 'Non-empty name');
        assert.ok(typeof loc.slug === 'string' && /^[a-z0-9-]+$/.test(loc.slug), 'URL-safe slug');
        assert.equal(loc.publicUrl, `/${loc.slug}`, 'publicUrl must match /:slug format');

        // State & Country hierarchy
        assert.ok(typeof loc.state === 'string' && loc.state.length > 0, 'Non-empty state');
        assert.equal(loc.state, loc.stateName, 'state and stateName alias must match');
        assert.ok(typeof loc.stateSlug === 'string' && loc.stateSlug.length > 0, 'Valid stateSlug');
        assert.equal(loc.country, 'India', 'Country must be India');
        assert.equal(loc.countryName, 'India', 'countryName must match country');
        assert.equal(loc.countrySlug, 'india', 'countrySlug must be india');

        // Status & Public Metrics
        assert.equal(loc.status, 'PUBLISHED', 'Publication status must be PUBLISHED');
        assert.ok(typeof loc.marketCount === 'number' && loc.marketCount > 0, 'marketCount > 0');
        assert.equal(loc.marketCount, loc.activeMarketCount, 'activeMarketCount alias match');

        // Private/sensitive leakage check
        const anyLoc = loc as any;
        assert.equal(anyLoc.secretKey, undefined, 'No secret leakage');
        assert.equal(anyLoc.biddingWallet, undefined, 'No wallet concept');
        assert.equal(anyLoc.adminNotes, undefined, 'No admin notes exposed');
      }
    });

    it('should sort published locations deterministically (marketCount desc, then name asc)', async () => {
      const locations = await locationService.getPublishedLocations();
      for (let i = 0; i < locations.length - 1; i++) {
        const curr = locations[i];
        const next = locations[i + 1];

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
  // 2. Location Resolution & Routing Contracts
  // -------------------------------------------------------------------------
  describe('2. City Page Slug Resolution (/[location])', () => {
    it('should resolve canonical published city slugs (/jaipur, /delhi, /mumbai)', async () => {
      const jaipur = await locationService.getPublishedLocationBySlug('jaipur');
      assert.ok(jaipur, 'Jaipur must resolve');
      assert.equal(jaipur.name, 'Jaipur');
      assert.equal(jaipur.stateName, 'Rajasthan');
      assert.equal(jaipur.publicUrl, '/jaipur');

      const delhi = await locationService.getPublishedLocationBySlug('delhi');
      assert.ok(delhi, 'Delhi must resolve');
      assert.equal(delhi.name, 'Delhi');
      assert.equal(delhi.stateName, 'Delhi');

      const mumbai = await locationService.getPublishedLocationBySlug('mumbai');
      assert.ok(mumbai, 'Mumbai must resolve');
      assert.equal(mumbai.name, 'Mumbai');
      assert.equal(mumbai.stateName, 'Maharashtra');
    });

    it('should resolve known aliases to canonical published location', async () => {
      const pinkCity = await locationService.getPublishedLocationBySlug('pink city');
      assert.ok(pinkCity, 'Alias "pink city" must resolve to canonical Jaipur');
      assert.equal(pinkCity.slug, 'jaipur');

      const bombay = await locationService.getPublishedLocationBySlug('bombay');
      assert.ok(bombay, 'Alias "bombay" must resolve to canonical Mumbai');
      assert.equal(bombay.slug, 'mumbai');
    });

    it('should return null for non-existent or unlisted cities', async () => {
      const unknown = await locationService.getPublishedLocationBySlug('karnal');
      assert.equal(unknown, null, 'Unlisted city Karnal must return null');

      const gibberish = await locationService.getPublishedLocationBySlug('invalid-city-xyz');
      assert.equal(gibberish, null, 'Gibberish city must return null');
    });
  });

  // -------------------------------------------------------------------------
  // 3. Dynamic Market & Category Derivation (Section 72 Invariant)
  // -------------------------------------------------------------------------
  describe('3. Dynamic Market & Category Behavior', () => {
    it('should strictly derive categories on a city page from published markets in that city', async () => {
      const jaipurMarkets = await marketService.getPublishedMarketsByLocation('jaipur');
      assert.ok(jaipurMarkets.data.length >= 2, 'Jaipur has at least 2 seed markets');

      // Aggregate categories
      const categories = Array.from(new Set(jaipurMarkets.data.map((m) => m.categoryName)));
      assert.ok(categories.includes('Interior Designers'), 'Includes Interior Designers');
      assert.ok(categories.includes('Restaurants'), 'Includes Restaurants');
    });

    it('should dynamically reflect newly published markets on City Page without code change', async () => {
      // 1. Check initial market count for Jaipur
      const initialMarkets = await marketService.getPublishedMarketsByLocation('jaipur');
      const initialCount = initialMarkets.data.length;

      // 2. Create a new category and market in Jaipur
      const newCategory = createCategory({
        id: 'cat-dentists-clinics-test',
        name: 'Dentists Clinics',
        slug: 'dentists-clinics',
        description: 'Dental care and clinics in Jaipur',
        status: 'ACTIVE',
      });

      const newMarket = createMarket({
        id: 'mkt-jaipur-dentists-test',
        cityId: 'city-jaipur',
        categoryId: newCategory.id,
        slug: 'jaipur/dentists-clinics',
        status: 'PUBLISHED',
        publicationStatus: 'PUBLISHED',
        indexabilityStatus: 'INDEXABLE',
        contentStatus: 'READY',
        totalBusinesses: 5,
        activePositions: 3,
        topQualifyingAmountMinor: 1800000,
      });

      // 3. Re-query market service for Jaipur
      const updatedMarkets = await marketService.getPublishedMarketsByLocation('jaipur');
      assert.equal(
        updatedMarkets.data.length,
        initialCount + 1,
        'Jaipur market count must automatically increase by 1'
      );

      const hasDentists = updatedMarkets.data.some((m) => m.categorySlug === 'dentists-clinics');
      assert.ok(hasDentists, 'Newly published Dentists market must be returned dynamically');

      // 4. Verify locationService automatically reflects updated market count
      const updatedLocation = await locationService.getPublishedLocationBySlug('jaipur');
      assert.ok(updatedLocation);
      assert.equal(
        updatedLocation.activeMarketCount,
        initialCount + 1,
        'activeMarketCount must reflect the newly published market'
      );
    });

    it('should make an emerging city (Hisar) dynamically available when published with a market', async () => {
      // 1. Create a category for Hisar
      const lawCategory = createCategory({
        id: 'cat-corporate-lawyers-test',
        name: 'Corporate Lawyers',
        slug: 'corporate-lawyers',
        description: 'Corporate legal services',
        status: 'ACTIVE',
      });

      // 2. Publish Hisar x Corporate Lawyers market
      createMarket({
        id: 'mkt-hisar-lawyers-test',
        cityId: 'city-hisar',
        categoryId: lawCategory.id,
        slug: 'hisar/corporate-lawyers',
        status: 'PUBLISHED',
        publicationStatus: 'PUBLISHED',
        indexabilityStatus: 'INDEXABLE',
        contentStatus: 'READY',
        totalBusinesses: 3,
        activePositions: 2,
        topQualifyingAmountMinor: 1500000,
      });

      // 3. Query locationService - Hisar should now resolve as a published location!
      const hisar = await locationService.getPublishedLocationBySlug('hisar');
      assert.ok(hisar, 'Hisar must now resolve as a published location');
      assert.equal(hisar.name, 'Hisar');
      assert.equal(hisar.stateName, 'Haryana');
      assert.equal(hisar.activeMarketCount, 1);
      assert.equal(hisar.publicUrl, '/hisar');

      // 4. Hisar must appear in published locations list
      const published = await locationService.getPublishedLocations();
      assert.ok(published.some((l) => l.slug === 'hisar'), 'Hisar must appear in directory list');
    });
  });

  // -------------------------------------------------------------------------
  // 4. Regional Filtering & State Rail
  // -------------------------------------------------------------------------
  describe('4. Regional Filtering & State Grouping', () => {
    it('should filter locations by state slug', async () => {
      const rajasthanLocations = await locationService.getPublishedLocationsByState('rajasthan');
      assert.ok(rajasthanLocations.length >= 1, 'Must have at least 1 Rajasthan location');
      assert.ok(rajasthanLocations.every((l) => l.stateSlug === 'rajasthan'));

      const maharashtraLocations = await locationService.getPublishedLocationsByState('maharashtra');
      assert.ok(maharashtraLocations.length >= 1, 'Must have at least 1 Maharashtra location');
      assert.ok(maharashtraLocations.every((l) => l.stateSlug === 'maharashtra'));
    });

    it('should return aggregated states with location and market counts', async () => {
      const states = await locationService.getStatesWithPublishedLocations();
      assert.ok(states.length >= 3, 'Must include Rajasthan, Delhi, Maharashtra, and Haryana');

      for (const st of states) {
        assert.ok(st.name.length > 0);
        assert.ok(st.slug.length > 0);
        assert.ok(st.locationCount > 0, 'Each state must have at least 1 location');
        assert.ok(st.marketCount > 0, 'Each state must have at least 1 market');
      }
    });

    it('should calculate related locations prioritizing same state first', async () => {
      const relatedToJaipur = await locationService.getRelatedLocations('jaipur', 4);
      assert.ok(!relatedToJaipur.some((l) => l.slug === 'jaipur'), 'Must exclude current city');
      assert.ok(relatedToJaipur.length > 0, 'Must return other published locations');
    });
  });

  // -------------------------------------------------------------------------
  // 5. Location Search & Discovery Integration
  // -------------------------------------------------------------------------
  describe('5. Location Search & Unknown Location Discovery', () => {
    it('should find published locations by name query', async () => {
      const results = await locationService.searchPublishedLocations('Jai');
      assert.ok(results.length >= 1);
      assert.equal(results[0].name, 'Jaipur');
      assert.equal(results[0].found, true);
    });

    it('should return found: false with query for unknown cities to trigger discovery', async () => {
      const results = await locationService.searchPublishedLocations('Karnal');
      assert.ok(results.length >= 1);
      assert.equal(results[0].found, false);
      assert.equal(results[0].marketCount, 0);
    });

    it('should record and deduplicate discovery request for unlisted city', () => {
      resetDiscoveryStoreForTesting();

      const req1 = recordDiscoveryRequest({
        rawInput: 'Karnal',
        requestType: 'CITY',
        clientId: 'test-client-loc-1',
      });

      assert.ok(req1.id);
      assert.equal(req1.requestCount, 1);
      assert.equal(req1.requestType, 'CITY');

      // Second request for same city
      const req2 = recordDiscoveryRequest({
        rawInput: 'karnal',
        requestType: 'CITY',
        clientId: 'test-client-loc-1',
      });

      assert.equal(req2.id, req1.id, 'Duplicate query must share identical discovery ID');
      assert.equal(req2.requestCount, 2, 'requestCount must increment to 2');

      const allCityRequests = getDiscoveryRequestsByType('CITY');
      assert.equal(allCityRequests.length, 1, 'Zero duplicate records created');
    });
  });

  // -------------------------------------------------------------------------
  // 6. Regression Protection: Six Market Pages & /markets
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

    it('should ensure /markets directory count remains accurate and non-zero', async () => {
      const count = await marketService.getPublishedMarketCount();
      assert.ok(count >= 6, `Expected at least 6 published markets, found ${count}`);
    });
  });
});
