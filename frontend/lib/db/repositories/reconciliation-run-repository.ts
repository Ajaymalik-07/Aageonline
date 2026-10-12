/**
 * AageOnline — PostgreSQL Reconciliation Run History Repository
 *
 * Persists durable audit records for automated and manual payment reconciliation
 * and settlement recovery cycles. Supports in-memory fallback for local dev/testing.
 */

import type pg from 'pg';
import { getDbPool, isDatabaseConfigured } from '../client.ts';

export type ReconciliationRunType =
  | 'PAYMENT_RECONCILIATION'
  | 'SETTLEMENT_RECOVERY'
  | 'FULL_RECONCILIATION';

export type ReconciliationTriggerSource = 'SCHEDULED' | 'MANUAL';
export type ReconciliationRunStatus = 'RUNNING' | 'COMPLETED' | 'FAILED';

export interface ReconciliationRun {
  id: string;
  runType: ReconciliationRunType;
  triggerSource: ReconciliationTriggerSource;
  status: ReconciliationRunStatus;
  startedAt: string;
  completedAt?: string;
  candidateCount: number;
  processedCount: number;
  successfulCount: number;
  retryableCount: number;
  permanentFailedCount: number;
  summary: Record<string, unknown>;
  errorMessage?: string;
  actorUserId?: string;
  createdAt: string;
}

// In-memory fallback registry for dev/testing
const MEMORY_RUNS: Map<string, ReconciliationRun> = new Map();

export class PostgresReconciliationRunRepository {
  private getClient(client?: pg.PoolClient): pg.PoolClient | pg.Pool {
    return client || getDbPool();
  }

  async createRun(
    run: Omit<ReconciliationRun, 'createdAt'>,
    client?: pg.PoolClient
  ): Promise<ReconciliationRun> {
    const nowIso = new Date().toISOString();
    const fullRun: ReconciliationRun = {
      ...run,
      createdAt: nowIso,
    };

    if (!isDatabaseConfigured()) {
      MEMORY_RUNS.set(run.id, { ...fullRun });
      return fullRun;
    }

    const db = this.getClient(client);
    await db.query(
      `INSERT INTO reconciliation_runs (
        id, run_type, trigger_source, status, started_at, completed_at,
        candidate_count, processed_count, successful_count, retryable_count,
        permanent_failed_count, summary, error_message, actor_user_id, created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)`,
      [
        run.id,
        run.runType,
        run.triggerSource,
        run.status,
        new Date(run.startedAt),
        run.completedAt ? new Date(run.completedAt) : null,
        run.candidateCount,
        run.processedCount,
        run.successfulCount,
        run.retryableCount,
        run.permanentFailedCount,
        JSON.stringify(run.summary || {}),
        run.errorMessage || null,
        run.actorUserId || null,
        new Date(fullRun.createdAt),
      ]
    );

    return fullRun;
  }

  async completeRun(
    id: string,
    counts: Partial<
      Pick<
        ReconciliationRun,
        | 'candidateCount'
        | 'processedCount'
        | 'successfulCount'
        | 'retryableCount'
        | 'permanentFailedCount'
        | 'summary'
      >
    >,
    client?: pg.PoolClient
  ): Promise<void> {
    const completedAt = new Date().toISOString();

    if (!isDatabaseConfigured()) {
      const existing = MEMORY_RUNS.get(id);
      if (existing) {
        existing.status = 'COMPLETED';
        existing.completedAt = completedAt;
        if (counts.candidateCount !== undefined) existing.candidateCount = counts.candidateCount;
        if (counts.processedCount !== undefined) existing.processedCount = counts.processedCount;
        if (counts.successfulCount !== undefined) existing.successfulCount = counts.successfulCount;
        if (counts.retryableCount !== undefined) existing.retryableCount = counts.retryableCount;
        if (counts.permanentFailedCount !== undefined) existing.permanentFailedCount = counts.permanentFailedCount;
        if (counts.summary !== undefined) existing.summary = counts.summary;
      }
      return;
    }

    const db = this.getClient(client);
    await db.query(
      `UPDATE reconciliation_runs
       SET status = 'COMPLETED',
           completed_at = NOW(),
           candidate_count = COALESCE($2, candidate_count),
           processed_count = COALESCE($3, processed_count),
           successful_count = COALESCE($4, successful_count),
           retryable_count = COALESCE($5, retryable_count),
           permanent_failed_count = COALESCE($6, permanent_failed_count),
           summary = COALESCE($7::JSONB, summary)
       WHERE id = $1`,
      [
        id,
        counts.candidateCount,
        counts.processedCount,
        counts.successfulCount,
        counts.retryableCount,
        counts.permanentFailedCount,
        counts.summary ? JSON.stringify(counts.summary) : null,
      ]
    );
  }

