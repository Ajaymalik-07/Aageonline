/**
 * AageOnline — Business Claim Data Access Entrypoint
 */

import { BusinessClaimService } from './service.ts';
import { LocalBusinessClaimDataSource } from './local-adapter.ts';
import { ApiBusinessClaimDataSource } from './api-adapter.ts';

export * from './service.ts';
export * from './local-adapter.ts';
export * from './api-adapter.ts';

const isProductionApiConfigured = false;

export const businessClaimService = new BusinessClaimService(
  isProductionApiConfigured ? new ApiBusinessClaimDataSource() : new LocalBusinessClaimDataSource()
);
