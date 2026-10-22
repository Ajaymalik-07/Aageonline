import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert';
import {
  getBusinessById,
  getBusinessBySlug,
  getMarketParticipationsByBusiness,
  resetBusinessStoreForTesting,
  createBusiness,
  addBusinessCategory,
  addBusinessLocation,
  addMarketParticipation,
} from '../lib/taxonomy/businesses.ts';
import {
  getMembershipsByUser,
  createMembership,
} from '../lib/memberships/store.ts';
import { resetAuthStoreForTesting, setActiveDevUser } from '../lib/auth/store.ts';

describe('Business Claim & First-Time Registration Flow', () => {
  beforeEach(() => {
    resetBusinessStoreForTesting();
    resetAuthStoreForTesting();
  });

  it('should verify ABC Interiors reference profile exists with canonical fields', () => {
    const abcBiz = getBusinessById('biz-abc-interiors');
    assert.ok(abcBiz, 'biz-abc-interiors must exist in canonical store');
    assert.strictEqual(abcBiz.name, 'ABC Interiors & Spacecraft Studio');
    assert.strictEqual(abcBiz.legalName, 'ABC Spacecraft Interior Design LLP');
    assert.strictEqual(abcBiz.primaryCityId, 'city-jaipur');
    assert.strictEqual(abcBiz.verificationStatus, 'VERIFIED');
    assert.strictEqual(abcBiz.publicationStatus, 'PUBLISHED');

    const participations = getMarketParticipationsByBusiness(abcBiz.id);
    assert.ok(participations.length > 0, 'ABC Interiors must have market participation');
    const jaipurPart = participations.find((p) => p.marketId === 'mkt-jaipur-interior-designers');
    assert.ok(jaipurPart, 'Must participate in Jaipur Interior Designers market');
    assert.strictEqual(jaipurPart.currentPosition, 1, 'ABC Interiors must hold Position #1');
    assert.strictEqual(jaipurPart.qualifyingAmountRupees, 28500, 'Qualifying floor must be ₹28,500');
  });

  it('should allow users to register and manage multiple businesses', () => {
    // user-ajay manages biz-royal-interiors and biz-abc-interiors
    const ajayMemberships = getMembershipsByUser('user-ajay');
    assert.ok(
      ajayMemberships.length >= 2,
      'user-ajay manages multiple business profiles'
    );
  });

  it('should allow first-time user to register one business and appear on website listings', () => {
    // 1. Initial state: user-rahul has no businesses
    const initialMemberships = getMembershipsByUser('user-rahul');
    assert.strictEqual(initialMemberships.length, 0);

    // 2. Simulate registration
    const newBizId = 'biz-modern-decor-jaipur';
    const newBizSlug = 'modern-decor-jaipur';

    const createdBiz = {
      id: newBizId,
      slug: newBizSlug,
      name: 'Modern Decor & Living',
      legalName: 'Modern Decor Solutions LLP',
      tagline: 'Modern furniture and turnkey spatial styling.',
      description: 'Design and execution studio delivering contemporary modular living.',
      primaryCityId: 'city-jaipur',
      primaryStateId: 'state-rajasthan',
      primaryCountryId: 'country-india',
      verificationStatus: 'VERIFIED' as const,
      publicationStatus: 'PUBLISHED' as const,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // Store in business registry
    createBusiness(createdBiz);
    addBusinessCategory({ businessId: newBizId, categoryId: 'cat-interior-designers', isPrimary: true });
    addBusinessLocation({ businessId: newBizId, cityId: 'city-jaipur', isPrimary: true });

    // Establish OWNER membership for user-rahul
    createMembership(
      {
        businessId: newBizId,
        userId: 'user-rahul',
        role: 'OWNER',
        status: 'ACTIVE',
      },
      'user-rahul'
    );

    // Assign Position #1 (Top Spotlight Rank) with qualifying amount
    addMarketParticipation({
      id: `mp-${newBizSlug}`,
      businessId: newBizId,
      marketId: 'mkt-jaipur-interior-designers',
      status: 'ACTIVE',
      eligibilityStatus: 'ELIGIBLE',
      currentPosition: 1,
      qualifyingAmountRupees: 28500,
      joinedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    // 3. Verify user now has exactly 1 business
    const updatedMemberships = getMembershipsByUser('user-rahul');
    assert.strictEqual(updatedMemberships.length, 1, 'user-rahul must now have exactly 1 business');
    assert.strictEqual(updatedMemberships[0].businessId, newBizId);
    assert.strictEqual(updatedMemberships[0].role, 'OWNER');

    // 4. Verify public lookup and market listing
    const publicBiz = getBusinessBySlug(newBizSlug);
    assert.ok(publicBiz, 'New business must be resolvable by slug for public profile');
    assert.strictEqual(publicBiz.publicationStatus, 'PUBLISHED');
    assert.strictEqual(publicBiz.verificationStatus, 'VERIFIED');

    const parts = getMarketParticipationsByBusiness(newBizId);
    assert.strictEqual(parts.length, 1);
    assert.strictEqual(parts[0].currentPosition, 1);
    assert.strictEqual(parts[0].qualifyingAmountRupees, 28500);
  });

  it('should normalize business identifiers with spaces, slugs, and prefixes in workspace context resolution', async () => {
    const { resolveWorkspaceContext, normalizeBusinessIdentifier } = await import('../lib/workspace/store.ts');

    // Verify identifier normalization logic
    assert.strictEqual(normalizeBusinessIdentifier('biz asdad jaipur'), 'asdad-jaipur');
    assert.strictEqual(normalizeBusinessIdentifier('biz-asdad-jaipur'), 'asdad-jaipur');
    assert.strictEqual(normalizeBusinessIdentifier('asdad-jaipur'), 'asdad-jaipur');
    assert.strictEqual(normalizeBusinessIdentifier('biz%20asdad%20jaipur'), 'asdad-jaipur');

    // Register a test business with slug 'asdad-jaipur'
    createBusiness({
      id: 'biz-asdad-jaipur',
      slug: 'asdad-jaipur',
      name: 'asdad',
      legalName: 'asdad legal',
      tagline: 'Design Tagline',
      description: 'Design Description',
      primaryCityId: 'city-jaipur',
      primaryStateId: 'state-rajasthan',
      primaryCountryId: 'country-india',
      verificationStatus: 'VERIFIED',
      publicationStatus: 'PUBLISHED',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    // Test resolving with un-hyphenated spaces in businessId query param (e.g. 'biz asdad jaipur')
    const ctx = await resolveWorkspaceContext('user-ajay', 'biz asdad jaipur');
    assert.ok(ctx, 'Context must resolve successfully without permission error');
    assert.strictEqual(ctx.currentBusiness.id, 'biz-asdad-jaipur');
    assert.strictEqual(ctx.currentBusiness.name, 'asdad');

    // Test graceful fallback when an unknown business ID is provided
    const fallbackCtx = await resolveWorkspaceContext('user-ajay', 'unknown-random-business-id');
    assert.ok(fallbackCtx, 'Context must fall back to primary business instead of 403 error');
    assert.ok(fallbackCtx.currentBusiness, 'Must have active business');
  });
});

