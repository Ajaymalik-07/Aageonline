/**
 * AageOnline — Remote API Business Membership Data Source Adapter
 */

import type { BusinessMembershipDataSource } from './service.ts';
import type {
  BusinessMembership,
  CreateMembershipInput,
  UpdateMembershipRoleInput,
  UpdateMembershipStatusInput,
} from '../../types/membership.ts';

export class ApiBusinessMembershipDataSource implements BusinessMembershipDataSource {
  private readonly baseUrl: string;

  constructor(baseUrl = '') {
    this.baseUrl = baseUrl;
  }

  async getMembership(businessId: string, userId: string): Promise<BusinessMembership | null> {
    const res = await fetch(`${this.baseUrl}/api/businesses/${businessId}/members/${userId}`);
    if (res.status === 404 || res.status === 401 || res.status === 403) return null;
    if (!res.ok) throw new Error(`Failed to fetch membership: ${res.statusText}`);
    const data = await res.json();
    return (data as { membership: BusinessMembership }).membership;
  }

  async getMembershipsByUser(userId: string): Promise<BusinessMembership[]> {
    const res = await fetch(`${this.baseUrl}/api/users/${userId}/memberships`);
    if (!res.ok) throw new Error(`Failed to fetch memberships: ${res.statusText}`);
    const data = await res.json();
    return (data as { memberships: BusinessMembership[] }).memberships;
  }

  async getMembershipsByBusiness(businessId: string): Promise<BusinessMembership[]> {
    const res = await fetch(`${this.baseUrl}/api/businesses/${businessId}/members`);
    if (!res.ok) throw new Error(`Failed to fetch members: ${res.statusText}`);
    const data = await res.json();
    return (data as { members: BusinessMembership[] }).members;
  }

  async createMembership(input: CreateMembershipInput, actorUserId?: string): Promise<BusinessMembership> {
    const res = await fetch(`${this.baseUrl}/api/businesses/${input.businessId}/members`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...input, actorUserId }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error((err as { message?: string }).message || `Failed to create membership: ${res.statusText}`);
    }
    const data = await res.json();
    return (data as { membership: BusinessMembership }).membership;
  }

  async updateRole(input: UpdateMembershipRoleInput): Promise<BusinessMembership> {
    const res = await fetch(`${this.baseUrl}/api/memberships/${input.membershipId}/role`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error((err as { message?: string }).message || `Failed to update role: ${res.statusText}`);
    }
    const data = await res.json();
    return (data as { membership: BusinessMembership }).membership;
  }

  async updateStatus(input: UpdateMembershipStatusInput): Promise<BusinessMembership> {
    const res = await fetch(`${this.baseUrl}/api/memberships/${input.membershipId}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error((err as { message?: string }).message || `Failed to update status: ${res.statusText}`);
    }
    const data = await res.json();
    return (data as { membership: BusinessMembership }).membership;
  }
}
