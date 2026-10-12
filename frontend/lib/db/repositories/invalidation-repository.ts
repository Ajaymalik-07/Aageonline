/**
 * AageOnline — PostgreSQL Durable Cache Invalidation Repository
 * Milestone 0.19.0: Production Readiness & Distributed State
 *
 * Implements a durable, transaction-safe invalidation outbox:
 * 1. Survives application restarts and pod crashes.
 * 2. Uses PostgreSQL `FOR UPDATE SKIP LOCKED` for concurrent multi-worker processing.
 * 3. Enforces bounded retries (default max 5) with exponential backoff.
 * 4. Tracks terminal failures for operational auditing and administrative intervention.
 * 5. Production persistence guard prevents silent in-memory fallback in live environments.
 */

import type pg from 'pg';
import { getDbPool, isDatabaseConfigured } from '../client.ts';
import { assertProductionPersistence } from '../guard.ts';

export type InvalidationJobStatus =
  | 'PENDING'
  | 'PROCESSING'
  | 'COMPLETED'
  | 'FAILED'
  | 'TERMINAL_FAILED';

export interface DurableInvalidationJob {
  id: string;
  marketId: string;
  paths: string[];
  tags: string[];
  status: InvalidationJobStatus;
  attempts: number;
  maxAttempts: number;
  nextRunAt: string;
  lockedUntil?: string;
  version: number;
  lastError?: string;
  triggerCause: string;
  createdAt: string;
  updatedAt: string;
}

export interface InvalidationJobInput {
  id: string;
  marketId: string;
  paths: string[];
  tags: string[];
  version?: number;
  maxAttempts?: number;
  nextRunAt?: string;
  triggerCause?: string;
}

export interface InvalidationQueueStats {
  pendingCount: number;
  failedCount: number;
  terminalFailedCount: number;
  processingCount: number;
  oldestPendingMinutes: number;
}

// In-memory fallback registry for dev/testing when DATABASE_URL is not configured
const IN_MEMORY_INVALIDATION_JOBS = new Map<string, DurableInvalidationJob>();

export class PostgresInvalidationRepository {
  constructor() {
    assertProductionPersistence();
  }

  private getClient(client?: pg.PoolClient): pg.PoolClient | pg.Pool {
    return client || getDbPool();
  }

  /**
   * Durably enqueues a cache invalidation job.
   */
  async enqueueJob(
    input: InvalidationJobInput,
    client?: pg.PoolClient
  ): Promise<DurableInvalidationJob> {
    const now = new Date();
    const version = input.version ?? 1;
    const maxAttempts = input.maxAttempts ?? 5;
    const nextRunAt = input.nextRunAt ? new Date(input.nextRunAt) : now;
    const triggerCause = input.triggerCause ?? 'SETTLEMENT_COMMITTED';

    if (!isDatabaseConfigured()) {
      assertProductionPersistence();
      const job: DurableInvalidationJob = {
        id: input.id,
        marketId: input.marketId,
        paths: input.paths,
        tags: input.tags,
        status: 'PENDING',
        attempts: 0,
        maxAttempts,
        nextRunAt: nextRunAt.toISOString(),
        version,
        triggerCause,
        createdAt: now.toISOString(),
        updatedAt: now.toISOString(),
      };
      IN_MEMORY_INVALIDATION_JOBS.set(job.id, job);
      return job;
    }

    const db = this.getClient(client);
    await db.query(
      `INSERT INTO cache_invalidation_jobs (
        id, market_id, paths, tags, status, attempts, max_attempts,
        next_run_at, version, trigger_cause, created_at, updated_at
      ) VALUES ($1, $2, $3, $4, 'PENDING', 0, $5, $6, $7, $8, $9, $10)
      ON CONFLICT (id) DO UPDATE SET
        paths = EXCLUDED.paths,
        tags = EXCLUDED.tags,
        next_run_at = EXCLUDED.next_run_at,
        updated_at = NOW()`,
      [
        input.id,
        input.marketId,
        JSON.stringify(input.paths),
        JSON.stringify(input.tags),
        maxAttempts,
        nextRunAt,
        version,
        triggerCause,
        now,
        now,
      ]
    );

    return {
      id: input.id,
      marketId: input.marketId,
      paths: input.paths,
      tags: input.tags,
      status: 'PENDING',
      attempts: 0,
      maxAttempts,
      nextRunAt: nextRunAt.toISOString(),
      version,
      triggerCause,
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
    };
  }

