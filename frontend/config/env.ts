/**
 * Client-safe environment configuration.
 * Strictly prevents secret leakage by validating only public environment variables.
 */

export const env = {
  APP_ENV: process.env.NODE_ENV || 'development',
  APP_URL: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
  API_BASE_URL: process.env.NEXT_PUBLIC_API_URL || '/api/v1',
  IS_PRODUCTION: process.env.NODE_ENV === 'production',
  IS_DEVELOPMENT: process.env.NODE_ENV !== 'production',
  ENABLE_ANALYTICS: process.env.NEXT_PUBLIC_ENABLE_ANALYTICS === 'true',
} as const;

export function validateClientEnv(): boolean {
  if (typeof window !== 'undefined') {
    // Assert that no server secret was accidentally exposed to the client
    const forbiddenKeys = ['DATABASE_URL', 'AUTH_SECRET', 'PAYMENT_SECRET', 'PAYMENT_KEY'];
    for (const key of forbiddenKeys) {
      if ((window as unknown as Record<string, unknown>)[key]) {
        console.error(`CRITICAL SECURITY VIOLATION: ${key} leaked to client environment!`);
        return false;
      }
    }
  }
  return true;
}
