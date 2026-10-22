/**
 * AageOnline API — Ranking & Atomic Position Mutation Repository
 * Milestone 0.20.26: Authoritative Server-Side Persistence
 */

import { query, withTransaction, assertProductionPersistence } from '../client.ts';

export interface DbRankingEntry {
  id: string;
  marketId: string;
  businessId: string;
  businessName: string;
  businessSlug: string;
  position: number;
  qualifyingAmountRupees: number;
  qualifyingAmountMinor: number;
  status: string;
  joinedAt: string;
  updatedAt: string;
}

export interface AtomicMutationInput {
  marketId: string;
  businessId: string;
  targetPosition: number;
  qualifyingAmountRupees: number;
  paymentOrderId?: string;
  bidIntentId?: string;
  actorUserId?: string;
}

export interface MutationResult {
  success: boolean;
  settlementId: string;
  businessId: string;
  marketId: string;
  previousPosition: number | null;
  newPosition: number;
  displacedBusinesses: Array<{ businessId: string; previousPosition: number; newPosition: number }>;
}

export const rankingRepository = {
  async getRankingsForMarket(marketIdOrSlug: string): Promise<DbRankingEntry[]> {
    const sql = `
      SELECT 
        mp.id,
        mp.market_id AS "marketId",
        mp.business_id AS "businessId",
        b.name AS "businessName",
        b.slug AS "businessSlug",
        mp.current_position AS "position",
        mp.qualifying_amount_rupees AS "qualifyingAmountRupees",
        (mp.qualifying_amount_rupees * 100)::bigint AS "qualifyingAmountMinor",
        mp.status,
        mp.joined_at AS "joinedAt",
        mp.updated_at AS "updatedAt"
      FROM market_participations mp
      JOIN businesses b ON mp.business_id = b.id
      JOIN markets m ON mp.market_id = m.id
      WHERE (m.id = $1 OR m.slug = $1) AND mp.status = 'ACTIVE' AND mp.current_position IS NOT NULL
      ORDER BY mp.current_position ASC
    `;
    const res = await query<DbRankingEntry>(sql, [marketIdOrSlug]);
    return res.rows;
  },

  async executeAtomicRankingSettlement(input: AtomicMutationInput): Promise<MutationResult> {
    assertProductionPersistence();
    return withTransaction(async (client) => {
      // 1. Lock the market row and its current participations with FOR UPDATE
      const marketRes = await client.query(
        'SELECT id, status FROM markets WHERE id = $1 FOR UPDATE',
        [input.marketId]
      );
      if (marketRes.rows.length === 0) {
        throw new Error(`Market "${input.marketId}" does not exist.`);
      }

      // 2. Fetch existing participations for this market with FOR UPDATE
      const existingRes = await client.query(
        `SELECT id, business_id, current_position, qualifying_amount_rupees 
         FROM market_participations 
         WHERE market_id = $1 AND status = 'ACTIVE' AND current_position IS NOT NULL
         ORDER BY current_position ASC
         FOR UPDATE`,
        [input.marketId]
      );

      const existingEntries = existingRes.rows;
      const currentLeader = existingEntries.find((e: any) => e.current_position === 1);

      // Invariant: If targeting #1, qualifying amount must be strictly greater than current leader
      if (input.targetPosition === 1 && currentLeader) {
        if (input.qualifyingAmountRupees <= currentLeader.qualifying_amount_rupees) {
          throw new Error(
            `Qualifying amount (₹${input.qualifyingAmountRupees}) must be strictly greater than the current leader (₹${currentLeader.qualifying_amount_rupees}). Minimum required: ₹${currentLeader.qualifying_amount_rupees + 1}.`
          );
        }
      }

      // 3. Find target business's current participation
      const targetBizPart = existingEntries.find((e: any) => e.business_id === input.businessId);
      const previousPosition = targetBizPart ? targetBizPart.current_position : null;

      const displacedList: Array<{ businessId: string; previousPosition: number; newPosition: number }> = [];

      // 4. Temporarily set target business's position to NULL to avoid unique index violation during shuffle
      if (targetBizPart) {
        await client.query(
          `UPDATE market_participations SET current_position = NULL WHERE id = $1`,
          [targetBizPart.id]
        );
      }

      // 5. Shift existing positions down to make room
      // Reverse order (highest position down to targetPosition) so we don't collide on unique index
      const entriesToShift = existingEntries
        .filter((e: any) => e.business_id !== input.businessId && e.current_position >= input.targetPosition)
        .sort((a: any, b: any) => b.current_position - a.current_position);

      for (const entry of entriesToShift) {
        const nextPos = entry.current_position + 1;
        await client.query(
          `UPDATE market_participations SET current_position = $1, updated_at = NOW() WHERE id = $2`,
          [nextPos, entry.id]
        );
        displacedList.push({
          businessId: entry.business_id,
          previousPosition: entry.current_position,
          newPosition: nextPos,
        });
      }

      // 6. Set target business to targetPosition
      const targetPartId = targetBizPart ? targetBizPart.id : `mp-${Date.now()}`;
      if (targetBizPart) {
        await client.query(
          `UPDATE market_participations 
           SET current_position = $1, qualifying_amount_rupees = $2, updated_at = NOW() 
           WHERE id = $3`,
          [input.targetPosition, input.qualifyingAmountRupees, targetBizPart.id]
        );
      } else {
        await client.query(
          `INSERT INTO market_participations (
            id, business_id, market_id, status, eligibility_status, current_position, qualifying_amount_rupees, joined_at, updated_at
           )
           VALUES ($1, $2, $3, 'ACTIVE', 'ELIGIBLE', $4, $5, NOW(), NOW())`,
          [targetPartId, input.businessId, input.marketId, input.targetPosition, input.qualifyingAmountRupees]
        );
      }

      // 7. Create ranking settlement record
      const settlementId = `set-${Date.now()}`;
      const amountMinor = BigInt(input.qualifyingAmountRupees) * 100n;
      await client.query(
        `INSERT INTO ranking_settlements (
          id, payment_order_id, bid_intent_id, business_id, market_id, status,
          target_position, paid_amount_minor, paid_amount_rupees, previous_position, final_position,
          created_at, updated_at, settled_at
        )
        VALUES ($1, $2, $3, $4, $5, 'COMPLETED', $6, $7, $8, $9, $10, NOW(), NOW(), NOW())`,
        [
          settlementId,
          input.paymentOrderId || `pay-mock-${Date.now()}`,
          input.bidIntentId || `bid-mock-${Date.now()}`,
          input.businessId,
          input.marketId,
          input.targetPosition,
          amountMinor.toString(),
          input.qualifyingAmountRupees,
          previousPosition,
          input.targetPosition,
        ]
      );

      // 8. Record strictly append-only position history for target business
      const targetHistId = `ph-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
      await client.query(
        `INSERT INTO position_history (
          id, business_id, market_id, previous_position, new_position, cause,
          payment_order_id, bid_intent_id, ranking_settlement_id, created_at
        )
        VALUES ($1, $2, $3, $4, $5, 'PAID_VISIBILITY_SETTLEMENT', $6, $7, $8, NOW())`,
        [
          targetHistId,
          input.businessId,
          input.marketId,
          previousPosition,
          input.targetPosition,
          input.paymentOrderId || null,
          input.bidIntentId || null,
          settlementId,
        ]
      );

      // 9. Record position history for displaced businesses
      for (const displaced of displacedList) {
        const histId = `ph-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
        await client.query(
          `INSERT INTO position_history (
            id, business_id, market_id, previous_position, new_position, cause,
            ranking_settlement_id, created_at
          )
          VALUES ($1, $2, $3, $4, $5, 'DISPLACEMENT_CASCADE', $6, NOW())`,
          [
            histId,
            displaced.businessId,
            input.marketId,
            displaced.previousPosition,
            displaced.newPosition,
            settlementId,
          ]
        );
      }

      return {
        success: true,
        settlementId,
        businessId: input.businessId,
        marketId: input.marketId,
        previousPosition,
        newPosition: input.targetPosition,
        displacedBusinesses: displacedList,
      };
    });
  },
};
