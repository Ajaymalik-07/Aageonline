/**
 * AageOnline — Dynamic Taxonomy, Discovery & Market Lifecycle Test Suite
 * Comprehensive verification for canonical taxonomy, slug normalization,
 * demand tracking, market resolution, administrative governance, and Scenarios A-D.
 */

import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert';

import {
  getAllCountries,
  getCountryById,
  getAllStates,
  getStateById,
  getAllCities,
  getCityById,
  getCityBySlug,
  createState,
  createCity,
} from '../lib/taxonomy/locations.ts';

import {
  getAllCategories,
  getCategoryById,
  getCategoryBySlug,
  createCategory,
} from '../lib/taxonomy/categories.ts';

import {
  getAllMarkets,
  getMarketById,
  getMarketBySlug,
  getMarketByCityAndCategory,
  createMarket,
  updateMarket,
} from '../lib/taxonomy/markets.ts';

import {
  generateSlug,
  canonicalizeText,
  findMatchingCity,
  findMatchingCategory,
} from '../lib/taxonomy/normalization.ts';

import {
  recordDiscoveryRequest,
  getAllDiscoveryRequests,
  getDiscoveryRequestById,
  updateDiscoveryStatus,
  checkRateLimit,
  resetDiscoveryStoreForTesting,
} from '../lib/taxonomy/discovery.ts';

import {
  resolveMarket,
} from '../lib/taxonomy/resolver.ts';

import {
  adminCreateCategory,
  adminMapCategoryDiscovery,
  adminCreateCity,
  adminCreateMarket,
  adminPublishMarket,
  adminSetMarketIndexability,
  adminArchiveMarket,
  assertAdminAuthorized,
} from '../lib/taxonomy/admin-service.ts';
import type { AdminActor } from '../lib/taxonomy/admin-service.ts';

import {
  getAuditLogs,
  resetAuditLogsForTesting,
} from '../lib/taxonomy/audit.ts';

import { getMarketPageData } from '../data/markets/index.ts';

