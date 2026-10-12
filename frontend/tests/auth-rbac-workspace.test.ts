/**
 * AageOnline — Authentication, Business Claim, Membership/RBAC & Workspace Test Suite
 *
 * Verifies:
 * 1. Provider-independent Authentication (Sessions, Expirations, 401 unauthenticated)
 * 2. Business Claim Lifecycle & Invariants (Auth required, deduplication, state transitions, atomic approval)
 * 3. Business Membership & RBAC (Composite uniqueness on (businessId, userId), centralized RBAC matrix)
 * 4. Cross-Business Security & Isolation (User A cannot access Business B, server-authoritative validation)
 * 5. Multi-business context switching & truthful workspace metrics
 */

import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert/strict';

import {
  createOrGetUserByEmail,
  createSessionForUser,
  getActiveDevSession,
  getSessionByToken,
  getUserById,
  invalidateSession,
  resetAuthStoreForTesting,
  setActiveDevUser,
} from '../lib/auth/store.ts';

import {
  can,
  assertAuthorized,
  AuthorizationError,
  getPermissionsForRole,
} from '../lib/auth/rbac.ts';

import {
  createMembership,
  getMembership,
  getMembershipsByBusiness,
  getMembershipsByUser,
  resetMembershipStoreForTesting,
  updateMembershipRole,
  updateMembershipStatus,
} from '../lib/memberships/store.ts';

import {
  cancelBusinessClaim,
  getActiveClaim,
  getClaimById,
  resetClaimsStoreForTesting,
  reviewBusinessClaim,
  submitBusinessClaim,
} from '../lib/claims/store.ts';

import {
  getWorkspaceMarkets,
  getWorkspaceOverview,
  resolveWorkspaceContext,
  updateWorkspaceProfile,
} from '../lib/workspace/store.ts';

import {
  getAllAuditEvents,
  resetAuditStoreForTesting,
} from '../lib/audit/store.ts';

import { resetBusinessStoreForTesting } from '../lib/taxonomy/businesses.ts';
import type { BusinessMembership } from '../types/membership.ts';

