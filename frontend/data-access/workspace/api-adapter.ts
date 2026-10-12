/**
 * AageOnline — Remote API Business Workspace Data Source Adapter
 */

import type { BusinessWorkspaceDataSource } from './service.ts';
import type { BusinessEntity } from '../../types/business.ts';
import type {
  UpdateBusinessProfileInput,
  WorkspaceContext,
  WorkspaceMarketItem,
  WorkspaceOverviewData,
} from '../../types/workspace.ts';

export class ApiBusinessWorkspaceDataSource implements BusinessWorkspaceDataSource {
  private readonly baseUrl: string;

  constructor(baseUrl = '') {
    this.baseUrl = baseUrl;
  }

  async resolveContext(userId: string, targetBusinessId?: string): Promise<WorkspaceContext> {
    const url = targetBusinessId
      ? `${this.baseUrl}/api/business/workspace?businessId=${encodeURIComponent(targetBusinessId)}`
      : `${this.baseUrl}/api/business/workspace`;
    const res = await fetch(url);
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      const error = new Error((err as { message?: string }).message || `Failed to resolve workspace: ${res.statusText}`);
      (error as unknown as { statusCode: number }).statusCode = res.status;
      throw error;
    }
    const data = await res.json();
    return (data as { context: WorkspaceContext }).context;
  }

  async getOverview(businessId: string, _userId: string): Promise<WorkspaceOverviewData> {
    const res = await fetch(`${this.baseUrl}/api/businesses/${businessId}/workspace`);
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      const error = new Error((err as { message?: string }).message || `Failed to fetch overview: ${res.statusText}`);
      (error as unknown as { statusCode: number }).statusCode = res.status;
      throw error;
    }
    const data = await res.json();
    return (data as { overview: WorkspaceOverviewData }).overview;
  }

  async getMarkets(businessId: string, _userId: string): Promise<WorkspaceMarketItem[]> {
    const res = await fetch(`${this.baseUrl}/api/businesses/${businessId}/markets`);
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      const error = new Error((err as { message?: string }).message || `Failed to fetch markets: ${res.statusText}`);
      (error as unknown as { statusCode: number }).statusCode = res.status;
      throw error;
    }
    const data = await res.json();
    return (data as { markets: WorkspaceMarketItem[] }).markets;
  }

  async updateProfile(input: UpdateBusinessProfileInput, _userId: string): Promise<BusinessEntity> {
    const res = await fetch(`${this.baseUrl}/api/businesses/${input.businessId}/profile`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      const error = new Error((err as { message?: string }).message || `Failed to update profile: ${res.statusText}`);
      (error as unknown as { statusCode: number }).statusCode = res.status;
      throw error;
    }
    const data = await res.json();
    return (data as { business: BusinessEntity }).business;
  }
}
