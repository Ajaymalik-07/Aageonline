/**
 * AageOnline — PostgreSQL Settlement Recovery & Outbox Repository
 *
 * Implements durable recovery jobs with SKIP LOCKED concurrency claiming,
 * bounded retries, and exponential backoff.
 */

import type pg from 'pg';
import { getDbPool } from '../client.ts';

export type RecoveryJobType =
  | 'SETTLE_CONFIRMED_PAYMENT'
  | 'RECONCILE_PAYMENT'
  | 'PROCESS_PAYMENT_WEBHOOK';

export type RecoveryJobStatus =
  | 'PENDING'
  | 'PROCESSING'
  | 'COMPLETED'
  | 'FAILED'
  | 'RETRYABLE';

export interface SettlementRecoveryJob {
  id: string;
  jobType: RecoveryJobType;
  paymentOrderId?: string;
  marketId?: string;
  businessId?: string;
  status: RecoveryJobStatus;
  attempts: number;
  maxAttempts: number;
  nextRunAt: string;
  lastError?: string;
  payload: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export class PostgresRecoveryRepository {
  private getClient(client?: pg.PoolClient): pg.PoolClient | pg.Pool {
    return client || getDbPool();
  }

  async enqueueJob(
    job: Omit<SettlementRecoveryJob, 'attempts' | 'status' | 'createdAt' | 'updatedAt'>,
    client?: pg.PoolClient
  ): Promise<SettlementRecoveryJob> {
    const db = this.getClient(client);
    const now = new Date();
    await db.query(
      `INSERT INTO settlement_recovery_jobs (
        id, job_type, payment_order_id, market_id, business_id,
        status, attempts, max_attempts, next_run_at, payload,
        created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, 'PENDING', 0, $6, $7, $8, $9, $10)`,
      [
        job.id,
        job.jobType,
        job.paymentOrderId || null,
        job.marketId || null,
        job.businessId || null,
        job.maxAttempts,
        new Date(job.nextRunAt),
        JSON.stringify(job.payload || {}),
        now,
        now,
      ]
    );

    return {
      ...job,
      status: 'PENDING',
      attempts: 0,
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
    };
  }

  /**
   * Concurrently claims pending or retryable jobs using `SELECT ... FOR UPDATE SKIP LOCKED`.
   * Multiple recovery worker instances can call this simultaneously without conflicting.
   */
  async claimNextJobs(
    limit = 10,
    lockDurationSeconds = 60,
    client?: pg.PoolClient
  ): Promise<SettlementRecoveryJob[]> {
    const db = this.getClient(client);
    const result = await db.query(
      `WITH claimable AS (
        SELECT id FROM settlement_recovery_jobs
        WHERE status IN ('PENDING', 'RETRYABLE')
          AND next_run_at <= NOW()
          AND (locked_until IS NULL OR locked_until < NOW())
        ORDER BY next_run_at ASC
        LIMIT $1
        FOR UPDATE SKIP LOCKED
      )
      UPDATE settlement_recovery_jobs j
      SET status = 'PROCESSING',
          attempts = j.attempts + 1,
          locked_until = NOW() + ($2 || ' seconds')::INTERVAL,
          updated_at = NOW()
      FROM claimable
      WHERE j.id = claimable.id
      RETURNING j.id, j.job_type AS "jobType", j.payment_order_id AS "paymentOrderId",
                j.market_id AS "marketId", j.business_id AS "businessId",
                j.status, j.attempts, j.max_attempts AS "maxAttempts",
                j.next_run_at AS "nextRunAt", j.last_error AS "lastError",
                j.payload, j.created_at AS "createdAt", j.updated_at AS "updatedAt"`,
      [limit, lockDurationSeconds]
    );

    return result.rows.map((row) => this.mapRow(row));
  }

  async completeJob(id: string, client?: pg.PoolClient): Promise<void> {
    const db = this.getClient(client);
    await db.query(
      `UPDATE settlement_recovery_jobs
       SET status = 'COMPLETED',
           locked_until = NULL,
           updated_at = NOW()
       WHERE id = $1`,
      [id]
    );
  }

  async failJob(
    id: string,
    error: string,
    isPermanent = false,
    client?: pg.PoolClient
  ): Promise<void> {
    const db = this.getClient(client);
    // Exponential backoff: base 10 seconds * 2^attempts, capped at 15 minutes
    await db.query(
      `UPDATE settlement_recovery_jobs
       SET status = CASE
             WHEN $2 = true OR attempts >= max_attempts THEN 'FAILED'
             ELSE 'RETRYABLE'
           END,
           next_run_at = CASE
             WHEN $2 = true OR attempts >= max_attempts THEN next_run_at
             ELSE NOW() + LEAST(INTERVAL '900 seconds', (INTERVAL '10 seconds' * POWER(2, attempts)))
           END,
           last_error = $3,
           locked_until = NULL,
           updated_at = NOW()
       WHERE id = $1`,
      [id, isPermanent, error]
    );
  }

  async getJobById(id: string, client?: pg.PoolClient): Promise<SettlementRecoveryJob | null> {
    const db = this.getClient(client);
    const result = await db.query(
      `SELECT id, job_type AS "jobType", payment_order_id AS "paymentOrderId",
              market_id AS "marketId", business_id AS "businessId",
              status, attempts, max_attempts AS "maxAttempts",
              next_run_at AS "nextRunAt", last_error AS "lastError",
              payload, created_at AS "createdAt", updated_at AS "updatedAt"
       FROM settlement_recovery_jobs
       WHERE id = $1`,
      [id]
    );

    if (result.rows.length === 0) return null;
    return this.mapRow(result.rows[0]);
  }

  async resetJobForRetry(id: string, client?: pg.PoolClient): Promise<void> {
    const db = this.getClient(client);
    await db.query(
      `UPDATE settlement_recovery_jobs
       SET status = 'PENDING',
           next_run_at = NOW(),
           locked_until = NULL,
           updated_at = NOW()
       WHERE id = $1 AND status IN ('FAILED', 'RETRYABLE')`,
      [id]
    );
  }

  async getPaginatedJobs(
    options: {
      page?: number;
      limit?: number;
      status?: string;
    } = {},
    client?: pg.PoolClient
  ): Promise<{ jobs: SettlementRecoveryJob[]; totalCount: number }> {
    const db = this.getClient(client);
    const page = Math.max(1, options.page || 1);
    const limit = Math.min(100, Math.max(1, options.limit || 20));
    const offset = (page - 1) * limit;

    const whereClauses: string[] = [];
    const params: unknown[] = [];

    if (options.status && options.status !== 'ALL') {
      params.push(options.status);
      whereClauses.push(`status = $${params.length}`);
    }

    const whereSql = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

    const countResult = await db.query(
      `SELECT COUNT(*) AS total FROM settlement_recovery_jobs ${whereSql}`,
      params
    );
    const totalCount = parseInt(String(countResult.rows[0]?.total || 0), 10);

    const queryParams = [...params, limit, offset];
    const dataResult = await db.query(
      `SELECT id, job_type AS "jobType", payment_order_id AS "paymentOrderId",
              market_id AS "marketId", business_id AS "businessId",
              status, attempts, max_attempts AS "maxAttempts",
              next_run_at AS "nextRunAt", last_error AS "lastError",
              payload, created_at AS "createdAt", updated_at AS "updatedAt"
       FROM settlement_recovery_jobs
       ${whereSql}
       ORDER BY created_at DESC
       LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
      queryParams
    );

    return {
      jobs: dataResult.rows.map((row) => this.mapRow(row)),
      totalCount,
    };
  }

  async getRecoveryStats(client?: pg.PoolClient): Promise<{
    pendingCount: number;
    retryableCount: number;
    terminalFailedCount: number;
    processingCount: number;
    overdueEligibleCount: number;
    oldestOverdueMinutes: number;
  }> {
    const db = this.getClient(client);
    const result = await db.query(`
      SELECT
        COUNT(*) FILTER (WHERE status = 'PENDING') AS pending_count,
        COUNT(*) FILTER (WHERE status = 'RETRYABLE') AS retryable_count,
        COUNT(*) FILTER (WHERE status = 'FAILED') AS failed_count,
        COUNT(*) FILTER (WHERE status = 'PROCESSING') AS processing_count,
        COUNT(*) FILTER (WHERE status IN ('PENDING', 'RETRYABLE') AND next_run_at <= NOW()) AS overdue_eligible_count,
        EXTRACT(EPOCH FROM (NOW() - MIN(next_run_at) FILTER (WHERE status IN ('PENDING', 'RETRYABLE') AND next_run_at <= NOW()))) / 60.0 AS oldest_overdue_minutes
      FROM settlement_recovery_jobs
    `);

    const row = result.rows[0] || {};
    return {
      pendingCount: parseInt(String(row.pending_count || 0), 10),
      retryableCount: parseInt(String(row.retryable_count || 0), 10),
      terminalFailedCount: parseInt(String(row.failed_count || 0), 10),
      processingCount: parseInt(String(row.processing_count || 0), 10),
      overdueEligibleCount: parseInt(String(row.overdue_eligible_count || 0), 10),
      oldestOverdueMinutes: Math.round(Number(row.oldest_overdue_minutes || 0)),
    };
  }

  private mapRow(row: Record<string, unknown>): SettlementRecoveryJob {
    return {
      id: String(row.id),
      jobType: row.jobType as RecoveryJobType,
      paymentOrderId: row.paymentOrderId ? String(row.paymentOrderId) : undefined,
      marketId: row.marketId ? String(row.marketId) : undefined,
      businessId: row.businessId ? String(row.businessId) : undefined,
      status: row.status as RecoveryJobStatus,
      attempts: Number(row.attempts),
      maxAttempts: Number(row.maxAttempts),
      nextRunAt: new Date(row.nextRunAt as string | Date).toISOString(),
      lastError: row.lastError ? String(row.lastError) : undefined,
      payload: typeof row.payload === 'string'
        ? JSON.parse(row.payload)
        : (row.payload as Record<string, unknown> || {}),
      createdAt: new Date(row.createdAt as string | Date).toISOString(),
      updatedAt: new Date(row.updatedAt as string | Date).toISOString(),
    };
  }
}