describe('AageOnline — Auth, Claim, Membership/RBAC & Workspace Suite', () => {
  beforeEach(() => {
    resetBusinessStoreForTesting();
    resetAuthStoreForTesting();
    resetMembershipStoreForTesting();
    resetClaimsStoreForTesting();
    resetAuditStoreForTesting();
  });

  // =========================================================================
  // 1. Authentication Layer Tests
  // =========================================================================
  describe('1. Authentication Abstraction & Session Management', () => {
    it('should retrieve existing canonical user by ID', () => {
      const user = getUserById('user-ajay');
      assert.ok(user);
      assert.equal(user.email, 'ajay@royalinteriors.example.com');
      assert.equal(user.status, 'ACTIVE');
    });

    it('should create new user on demand with ACTIVE status', () => {
      const newUser = createOrGetUserByEmail('founder@newbrand.example.com', 'Brand Founder');
      assert.ok(newUser.id);
      assert.equal(newUser.email, 'founder@newbrand.example.com');
      assert.equal(newUser.displayName, 'Brand Founder');
      assert.equal(newUser.status, 'ACTIVE');
    });

    it('should create valid session token for active user', () => {
      const session = createSessionForUser('user-ajay');
      assert.ok(session.token);
      assert.equal(session.userId, 'user-ajay');
      assert.equal(session.user.id, 'user-ajay');
      assert.ok(new Date(session.expiresAt) > new Date());
    });

    it('should reject session creation for suspended account', () => {
      assert.throws(
        () => createSessionForUser('user-suspended'),
        /Cannot create session: User account is SUSPENDED/
      );
    });

    it('should handle session invalidation and sign out', () => {
      const session = createSessionForUser('user-ajay');
      assert.ok(getSessionByToken(session.token));

      invalidateSession(session.token);
      assert.equal(getSessionByToken(session.token), null);
    });
  });

  // =========================================================================
  // 2. Centralized RBAC Engine Tests
  // =========================================================================
  describe('2. Centralized RBAC Authorization Matrix', () => {
    const baseMembership: BusinessMembership = {
      id: 'test-mem-1',
      businessId: 'biz-royal-interiors',
      userId: 'user-ajay',
      role: 'OWNER',
      status: 'ACTIVE',
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
    };

    it('OWNER should hold full authority including ownership transfer', () => {
      const ownerMem = { ...baseMembership, role: 'OWNER' as const };
      assert.equal(can(ownerMem, 'business.transfer_ownership'), true);
      assert.equal(can(ownerMem, 'business.update'), true);
      assert.equal(can(ownerMem, 'business.members.manage'), true);
      assert.equal(can(ownerMem, 'financial.view'), true);
      assert.equal(can(ownerMem, 'financial.transact'), true);
      assert.equal(can(ownerMem, 'workspace.access'), true);
    });

    it('ADMIN should manage profile and members but CANNOT transfer ownership or financial transact', () => {
      const adminMem = { ...baseMembership, role: 'ADMIN' as const };
      assert.equal(can(adminMem, 'business.update'), true);
      assert.equal(can(adminMem, 'business.members.invite'), true);
      assert.equal(can(adminMem, 'business.members.manage'), true);
      assert.equal(can(adminMem, 'financial.view'), true);
      assert.equal(can(adminMem, 'business.transfer_ownership'), false);
      assert.equal(can(adminMem, 'financial.transact'), false);
    });

    it('EDITOR can update content but CANNOT manage members or financial views', () => {
      const editorMem = { ...baseMembership, role: 'EDITOR' as const };
      assert.equal(can(editorMem, 'business.update'), true);
      assert.equal(can(editorMem, 'business.view'), true);
      assert.equal(can(editorMem, 'workspace.access'), true);
      assert.equal(can(editorMem, 'business.members.manage'), false);
      assert.equal(can(editorMem, 'business.members.invite'), false);
      assert.equal(can(editorMem, 'financial.view'), false);
      assert.equal(can(editorMem, 'business.transfer_ownership'), false);
    });

    it('FINANCE has financial visibility but CANNOT modify business profile', () => {
      const financeMem = { ...baseMembership, role: 'FINANCE' as const };
      assert.equal(can(financeMem, 'financial.view'), true);
      assert.equal(can(financeMem, 'workspace.access'), true);
      assert.equal(can(financeMem, 'business.update'), false);
      assert.equal(can(financeMem, 'business.members.manage'), false);
    });

    it('assertAuthorized throws 401 when membership is missing', () => {
      assert.throws(
        () => assertAuthorized(null, 'business.view'),
        (err: unknown) => err instanceof AuthorizationError && err.statusCode === 401
      );
    });

    it('assertAuthorized throws 403 when role is unauthorized', () => {
      const editorMem = { ...baseMembership, role: 'EDITOR' as const };
      assert.throws(
        () => assertAuthorized(editorMem, 'business.members.manage'),
        (err: unknown) => err instanceof AuthorizationError && err.statusCode === 403
      );
    });

    it('suspended membership is denied all permissions', () => {
      const suspendedMem = { ...baseMembership, role: 'OWNER' as const, status: 'SUSPENDED' as const };
      assert.equal(can(suspendedMem, 'business.view'), false);
      assert.equal(can(suspendedMem, 'workspace.access'), false);
    });
  });

  // =========================================================================
  // 3. Business Claim Lifecycle & Invariants
  // =========================================================================
  describe('3. Business Claim Lifecycle & Governance Rules', () => {
    it('Rule 1: Unclaimed business exists publicly without claim', () => {
      const activeClaim = getActiveClaim('biz-artisanal-decor', 'user-rahul');
      assert.equal(activeClaim, undefined);
    });

    it('Rule 2: Unauthenticated claim submission is rejected', () => {
      assert.throws(
        () =>
          submitBusinessClaim(
            {
              businessId: 'biz-artisanal-decor',
              claimantName: 'Anonymous',
              claimantEmail: 'anon@example.com',
              evidenceType: 'GSTIN',
              evidenceReference: '08AAACR1234F1Z5',
            },
            '' // missing claimant user ID
          ),
        /Authentication required/
      );
    });

    it('Rule 3 & 4: Claim must reference existing canonical business and not create duplicates', () => {
      assert.throws(
        () =>
          submitBusinessClaim(
            {
              businessId: 'biz-non-existent-999',
              claimantName: 'Rahul Nair',
              claimantEmail: 'rahul@prospective.example.com',
              evidenceType: 'GSTIN',
              evidenceReference: '08AAACR1234F1Z5',
            },
            'user-rahul'
          ),
        /does not exist/
      );
    });

    it('Rule 5: Duplicate active claims for same business + claimant are strictly prevented', () => {
      submitBusinessClaim(
        {
          businessId: 'biz-artisanal-decor',
          claimantName: 'Rahul Nair',
          claimantEmail: 'rahul@prospective.example.com',
          evidenceType: 'GSTIN',
          evidenceReference: '08AAACR1234F1Z5',
        },
        'user-rahul'
      );

      // Attempt second claim by same user
      assert.throws(
        () =>
          submitBusinessClaim(
            {
              businessId: 'biz-artisanal-decor',
              claimantName: 'Rahul Nair',
              claimantEmail: 'rahul@prospective.example.com',
              evidenceType: 'BUSINESS_EMAIL',
              evidenceReference: 'admin@artisanaldecor.example.com',
            },
            'user-rahul'
          ),
        /already pending/
      );
    });

    it('Rule 6: Claim submission does NOT grant membership or ownership immediately', () => {
      const claim = submitBusinessClaim(
        {
          businessId: 'biz-artisanal-decor',
          claimantName: 'Rahul Nair',
          claimantEmail: 'rahul@prospective.example.com',
          evidenceType: 'GSTIN',
          evidenceReference: '08AAACR1234F1Z5',
        },
        'user-rahul'
      );

      assert.equal(claim.status, 'PENDING');
      // Verify no membership was created yet
      const membership = getMembership('biz-artisanal-decor', 'user-rahul');
      assert.equal(membership, undefined);
    });

    it('Rule 7: Claim approval atomically provisions an ACTIVE OWNER membership', () => {
      const claim = submitBusinessClaim(
        {
          businessId: 'biz-artisanal-decor',
          claimantName: 'Rahul Nair',
          claimantEmail: 'rahul@prospective.example.com',
          evidenceType: 'GSTIN',
          evidenceReference: '08AAACR1234F1Z5',
        },
        'user-rahul'
      );

      // Reviewer approves claim
      const reviewed = reviewBusinessClaim({
        claimId: claim.id,
        decision: 'APPROVE',
        reviewedByUserId: 'user-ajay',
      });

      assert.equal(reviewed.status, 'APPROVED');
      assert.equal(reviewed.reviewedBy, 'user-ajay');

      // Membership is provisioned
      const membership = getMembership('biz-artisanal-decor', 'user-rahul');
      assert.ok(membership);
      assert.equal(membership.role, 'OWNER');
      assert.equal(membership.status, 'ACTIVE');
    });

    it('Rule 8: Rejected claims do NOT grant access and record rejection reason', () => {
      const claim = submitBusinessClaim(
        {
          businessId: 'biz-artisanal-decor',
          claimantName: 'Rahul Nair',
          claimantEmail: 'rahul@prospective.example.com',
          evidenceType: 'GSTIN',
          evidenceReference: 'INVALID-GST',
        },
        'user-rahul'
      );

      const reviewed = reviewBusinessClaim({
        claimId: claim.id,
        decision: 'REJECT',
        reviewedByUserId: 'user-ajay',
        rejectionReason: 'GSTIN does not match legal business trade name in state registry.',
      });

      assert.equal(reviewed.status, 'REJECTED');
      assert.equal(reviewed.rejectionReason, 'GSTIN does not match legal business trade name in state registry.');

      // Zero membership granted
      const membership = getMembership('biz-artisanal-decor', 'user-rahul');
      assert.equal(membership, undefined);
    });

    it('Rule 10: State transitions are validated and recorded in audit trail', () => {
      const claim = submitBusinessClaim(
        {
          businessId: 'biz-artisanal-decor',
          claimantName: 'Rahul Nair',
          claimantEmail: 'rahul@prospective.example.com',
          evidenceType: 'GSTIN',
          evidenceReference: '08AAACR1234F1Z5',
        },
        'user-rahul'
      );

      reviewBusinessClaim({
        claimId: claim.id,
        decision: 'APPROVE',
        reviewedByUserId: 'user-ajay',
      });

      // Attempting to reject an already APPROVED claim must fail
      assert.throws(
        () =>
          reviewBusinessClaim({
            claimId: claim.id,
            decision: 'REJECT',
            reviewedByUserId: 'user-ajay',
          }),
        /Invalid state transition/
      );

      const auditEvents = getAllAuditEvents();
      assert.ok(auditEvents.some((e) => e.action === 'BUSINESS_CLAIM_SUBMITTED'));
      assert.ok(auditEvents.some((e) => e.action === 'BUSINESS_CLAIM_APPROVED'));
      assert.ok(auditEvents.some((e) => e.action === 'MEMBERSHIP_CREATED'));
    });
  });

  // =========================================================================
  // 4. Membership Model & Uniqueness Invariants
  // =========================================================================
  describe('4. Business Membership Integrity & Multi-User Operations', () => {
    it('enforces composite uniqueness on (businessId, userId)', () => {
      // user-ajay is already OWNER of biz-royal-interiors in seed
      assert.throws(
        () =>
          createMembership({
            businessId: 'biz-royal-interiors',
            userId: 'user-ajay',
            role: 'ADMIN',
          }),
        /An active or invited membership already exists/
      );
    });

    it('allows role changes without creating duplicate membership records', () => {
      const initialMem = getMembership('biz-royal-interiors', 'user-priya');
      assert.ok(initialMem);
      assert.equal(initialMem.role, 'ADMIN');

      const updated = updateMembershipRole({
        membershipId: initialMem.id,
        targetRole: 'OWNER',
        actorUserId: 'user-ajay',
      });

      assert.equal(updated.role, 'OWNER');

      // Verify still only one membership exists for this user in this business
      const members = getMembershipsByBusiness('biz-royal-interiors');
      const priyaMemberships = members.filter((m) => m.userId === 'user-priya');
      assert.equal(priyaMemberships.length, 1);
      assert.equal(priyaMemberships[0].role, 'OWNER');
    });

    it('allows a business to have multiple concurrent users with distinct roles', () => {
      const members = getMembershipsByBusiness('biz-royal-interiors');
      assert.equal(members.length, 4);

      const roles = members.map((m) => m.role).sort();
      assert.deepEqual(roles, ['ADMIN', 'EDITOR', 'FINANCE', 'OWNER']);
    });
  });

  // =========================================================================
  // 5. Cross-Business Isolation & Security Invariants
  // =========================================================================
  describe('5. Cross-Business Security & Isolation', () => {
    it('User A (user-ajay) cannot access Business B (biz-coastal-spice)', async () => {
      await assert.rejects(
        () => resolveWorkspaceContext('user-ajay', 'biz-coastal-spice'),
        (err: unknown) => {
          assert.equal((err as { statusCode: number }).statusCode, 403);
          return true;
        }
      );
    });

    it('User A cannot update profile of Business B', async () => {
      await assert.rejects(
        () =>
          updateWorkspaceProfile(
            {
              businessId: 'biz-coastal-spice',
              tagline: 'Unauthorized override attempt',
            },
            'user-ajay'
          ),
        (err: unknown) => err instanceof AuthorizationError && err.statusCode === 401
      );
    });

    it('User without any memberships gets 403 on workspace entry', async () => {
      await assert.rejects(
        () => resolveWorkspaceContext('user-rahul'),
        (err: unknown) => {
          assert.equal((err as { statusCode: number }).statusCode, 403);
          return true;
        }
      );
    });

    it('Server validates businessId server-side and ignores client mismatch', async () => {
      // Vikram only belongs to Coastal Spice
      const context = await resolveWorkspaceContext('user-vikram');
      assert.equal(context.currentBusiness.id, 'biz-coastal-spice');

      // Cannot force switch to Royal Interiors via query
      await assert.rejects(
        () => resolveWorkspaceContext('user-vikram', 'biz-royal-interiors'),
        (err: unknown) => (err as { statusCode: number }).statusCode === 403
      );
    });
  });

  // =========================================================================
  // 6. Business Workspace Metrics & Truthfulness
  // =========================================================================
  describe('6. Workspace Metrics & Position Presentation', () => {
    it('computes truthful market counts and position for Royal Interiors Studio', async () => {
      const overview = await getWorkspaceOverview('biz-royal-interiors', 'user-ajay');

      assert.equal(overview.business.name, 'Royal Interiors Studio');
      assert.equal(overview.activeMarketsCount, 1);
      assert.equal(overview.hasPaidPosition, true);
      assert.equal(overview.membership.role, 'OWNER');
    });

    it('retrieves truthful market positions and labels for participating markets', async () => {
      const markets = await getWorkspaceMarkets('biz-royal-interiors', 'user-ajay');
      assert.equal(markets.length, 1);

      const m = markets[0];
      assert.equal(m.market.id, 'mkt-jaipur-interior-designers');
      assert.equal(m.status, 'ACTIVE');
      assert.equal(m.position, 3);
      assert.equal(m.positionLabel, 'Position #3');
      assert.equal(m.qualifyingAmountRupees, 24500);
    });

    it('updates permitted business profile fields and logs audit event', async () => {
      const updated = await updateWorkspaceProfile(
        {
          businessId: 'biz-royal-interiors',
          tagline: 'Modern architectural interior craftsmanship across Jaipur & Rajasthan.',
          website: 'https://updated-royalinteriors.example.com',
        },
        'user-ajay'
      );

      assert.equal(updated.tagline, 'Modern architectural interior craftsmanship across Jaipur & Rajasthan.');
      assert.equal(updated.website, 'https://updated-royalinteriors.example.com');

      const auditEvents = getAllAuditEvents();
      const profileEvent = auditEvents.find((e) => e.action === 'BUSINESS_PROFILE_UPDATED');
      assert.ok(profileEvent);
      assert.equal(profileEvent.entityId, 'biz-royal-interiors');
      assert.equal(profileEvent.actorUserId, 'user-ajay');
    });
  });
});
