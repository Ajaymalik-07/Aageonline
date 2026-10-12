/**
 * AageOnline — Locations Data Access Module
 */

import { LocationService } from './service.ts';
import { LocalLocationDataSource } from './local-adapter.ts';

export * from './service.ts';
export * from './local-adapter.ts';
export * from './api-adapter.ts';

export function createLocationService(): LocationService {
  return new LocationService(new LocalLocationDataSource());
}

export const locationService = createLocationService();
