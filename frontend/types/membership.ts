/**
 * AageOnline — Business Membership & RBAC Domain Types
 * First-class membership model, roles, and fine-grained permissions.
 */

export type MembershipRole = 'OWNER' | 'ADMIN' | 'EDITOR' | 'FINANCE';

export type MembershipStatus = 'ACTIVE' | 'INVITED' | 'SUSPENDED' | 'REMOVED';

export type PermissionAction =
  | 'business.view'
  | 'business.update'
  | 'business.identity.update'
  | 'business.members.view'
  | 'business.members.invite'
  | 'business.members.manage'
  | 'business.transfer_ownership'
  | 'business.claim.manage'
  | 'market.participation.view'
  | 'market.participation.manage'
  | 'financial.view'
  | 'financial.transact'
  | 'bidIntent.create'
  | 'bidIntent.cancel'
  | 'bidIntent.view'
  | 'paymentOrder.create'
  | 'paymentOrder.view'
  | 'paymentOrder.cancel'
  | 'rankingSettlement.create'
  | 'rankingSettlement.view'
  | 'workspace.access';

export interface BusinessMembership {
  id: string;
  businessId: string;
  userId: string;
  role: MembershipRole;
  status: MembershipStatus;
  invitedBy?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateMembershipInput {
  businessId: string;
  userId: string;
  role: MembershipRole;
  status?: MembershipStatus;
  invitedBy?: string;
}

export interface UpdateMembershipRoleInput {
  membershipId: string;
  targetRole: MembershipRole;
  actorUserId: string;
}

export interface UpdateMembershipStatusInput {
  membershipId: string;
  targetStatus: MembershipStatus;
  actorUserId: string;
}
