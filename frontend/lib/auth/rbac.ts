/**
 * AageOnline — Centralized RBAC Authorization Engine
 * Pure permission evaluator for Business Membership roles.
 *
 * Invariant: Server-side authorization is authoritative.
 * Frontend permission checks are for UX only.
 */

import type { BusinessMembership, MembershipRole, PermissionAction } from '../../types/membership.ts';

const ROLE_PERMISSIONS: Record<MembershipRole, Set<PermissionAction>> = {
  OWNER: new Set<PermissionAction>([
    'business.view',
    'business.update',
    'business.identity.update',
    'business.members.view',
    'business.members.invite',
    'business.members.manage',
    'business.transfer_ownership',
    'business.claim.manage',
    'market.participation.view',
    'market.participation.manage',
    'financial.view',
    'financial.transact',
    'bidIntent.create',
    'bidIntent.cancel',
    'bidIntent.view',
    'paymentOrder.create',
    'paymentOrder.view',
    'paymentOrder.cancel',
    'rankingSettlement.create',
    'rankingSettlement.view',
    'workspace.access',
  ]),
  ADMIN: new Set<PermissionAction>([
    'business.view',
    'business.update',
    'business.members.view',
    'business.members.invite',
    'business.members.manage',
    'market.participation.view',
    'market.participation.manage',
    'financial.view',
    'bidIntent.create',
    'bidIntent.cancel',
    'bidIntent.view',
    'paymentOrder.create',
    'paymentOrder.view',
    'paymentOrder.cancel',
    'rankingSettlement.create',
    'rankingSettlement.view',
    'workspace.access',
  ]),
  EDITOR: new Set<PermissionAction>([
    'business.view',
    'business.update',
    'market.participation.view',
    'workspace.access',
  ]),
  FINANCE: new Set<PermissionAction>([
    'business.view',
    'financial.view',
    'bidIntent.view',
    'paymentOrder.view',
    'rankingSettlement.view',
    'market.participation.view',
    'workspace.access',
  ]),
};

export function getPermissionsForRole(role: MembershipRole): PermissionAction[] {
  const perms = ROLE_PERMISSIONS[role];
  return perms ? Array.from(perms) : [];
}

/**
 * Pure authorization check against a business membership.
 * Requires ACTIVE status on the membership.
 */
export function can(
  membership: BusinessMembership | null | undefined,
  action: PermissionAction
): boolean {
  if (!membership) {
    return false;
  }
  if (membership.status !== 'ACTIVE') {
    return false;
  }
  const perms = ROLE_PERMISSIONS[membership.role];
  if (!perms) {
    return false;
  }
  return perms.has(action);
}

export class AuthorizationError extends Error {
  statusCode: number;

  constructor(message: string, statusCode = 403) {
    super(message);
    this.name = 'AuthorizationError';
    this.statusCode = statusCode;
  }
}

/**
 * Authoritative server-side guard asserting membership authorization.
 * Throws 401 when membership is missing, 403 when permissions are insufficient.
 */
export function assertAuthorized(
  membership: BusinessMembership | null | undefined,
  action: PermissionAction
): void {
  if (!membership) {
    throw new AuthorizationError('Authentication and business membership required.', 401);
  }
  if (membership.status !== 'ACTIVE') {
    throw new AuthorizationError(`Membership is ${membership.status}. Access denied.`, 403);
  }
  if (!can(membership, action)) {
    throw new AuthorizationError(
      `Role "${membership.role}" does not have permission "${action}".`,
      403
    );
  }
}
