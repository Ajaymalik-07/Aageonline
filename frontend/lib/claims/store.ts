/**
 * AageOnline — Business Claim Store
 * First-class claim lifecycle, state machine, and verification engine.
 *
 * Enforces:
 * 1. User must be authenticated to submit claim.
 * 2. Target business must exist canonically.
 * 3. Never creates duplicate businesses.
 * 4. Duplicate active claims for (businessId, claimantUserId) are strictly rejected.
 * 5. State transitions strictly validated.
 * 6. Claim approval atomically provisions an OWNER BusinessMembership.
 * 7. All status transitions recorded in append-only audit log.
 */

import type {
  BusinessClaim,
  CancelClaimInput,
  ClaimStatus,
  ReviewClaimInput,
  SubmitClaimInput,
} from '../../types/business-claim.ts';
import { recordAuditEvent } from '../audit/store.ts';
import { getBusinessById } from '../taxonomy/businesses.ts';
import { getUserById } from '../auth/store.ts';
import { createMembership, getMembership } from '../memberships/store.ts';

const CLAIMS_STORE: Map<string, BusinessClaim> = new Map();

// Valid state machine transitions
const ALLOWED_TRANSITIONS: Record<ClaimStatus, Set<ClaimStatus>> = {
  PENDING: new Set(['UNDER_REVIEW', 'APPROVED', 'REJECTED', 'CANCELLED', 'EXPIRED']),
  UNDER_REVIEW: new Set(['APPROVED', 'REJECTED', 'CANCELLED']),
  APPROVED: new Set(),
  REJECTED: new Set(),
  CANCELLED: new Set(),
  EXPIRED: new Set(),
};

function seedCanonicalClaims(): void {
  CLAIMS_STORE.clear();
}

seedCanonicalClaims();

export function getAllClaims(): BusinessClaim[] {
  return Array.from(CLAIMS_STORE.values());
}

export function getClaimById(id: string): BusinessClaim | undefined {
  return CLAIMS_STORE.get(id);
}

export function getClaimsByBusiness(businessId: string): BusinessClaim[] {
  return Array.from(CLAIMS_STORE.values()).filter((c) => c.businessId === businessId);
}

export function getClaimsByClaimant(claimantUserId: string): BusinessClaim[] {
  return Array.from(CLAIMS_STORE.values()).filter((c) => c.claimantUserId === claimantUserId);
}

export function getActiveClaim(
  businessId: string,
  claimantUserId: string
): BusinessClaim | undefined {
  return Array.from(CLAIMS_STORE.values()).find(
    (c) =>
      c.businessId === businessId &&
      c.claimantUserId === claimantUserId &&
      (c.status === 'PENDING' || c.status === 'UNDER_REVIEW')
  );
}

export function submitBusinessClaim(
  input: SubmitClaimInput,
  claimantUserId: string
): BusinessClaim {
  if (!claimantUserId) {
    throw new Error('Authentication required: A claimant user ID must be provided.');
  }

  const claimant = getUserById(claimantUserId);
  if (!claimant || claimant.status !== 'ACTIVE') {
    throw new Error('Authentication required: Claimant account is invalid or inactive.');
  }

  const business = getBusinessById(input.businessId);
  if (!business) {
    throw new Error(`Business "${input.businessId}" does not exist.`);
  }

  // Check if claimant already has an active membership for this business
  const existingMembership = getMembership(input.businessId, claimantUserId);
  if (existingMembership && existingMembership.status === 'ACTIVE') {
    throw new Error('You are already an active member of this business.');
  }

  // Check for duplicate active claim by the same user for this business
  const existingActive = getActiveClaim(input.businessId, claimantUserId);
  if (existingActive) {
    throw new Error(
      `A claim for this business is already ${existingActive.status.toLowerCase().replace('_', ' ')}.`
    );
  }

  const now = new Date().toISOString();
  const claim: BusinessClaim = {
    id: `claim-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    businessId: input.businessId,
    claimantUserId,
    claimantName: input.claimantName || claimant.displayName,
    claimantEmail: input.claimantEmail || claimant.email,
    claimantRoleDescription: input.claimantRoleDescription,
    status: 'PENDING',
    evidenceType: input.evidenceType,
    evidenceReference: input.evidenceReference,
    submittedAt: now,
    createdAt: now,
    updatedAt: now,
  };

  CLAIMS_STORE.set(claim.id, claim);

  recordAuditEvent('BUSINESS_CLAIM_SUBMITTED', 'BusinessClaim', claim.id, claimantUserId, {
    businessId: input.businessId,
    evidenceType: input.evidenceType,
  });

  return claim;
}

export function reviewBusinessClaim(input: ReviewClaimInput): BusinessClaim {
  const claim = CLAIMS_STORE.get(input.claimId);
  if (!claim) {
    throw new Error(`Claim with ID "${input.claimId}" not found.`);
  }

  const reviewer = getUserById(input.reviewedByUserId);
  if (!reviewer) {
    throw new Error(`Reviewer user with ID "${input.reviewedByUserId}" not found.`);
  }

  const targetStatus: ClaimStatus = input.decision === 'APPROVE' ? 'APPROVED' : 'REJECTED';
  const allowed = ALLOWED_TRANSITIONS[claim.status];

  if (!allowed || !allowed.has(targetStatus)) {
    throw new Error(
      `Cannot transition claim from ${claim.status} to ${targetStatus}. Invalid state transition.`
    );
  }

  const now = new Date().toISOString();
  claim.status = targetStatus;
  claim.reviewedAt = now;
  claim.reviewedBy = input.reviewedByUserId;
  claim.updatedAt = now;

  if (input.decision === 'REJECT') {
    claim.rejectionReason = input.rejectionReason || 'Verification requirements not satisfied.';
    recordAuditEvent('BUSINESS_CLAIM_REJECTED', 'BusinessClaim', claim.id, input.reviewedByUserId, {
      rejectionReason: claim.rejectionReason,
    });
  } else {
    // Approved: atomically provision OWNER membership
    createMembership(
      {
        businessId: claim.businessId,
        userId: claim.claimantUserId,
        role: 'OWNER',
        status: 'ACTIVE',
      },
      input.reviewedByUserId
    );

    recordAuditEvent('BUSINESS_CLAIM_APPROVED', 'BusinessClaim', claim.id, input.reviewedByUserId, {
      businessId: claim.businessId,
      claimantUserId: claim.claimantUserId,
      assignedRole: 'OWNER',
    });
  }

  return { ...claim };
}

export function cancelBusinessClaim(input: CancelClaimInput): BusinessClaim {
  const claim = CLAIMS_STORE.get(input.claimId);
  if (!claim) {
    throw new Error(`Claim with ID "${input.claimId}" not found.`);
  }

  if (claim.claimantUserId !== input.userId) {
    throw new Error('Only the original claimant can cancel this claim.');
  }

  const allowed = ALLOWED_TRANSITIONS[claim.status];
  if (!allowed || !allowed.has('CANCELLED')) {
    throw new Error(`Cannot cancel a claim with status ${claim.status}.`);
  }

  const now = new Date().toISOString();
  claim.status = 'CANCELLED';
  claim.updatedAt = now;

  recordAuditEvent('BUSINESS_CLAIM_CANCELLED', 'BusinessClaim', claim.id, input.userId, {
    businessId: claim.businessId,
  });

  return { ...claim };
}

export function resetClaimsStoreForTesting(): void {
  seedCanonicalClaims();
}
