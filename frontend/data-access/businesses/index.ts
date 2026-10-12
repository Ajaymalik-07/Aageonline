/**
 * AageOnline — Business Data Access Layer Barrel
 */

import { LocalBusinessDataSource } from './local-adapter.ts';
import { ApiBusinessDataSource } from './api-adapter.ts';
import { BusinessService } from './service.ts';

export * from './service.ts';
export * from './local-adapter.ts';
export * from './api-adapter.ts';

const useRemoteApi = process.env.NEXT_PUBLIC_USE_REMOTE_API === 'true';

const defaultDataSource = useRemoteApi
  ? new ApiBusinessDataSource(process.env.NEXT_PUBLIC_API_URL || '')
  : new LocalBusinessDataSource();

export const businessService = new BusinessService(defaultDataSource);
