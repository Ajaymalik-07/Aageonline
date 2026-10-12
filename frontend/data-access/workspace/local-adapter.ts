/**
 * AageOnline — Local Business Workspace Data Source Adapter
 */

import type { BusinessWorkspaceDataSource } from './service.ts';
import type { BusinessEntity } from '../../types/business.ts';
import type {
  UpdateBusinessProfileInput,
  WorkspaceContext,
  WorkspaceMarketItem,
  WorkspaceOverviewData,
} from '../../types/workspace.ts';
import {
  getWorkspaceMarkets,
  getWorkspaceOverview,
  resolveWorkspaceContext,
  updateWorkspaceProfile,
} from '../../lib/workspace/store.ts';

export class LocalBusinessWorkspaceDataSource implements BusinessWorkspaceDataSource {
  async resolveContext(userId: string, targetBusinessId?: string): Promise<WorkspaceContext> {
    return resolveWorkspaceContext(userId, targetBusinessId);
  }

  async getOverview(businessId: string, userId: string): Promise<WorkspaceOverviewData> {
    return getWorkspaceOverview(businessId, userId);
  }

  async getMarkets(businessId: string, userId: string): Promise<WorkspaceMarketItem[]> {
    return getWorkspaceMarkets(businessId, userId);
  }

  async updateProfile(input: UpdateBusinessProfileInput, userId: string): Promise<BusinessEntity> {
    return updateWorkspaceProfile(input, userId);
  }
}
