/**
 * AageOnline API — Payments, Bid Intents & Settlements Repository
 * Milestone 0.20.26: Authoritative Server-Side Persistence
 */

import { query, assertProductionPersistence } from '../client.ts';

export interface DbPaymentOrder {
  id: string;
  bidIntentId: string;
  businessId: string;
  businessName?: string;
  marketId: string;
  marketSlug?: string;
  createdByUserId: string;
  provider: string;
  providerOrderId: string | null;
  providerTransactionId: string | null;
  amountMinor: string;
  amountRupees: number;
  currency: string;
  status: string;
  idempotencyKey: string;
  paidAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export const paymentsRepository = {
  async getAll(): Promise<DbPaymentOrder[]> {
    const sql = `
      SELECT 
        po.id,
        po.bid_intent_id AS "bidIntentId",
        po.business_id AS "businessId",
        b.name AS "businessName",
        po.market_id AS "marketId",
        m.slug AS "marketSlug",
        po.created_by_user_id AS "createdByUserId",
        po.provider,
        po.provider_order_id AS "providerOrderId",
        po.provider_transaction_id AS "providerTransactionId",
        po.amount_minor AS "amountMinor",
        po.amount_rupees AS "amountRupees",
        po.currency,
        po.status,
        po.idempotency_key AS "idempotencyKey",
        po.paid_at AS "paidAt",
        po.created_at AS "createdAt",
        po.updated_at AS "updatedAt"
      FROM payment_orders po
      LEFT JOIN businesses b ON po.business_id = b.id
      LEFT JOIN markets m ON po.market_id = m.id
      ORDER BY po.created_at DESC
    `;
    const res = await query<DbPaymentOrder>(sql);
    return res.rows;
  },

  async getById(id: string): Promise<DbPaymentOrder | null> {
    const sql = `
      SELECT 
        po.id,
        po.bid_intent_id AS "bidIntentId",
        po.business_id AS "businessId",
        b.name AS "businessName",
        po.market_id AS "marketId",
        m.slug AS "marketSlug",
        po.created_by_user_id AS "createdByUserId",
        po.provider,
        po.provider_order_id AS "providerOrderId",
        po.provider_transaction_id AS "providerTransactionId",
        po.amount_minor AS "amountMinor",
        po.amount_rupees AS "amountRupees",
        po.currency,
        po.status,
        po.idempotency_key AS "idempotencyKey",
        po.paid_at AS "paidAt",
        po.created_at AS "createdAt",
        po.updated_at AS "updatedAt"
      FROM payment_orders po
      LEFT JOIN businesses b ON po.business_id = b.id
      LEFT JOIN markets m ON po.market_id = m.id
      WHERE po.id = $1
    `;
    const res = await query<DbPaymentOrder>(sql, [id]);
    return res.rows[0] || null;
  },

  async create(data: {
    id?: string;
    bidIntentId: string;
    businessId: string;
    marketId: string;
    createdByUserId: string;
    membershipId: string;
    provider?: string;
    amountRupees: number;
    idempotencyKey: string;
  }): Promise<DbPaymentOrder> {
    assertProductionPersistence();
    const id = data.id || `pay-${Date.now()}`;
    const amountMinor = BigInt(data.amountRupees) * 100n;
    const provider = data.provider || 'PAYU';

    const sql = `
      INSERT INTO payment_orders (
        id, bid_intent_id, business_id, market_id, created_by_user_id, membership_id,
        provider, amount_minor, amount_rupees, currency, status, idempotency_key, created_at, updated_at
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'INR', 'CREATED', $10, NOW(), NOW())
      RETURNING id
    `;

    await query(sql, [
      id,
      data.bidIntentId,
      data.businessId,
      data.marketId,
      data.createdByUserId,
      data.membershipId,
      provider,
      amountMinor.toString(),
      data.amountRupees,
      data.idempotencyKey,
    ]);

    const created = await this.getById(id);
    if (!created) throw new Error('Failed to retrieve newly created payment order.');
    return created;
  },

  async updateStatus(
    id: string,
    status: 'PAID' | 'FAILED' | 'REFUNDED_DISALLOWED',
    providerTxnId?: string
  ): Promise<DbPaymentOrder | null> {
    assertProductionPersistence();
    const paidAt = status === 'PAID' ? 'NOW()' : 'NULL';
    const sql = `
      UPDATE payment_orders
      SET status = $2,
          provider_transaction_id = COALESCE($3, provider_transaction_id),
          paid_at = ${status === 'PAID' ? 'COALESCE(paid_at, NOW())' : 'paid_at'},
          updated_at = NOW()
      WHERE id = $1
      RETURNING id
    `;
    const res = await query(sql, [id, status, providerTxnId || null]);
    if (res.rows.length === 0) return null;
    return this.getById(id);
  },

  async getSettlements(): Promise<any[]> {
    const sql = `
      SELECT 
        rs.id,
        rs.payment_order_id AS "paymentOrderId",
        rs.bid_intent_id AS "bidIntentId",
        rs.business_id AS "businessId",
        b.name AS "businessName",
        rs.market_id AS "marketId",
        m.slug AS "marketSlug",
        rs.status,
        rs.target_position AS "targetPosition",
        rs.paid_amount_rupees AS "amountRupees",
        rs.paid_amount_minor AS "amountMinor",
        rs.previous_position AS "previousPosition",
        rs.final_position AS "finalPosition",
        rs.created_at AS "createdAt",
        rs.settled_at AS "settledAt"
      FROM ranking_settlements rs
      LEFT JOIN businesses b ON rs.business_id = b.id
      LEFT JOIN markets m ON rs.market_id = m.id
      ORDER BY rs.created_at DESC
    `;
    const res = await query(sql);
    return res.rows;
  },
};
