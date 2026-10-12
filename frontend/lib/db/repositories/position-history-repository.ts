/**
 * AageOnline — PostgreSQL Position History Repository
 *
 * Implements append-only persistence for PositionHistory records.
 * Row updates and deletions are strictly forbidden by architectural rules.
 */

import type pg from 'pg';
import type { PositionHistoryRecord } from '../../../types/ranking-settlement.ts';
import { getDbPool } from '../client.ts';

export class PostgresPositionHistoryRepository {
  private getClient(client?: pg.PoolClient): pg.PoolClient | pg.Pool {
    return client || getDbPool();
  }

  async appendHistoryRecord(
    record: PositionHistoryRecord,
    client?: pg.PoolClient
  ): Promise<PositionHistoryRecord> {
    const db = this.getClient(client);
    await db.query(
      `INSERT INTO position_history (
        id, business_id, market_id, previous_position, new_position,
        cause, payment_order_id, bid_intent_id, ranking_settlement_id, created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
      [
        record.id,
        record.businessId,
        record.marketId,
        record.previousPosition ?? null,
        record.newPosition,
        record.cause,
        record.paymentOrderId || null,
        record.bidIntentId || null,
        record.rankingSettlementId,
        new Date(record.createdAt),
      ]
    );

    return record;
  }

  async getHistoryByBusiness(
    businessId: string,
    limit = 50,
    client?: pg.PoolClient
  ): Promise<PositionHistoryRecord[]> {
    const db = this.getClient(client);
    const result = await db.query(
      `SELECT id, business_id AS "businessId", market_id AS "marketId",
              previous_position AS "previousPosition", new_position AS "newPosition",
              cause, payment_order_id AS "paymentOrderId", bid_intent_id AS "bidIntentId",
              ranking_settlement_id AS "rankingSettlementId", created_at AS "createdAt"
       FROM position_history
       WHERE business_id = $1
       ORDER BY created_at DESC
       LIMIT $2`,
      [businessId, limit]
    );

    return result.rows.map((row) => this.mapRow(row));
  }

  async getHistoryByMarket(
    marketId: string,
    limit = 50,
    client?: pg.PoolClient
  ): Promise<PositionHistoryRecord[]> {
    const db = this.getClient(client);
    const result = await db.query(
      `SELECT id, business_id AS "businessId", market_id AS "marketId",
              previous_position AS "previousPosition", new_position AS "newPosition",
              cause, payment_order_id AS "paymentOrderId", bid_intent_id AS "bidIntentId",
              ranking_settlement_id AS "rankingSettlementId", created_at AS "createdAt"
       FROM position_history
       WHERE market_id = $1
       ORDER BY created_at DESC
       LIMIT $2`,
      [marketId, limit]
    );

    return result.rows.map((row) => this.mapRow(row));
  }

  async getHistoryBySettlement(
    rankingSettlementId: string,
    client?: pg.PoolClient
  ): Promise<PositionHistoryRecord[]> {
    const db = this.getClient(client);
    const result = await db.query(
      `SELECT id, business_id AS "businessId", market_id AS "marketId",
              previous_position AS "previousPosition", new_position AS "newPosition",
              cause, payment_order_id AS "paymentOrderId", bid_intent_id AS "bidIntentId",
              ranking_settlement_id AS "rankingSettlementId", created_at AS "createdAt"
       FROM position_history
       WHERE ranking_settlement_id = $1
       ORDER BY new_position ASC`,
      [rankingSettlementId]
    );

    return result.rows.map((row) => this.mapRow(row));
  }

  private mapRow(row: Record<string, unknown>): PositionHistoryRecord {
    return {
      id: String(row.id),
      businessId: String(row.businessId),
      marketId: String(row.marketId),
      previousPosition: row.previousPosition !== null && row.previousPosition !== undefined
        ? Number(row.previousPosition)
        : null,
      newPosition: Number(row.newPosition),
      cause: 'PAID_VISIBILITY_SETTLEMENT',
      paymentOrderId: String(row.paymentOrderId || ''),
      bidIntentId: String(row.bidIntentId || ''),
      rankingSettlementId: String(row.rankingSettlementId),
      createdAt: new Date(row.createdAt as string | Date).toISOString(),
    };
  }
}