describe('Dynamic Taxonomy & Discovery System', () => {
  beforeEach(() => {
    resetDiscoveryStoreForTesting();
    resetAuditLogsForTesting();
  });

  describe('1. Canonical Location & Category Taxonomy', () => {
    it('should pre-seed India and canonical states (Rajasthan, Delhi, Maharashtra, Haryana)', () => {
      const countries = getAllCountries();
      assert.strictEqual(countries.length, 1);
      assert.strictEqual(countries[0].slug, 'india');
      assert.strictEqual(countries[0].code, 'IN');

      const states = getAllStates();
      assert.ok(states.length >= 4);
      const codes = states.map((s) => s.code);
      assert.ok(codes.includes('RJ'));
      assert.ok(codes.includes('DL'));
      assert.ok(codes.includes('MH'));
      assert.ok(codes.includes('HR'));
    });

    it('should enforce parent country existence when creating a state', () => {
      assert.throws(() => {
        createState({
          id: 'state-invalid',
          countryId: 'country-nonexistent',
          name: 'Invalid Region',
          slug: 'invalid-region',
          code: 'IR',
          status: 'ACTIVE',
        });
      }, /Country with ID "country-nonexistent" does not exist/);
    });

    it('should enforce state and country hierarchy when creating a city', () => {
      assert.throws(() => {
        createCity({
          id: 'city-invalid',
          countryId: 'country-india',
          stateId: 'state-nonexistent',
          name: 'Unknown City',
          slug: 'unknown-city',
          status: 'ACTIVE',
        });
      }, /State with ID "state-nonexistent" does not exist/);
    });

    it('should prevent duplicate city creation within the same state', () => {
      assert.throws(() => {
        createCity({
          id: 'city-jaipur-duplicate',
          countryId: 'country-india',
          stateId: 'state-rajasthan',
          name: 'Jaipur',
          slug: 'jaipur-2',
          status: 'ACTIVE',
        });
      }, /already exists in State/);
    });

    it('should prevent duplicate category names and slugs', () => {
      assert.throws(() => {
        createCategory({
          id: 'cat-restaurants-duplicate',
          name: 'Restaurants',
          slug: 'restaurants-alt',
          status: 'ACTIVE',
        });
      }, /Category with name "Restaurants" already exists/);
    });
  });

  describe('2. Normalization & Slug Generation', () => {
    it('should generate clean, deterministic, URL-safe slugs', () => {
      assert.strictEqual(generateSlug('Interior Designers'), 'interior-designers');
      assert.strictEqual(generateSlug('Food & Dining!'), 'food-and-dining');
      assert.strictEqual(generateSlug('New Delhi, NCR'), 'new-delhi-ncr');
      assert.strictEqual(generateSlug('  Hissar (Haryana)  '), 'hissar-haryana');
    });

    it('should resolve spelling and alias variations to canonical city', () => {
      const city1 = findMatchingCity('Hisar');
      const city2 = findMatchingCity('Hissar');
      const city3 = findMatchingCity('Hisar, Haryana');
      const city4 = findMatchingCity('125001');

      assert.ok(city1);
      assert.strictEqual(city1.slug, 'hisar');
      assert.strictEqual(city2?.slug, 'hisar');
      assert.strictEqual(city3?.slug, 'hisar');
      assert.strictEqual(city4?.slug, 'hisar');
    });

    it('should resolve category variations to canonical category', () => {
      const cat1 = findMatchingCategory('Interior Designers');
      const cat2 = findMatchingCategory('interior designer');
      const cat3 = findMatchingCategory('interior designing');
      const cat4 = findMatchingCategory('interior design services');

      assert.ok(cat1);
      assert.strictEqual(cat1.slug, 'interior-designers');
      assert.strictEqual(cat2?.slug, 'interior-designers');
      assert.strictEqual(cat3?.slug, 'interior-designers');
      assert.strictEqual(cat4?.slug, 'interior-designers');
    });
  });

  describe('3. Market Registry & Unique Invariants', () => {
    it('should enforce cityId + categoryId composite uniqueness', () => {
      assert.throws(() => {
        createMarket({
          id: 'mkt-duplicate-pair',
          cityId: 'city-jaipur',
          categoryId: 'cat-interior-designers',
          slug: 'jaipur/interior-designers',
          status: 'DRAFT',
          publicationStatus: 'DRAFT',
          indexabilityStatus: 'NOINDEX',
          contentStatus: 'MISSING',
          totalBusinesses: 0,
          activePositions: 0,
          topQualifyingAmountMinor: 100000,
        });
      }, /already exists with ID "mkt-jaipur-interior-designers"/);
    });

    it('should require valid existing city and category to create a market', () => {
      assert.throws(() => {
        createMarket({
          id: 'mkt-bad-city',
          cityId: 'city-nonexistent',
          categoryId: 'cat-restaurants',
          slug: 'bad/restaurants',
          status: 'DRAFT',
          publicationStatus: 'DRAFT',
          indexabilityStatus: 'NOINDEX',
          contentStatus: 'MISSING',
          totalBusinesses: 0,
          activePositions: 0,
          topQualifyingAmountMinor: 100000,
        });
      }, /City "city-nonexistent" does not exist/);
    });
  });

  describe('4. Discovery Request Tracking & Deduplication', () => {
    it('should create discovery record on first request with requestCount = 1', () => {
      const req = recordDiscoveryRequest({
        requestType: 'CATEGORY',
        rawInput: 'Pet Groomers',
      });

      assert.strictEqual(req.requestCount, 1);
      assert.strictEqual(req.status, 'NEEDS_REVIEW');
      assert.strictEqual(req.normalizedValue, 'pet groomers');
    });

    it('should increment requestCount and update timestamp on repeat requests without duplicating', () => {
      const first = recordDiscoveryRequest({
        requestType: 'CATEGORY',
        rawInput: 'Pet Groomers',
      });

      const second = recordDiscoveryRequest({
        requestType: 'CATEGORY',
        rawInput: 'pet groomers',
      });

      const third = recordDiscoveryRequest({
        requestType: 'CATEGORY',
        rawInput: ' Pet Groomers  ',
      });

      assert.strictEqual(first.id, second.id);
      assert.strictEqual(second.id, third.id);
      assert.strictEqual(third.requestCount, 3);

      const all = getAllDiscoveryRequests();
      assert.strictEqual(all.length, 1);
    });

    it('should enforce rate limits on discovery requests per client', () => {
      const clientId = 'abusive-bot-ip';
      for (let i = 0; i < 30; i++) {
        checkRateLimit(clientId);
      }
      assert.throws(() => {
        checkRateLimit(clientId);
      }, /Rate limit exceeded/);
    });
  });

  describe('5. Administrative Governance & Security Invariants', () => {
    const adminUser: AdminActor = {
      id: 'admin-1',
      name: 'Senior Taxonomy Manager',
      role: 'TAXONOMY_ADMIN',
    };

    const regularUser: AdminActor = {
      id: 'user-1',
      name: 'Public User',
      role: 'USER',
    };

    it('should reject non-admin actors from executing administrative mutations', () => {
      assert.throws(() => {
        assertAdminAuthorized(regularUser);
      }, /Unauthorized: Actor "Public User" \(USER\) does not have administrative permissions/);

      assert.throws(() => {
        adminCreateCategory(regularUser, { name: 'Unauthorized Category' });
      }, /Unauthorized/);
    });

    it('should allow authorized admin to create category and log to audit trail', () => {
      const newCat = adminCreateCategory(adminUser, {
        name: 'Solar Panel Installers',
        description: 'Rooftop solar and commercial renewable energy specialists.',
      });

      assert.ok(newCat);
      assert.strictEqual(newCat.slug, 'solar-panel-installers');

      const logs = getAuditLogs({ entityType: 'CATEGORY', entityId: newCat.id });
      assert.strictEqual(logs.length, 1);
      assert.strictEqual(logs[0].action, 'CATEGORY_CREATED');
      assert.strictEqual(logs[0].actor, 'Senior Taxonomy Manager');
    });

    it('should transition market publication and indexability states with audit logging', () => {
      const newMkt = adminCreateMarket(adminUser, {
        cityId: 'city-jaipur',
        categoryId: 'cat-dentists',
        publicationStatus: 'DRAFT',
        indexabilityStatus: 'NOINDEX',
      });

      assert.strictEqual(newMkt.publicationStatus, 'DRAFT');
      assert.strictEqual(newMkt.indexabilityStatus, 'NOINDEX');

      // Publish with noindex first
      const publishedNoindex = adminPublishMarket(adminUser, newMkt.id, { indexable: false });
      assert.strictEqual(publishedNoindex.publicationStatus, 'PUBLISHED');
      assert.strictEqual(publishedNoindex.indexabilityStatus, 'NOINDEX');

      // Set to indexable after content review
      const publishedIndexable = adminSetMarketIndexability(adminUser, newMkt.id, true);
      assert.strictEqual(publishedIndexable.indexabilityStatus, 'INDEXABLE');

      // Archive market
      const archived = adminArchiveMarket(adminUser, newMkt.id, 'Seasonal market closure');
      assert.strictEqual(archived.publicationStatus, 'ARCHIVED');
      assert.strictEqual(archived.indexabilityStatus, 'NOINDEX');
    });
  });

  describe('6. Exact User Scenarios (A, B, C, D)', () => {
    it('Scenario A: User requests Jaipur + Interior Designers -> Resolves existing published page', () => {
      const res = resolveMarket('jaipur', 'interior-designers');

      assert.strictEqual(res.found, true);
      assert.strictEqual(res.isPublished, true);
      assert.strictEqual(res.isIndexable, true);
      assert.strictEqual(res.contentReady, true);
      assert.strictEqual(res.market?.slug, 'jaipur/interior-designers');
      assert.strictEqual(res.city?.name, 'Jaipur');
      assert.strictEqual(res.category?.name, 'Interior Designers');

      // Data layer returns rich production content
      const pageData = getMarketPageData('jaipur', 'interior-designers');
      assert.ok(pageData);
      assert.strictEqual(pageData.market.slug, 'jaipur/interior-designers');
      assert.strictEqual(pageData.rankings.length, 8);
    });

    it('Scenario B: User requests Hisar + Dentists -> Discovers market, remains non-indexable draft until approved', () => {
      // First ensure market does not yet exist
      const existing = getMarketByCityAndCategory('city-hisar', 'cat-dentists');
      assert.strictEqual(existing, undefined);

      const res = resolveMarket('hisar', 'dentists', { autoDiscover: true });

      assert.strictEqual(res.found, true);
      assert.strictEqual(res.isPublished, false); // DRAFT
      assert.strictEqual(res.isIndexable, false); // NOINDEX
      assert.strictEqual(res.contentReady, false); // MISSING
      assert.strictEqual(res.discoveryCreated, true);

      // Verify market created in DRAFT
      const market = getMarketBySlug('hisar/dentists');
      assert.ok(market);
      assert.strictEqual(market.publicationStatus, 'DRAFT');
      assert.strictEqual(market.indexabilityStatus, 'NOINDEX');

      // Admin sees discovery demand
      const disc = getAllDiscoveryRequests().find((d) => d.requestType === 'MARKET');
      assert.ok(disc);
      assert.strictEqual(disc.status, 'NEEDS_REVIEW');
    });

    it('Scenario C: User requests Hisar + Restaurants -> Reuses existing Hisar & Restaurants, creates market in DRAFT', () => {
      const res = resolveMarket('Hisar, Haryana', 'food & dining', { autoDiscover: true });

      assert.strictEqual(res.found, true);
      assert.strictEqual(res.city?.slug, 'hisar');
      assert.strictEqual(res.category?.slug, 'restaurants');
      assert.strictEqual(res.market?.slug, 'hisar/restaurants');
      assert.strictEqual(res.isPublished, false); // DRAFT
      assert.strictEqual(res.isIndexable, false); // NOINDEX
    });

    it('Scenario D: User repeatedly requests unlisted entity -> Increments requestCount, zero duplicate records', () => {
      // Repeatedly resolve unknown combination
      for (let i = 0; i < 5; i++) {
        resolveMarket('Jodhpur', 'Architects', { autoDiscover: true });
      }

      const cityRequests = getAllDiscoveryRequests().filter((r) => r.requestType === 'CITY');
      assert.strictEqual(cityRequests.length, 1);
      assert.strictEqual(cityRequests[0].rawInput, 'Jodhpur');
      assert.strictEqual(cityRequests[0].requestCount, 5);

      const catRequests = getAllDiscoveryRequests().filter((r) => r.requestType === 'CATEGORY');
      assert.strictEqual(catRequests.length, 1);
      assert.strictEqual(catRequests[0].rawInput, 'Architects');
      assert.strictEqual(catRequests[0].requestCount, 5);
    });
  });

  describe('7. SEO & Route Indexability Safeguards', () => {
    it('should never expose DRAFT markets as indexable', () => {
      const draft = resolveMarket('hisar', 'dentists', { autoDiscover: false });
      assert.strictEqual(draft.isIndexable, false);
      assert.strictEqual(draft.isPublished, false);
    });

    it('should keep all six production markets published and indexable', () => {
      const sixSlugs = [
        ['jaipur', 'interior-designers'],
        ['delhi', 'interior-designers'],
        ['mumbai', 'interior-designers'],
        ['jaipur', 'restaurants'],
        ['delhi', 'restaurants'],
        ['mumbai', 'restaurants'],
      ];

      for (const [loc, cat] of sixSlugs) {
        const res = resolveMarket(loc, cat);
        assert.strictEqual(res.found, true, `${loc}/${cat} must be found`);
        assert.strictEqual(res.isPublished, true, `${loc}/${cat} must be published`);
        assert.strictEqual(res.isIndexable, true, `${loc}/${cat} must be indexable`);
      }
    });
  });
});
