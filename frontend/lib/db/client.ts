/**
 * AageOnline — Production Database Client & Connection Pool Manager
 *
 * Provides connection pooling, transaction execution, connectivity health checks,
 * and strict production persistence assertion.
 *
 * Invariant: Never silently fall back to in-memory financial storage in production.
 */

import pg from 'pg';
import {
  type DatabaseConfig,
  getDatabaseConfig,
  isDatabaseConfigured,
  isProductionPersistenceRequired,
  isProductionEnvironment,
  assertProductionPersistence,
} from './guard.ts';

export type { DatabaseConfig };
export {
  getDatabaseConfig,
  isDatabaseConfigured,
  isProductionPersistenceRequired,
  isProductionEnvironment,
  assertProductionPersistence,
};

const { Pool } = pg;

let poolInstance: pg.Pool | null = null;

/**
 * Returns the singleton connection pool.
 */
export function getDbPool(): pg.Pool {
  if (!isDatabaseConfigured()) {
    throw new Error(
      'Cannot initialize PostgreSQL connection pool: DATABASE_URL environment variable is not defined.'
    );
  }

  if (!poolInstance) {
    const config = getDatabaseConfig();
    poolInstance = new Pool({
      connectionString: config.connectionString,
      max: config.maxConnections,
      idleTimeoutMillis: config.idleTimeoutMillis,
      connectionTimeoutMillis: config.connectionTimeoutMillis,
      statement_timeout: config.statementTimeoutMillis,
      ssl: config.ssl,
    });

    poolInstance.on('error', (err) => {
      console.error('Unexpected error on idle PostgreSQL client pool:', err);
    });
  }

  return poolInstance;
}

export interface DbPoolMetrics {
  totalCount: number;
  idleCount: number;
  waitingCount: number;
  maxConnections: number;
}

/**
 * Returns current connection pool metrics for telemetry and health audits.
 */
export function getPoolMetrics(): DbPoolMetrics | null {
  if (!poolInstance) return null;
  return {
    totalCount: poolInstance.totalCount,
    idleCount: poolInstance.idleCount,
    waitingCount: poolInstance.waitingCount,
    maxConnections: (poolInstance as unknown as { options?: { max?: number } }).options?.max || 10,
  };
}

/**
 * Closes the connection pool (used during graceful shutdown and testing).
 */
export async function closeDbPool(): Promise<void> {
  if (poolInstance) {
    await poolInstance.end();
    poolInstance = null;
  }
}

/**
 * Executes a query against the connection pool.
 */
export async function query<T extends pg.QueryResultRow = pg.QueryResultRow>(
  text: string,
  params?: unknown[]
): Promise<pg.QueryResult<T>> {
  const pool = getDbPool();
  return pool.query<T>(text, params);
}

/**
 * Executes a callback within a managed PostgreSQL transaction (BEGIN ... COMMIT / ROLLBACK).
 */
export async function withTransaction<T>(
  callback: (client: pg.PoolClient) => Promise<T>
): Promise<T> {
  const pool = getDbPool();
  const client = await pool.connect();

  try {
    await client.query('BEGIN');
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    try {
      await client.query('ROLLBACK');
    } catch (rollbackError) {
      console.error('Failed to rollback transaction:', rollbackError);
    }
    throw error;
  } finally {
    client.release();
  }
}

export interface HealthCheckResult {
  healthy: boolean;
  configured: boolean;
  latencyMs?: number;
  error?: string;
}

/**
 * Checks connectivity to the PostgreSQL database with a bounded timeout.
 */
export async function checkDatabaseHealth(): Promise<HealthCheckResult> {
  if (!isDatabaseConfigured()) {
    return {
      healthy: false,
      configured: false,
      error: 'DATABASE_URL is not set.',
    };
  }

  const start = Date.now();
  try {
    const pool = getDbPool();
    await pool.query('SELECT 1 AS health_check');
    const latencyMs = Date.now() - start;
    return {
      healthy: true,
      configured: true,
      latencyMs,
    };
  } catch (error) {
    return {
      healthy: false,
      configured: true,
      latencyMs: Date.now() - start,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}
