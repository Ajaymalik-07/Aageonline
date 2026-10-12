/**
 * AageOnline — Production Persistence & Configuration Guards
 *
 * Lightweight, zero-dependency environment guards that run safely in both
 * server and browser/client contexts without pulling Node.js-only driver packages.
 *
 * Invariant: Never silently fall back to in-memory financial storage in production.
 */

export interface DatabaseConfig {
  connectionString?: string;
  maxConnections?: number;
  idleTimeoutMillis?: number;
  connectionTimeoutMillis?: number;
  statementTimeoutMillis?: number;
  ssl?: boolean | { rejectUnauthorized: boolean };
}

/**
 * Returns configuration derived strictly from server-side environment variables.
 */
export function getDatabaseConfig(): DatabaseConfig {
  const connectionString = process.env.DATABASE_URL;
  const isProduction = process.env.NODE_ENV === 'production' || process.env.APP_ENV === 'production';
  const sslEnabled = process.env.DATABASE_SSL === 'true' || isProduction;
  const sslRejectUnauthorized = process.env.DATABASE_SSL_REJECT_UNAUTHORIZED !== 'false';

  return {
    connectionString,
    maxConnections: parseInt(process.env.DATABASE_MAX_CONNECTIONS || '10', 10),
    idleTimeoutMillis: parseInt(process.env.DATABASE_IDLE_TIMEOUT_MS || '30000', 10),
    connectionTimeoutMillis: parseInt(process.env.DATABASE_CONNECTION_TIMEOUT_MS || '5000', 10),
    statementTimeoutMillis: parseInt(process.env.DATABASE_STATEMENT_TIMEOUT_MS || '10000', 10),
    ssl: sslEnabled ? { rejectUnauthorized: sslRejectUnauthorized } : undefined,
  };
}

/**
 * Returns whether persistent PostgreSQL database is configured.
 */
export function isDatabaseConfigured(): boolean {
  const url = process.env.DATABASE_URL;
  return typeof url === 'string' && url.trim().length > 0;
}

/**
 * Returns whether persistent PostgreSQL mode is mandatory.
 */
export function isProductionPersistenceRequired(): boolean {
  // During static bundle build / compilation phase, allow build to succeed without requiring active database connection
  if (process.env.NEXT_PHASE === 'phase-production-build') {
    return false;
  }
  return (
    process.env.NODE_ENV === 'production' ||
    process.env.APP_ENV === 'production' ||
    process.env.PERSISTENCE_MODE === 'postgres'
  );
}

/**
 * Production persistence safety invariant:
 * In production or PERSISTENCE_MODE=postgres, this MUST throw if DATABASE_URL is missing.
 */
export function assertProductionPersistence(): void {
  if (isProductionPersistenceRequired() && !isDatabaseConfigured()) {
    throw new Error(
      'CRITICAL CONFIGURATION ERROR: Production mode requires a persistent PostgreSQL database. ' +
      'DATABASE_URL is not configured. Silently falling back to in-memory financial storage is strictly forbidden.'
    );
  }
}
