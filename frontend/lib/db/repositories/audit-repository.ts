/**
 * AageOnline — PostgreSQL Audit Repository
 *
 * Persists immutable security, payment, and ranking settlement audit events.
 */

import type pg from 'pg';
import type { AuditEvent } from '../../../types/audit.ts';
import { getDbPool } from '../client.ts';

export class PostgresAuditRepository {
  private getClient(client?: pg.PoolClient): pg.PoolClient | pg.Pool {
    return client || getDbPool();
  }

  async recordAuditEvent(event: AuditEvent, client?: pg.PoolClient): Promise<AuditEvent> {
    const db = this.getClient(client);
    await db.query(
      `INSERT INTO audit_logs (
        id, event_type, entity_type, entity_id, actor_user_id, metadata, created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [
        event.id,
        event.action,
        event.entityType,
        event.entityId,
        event.actorUserId || null,
        JSON.stringify(event.metadata || {}),
        new Date(event.createdAt),
      ]
    );

    return event;
  }

  async getAuditEventsByEntity(
    entityType: string,
    entityId: string,
    limit = 50,
    client?: pg.PoolClient
  ): Promise<AuditEvent[]> {
    const db = this.getClient(client);
    const result = await db.query(
      `SELECT id, event_type AS "action", entity_type AS "entityType",
              entity_id AS "entityId", actor_user_id AS "actorUserId",
              metadata, created_at AS "createdAt"
       FROM audit_logs
       WHERE entity_type = $1 AND entity_id = $2
       ORDER BY created_at DESC
       LIMIT $3`,
      [entityType, entityId, limit]
    );

    return result.rows.map((row) => ({
      id: String(row.id),
      action: row.action as AuditEvent['action'],
      entityType: row.entityType as AuditEvent['entityType'],
      entityId: String(row.entityId),
      actorUserId: row.actorUserId ? String(row.actorUserId) : undefined,
      metadata: typeof row.metadata === 'string'
        ? JSON.parse(row.metadata)
        : (row.metadata as Record<string, unknown> || {}),
      createdAt: new Date(row.createdAt as string | Date).toISOString(),
    }));
  }
}
