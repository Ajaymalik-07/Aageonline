/**
 * AageOnline — Business Membership Store
 * Canonical store for Business Memberships and role assignments.
 *
 * Enforces composite uniqueness on (businessId, userId).
 * Direct membership is the authoritative gateway to Business context.
 */

import type {
  BusinessMembership,
  CreateMembershipInput,
  MembershipRole,
  MembershipStatus,
  UpdateMembershipRoleInput,
  UpdateMembershipStatusInput,
} from '../../types/membership.ts';
import { recordAuditEvent } from '../audit/store.ts';
import { getBusinessById } from '../taxonomy/businesses.ts';
import { getUserById } from '../auth/store.ts';

const MEMBERSHIPS_STORE: Map<string, BusinessMembership> = new Map();

function compositeKey(businessId: string, userId: string): string {
  return `${businessId}:::${userId}`;
}

function seedCanonicalMemberships(): void {
  MEMBERSHIPS_STORE.clear();

  const now = '2026-01-01T00:00:00.000Z';

  // Seed memberships for Royal Interiors Studio (multi-role business demonstration)
  const seedMemberships: BusinessMembership[] = [
    {
      id: 'mem-royal-ajay',
      businessId: 'biz-royal-interiors',
      userId: 'user-ajay',
      role: 'OWNER',
      status: 'ACTIVE',
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'mem-royal-priya',
      businessId: 'biz-royal-interiors',
      userId: 'user-priya',
      role: 'ADMIN',
      status: 'ACTIVE',
      invitedBy: 'user-ajay',
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'mem-royal-rohit',
      businessId: 'biz-royal-interiors',
      userId: 'user-rohit',
      role: 'EDITOR',
      status: 'ACTIVE',
      invitedBy: 'user-ajay',
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'mem-royal-kavita',
      businessId: 'biz-royal-interiors',
      userId: 'user-kavita',
      role: 'FINANCE',
      status: 'ACTIVE',
      invitedBy: 'user-ajay',
      createdAt: now,
      updatedAt: now,
    },
    // Seed membership for Coastal Spice Dining Group
    {
      id: 'mem-coastal-vikram',
      businessId: 'biz-coastal-spice',
      userId: 'user-vikram',
      role: 'OWNER',
      status: 'ACTIVE',
      createdAt: now,
      updatedAt: now,
    },
  ];

  for (const m of seedMemberships) {
    MEMBERSHIPS_STORE.set(compositeKey(m.businessId, m.userId), m);
  }
}

// Seed on module load
seedCanonicalMemberships();

export function getMembership(businessId: string, userId: string): BusinessMembership | undefined {
  return MEMBERSHIPS_STORE.get(compositeKey(businessId, userId));
}

export function getMembershipsByUser(userId: string): BusinessMembership[] {
  return Array.from(MEMBERSHIPS_STORE.values()).filter(
    (m) => m.userId === userId && m.status === 'ACTIVE'
  );
}

export function getAllMembershipsByUser(userId: string): BusinessMembership[] {
  return Array.from(MEMBERSHIPS_STORE.values()).filter((m) => m.userId === userId);
}

export function getMembershipsByBusiness(businessId: string): BusinessMembership[] {
  return Array.from(MEMBERSHIPS_STORE.values()).filter(
    (m) => m.businessId === businessId && m.status !== 'REMOVED'
  );
}

export function createMembership(
  input: CreateMembershipInput,
  actorUserId?: string
): BusinessMembership {
  const business = getBusinessById(input.businessId);
  if (!business) {
    throw new Error(`Business "${input.businessId}" does not exist.`);
  }

  const user = getUserById(input.userId);
  if (!user) {
    throw new Error(`User "${input.userId}" does not exist.`);
  }

  const key = compositeKey(input.businessId, input.userId);
  const existing = MEMBERSHIPS_STORE.get(key);

  if (existing && existing.status !== 'REMOVED') {
    throw new Error(
      `An active or invited membership already exists for user "${input.userId}" in business "${input.businessId}".`
    );
  }

  const now = new Date().toISOString();
  const membership: BusinessMembership = {
    id: existing?.id || `mem-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    businessId: input.businessId,
    userId: input.userId,
    role: input.role,
    status: input.status || 'ACTIVE',
    invitedBy: input.invitedBy,
    createdAt: existing?.createdAt || now,
    updatedAt: now,
  };

  MEMBERSHIPS_STORE.set(key, membership);

  recordAuditEvent('MEMBERSHIP_CREATED', 'BusinessMembership', membership.id, actorUserId, {
    businessId: input.businessId,
    targetUserId: input.userId,
    role: input.role,
  });

  return membership;
}

export function updateMembershipRole(input: UpdateMembershipRoleInput): BusinessMembership {
  let targetMembership: BusinessMembership | undefined;
  for (const m of MEMBERSHIPS_STORE.values()) {
    if (m.id === input.membershipId) {
      targetMembership = m;
      break;
    }
  }

  if (!targetMembership) {
    throw new Error(`Membership with ID "${input.membershipId}" not found.`);
  }

  const previousRole = targetMembership.role;
  targetMembership.role = input.targetRole;
  targetMembership.updatedAt = new Date().toISOString();

  recordAuditEvent(
    'MEMBERSHIP_ROLE_CHANGED',
    'BusinessMembership',
    targetMembership.id,
    input.actorUserId,
    {
      previousRole,
      newRole: input.targetRole,
      businessId: targetMembership.businessId,
    }
  );

  return { ...targetMembership };
}

export function updateMembershipStatus(input: UpdateMembershipStatusInput): BusinessMembership {
  let targetMembership: BusinessMembership | undefined;
  for (const m of MEMBERSHIPS_STORE.values()) {
    if (m.id === input.membershipId) {
      targetMembership = m;
      break;
    }
  }

  if (!targetMembership) {
    throw new Error(`Membership with ID "${input.membershipId}" not found.`);
  }

  targetMembership.status = input.targetStatus;
  targetMembership.updatedAt = new Date().toISOString();

  const action =
    input.targetStatus === 'SUSPENDED'
      ? 'MEMBERSHIP_SUSPENDED'
      : input.targetStatus === 'REMOVED'
      ? 'MEMBERSHIP_REMOVED'
      : 'MEMBERSHIP_ROLE_CHANGED';

  recordAuditEvent(action, 'BusinessMembership', targetMembership.id, input.actorUserId, {
    status: input.targetStatus,
    businessId: targetMembership.businessId,
  });

  return { ...targetMembership };
}

export function resetMembershipStoreForTesting(): void {
  seedCanonicalMemberships();
}
