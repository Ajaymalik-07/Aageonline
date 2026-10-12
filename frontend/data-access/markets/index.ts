/**
 * AageOnline — Markets Data Access Module
 */

import { MarketService } from './service.ts';
import { LocalMarketDataSource } from './local-adapter.ts';
import { ApiMarketDataSource } from './api-adapter.ts';

export * from './service.ts';
export * from './validator.ts';
export * from './local-adapter.ts';
export * from './api-adapter.ts';

/**
 * Creates a MarketService configured for the environment.
 */
export function createMarketService(mode?: 'local' | 'api', baseUrl?: string): MarketService {
  const selectedMode =
    mode || (process.env.NEXT_PUBLIC_DATA_SOURCE === 'api' ? 'api' : 'local');

  const dataSource =
    selectedMode === 'api'
      ? new ApiMarketDataSource(baseUrl || process.env.NEXT_PUBLIC_API_URL || '')
      : new LocalMarketDataSource();

  return new MarketService(dataSource);
}

/**
 * Default singleton instance for application use.
 */
export const marketService = createMarketService();
