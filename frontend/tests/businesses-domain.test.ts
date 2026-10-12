import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert/strict';

import {
  businessService,
  LocalBusinessDataSource,
} from '../data-access/businesses/index.ts';
import {
  getAllBusinesses,
  getBusinessById,
  getBusinessBySlug,
  createBusiness,
  addBusinessCategory,
  addBusinessLocation,
  addMarketParticipation,
  resetBusinessStoreForTesting,
} from '../lib/taxonomy/businesses.ts';
import {
  recordDiscoveryRequest,
  getAllDiscoveryRequests,
  resetDiscoveryStoreForTesting,
} from '../lib/taxonomy/discovery.ts';
import type { BusinessEntity } from '../types/business.ts';

describe('Business Entity + Reusable Business Profile + Market Participation Architecture', () => {
  beforeEach(() => {
    resetBusinessStoreForTesting();
    resetDiscoveryStoreForTesting();
  });

  describe('1. Business Entity & Canonical Identity Invariants', () => {
    it('should establish independent business identity with canonical slug', async () => {
      const biz = await businessService.getPublishedBusinessBySlug('royal-interiors-jaipur');
      assert.ok(biz, 'Royal Interiors should resolve by canonical slug');
      assert.strictEqual(biz.id, 'biz-royal-interiors');
      assert.strictEqual(biz.name, 'Royal Interiors Studio');
      assert.strictEqual(biz.slug, 'royal-interiors-jaipur');
      assert.strictEqual(biz.publicUrl, '/businesses/royal-interiors-jaipur');
      assert.strictEqual(biz.publicationStatus, 'PUBLISHED');
      assert.strictEqual(biz.verificationStatus, 'VERIFIED');
    });

    it('should enforce that business slug identifies business, not ranking position', async () => {
      const biz = await businessService.getPublishedBusinessBySlug('royal-interiors-jaipur');
      assert.ok(biz);
      // Slug should not contain position numbers like "royal-interiors-3"
      assert.ok(!biz.slug.includes('-3'), 'Slug must be immutable and independent of rank');
      assert.ok(!biz.publicUrl.includes('/1-'), 'URL must not embed ranking number');
    });

    it('should return null for unknown or non-existent business slugs', async () => {
      const result = await businessService.getPublishedBusinessBySlug('non-existent-business-xyz');
      assert.strictEqual(result, null, 'Unlisted business slug must return null (404 boundary)');
    });
  });

  describe('2. Business Directory & Publication Invariants', () => {
    it('should list only PUBLISHED businesses and exclude DRAFT or ARCHIVED businesses', async () => {
      const res = await businessService.getPublishedBusinesses();
      assert.ok(res.data.length > 0, 'Should return published businesses');

      const draftBiz = res.data.find((b) => b.slug === 'draft-design-agency');
      assert.strictEqual(draftBiz, undefined, 'DRAFT business must never appear in public directory');

      for (const biz of res.data) {
        assert.strictEqual(biz.publicationStatus, 'PUBLISHED');
      }
    });

    it('should paginate business directory results cleanly', async () => {
      const res = await businessService.getPublishedBusinesses({ page: 1, pageSize: 2 });
      assert.strictEqual(res.data.length, 2, 'PageSize 2 should yield 2 items');
      assert.strictEqual(res.pagination.page, 1);
      assert.strictEqual(res.pagination.pageSize, 2);
      assert.ok(res.pagination.total >= 4, 'Total published businesses should be >= 4');
      assert.strictEqual(res.pagination.hasNextPage, true);
    });

    it('should filter businesses by category and location', async () => {
      const interiorBiz = await businessService.getPublishedBusinesses({
        categorySlug: 'interior-designers',
      });
      assert.ok(interiorBiz.data.length > 0);
      for (const b of interiorBiz.data) {
        assert.strictEqual(b.primaryCategory?.slug, 'interior-designers');
      }

      const delhiBiz = await businessService.getPublishedBusinesses({
        locationSlug: 'delhi',
      });
      assert.ok(delhiBiz.data.length > 0);
      for (const b of delhiBiz.data) {
        assert.strictEqual(b.primaryLocation?.slug, 'delhi');
      }
    });
  });

  describe('3. Market Participation Architecture & Ranking Separation', () => {
    it('should represent market participation as an explicit relationship (Business + Market)', async () => {
      const biz = await businessService.getPublishedBusinessBySlug('royal-interiors-jaipur');
      assert.ok(biz);
      assert.ok(biz.marketParticipations.length > 0, 'Business should have market participations');

      const participation = biz.marketParticipations[0];
      assert.strictEqual(participation.marketSlug, 'jaipur/interior-designers');
      assert.strictEqual(participation.marketUrl, '/jaipur/interior-designers');
      assert.strictEqual(participation.cityName, 'Jaipur');
      assert.strictEqual(participation.categoryName, 'Interior Designers');
      assert.strictEqual(participation.currentPosition, 3, 'Should reflect authoritative position in this market');
    });

    it('should prevent duplicate market participation for same business + market pair', () => {
      assert.throws(
        () => {
          addMarketParticipation({
            id: 'mp-duplicate-test',
            businessId: 'biz-royal-interiors',
            marketId: 'mkt-jaipur-interior-designers', // already exists
            status: 'ACTIVE',
            eligibilityStatus: 'ELIGIBLE',
            joinedAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          });
        },
        /already exists/,
        'Duplicate participation on composite (businessId, marketId) must throw error'
      );
    });

    it('should correctly render business without ranking (currentPosition = null)', async () => {
      // Create a business with participation but unranked (no paid position)
      const unrankedBizId = 'biz-unranked-firm';
      createBusiness({
        id: unrankedBizId,
        slug: 'unranked-interior-firm',
        name: 'Unranked Interior Firm',
        description: 'New participant in the Jaipur interior design market.',
        verificationStatus: 'VERIFIED',
        publicationStatus: 'PUBLISHED',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
      addBusinessCategory({ businessId: unrankedBizId, categoryId: 'cat-interior-designers', isPrimary: true });
      addBusinessLocation({ businessId: unrankedBizId, cityId: 'city-jaipur', isPrimary: true });
      addMarketParticipation({
        id: 'mp-unranked-jaipur',
        businessId: unrankedBizId,
        marketId: 'mkt-jaipur-interior-designers',
        status: 'ACTIVE',
        eligibilityStatus: 'ELIGIBLE',
        currentPosition: null, // explicitly unranked
        joinedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });

      const profile = await businessService.getPublishedBusinessBySlug('unranked-interior-firm');
      assert.ok(profile);
      assert.strictEqual(profile.marketParticipations.length, 1);
      assert.strictEqual(profile.marketParticipations[0].currentPosition, null);
      assert.strictEqual(profile.marketParticipations[0].participationStatus, 'ACTIVE');
    });
  });

  describe('4. Mandatory Dynamic Proofs (1, 2, 3, 4)', () => {
    it('Dynamic Proof 1: Multi-market expansion without frontend code modification', async () => {
      // Step 1: Initial state - Royal Interiors participates in Jaipur
      let profile = await businessService.getPublishedBusinessBySlug('royal-interiors-jaipur');
      assert.ok(profile);
      assert.strictEqual(profile.marketParticipations.length, 1);
      assert.strictEqual(profile.marketParticipations[0].cityName, 'Jaipur');

      // Step 2: Add participation in Delhi × Interior Designers via data layer
      addMarketParticipation({
        id: 'mp-royal-interiors-delhi',
        businessId: 'biz-royal-interiors',
        marketId: 'mkt-delhi-interior-designers',
        status: 'ACTIVE',
        eligibilityStatus: 'ELIGIBLE',
        currentPosition: 7,
        joinedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });

      // Step 3: Next render immediately reflects both markets
      profile = await businessService.getPublishedBusinessBySlug('royal-interiors-jaipur');
      assert.ok(profile);
      assert.strictEqual(profile.marketParticipations.length, 2);
      const cities = profile.marketParticipations.map((p) => p.cityName).sort();
      assert.deepStrictEqual(cities, ['Delhi', 'Jaipur']);

      // Step 4: Add participation in Mumbai × Interior Designers
      addMarketParticipation({
        id: 'mp-royal-interiors-mumbai',
        businessId: 'biz-royal-interiors',
        marketId: 'mkt-mumbai-interior-designers',
        status: 'ACTIVE',
        eligibilityStatus: 'ELIGIBLE',
        currentPosition: null, // participating without paid position
        joinedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });

      profile = await businessService.getPublishedBusinessBySlug('royal-interiors-jaipur');
      assert.ok(profile);
      assert.strictEqual(profile.marketParticipations.length, 3);
      const allCities = profile.marketParticipations.map((p) => p.cityName).sort();
      assert.deepStrictEqual(allCities, ['Delhi', 'Jaipur', 'Mumbai']);
    });

    it('Dynamic Proof 2: Multiple businesses participate in the same market independently', async () => {
      const bizA = await businessService.getPublishedBusinessBySlug('abc-interiors-jaipur');
      const bizB = await businessService.getPublishedBusinessBySlug('studio-xyz-jaipur');

      assert.ok(bizA);
      assert.ok(bizB);

      // Both participate in Jaipur × Interior Designers
      const partA = bizA.marketParticipations.find((p) => p.marketSlug === 'jaipur/interior-designers');
      const partB = bizB.marketParticipations.find((p) => p.marketSlug === 'jaipur/interior-designers');

      assert.ok(partA);
      assert.ok(partB);
      assert.strictEqual(partA.currentPosition, 1);
      assert.strictEqual(partB.currentPosition, 2);

      // Slugs remain completely independent
      assert.strictEqual(bizA.publicUrl, '/businesses/abc-interiors-jaipur');
      assert.strictEqual(bizB.publicUrl, '/businesses/studio-xyz-jaipur');
    });

    it('Dynamic Proof 3: Business exists with category & location without market participation', async () => {
      const bizC = await businessService.getPublishedBusinessBySlug('artisanal-decor-jaipur');
      assert.ok(bizC, 'Business C should resolve');
      assert.strictEqual(bizC.categories.length, 1);
      assert.strictEqual(bizC.categories[0].slug, 'interior-designers');
      assert.strictEqual(bizC.locationsServed.length, 1);
      assert.strictEqual(bizC.locationsServed[0].slug, 'jaipur');

      // Crucial: Zero market participations fabricated
      assert.strictEqual(
        bizC.marketParticipations.length,
        0,
        'No market participation should be inferred simply because location & category exist'
      );
    });

    it('Dynamic Proof 4: Single canonical profile participates across multiple markets', async () => {
      // Add Delhi to ABC Interiors
      addMarketParticipation({
        id: 'mp-abc-delhi',
        businessId: 'biz-abc-interiors',
        marketId: 'mkt-delhi-interior-designers',
        status: 'ACTIVE',
        eligibilityStatus: 'ELIGIBLE',
        currentPosition: 4,
        joinedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });

      const profile = await businessService.getPublishedBusinessBySlug('abc-interiors-jaipur');
      assert.ok(profile);
      assert.strictEqual(profile.slug, 'abc-interiors-jaipur', 'Single canonical entity and slug');
      assert.strictEqual(profile.marketParticipations.length, 2);
    });
  });

  describe('5. Unknown Business Discovery Workflow', () => {
    it('should search published businesses by name and return matching result', async () => {
      const results = await businessService.searchPublishedBusinesses('Royal Interiors');
      assert.ok(results.length > 0);
      assert.strictEqual(results[0].slug, 'royal-interiors-jaipur');
      assert.strictEqual(results[0].found, true);
    });

    it('should record discovery request for unlisted business without mutating database', () => {
      const unlistedName = 'Nova Architectural Interiors';
      const req = recordDiscoveryRequest({
        requestType: 'BUSINESS',
        rawInput: unlistedName,
      });

      assert.ok(req);
      assert.strictEqual(req.requestType, 'BUSINESS');
      assert.strictEqual(req.status, 'NEEDS_REVIEW');
      assert.strictEqual(req.requestCount, 1);

      // Verify unlisted business is not added to canonical businesses
      const foundInStore = getBusinessBySlug('nova-architectural-interiors');
      assert.strictEqual(foundInStore, undefined, 'Public users cannot directly create canonical businesses');
    });

    it('should increment request count and deduplicate repeated discovery requests', () => {
      const unlistedName = 'Elite Spacecraft Design';
      recordDiscoveryRequest({ requestType: 'BUSINESS', rawInput: unlistedName });
      recordDiscoveryRequest({ requestType: 'BUSINESS', rawInput: unlistedName });
      const req3 = recordDiscoveryRequest({ requestType: 'BUSINESS', rawInput: unlistedName });

      assert.strictEqual(req3.requestCount, 3);
      const allBusinessRequests = getAllDiscoveryRequests().filter((r) => r.requestType === 'BUSINESS');
      assert.strictEqual(allBusinessRequests.length, 1, 'Repeat requests must not create duplicate records');
    });
  });
});
