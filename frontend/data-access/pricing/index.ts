/**
 * AageOnline — Pricing Data Access Entrypoint
 */

import { PricingService } from './service.ts';
import { LocalPricingDataSource } from './local-adapter.ts';
import { ApiPricingDataSource } from './api-adapter.ts';

export * from './service.ts';
export * from './local-adapter.ts';
export * from './api-adapter.ts';

const isProductionApiConfigured = false;

export const pricingService = new PricingService(
  isProductionApiConfigured ? new ApiPricingDataSource() : new LocalPricingDataSource()
);
