/**
 * AageOnline — Authentication Data Access Entrypoint
 */

import { AuthService } from './service.ts';
import { LocalAuthDataSource } from './local-adapter.ts';
import { ApiAuthDataSource } from './api-adapter.ts';

export * from './service.ts';
export * from './local-adapter.ts';
export * from './api-adapter.ts';

const isProduction =
  process.env.NODE_ENV === 'production' ||
  process.env.APP_ENV === 'production';

export const authService = new AuthService(
  isProduction ? new ApiAuthDataSource() : new LocalAuthDataSource()
);
