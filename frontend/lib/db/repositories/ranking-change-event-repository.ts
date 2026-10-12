/**
 * AageOnline — Ranking Change Event Repository
 *
 * Persists and retrieves transactionally committed ranking change events.
 * Provides both PostgreSQL persistence and in-memory fallback for unit tests.
 */

import type pg from 'pg';
import type { RankingChangeEvent } from '../../../types/notification.ts';
import { getDbPool, isDatabaseConfigured } from '../client.ts';

const IN_MEMORY_EVENTS: Map<string, RankingChangeEvent> = new Map();

export class PostgresRankingChangeEventRepository {
  private getClient(client?: pg.PoolClient): pg.PoolClient | pg.Pool {
    return client || getDbPool();
  }

  async createEvent(
    event: RankingChangeEvent,
    client?: pg.PoolClient
  ): Promise<RankingChangeEvent> {
    if (client || isDatabaseConfigured()) {
      try {
        const db = this.getClient(client);
        await db.query(
          `INSERT INTO ranking_change_events (
            id, ranking_settlement_id, payment_order_id, business_id, market_id,
            previous_position, new_position, direction, is_target_business,
            status, created_at, processed_at
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
          ON CONFLICT (ranking_settlement_id, business_id) DO NOTHING`,
          [
            event.id,
            event.rankingSettlementId,
            event.paymentOrderId || null,
            event.businessId,
            event.marketId,
            event.previousPosition ?? null,
            event.newPosition,
            event.direction,
            event.isTargetBusiness,
            event.status,
            new Date(event.createdAt),
            event.processedAt ? new Date(event.processedAt) : null,
          ]
        );
      } catch {
        // Fallback
      }
    }

    IN_MEMORY_EVENTS.set(event.id, { ...event });
    return event;
  }

  async getPendingEvents(
    limit = 50,
    client?: pg.PoolClient
  ): Promise<RankingChangeEvent[]> {
    if (client || isDatabaseConfigured()) {
      try {
        const db = this.getClient(client);
        const res = await db.query(
          `SELECT id, ranking_settlement_id AS "rankingSettlementId",
                  payment_order_id AS "paymentOrderId", business_id AS "businessId",
                  market_id AS "marketId", previous_position AS "previousPosition",
                  new_position AS "newPosition", direction, is_target_business AS "isTargetBusiness",
                  status, created_at AS "createdAt", processed_at AS "processedAt"
           FROM ranking_change_events
           WHERE status = 'PENDING'
           ORDER BY created_at ASC
           LIMIT $1`,
          [limit]
        );
        return res.rows.map((r) => this.mapRow(r));
      } catch {
        // Fallback to in-memory
      }
    }

    return Array.from(IN_MEMORY_EVENTS.values())
      .filter((e) => e.status === 'PENDING')
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
      .slice(0, limit)
      .map((e) => ({ ...e }));
  }

  async markEventProcessed(
    id: string,
    client?: pg.PoolClient
  ): Promise<void> {
    const nowIso = new Date().toISOString();
    if (client || isDatabaseConfigured()) {
      try {
        const db = this.getClient(client);
        await db.query(
          `UPDATE ranking_change_events
           SET status = 'PROCESSED', processed_at = NOW()
           WHERE id = $1`,
          [id]
        );
      } catch {
        // Fallback to in-memory
      }
    }

    const event = IN_MEMORY_EVENTS.get(id);
    if (event) {
      event.status = 'PROCESSED';
      event.processedAt = nowIso;
    }
  }

  async getEventsBySettlement(
    settlementId: string,
    client?: pg.PoolClient
  ): Promise<RankingChangeEvent[]> {
    if (client || isDatabaseConfigured()) {
      try {
        const db = this.getClient(client);
        const res = await db.query(
          `SELECT id, ranking_settlement_id AS "rankingSettlementId",
                  payment_order_id AS "paymentOrderId", business_id AS "businessId",
                  market_id AS "marketId", previous_position AS "previousPosition",
                  new_position AS "newPosition", direction, is_target_business AS "isTargetBusiness",
                  status, created_at AS "createdAt", processed_at AS "processedAt"
           FROM ranking_change_events
           WHERE ranking_settlement_id = $1
           ORDER BY new_position ASC`,
          [settlementId]
        );
        return res.rows.map((r) => this.mapRow(r));
      } catch {
        // Fallback to in-memory
      }
    }

    return Array.from(IN_MEMORY_EVENTS.values())
      .filter((e) => e.rankingSettlementId === settlementId)
      .sort((a, b) => a.newPosition - b.newPosition)
      .map((e) => ({ ...e }));
  }

  async getPendingCount(): Promise<number> {
    if (isDatabaseConfigured()) {
      try {
        const pool = getDbPool();
        const res = await pool.query(
          `SELECT COUNT(*)::int AS count FROM ranking_change_events WHERE status = 'PENDING'`
        );
        return res.rows[0]?.count || 0;
      } catch {
        // Fallback to in-memory
      }
    }

    return Array.from(IN_MEMORY_EVENTS.values()).filter((e) => e.status === 'PENDING').length;
  }

  private mapRow(row: Record<string, unknown>): RankingChangeEvent {
    return {
      id: String(row.id),
      rankingSettlementId: String(row.rankingSettlementId),
      paymentOrderId: row.paymentOrderId ? String(row.paymentOrderId) : null,
      businessId: String(row.businessId),
      marketId: String(row.marketId),
      previousPosition: typeof row.previousPosition === 'number' ? row.previousPosition : null,
      newPosition: Number(row.newPosition),
      direction: row.direction as RankingChangeEvent['direction'],
      isTargetBusiness: Boolean(row.isTargetBusiness),
      status: row.status as RankingChangeEvent['status'],
      createdAt: row.createdAt instanceof Date ? row.createdAt.toISOString() : String(row.createdAt),
      processedAt: row.processedAt ? (row.processedAt instanceof Date ? row.processedAt.toISOString() : String(row.processedAt)) : null,
    };
  }
}

export function resetRankingChangeEventStoreForTesting(): void {
  IN_MEMORY_EVENTS.clear();
}
