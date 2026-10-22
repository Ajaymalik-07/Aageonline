/**
 * AageOnline — Worker Heartbeat & Liveness Repository
 *
 * Tracks background worker process liveness and heartbeat timestamps.
 * Provides database-backed operational status to administrative readiness audits.
 */

import type pg from 'pg';
import { getDbPool, isDatabaseConfigured } from '../client.ts';

export interface WorkerHeartbeat {
  workerId: string;
  workerType: string;
  lastHeartbeatAt: string;
  status: 'ACTIVE' | 'STOPPED' | 'STALE';
  metadata: Record<string, unknown>;
}

const MEMORY_HEARTBEATS: Map<string, WorkerHeartbeat> = new Map();

export class PostgresHeartbeatRepository {
  private getClient(client?: pg.PoolClient): pg.PoolClient | pg.Pool {
    return client || getDbPool();
  }

  async recordHeartbeat(
    workerId: string,
    workerType: string,
    metadata: Record<string, unknown> = {},
    statusOrClient?: WorkerHeartbeat['status'] | pg.PoolClient,
    client?: pg.PoolClient
  ): Promise<WorkerHeartbeat> {
    const nowIso = new Date().toISOString();

    let explicitStatus: WorkerHeartbeat['status'] | undefined;
    let effectiveClient = client;

    if (statusOrClient) {
      if (typeof statusOrClient === 'string') {
        explicitStatus = statusOrClient;
      } else {
        effectiveClient = statusOrClient;
      }
    }

    const resolvedStatus: WorkerHeartbeat['status'] =
      explicitStatus ||
      (typeof metadata.status === 'string' && (['ACTIVE', 'STOPPED', 'STALE'] as const).includes(metadata.status as any)
        ? (metadata.status as WorkerHeartbeat['status'])
        : 'ACTIVE');

    const heartbeat: WorkerHeartbeat = {
      workerId,
      workerType,
      lastHeartbeatAt: nowIso,
      status: resolvedStatus,
      metadata,
    };

    if (!isDatabaseConfigured()) {
      MEMORY_HEARTBEATS.set(workerId, heartbeat);
      return heartbeat;
    }

    const db = this.getClient(effectiveClient);
    await db.query(
      `INSERT INTO worker_heartbeats (worker_id, worker_type, last_heartbeat_at, status, metadata)
       VALUES ($1, $2, NOW(), $3, $4)
       ON CONFLICT (worker_id)
       DO UPDATE SET
         last_heartbeat_at = NOW(),
         status = $3,
         metadata = $4`,
      [workerId, workerType, resolvedStatus, JSON.stringify(metadata)]
    );

    return heartbeat;
  }

  async getLatestHeartbeat(
    workerType = 'reconciler-worker',
    client?: pg.PoolClient
  ): Promise<WorkerHeartbeat | null> {
    if (!isDatabaseConfigured()) {
      const filtered = Array.from(MEMORY_HEARTBEATS.values())
        .filter((h) => h.workerType === workerType)
        .sort((a, b) => new Date(b.lastHeartbeatAt).getTime() - new Date(a.lastHeartbeatAt).getTime());
      return filtered[0] || null;
    }

    const db = this.getClient(client);
    const result = await db.query(
      `SELECT worker_id AS "workerId", worker_type AS "workerType",
              last_heartbeat_at AS "lastHeartbeatAt", status, metadata
       FROM worker_heartbeats
       WHERE worker_type = $1
       ORDER BY last_heartbeat_at DESC
       LIMIT 1`,
      [workerType]
    );

    if (result.rows.length === 0) return null;
    return this.mapRow(result.rows[0]);
  }

  async getAllHeartbeats(client?: pg.PoolClient): Promise<WorkerHeartbeat[]> {
    if (!isDatabaseConfigured()) {
      return Array.from(MEMORY_HEARTBEATS.values());
    }

    const db = this.getClient(client);
    const result = await db.query(
      `SELECT worker_id AS "workerId", worker_type AS "workerType",
              last_heartbeat_at AS "lastHeartbeatAt", status, metadata
       FROM worker_heartbeats
       ORDER BY last_heartbeat_at DESC`
    );

    return result.rows.map(this.mapRow);
  }

  public mapRow(row: Record<string, unknown>): WorkerHeartbeat {
    const rawMetadata = typeof row.metadata === 'string'
      ? JSON.parse(row.metadata)
      : (row.metadata as Record<string, unknown> || {});

    const rawStatus = row.status as string;
    let status: WorkerHeartbeat['status'] = 'ACTIVE';
    if (rawStatus === 'ACTIVE' || rawStatus === 'STOPPED' || rawStatus === 'STALE') {
      status = rawStatus;
    } else if (rawMetadata.status === 'STOPPED' || rawMetadata.status === 'ACTIVE' || rawMetadata.status === 'STALE') {
      status = rawMetadata.status as WorkerHeartbeat['status'];
    }

    return {
      workerId: String(row.workerId),
      workerType: String(row.workerType),
      lastHeartbeatAt: new Date(row.lastHeartbeatAt as string | Date).toISOString(),
      status,
      metadata: rawMetadata,
    };
  }
}

export function resetHeartbeatStoreForTesting(): void {
  MEMORY_HEARTBEATS.clear();
}