  async failRun(id: string, errorMessage: string, client?: pg.PoolClient): Promise<void> {
    const completedAt = new Date().toISOString();

    if (!isDatabaseConfigured()) {
      const existing = MEMORY_RUNS.get(id);
      if (existing) {
        existing.status = 'FAILED';
        existing.completedAt = completedAt;
        existing.errorMessage = errorMessage;
      }
      return;
    }

    const db = this.getClient(client);
    await db.query(
      `UPDATE reconciliation_runs
       SET status = 'FAILED',
           completed_at = NOW(),
           error_message = $2
       WHERE id = $1`,
      [id, errorMessage]
    );
  }

  async getRecentRuns(limit = 20, client?: pg.PoolClient): Promise<ReconciliationRun[]> {
    if (!isDatabaseConfigured()) {
      return Array.from(MEMORY_RUNS.values())
        .sort((a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime())
        .slice(0, limit);
    }

    const db = this.getClient(client);
    const result = await db.query(
      `SELECT id, run_type AS "runType", trigger_source AS "triggerSource",
              status, started_at AS "startedAt", completed_at AS "completedAt",
              candidate_count AS "candidateCount", processed_count AS "processedCount",
              successful_count AS "successfulCount", retryable_count AS "retryableCount",
              permanent_failed_count AS "permanentFailedCount", summary,
              error_message AS "errorMessage", actor_user_id AS "actorUserId",
              created_at AS "createdAt"
       FROM reconciliation_runs
       ORDER BY started_at DESC
       LIMIT $1`,
      [limit]
    );

    return result.rows.map(this.mapRow);
  }

  async getLatestSuccessfulRun(
    runType?: ReconciliationRunType,
    client?: pg.PoolClient
  ): Promise<ReconciliationRun | null> {
    if (!isDatabaseConfigured()) {
      const runs = Array.from(MEMORY_RUNS.values())
        .filter((r) => r.status === 'COMPLETED' && (!runType || r.runType === runType))
        .sort((a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime());
      return runs[0] || null;
    }

    const db = this.getClient(client);
    const query = runType
      ? `SELECT id, run_type AS "runType", trigger_source AS "triggerSource",
                status, started_at AS "startedAt", completed_at AS "completedAt",
                candidate_count AS "candidateCount", processed_count AS "processedCount",
                successful_count AS "successfulCount", retryable_count AS "retryableCount",
                permanent_failed_count AS "permanentFailedCount", summary,
                error_message AS "errorMessage", actor_user_id AS "actorUserId",
                created_at AS "createdAt"
         FROM reconciliation_runs
         WHERE status = 'COMPLETED' AND run_type = $1
         ORDER BY started_at DESC
         LIMIT 1`
      : `SELECT id, run_type AS "runType", trigger_source AS "triggerSource",
                status, started_at AS "startedAt", completed_at AS "completedAt",
                candidate_count AS "candidateCount", processed_count AS "processedCount",
                successful_count AS "successfulCount", retryable_count AS "retryableCount",
                permanent_failed_count AS "permanentFailedCount", summary,
                error_message AS "errorMessage", actor_user_id AS "actorUserId",
                created_at AS "createdAt"
         FROM reconciliation_runs
         WHERE status = 'COMPLETED'
         ORDER BY started_at DESC
         LIMIT 1`;

    const params = runType ? [runType] : [];
    const result = await db.query(query, params);
    if (result.rows.length === 0) return null;
    return this.mapRow(result.rows[0]);
  }

  private mapRow(row: Record<string, unknown>): ReconciliationRun {
    return {
      id: String(row.id),
      runType: row.runType as ReconciliationRunType,
      triggerSource: row.triggerSource as ReconciliationTriggerSource,
      status: row.status as ReconciliationRunStatus,
      startedAt: new Date(row.startedAt as string | Date).toISOString(),
      completedAt: row.completedAt ? new Date(row.completedAt as string | Date).toISOString() : undefined,
      candidateCount: Number(row.candidateCount),
      processedCount: Number(row.processedCount),
      successfulCount: Number(row.successfulCount),
      retryableCount: Number(row.retryableCount),
      permanentFailedCount: Number(row.permanentFailedCount),
      summary: typeof row.summary === 'string'
        ? JSON.parse(row.summary)
        : (row.summary as Record<string, unknown> || {}),
      errorMessage: row.errorMessage ? String(row.errorMessage) : undefined,
      actorUserId: row.actorUserId ? String(row.actorUserId) : undefined,
      createdAt: new Date(row.createdAt as string | Date).toISOString(),
    };
  }
}

export function resetReconciliationRunsStoreForTesting(): void {
  MEMORY_RUNS.clear();
}
