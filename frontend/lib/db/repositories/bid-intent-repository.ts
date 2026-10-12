/**
 * AageOnline — PostgreSQL BidIntent Repository
 *
 * Persists BidIntent records and their immutable pricing snapshots with scoped idempotency.
 */

import type pg from 'pg';
import type { BidIntent, BidIntentStatus } from '../../../types/bid-intent.ts';
import { getDbPool } from '../client.ts';

export class PostgresBidIntentRepository {
  private getClient(client?: pg.PoolClient): pg.PoolClient | pg.Pool {
    return client || getDbPool();
  }

  async getBidIntentById(id: string, client?: pg.PoolClient): Promise<BidIntent | null> {
    const db = this.getClient(client);
    const result = await db.query(
      `SELECT id, business_id AS "businessId", market_id AS "marketId",
              created_by_user_id AS "createdByUserId", membership_id AS "membershipId",
              target_position AS "targetPosition", qualifying_amount_minor AS "qualifyingAmountMinor",
              qualifying_amount_rupees AS "qualifyingAmountRupees", currency, status,
              idempotency_key AS "idempotencyKey", pricing_snapshot AS "pricingSnapshot",
              expires_at AS "expiresAt", created_at AS "createdAt", updated_at AS "updatedAt"
       FROM bid_intents
       WHERE id = $1`,
      [id]
    );

    if (result.rows.length === 0) return null;
    return this.mapRow(result.rows[0]);
  }

  async findIdempotentIntent(
    actorUserId: string,
    businessId: string,
    idempotencyKey: string,
    client?: pg.PoolClient
  ): Promise<BidIntent | null> {
    const db = this.getClient(client);
    const result = await db.query(
      `SELECT id, business_id AS "businessId", market_id AS "marketId",
              created_by_user_id AS "createdByUserId", membership_id AS "membershipId",
              target_position AS "targetPosition", qualifying_amount_minor AS "qualifyingAmountMinor",
              qualifying_amount_rupees AS "qualifyingAmountRupees", currency, status,
              idempotency_key AS "idempotencyKey", pricing_snapshot AS "pricingSnapshot",
              expires_at AS "expiresAt", created_at AS "createdAt", updated_at AS "updatedAt"
       FROM bid_intents
       WHERE created_by_user_id = $1 AND business_id = $2 AND idempotency_key = $3`,
      [actorUserId, businessId, idempotencyKey]
    );

    if (result.rows.length === 0) return null;
    return this.mapRow(result.rows[0]);
  }

  async createBidIntent(intent: BidIntent, client?: pg.PoolClient): Promise<BidIntent> {
    const db = this.getClient(client);
    await db.query(
      `INSERT INTO bid_intents (
        id, business_id, market_id, created_by_user_id, membership_id,
        target_position, qualifying_amount_minor, qualifying_amount_rupees,
        currency, status, idempotency_key, pricing_snapshot, expires_at,
        created_at, updated_at
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15
      )`,
      [
        intent.id,
        intent.businessId,
        intent.marketId,
        intent.createdByUserId,
        intent.membershipId,
        intent.targetPosition,
        intent.qualifyingAmountMinor,
        intent.qualifyingAmountRupees,
        intent.currency,
        intent.status,
        intent.idempotencyKey,
        JSON.stringify(intent.pricingSnapshot),
        new Date(intent.expiresAt),
        new Date(intent.createdAt),
        new Date(intent.updatedAt),
      ]
    );

    return intent;
  }

  async updateBidIntentStatus(
    id: string,
    status: BidIntentStatus,
    client?: pg.PoolClient
  ): Promise<void> {
    const db = this.getClient(client);
    await db.query(
      `UPDATE bid_intents
       SET status = $1, updated_at = NOW()
       WHERE id = $2`,
      [status, id]
    );
  }

  async getBidIntentsByBusiness(
    businessId: string,
    filter?: { marketId?: string; status?: BidIntentStatus; limit?: number; offset?: number },
    client?: pg.PoolClient
  ): Promise<{ intents: BidIntent[]; total: number }> {
    const db = this.getClient(client);
    const whereClauses: string[] = ['business_id = $1'];
    const params: unknown[] = [businessId];

    if (filter?.marketId) {
      params.push(filter.marketId);
      whereClauses.push(`market_id = $${params.length}`);
    }

    if (filter?.status) {
      params.push(filter.status);
      whereClauses.push(`status = $${params.length}`);
    }

    const whereSql = `WHERE ${whereClauses.join(' AND ')}`;
    const countRes = await db.query(`SELECT COUNT(*) AS total FROM bid_intents ${whereSql}`, params);
    const total = parseInt(String(countRes.rows[0]?.total || 0), 10);

    const limit = filter?.limit || 50;
    const offset = filter?.offset || 0;
    const queryParams = [...params, limit, offset];

    const dataRes = await db.query(
      `SELECT id, business_id AS "businessId", market_id AS "marketId",
              created_by_user_id AS "createdByUserId", membership_id AS "membershipId",
              target_position AS "targetPosition", qualifying_amount_minor AS "qualifyingAmountMinor",
              qualifying_amount_rupees AS "qualifyingAmountRupees", currency, status,
              idempotency_key AS "idempotencyKey", pricing_snapshot AS "pricingSnapshot",
              expires_at AS "expiresAt", created_at AS "createdAt", updated_at AS "updatedAt"
       FROM bid_intents
       ${whereSql}
       ORDER BY created_at DESC
       LIMIT $${queryParams.length - 1} OFFSET $${queryParams.length}`,
      queryParams
    );

    return {
      intents: dataRes.rows.map((row) => this.mapRow(row)),
      total,
    };
  }

  private mapRow(row: Record<string, unknown>): BidIntent {
    return {
      id: String(row.id),
      businessId: String(row.businessId),
      marketId: String(row.marketId),
      createdByUserId: String(row.createdByUserId),
      membershipId: String(row.membershipId),
      targetPosition: Number(row.targetPosition),
      qualifyingAmountMinor: Number(row.qualifyingAmountMinor),
      qualifyingAmountRupees: Number(row.qualifyingAmountRupees),
      currency: 'INR',
      status: row.status as BidIntentStatus,
      idempotencyKey: String(row.idempotencyKey),
      pricingSnapshot: typeof row.pricingSnapshot === 'string'
        ? JSON.parse(row.pricingSnapshot)
        : (row.pricingSnapshot as BidIntent['pricingSnapshot']),
      expiresAt: new Date(row.expiresAt as string | Date).toISOString(),
      createdAt: new Date(row.createdAt as string | Date).toISOString(),
      updatedAt: new Date(row.updatedAt as string | Date).toISOString(),
    };
  }
}
