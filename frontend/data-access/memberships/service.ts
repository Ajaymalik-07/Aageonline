/**
 * AageOnline — Business Membership Service Contract
 */

import type {
  BusinessMembership,
  CreateMembershipInput,
  UpdateMembershipRoleInput,
  UpdateMembershipStatusInput,
} from '../../types/membership.ts';

export interface BusinessMembershipDataSource {
  getMembership(businessId: string, userId: string): Promise<BusinessMembership | null>;
  getMembershipsByUser(userId: string): Promise<BusinessMembership[]>;
  getMembershipsByBusiness(businessId: string): Promise<BusinessMembership[]>;
  createMembership(input: CreateMembershipInput, actorUserId?: string): Promise<BusinessMembership>;
  updateRole(input: UpdateMembershipRoleInput): Promise<BusinessMembership>;
  updateStatus(input: UpdateMembershipStatusInput): Promise<BusinessMembership>;
}

export class BusinessMembershipService {
  private readonly dataSource: BusinessMembershipDataSource;

  constructor(dataSource: BusinessMembershipDataSource) {
    this.dataSource = dataSource;
  }

  async getMembership(businessId: string, userId: string): Promise<BusinessMembership | null> {
    return this.dataSource.getMembership(businessId, userId);
  }

  async getMembershipsByUser(userId: string): Promise<BusinessMembership[]> {
    return this.dataSource.getMembershipsByUser(userId);
  }

  async getMembershipsByBusiness(businessId: string): Promise<BusinessMembership[]> {
    return this.dataSource.getMembershipsByBusiness(businessId);
  }

  async createMembership(input: CreateMembershipInput, actorUserId?: string): Promise<BusinessMembership> {
    return this.dataSource.createMembership(input, actorUserId);
  }

  async updateRole(input: UpdateMembershipRoleInput): Promise<BusinessMembership> {
    return this.dataSource.updateRole(input);
  }

  async updateStatus(input: UpdateMembershipStatusInput): Promise<BusinessMembership> {
    return this.dataSource.updateStatus(input);
  }
}
