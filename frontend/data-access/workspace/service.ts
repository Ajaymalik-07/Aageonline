/**
 * AageOnline — Business Workspace Service Contract
 */

import type { BusinessEntity } from '../../types/business.ts';
import type {
  UpdateBusinessProfileInput,
  WorkspaceContext,
  WorkspaceMarketItem,
  WorkspaceOverviewData,
} from '../../types/workspace.ts';

export interface BusinessWorkspaceDataSource {
  resolveContext(userId: string, targetBusinessId?: string): Promise<WorkspaceContext>;
  getOverview(businessId: string, userId: string): Promise<WorkspaceOverviewData>;
  getMarkets(businessId: string, userId: string): Promise<WorkspaceMarketItem[]>;
  updateProfile(input: UpdateBusinessProfileInput, userId: string): Promise<BusinessEntity>;
}

export class BusinessWorkspaceService {
  private readonly dataSource: BusinessWorkspaceDataSource;

  constructor(dataSource: BusinessWorkspaceDataSource) {
    this.dataSource = dataSource;
  }

  async resolveContext(userId: string, targetBusinessId?: string): Promise<WorkspaceContext> {
    return this.dataSource.resolveContext(userId, targetBusinessId);
  }

  async getOverview(businessId: string, userId: string): Promise<WorkspaceOverviewData> {
    return this.dataSource.getOverview(businessId, userId);
  }

  async getMarkets(businessId: string, userId: string): Promise<WorkspaceMarketItem[]> {
    return this.dataSource.getMarkets(businessId, userId);
  }

  async updateProfile(input: UpdateBusinessProfileInput, userId: string): Promise<BusinessEntity> {
    return this.dataSource.updateProfile(input, userId);
  }
}
