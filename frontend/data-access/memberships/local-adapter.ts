/**
 * AageOnline — Local Business Membership Data Source Adapter
 */

import type { BusinessMembershipDataSource } from './service.ts';
import type {
  BusinessMembership,
  CreateMembershipInput,
  UpdateMembershipRoleInput,
  UpdateMembershipStatusInput,
} from '../../types/membership.ts';
import {
  createMembership,
  getMembership,
  getMembershipsByBusiness,
  getMembershipsByUser,
  updateMembershipRole,
  updateMembershipStatus,
} from '../../lib/memberships/store.ts';

export class LocalBusinessMembershipDataSource implements BusinessMembershipDataSource {
  async getMembership(businessId: string, userId: string): Promise<BusinessMembership | null> {
    const mem = getMembership(businessId, userId);
    return mem || null;
  }

  async getMembershipsByUser(userId: string): Promise<BusinessMembership[]> {
    return getMembershipsByUser(userId);
  }

  async getMembershipsByBusiness(businessId: string): Promise<BusinessMembership[]> {
    return getMembershipsByBusiness(businessId);
  }

  async createMembership(input: CreateMembershipInput, actorUserId?: string): Promise<BusinessMembership> {
    return createMembership(input, actorUserId);
  }

  async updateRole(input: UpdateMembershipRoleInput): Promise<BusinessMembership> {
    return updateMembershipRole(input);
  }

  async updateStatus(input: UpdateMembershipStatusInput): Promise<BusinessMembership> {
    return updateMembershipStatus(input);
  }
}