  /**
   * Concurrently claims pending or failed jobs using `SELECT ... FOR UPDATE SKIP LOCKED`.
   * Safe across multiple worker instances running simultaneously.
   */
  async claimNextJobs(
    limit = 10,
    lockDurationSeconds = 60,
    client?: pg.PoolClient
  ): Promise<DurableInvalidationJob[]> {
    if (!isDatabaseConfigured()) {
      assertProductionPersistence();
      const now = Date.now();
      const claimable: DurableInvalidationJob[] = [];
      for (const job of IN_MEMORY_INVALIDATION_JOBS.values()) {
        if (
          (job.status === 'PENDING' || job.status === 'FAILED') &&
          new Date(job.nextRunAt).getTime() <= now &&
          (!job.lockedUntil || new Date(job.lockedUntil).getTime() <= now)
        ) {
          job.status = 'PROCESSING';
          job.lockedUntil = new Date(now + lockDurationSeconds * 1000).toISOString();
          job.updatedAt = new Date().toISOString();
          claimable.push({ ...job });
          if (claimable.length >= limit) break;
        }
      }
      return claimable;
    }

    const db = this.getClient(client);
    const result = await db.query(
      `WITH claimable AS (
        SELECT id FROM cache_invalidation_jobs
        WHERE status IN ('PENDING', 'FAILED')
          AND next_run_at <= NOW()
          AND (locked_until IS NULL OR locked_until < NOW())
        ORDER BY next_run_at ASC
        LIMIT $1
        FOR UPDATE SKIP LOCKED
      )
      UPDATE cache_invalidation_jobs j
      SET status = 'PROCESSING',
          locked_until = NOW() + ($2 || ' seconds')::INTERVAL,
          attempts = j.attempts + 1,
          updated_at = NOW()
      FROM claimable c
      WHERE j.id = c.id
      RETURNING j.id, j.market_id AS "marketId", j.paths, j.tags, j.status,
                j.attempts, j.max_attempts AS "maxAttempts", j.next_run_at AS "nextRunAt",
                j.locked_until AS "lockedUntil", j.version, j.last_error AS "lastError",
                j.trigger_cause AS "triggerCause", j.created_at AS "createdAt",
                j.updated_at AS "updatedAt"`,
      [limit, lockDurationSeconds]
    );

    return result.rows.map((row) => ({
      ...row,
      paths: typeof row.paths === 'string' ? JSON.parse(row.paths) : row.paths,
      tags: typeof row.tags === 'string' ? JSON.parse(row.tags) : row.tags,
      nextRunAt: row.nextRunAt?.toISOString ? row.nextRunAt.toISOString() : String(row.nextRunAt),
      lockedUntil: row.lockedUntil?.toISOString ? row.lockedUntil.toISOString() : row.lockedUntil,
      createdAt: row.createdAt?.toISOString ? row.createdAt.toISOString() : String(row.createdAt),
      updatedAt: row.updatedAt?.toISOString ? row.updatedAt.toISOString() : String(row.updatedAt),
    }));
  }

  /**
   * Marks an invalidation job as COMPLETED.
   */
  async markJobCompleted(jobId: string, client?: pg.PoolClient): Promise<void> {
    if (!isDatabaseConfigured()) {
      assertProductionPersistence();
      const job = IN_MEMORY_INVALIDATION_JOBS.get(jobId);
      if (job) {
        job.status = 'COMPLETED';
        job.lockedUntil = undefined;
        job.updatedAt = new Date().toISOString();
      }
      return;
    }

    const db = this.getClient(client);
    await db.query(
      `UPDATE cache_invalidation_jobs
       SET status = 'COMPLETED',
           locked_until = NULL,
           updated_at = NOW()
       WHERE id = $1`,
      [jobId]
    );
  }

