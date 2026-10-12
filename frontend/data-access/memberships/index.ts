/**
 * AageOnline — Business Membership Data Access Entrypoint
 */

import { BusinessMembershipService } from './service.ts';
import { LocalBusinessMembershipDataSource } from './local-adapter.ts';
import { ApiBusinessMembershipDataSource } from './api-adapter.ts';

export * from './service.ts';
export * from './local-adapter.ts';
export * from './api-adapter.ts';

const isProductionApiConfigured = false;

export const businessMembershipService = new BusinessMembershipService(
  isProductionApiConfigured
    ? new ApiBusinessMembershipDataSource()
    : new LocalBusinessMembershipDataSource()
);
