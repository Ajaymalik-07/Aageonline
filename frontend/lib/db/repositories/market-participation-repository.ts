/**
 * AageOnline — PostgreSQL Market Participation Repository
 *
 * Persists and updates MarketParticipation records.
 * Provides live ranking retrieval for pure settlement plan calculation inside transactions.
 */

import type pg from 'pg';
import type { MarketParticipation } from '../../../types/business.ts';
import { getDbPool } from '../client.ts';

export class PostgresMarketParticipationRepository {
  private getClient(client?: pg.PoolClient): pg.PoolClient | pg.Pool {
    return client || getDbPool();
  }

  async getParticipation(
    businessId: string,
    marketId: string,
    client?: pg.PoolClient
  ): Promise<MarketParticipation | null> {
    const db = this.getClient(client);
    const result = await db.query(
      `SELECT id, business_id AS "businessId", market_id AS "marketId", status,
              eligibility_status AS "eligibilityStatus", current_position AS "currentPosition",
              qualifying_amount_rupees AS "qualifyingAmountRupees",
              joined_at AS "joinedAt", updated_at AS "updatedAt"
       FROM market_participations
       WHERE business_id = $1 AND market_id = $2`,
      [businessId, marketId]
    );

    if (result.rows.length === 0) return null;
    return this.mapRow(result.rows[0]);
  }

  async getParticipationsByMarket(
    marketId: string,
    client?: pg.PoolClient
  ): Promise<MarketParticipation[]> {
    const db = this.getClient(client);
    const result = await db.query(
      `SELECT id, business_id AS "businessId", market_id AS "marketId", status,
              eligibility_status AS "eligibilityStatus", current_position AS "currentPosition",
              qualifying_amount_rupees AS "qualifyingAmountRupees",
              joined_at AS "joinedAt", updated_at AS "updatedAt"
       FROM market_participations
       WHERE market_id = $1 AND status = 'ACTIVE'
       ORDER BY current_position ASC NULLS LAST`,
      [marketId]
    );

    return result.rows.map((row) => this.mapRow(row));
  }

  async updatePositionAndAmount(
    businessId: string,
    marketId: string,
    currentPosition: number | null,
    qualifyingAmountRupees: number,
    client?: pg.PoolClient
  ): Promise<void> {
    const db = this.getClient(client);
    await db.query(
      `UPDATE market_participations
       SET current_position = $1,
           qualifying_amount_rupees = $2,
           updated_at = NOW()
       WHERE business_id = $3 AND market_id = $4`,
      [currentPosition, qualifyingAmountRupees, businessId, marketId]
    );
  }

  async upsertParticipation(
    participation: MarketParticipation,
    client?: pg.PoolClient
  ): Promise<MarketParticipation> {
    const db = this.getClient(client);
    await db.query(
      `INSERT INTO market_participations (
        id, business_id, market_id, status, eligibility_status,
        current_position, qualifying_amount_rupees, joined_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      ON CONFLICT (business_id, market_id) DO UPDATE
      SET current_position = EXCLUDED.current_position,
          qualifying_amount_rupees = EXCLUDED.qualifying_amount_rupees,
          status = EXCLUDED.status,
          updated_at = NOW()`,
      [
        participation.id,
        participation.businessId,
        participation.marketId,
        participation.status,
        participation.eligibilityStatus,
        participation.currentPosition ?? null,
        participation.qualifyingAmountRupees,
        new Date(participation.joinedAt),
        new Date(participation.updatedAt),
      ]
    );

    return participation;
  }

  private mapRow(row: Record<string, unknown>): MarketParticipation {
    return {
      id: String(row.id),
      businessId: String(row.businessId),
      marketId: String(row.marketId),
      status: row.status as MarketParticipation['status'],
      eligibilityStatus: row.eligibilityStatus as MarketParticipation['eligibilityStatus'],
      currentPosition: row.currentPosition !== null && row.currentPosition !== undefined
        ? Number(row.currentPosition)
        : null,
      qualifyingAmountRupees: Number(row.qualifyingAmountRupees),
      joinedAt: new Date(row.joinedAt as string | Date).toISOString(),
      updatedAt: new Date(row.updatedAt as string | Date).toISOString(),
    };
  }
}