  /**
   * Records a job failure with exponential backoff.
   * If attempts reach or exceed maxAttempts, transitions to TERMINAL_FAILED.
   */
  async markJobFailed(
    jobId: string,
    error: string,
    backoffBaseSeconds = 10,
    client?: pg.PoolClient
  ): Promise<{ status: InvalidationJobStatus; nextRunAt: string }> {
    if (!isDatabaseConfigured()) {
      assertProductionPersistence();
      const job = IN_MEMORY_INVALIDATION_JOBS.get(jobId);
      if (!job) {
        throw new Error(`Job "${jobId}" not found in in-memory invalidation registry.`);
      }
      job.attempts = (job.attempts || 0) + 1;
      job.lastError = error;
      const isTerminal = job.attempts >= job.maxAttempts;
      job.status = isTerminal ? 'TERMINAL_FAILED' : 'FAILED';
      const backoffSec = Math.min(3600, backoffBaseSeconds * Math.pow(2, Math.max(0, job.attempts - 1)));
      job.nextRunAt = new Date(Date.now() + backoffSec * 1000).toISOString();
      job.lockedUntil = undefined;
      job.updatedAt = new Date().toISOString();
      return { status: job.status, nextRunAt: job.nextRunAt };
    }

    const db = this.getClient(client);
    const result = await db.query(
      `UPDATE cache_invalidation_jobs
       SET status = CASE 
             WHEN attempts >= max_attempts THEN 'TERMINAL_FAILED'
             ELSE 'FAILED'
           END,
           last_error = $2,
           locked_until = NULL,
           next_run_at = NOW() + (LEAST(3600, $3 * POWER(2, GREATEST(0, attempts - 1))) || ' seconds')::INTERVAL,
           updated_at = NOW()
       WHERE id = $1
       RETURNING status, next_run_at AS "nextRunAt"`,
      [jobId, error, backoffBaseSeconds]
    );

    if (result.rows.length === 0) {
      throw new Error(`Invalidation job "${jobId}" not found.`);
    }

    const row = result.rows[0];
    return {
      status: row.status as InvalidationJobStatus,
      nextRunAt: row.nextRunAt?.toISOString ? row.nextRunAt.toISOString() : String(row.nextRunAt),
    };
  }

  /**
   * Returns operational queue metrics for administrative overview.
   */
  async getInvalidationStats(): Promise<InvalidationQueueStats> {
    if (!isDatabaseConfigured()) {
      assertProductionPersistence();
      let pendingCount = 0;
      let failedCount = 0;
      let terminalFailedCount = 0;
      let processingCount = 0;
      let oldestPendingMs = Infinity;

      for (const job of IN_MEMORY_INVALIDATION_JOBS.values()) {
        if (job.status === 'PENDING') {
          pendingCount++;
          oldestPendingMs = Math.min(oldestPendingMs, new Date(job.createdAt).getTime());
        } else if (job.status === 'FAILED') {
          failedCount++;
        } else if (job.status === 'TERMINAL_FAILED') {
          terminalFailedCount++;
        } else if (job.status === 'PROCESSING') {
          processingCount++;
        }
      }

      const oldestPendingMinutes =
        oldestPendingMs !== Infinity ? Math.round((Date.now() - oldestPendingMs) / 60000) : 0;

      return {
        pendingCount,
        failedCount,
        terminalFailedCount,
        processingCount,
        oldestPendingMinutes,
      };
    }

    const pool = getDbPool();
    const result = await pool.query(`
      SELECT 
        COUNT(*) FILTER (WHERE status = 'PENDING') AS "pendingCount",
        COUNT(*) FILTER (WHERE status = 'FAILED') AS "failedCount",
        COUNT(*) FILTER (WHERE status = 'TERMINAL_FAILED') AS "terminalFailedCount",
        COUNT(*) FILTER (WHERE status = 'PROCESSING') AS "processingCount",
        COALESCE(
          EXTRACT(EPOCH FROM (NOW() - MIN(created_at) FILTER (WHERE status IN ('PENDING', 'FAILED')))) / 60,
          0
        ) AS "oldestPendingMinutes"
      FROM cache_invalidation_jobs
    `);

    const row = result.rows[0] || {};
    return {
      pendingCount: parseInt(row.pendingCount || '0', 10),
      failedCount: parseInt(row.failedCount || '0', 10),
      terminalFailedCount: parseInt(row.terminalFailedCount || '0', 10),
      processingCount: parseInt(row.processingCount || '0', 10),
      oldestPendingMinutes: Math.round(parseFloat(row.oldestPendingMinutes || '0')),
    };
  }
}

/**
 * Resets in-memory test store.
 */
export function resetDurableInvalidationStoreForTesting(): void {
  IN_MEMORY_INVALIDATION_JOBS.clear();
}
