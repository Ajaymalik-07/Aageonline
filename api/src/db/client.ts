/**
 * AageOnline API — PostgreSQL Database Client & Connection Pool
 * Milestone 0.20.26: Authoritative Server-Side Persistence
 */

import pg from 'pg';

const { Pool } = pg;

let pool: pg.Pool | null = null;

export function getDatabaseUrl(): string | undefined {
  return process.env.DATABASE_URL;
}

export function isDatabaseConfigured(): boolean {
  const url = getDatabaseUrl();
  return typeof url === 'string' && url.trim().length > 0;
}

/**
 * Returns true when the process is running in a production or postgres-persistence
 * environment where fixture fallbacks are strictly forbidden.
 */
export function isProductionEnvironment(): boolean {
  const nodeEnv = (process.env.NODE_ENV ?? '').toLowerCase().trim();
  const appEnv = (process.env.APP_ENV ?? '').toLowerCase().trim();
  const persistenceMode = (process.env.PERSISTENCE_MODE ?? '').toLowerCase().trim();
  return (
    nodeEnv === 'production' ||
    nodeEnv === 'prod' ||
    appEnv === 'production' ||
    appEnv === 'prod' ||
    persistenceMode === 'postgres' ||
    persistenceMode === 'production'
  );
}

/**
 * Throws a sanitised configuration error when called in a production environment
 * without a valid DATABASE_URL.  Must be called at every financial and ranking
 * mutation entry point (createBidIntent, createPaymentOrder, processPayUWebhook,
 * reconcilePaymentOrder, settleRanking) per Architecture §14.2.
 *
 * The error message deliberately omits the value of DATABASE_URL to prevent
 * accidental credential leakage in logs.
 */
export function assertProductionPersistence(): void {
  if (isProductionEnvironment() && !isDatabaseConfigured()) {
    throw new Error(
      'PRODUCTION_PERSISTENCE_GUARD: DATABASE_URL is missing or blank. ' +
      'The API cannot process real payments or ranking mutations without a ' +
      'configured PostgreSQL database. Set DATABASE_URL and restart the service.'
    );
  }
}

export function getPool(): pg.Pool {
  if (pool) return pool;

  const connectionString = getDatabaseUrl();
  if (!connectionString) {
    throw new Error('DATABASE_URL environment variable is not configured.');
  }

  if (process.env.APP_ENV === 'production' && process.env.DATABASE_SSL_REJECT_UNAUTHORIZED === 'false') {
    throw new Error(
      'SECURITY CONFIGURATION ERROR: Disabling TLS certificate validation (DATABASE_SSL_REJECT_UNAUTHORIZED=false) is strictly forbidden in production.'
    );
  }

  pool = new Pool({
    connectionString,
    max: parseInt(process.env.DATABASE_MAX_CONNECTIONS || process.env.PG_MAX_CONNECTIONS || '10', 10),
    idleTimeoutMillis: parseInt(process.env.DATABASE_IDLE_TIMEOUT_MS || '30000', 10),
    connectionTimeoutMillis: parseInt(process.env.DATABASE_CONNECTION_TIMEOUT_MS || '5000', 10),
    ssl: (connectionString.includes('sslmode=require') || process.env.DATABASE_SSL === 'true' || process.env.NODE_ENV === 'production' || process.env.APP_ENV === 'production')
      ? { rejectUnauthorized: process.env.DATABASE_SSL_REJECT_UNAUTHORIZED !== 'false' }
      : false,
  });

  pool.on('error', (err) => {
    console.error('[API Database Pool Error]', err);
  });

  return pool;
}

export async function query<T extends pg.QueryResultRow = any>(
  text: string,
  params?: any[]
): Promise<pg.QueryResult<T>> {
  const p = getPool();
  const start = Date.now();
  try {
    const res = await p.query<T>(text, params);
    return res;
  } catch (err: any) {
    console.error(`[API DB Query Error] ${err.message} | Query: ${text}`);
    throw err;
  }
}

export async function withTransaction<T>(
  callback: (client: pg.PoolClient) => Promise<T>
): Promise<T> {
  const p = getPool();
  const client = await p.connect();
  try {
    await client.query('BEGIN');
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

export interface DatabaseHealth {
  status: 'CONNECTED' | 'DISCONNECTED' | 'UNCONFIGURED';
  latencyMs?: number;
  poolTotal?: number;
  poolIdle?: number;
  poolWaiting?: number;
  error?: string;
}

export async function checkDatabaseHealth(): Promise<DatabaseHealth> {
  if (!isDatabaseConfigured()) {
    return { status: 'UNCONFIGURED' };
  }

  const start = Date.now();
  try {
    const p = getPool();
    await p.query('SELECT 1 AS probe');
    const latencyMs = Date.now() - start;
    return {
      status: 'CONNECTED',
      latencyMs,
      poolTotal: p.totalCount,
      poolIdle: p.idleCount,
      poolWaiting: p.waitingCount,
    };
  } catch (err: any) {
    return {
      status: 'DISCONNECTED',
      error: err.message,
    };
  }
}

export async function closePool(): Promise<void> {
  if (pool) {
    await pool.end();
    pool = null;
  }
}
