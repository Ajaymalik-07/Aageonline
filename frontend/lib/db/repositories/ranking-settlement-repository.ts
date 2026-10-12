/**
 * AageOnline — PostgreSQL Ranking Settlement Repository
 *
 * Persists RankingSettlement domain entities with unique payment_order_id constraint.
 */

import type pg from 'pg';
import type { RankingSettlement, RankingSettlementStatus } from '../../../types/ranking-settlement.ts';
import { getDbPool } from '../client.ts';

export class PostgresRankingSettlementRepository {
  private getClient(client?: pg.PoolClient): pg.PoolClient | pg.Pool {
    return client || getDbPool();
  }

  async getSettlementById(id: string, client?: pg.PoolClient): Promise<RankingSettlement | null> {
    const db = this.getClient(client);
    const result = await db.query(
      `SELECT id, payment_order_id AS "paymentOrderId", bid_intent_id AS "bidIntentId",
              business_id AS "businessId", market_id AS "marketId", status,
              failure_reason AS "failureReason", target_position AS "targetPosition",
              paid_amount_minor AS "paidAmountMinor", paid_amount_rupees AS "paidAmountRupees",
              previous_position AS "previousPosition", final_position AS "finalPosition",
              created_at AS "createdAt", updated_at AS "updatedAt", settled_at AS "settledAt"
       FROM ranking_settlements
       WHERE id = $1`,
      [id]
    );

    if (result.rows.length === 0) return null;
    return this.mapRow(result.rows[0]);
  }

  async getSettlementByPaymentOrderId(
    paymentOrderId: string,
    client?: pg.PoolClient
  ): Promise<RankingSettlement | null> {
    const db = this.getClient(client);
    const result = await db.query(
      `SELECT id, payment_order_id AS "paymentOrderId", bid_intent_id AS "bidIntentId",
              business_id AS "businessId", market_id AS "marketId", status,
              failure_reason AS "failureReason", target_position AS "targetPosition",
              paid_amount_minor AS "paidAmountMinor", paid_amount_rupees AS "paidAmountRupees",
              previous_position AS "previousPosition", final_position AS "finalPosition",
              created_at AS "createdAt", updated_at AS "updatedAt", settled_at AS "settledAt"
       FROM ranking_settlements
       WHERE payment_order_id = $1`,
      [paymentOrderId]
    );

    if (result.rows.length === 0) return null;
    return this.mapRow(result.rows[0]);
  }

  async getSettlementsByBusiness(
    businessId: string,
    limit = 50,
    client?: pg.PoolClient
  ): Promise<RankingSettlement[]> {
    const db = this.getClient(client);
    const result = await db.query(
      `SELECT id, payment_order_id AS "paymentOrderId", bid_intent_id AS "bidIntentId",
              business_id AS "businessId", market_id AS "marketId", status,
              failure_reason AS "failureReason", target_position AS "targetPosition",
              paid_amount_minor AS "paidAmountMinor", paid_amount_rupees AS "paidAmountRupees",
              previous_position AS "previousPosition", final_position AS "finalPosition",
              created_at AS "createdAt", updated_at AS "updatedAt", settled_at AS "settledAt"
       FROM ranking_settlements
       WHERE business_id = $1
       ORDER BY created_at DESC
       LIMIT $2`,
      [businessId, limit]
    );

    return result.rows.map((row) => this.mapRow(row));
  }

  async createSettlement(
    settlement: RankingSettlement,
    client?: pg.PoolClient
  ): Promise<RankingSettlement> {
    const db = this.getClient(client);
    await db.query(
      `INSERT INTO ranking_settlements (
        id, payment_order_id, bid_intent_id, business_id, market_id,
        status, failure_reason, target_position, paid_amount_minor, paid_amount_rupees,
        previous_position, final_position, created_at, updated_at, settled_at
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15
      )`,
      [
        settlement.id,
        settlement.paymentOrderId,
        settlement.bidIntentId,
        settlement.businessId,
        settlement.marketId,
        settlement.status,
        settlement.failureReason || null,
        settlement.targetPosition,
        settlement.paidAmountMinor,
        settlement.paidAmountRupees,
        settlement.previousPosition ?? null,
        settlement.finalPosition ?? null,
        new Date(settlement.createdAt),
        new Date(settlement.updatedAt),
        settlement.settledAt ? new Date(settlement.settledAt) : null,
      ]
    );

    return settlement;
  }

  async updateSettlement(
    settlement: RankingSettlement,
    client?: pg.PoolClient
  ): Promise<void> {
    const db = this.getClient(client);
    await db.query(
      `UPDATE ranking_settlements
       SET status = $1,
           failure_reason = $2,
           previous_position = $3,
           final_position = $4,
           settled_at = $5,
           updated_at = NOW()
       WHERE id = $6`,
      [
        settlement.status,
        settlement.failureReason || null,
        settlement.previousPosition ?? null,
        settlement.finalPosition ?? null,
        settlement.settledAt ? new Date(settlement.settledAt) : null,
        settlement.id,
      ]
    );
  }

  async getPaginatedSettlements(
    options: {
      page?: number;
      limit?: number;
      status?: string;
    } = {},
    client?: pg.PoolClient
  ): Promise<{ settlements: RankingSettlement[]; totalCount: number }> {
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
      `SELECT COUNT(*) AS total FROM ranking_settlements ${whereSql}`,
      params
    );
    const totalCount = parseInt(String(countResult.rows[0]?.total || 0), 10);

    const queryParams = [...params, limit, offset];
    const dataResult = await db.query(
      `SELECT id, payment_order_id AS "paymentOrderId", bid_intent_id AS "bidIntentId",
              business_id AS "businessId", market_id AS "marketId", status,
              failure_reason AS "failureReason", target_position AS "targetPosition",
              paid_amount_minor AS "paidAmountMinor", paid_amount_rupees AS "paidAmountRupees",
              previous_position AS "previousPosition", final_position AS "finalPosition",
              created_at AS "createdAt", updated_at AS "updatedAt", settled_at AS "settledAt"
       FROM ranking_settlements
       ${whereSql}
       ORDER BY created_at DESC
       LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
      queryParams
    );

    return {
      settlements: dataResult.rows.map((row) => this.mapRow(row)),
      totalCount,
    };
  }

  private mapRow(row: Record<string, unknown>): RankingSettlement {
    return {
      id: String(row.id),
      paymentOrderId: String(row.paymentOrderId),
      bidIntentId: String(row.bidIntentId),
      businessId: String(row.businessId),
      marketId: String(row.marketId),
      status: row.status as RankingSettlementStatus,
      failureReason: row.failureReason ? String(row.failureReason) : undefined,
      targetPosition: Number(row.targetPosition),
      paidAmountMinor: Number(row.paidAmountMinor),
      paidAmountRupees: Number(row.paidAmountRupees),
      previousPosition: row.previousPosition !== null && row.previousPosition !== undefined
        ? Number(row.previousPosition)
        : null,
      finalPosition: row.finalPosition !== null && row.finalPosition !== undefined
        ? Number(row.finalPosition)
        : null,
      createdAt: new Date(row.createdAt as string | Date).toISOString(),
      updatedAt: new Date(row.updatedAt as string | Date).toISOString(),
      settledAt: row.settledAt ? new Date(row.settledAt as string | Date).toISOString() : null,
    };
  }
}
