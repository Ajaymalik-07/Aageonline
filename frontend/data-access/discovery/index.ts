/**
 * AageOnline — Discovery Data Access Module
 */

import { DiscoveryService } from './service.ts';
import { LocalDiscoveryDataSource } from './local-adapter.ts';

export * from './service.ts';
export * from './local-adapter.ts';

export function createDiscoveryService(): DiscoveryService {
  return new DiscoveryService(new LocalDiscoveryDataSource());
}

export const discoveryService = createDiscoveryService();
