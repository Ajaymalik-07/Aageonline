/**
 * AageOnline — Business Workspace Data Access Entrypoint
 */

import { BusinessWorkspaceService } from './service.ts';
import { LocalBusinessWorkspaceDataSource } from './local-adapter.ts';
import { ApiBusinessWorkspaceDataSource } from './api-adapter.ts';

export * from './service.ts';
export * from './local-adapter.ts';
export * from './api-adapter.ts';

const isProductionApiConfigured = false;

export const businessWorkspaceService = new BusinessWorkspaceService(
  isProductionApiConfigured
    ? new ApiBusinessWorkspaceDataSource()
    : new LocalBusinessWorkspaceDataSource()
);
