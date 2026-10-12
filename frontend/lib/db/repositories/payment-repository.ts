/**
 * AageOnline — PostgreSQL Payment Order & Provider Event Repository
 *
 * Persists PaymentOrder and PaymentProviderEvent records with strict financial precision,
 * whole-rupee invariants, scoped idempotency, and provider transaction references.
 */

import type pg from 'pg';
import type {
  PaymentOrder,
  PaymentOrderStatus,
  PaymentProviderEvent,
  ProviderEventProcessingStatus,
} from '../../../types/payment.ts';
import { getDbPool } from '../client.ts';
import { assertProductionPersistence } from '../guard.ts';

export class PostgresPaymentRepository {
  constructor() {
    assertProductionPersistence();
  }

  private getClient(client?: pg.PoolClient): pg.PoolClient | pg.Pool {
    return client || getDbPool();
  }

  /**
   * Retrieves a PaymentOrder by its ID.
   */
  async getPaymentOrderById(id: string, client?: pg.PoolClient): Promise<PaymentOrder | null> {
    const db = this.getClient(client);
    const result = await db.query(
      `SELECT id, bid_intent_id AS "bidIntentId", business_id AS "businessId", market_id AS "marketId",
              created_by_user_id AS "createdByUserId", membership_id AS "membershipId",
              provider, provider_order_id AS "providerOrderId", provider_transaction_id AS "providerTransactionId",
              provider_payment_id AS "providerPaymentId", amount_minor AS "amountMinor", amount_rupees AS "amountRupees",
              currency, status, idempotency_key AS "idempotencyKey", paid_at AS "paidAt",
              created_at AS "createdAt", updated_at AS "updatedAt"
       FROM payment_orders
       WHERE id = $1`,
      [id]
    );

    if (result.rows.length === 0) return null;
    return this.mapOrderRow(result.rows[0]);
  }

  /**
   * Finds an existing order using the scoped idempotency tuple.
   */
  async findIdempotentOrder(
    actorUserId: string,
    businessId: string,
    bidIntentId: string,
    idempotencyKey: string,
    client?: pg.PoolClient
  ): Promise<PaymentOrder | null> {
    const db = this.getClient(client);
    const result = await db.query(
      `SELECT id, bid_intent_id AS "bidIntentId", business_id AS "businessId", market_id AS "marketId",
              created_by_user_id AS "createdByUserId", membership_id AS "membershipId",
              provider, provider_order_id AS "providerOrderId", provider_transaction_id AS "providerTransactionId",
              provider_payment_id AS "providerPaymentId", amount_minor AS "amountMinor", amount_rupees AS "amountRupees",
              currency, status, idempotency_key AS "idempotencyKey", paid_at AS "paidAt",
              created_at AS "createdAt", updated_at AS "updatedAt"
       FROM payment_orders
       WHERE created_by_user_id = $1 AND business_id = $2 AND bid_intent_id = $3 AND idempotency_key = $4`,
      [actorUserId, businessId, bidIntentId, idempotencyKey]
    );

    if (result.rows.length === 0) return null;
    return this.mapOrderRow(result.rows[0]);
  }

  /**
   * Finds an order by provider transaction ID (txnid).
   */
  async getOrderByProviderTxnId(txnId: string, client?: pg.PoolClient): Promise<PaymentOrder | null> {
    const db = this.getClient(client);
    const result = await db.query(
      `SELECT id, bid_intent_id AS "bidIntentId", business_id AS "businessId", market_id AS "marketId",
              created_by_user_id AS "createdByUserId", membership_id AS "membershipId",
              provider, provider_order_id AS "providerOrderId", provider_transaction_id AS "providerTransactionId",
              provider_payment_id AS "providerPaymentId", amount_minor AS "amountMinor", amount_rupees AS "amountRupees",
              currency, status, idempotency_key AS "idempotencyKey", paid_at AS "paidAt",
              created_at AS "createdAt", updated_at AS "updatedAt"
       FROM payment_orders
       WHERE provider_transaction_id = $1`,
      [txnId]
    );

    if (result.rows.length === 0) return null;
    return this.mapOrderRow(result.rows[0]);
  }

  /**
   * Retrieves a PaymentOrder by its associated BidIntent ID.
   */
  async getPaymentOrderByBidIntentId(bidIntentId: string, client?: pg.PoolClient): Promise<PaymentOrder | null> {
    const db = this.getClient(client);
    const result = await db.query(
      `SELECT id, bid_intent_id AS "bidIntentId", business_id AS "businessId", market_id AS "marketId",
              created_by_user_id AS "createdByUserId", membership_id AS "membershipId",
              provider, provider_order_id AS "providerOrderId", provider_transaction_id AS "providerTransactionId",
              provider_payment_id AS "providerPaymentId", amount_minor AS "amountMinor", amount_rupees AS "amountRupees",
              currency, status, idempotency_key AS "idempotencyKey", paid_at AS "paidAt",
              created_at AS "createdAt", updated_at AS "updatedAt"
       FROM payment_orders
       WHERE bid_intent_id = $1
       ORDER BY created_at DESC
       LIMIT 1`,
      [bidIntentId]
    );

    if (result.rows.length === 0) return null;
    return this.mapOrderRow(result.rows[0]);
  }

  /**
   * Retrieves PaymentOrders for a business.
   */
  async getPaymentOrdersByBusiness(businessId: string, limit = 50, client?: pg.PoolClient): Promise<PaymentOrder[]> {
    const db = this.getClient(client);
    const result = await db.query(
      `SELECT id, bid_intent_id AS "bidIntentId", business_id AS "businessId", market_id AS "marketId",
              created_by_user_id AS "createdByUserId", membership_id AS "membershipId",
              provider, provider_order_id AS "providerOrderId", provider_transaction_id AS "providerTransactionId",
              provider_payment_id AS "providerPaymentId", amount_minor AS "amountMinor", amount_rupees AS "amountRupees",
              currency, status, idempotency_key AS "idempotencyKey", paid_at AS "paidAt",
              created_at AS "createdAt", updated_at AS "updatedAt"
       FROM payment_orders
       WHERE business_id = $1
       ORDER BY created_at DESC
       LIMIT $2`,
      [businessId, limit]
    );

    return result.rows.map((row) => this.mapOrderRow(row));
  }

  /**
   * Persists a newly created PaymentOrder.
   */
  async createPaymentOrder(order: PaymentOrder, client?: pg.PoolClient): Promise<PaymentOrder> {
    const db = this.getClient(client);
    await db.query(
      `INSERT INTO payment_orders (
        id, bid_intent_id, business_id, market_id, created_by_user_id, membership_id,
        provider, provider_order_id, provider_transaction_id, provider_payment_id,
        amount_minor, amount_rupees, currency, status, idempotency_key, paid_at,
        created_at, updated_at
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18
      )`,
      [
        order.id,
        order.bidIntentId,
        order.businessId,
        order.marketId,
        order.createdByUserId,
        order.membershipId,
        order.provider,
        order.providerOrderId || null,
        order.providerTransactionId || null,
        order.providerPaymentId || null,
        order.amountMinor,
        order.amountRupees,
        order.currency,
        order.status,
        order.idempotencyKey,
        order.paidAt ? new Date(order.paidAt) : null,
        new Date(order.createdAt),
        new Date(order.updatedAt),
      ]
    );

    return order;
  }

  /**
   * Updates status and timestamps for an existing order.
   */
  async updatePaymentOrderStatus(
    orderId: string,
    status: PaymentOrderStatus,
    fields?: { paidAt?: string; providerTransactionId?: string; providerPaymentId?: string },
    client?: pg.PoolClient
  ): Promise<void> {
    const db = this.getClient(client);
    const now = new Date();
    await db.query(
      `UPDATE payment_orders
       SET status = $1,
           paid_at = COALESCE($2, paid_at),
           provider_transaction_id = COALESCE($3, provider_transaction_id),
           provider_payment_id = COALESCE($4, provider_payment_id),
           updated_at = $5
       WHERE id = $6`,
      [
        status,
        fields?.paidAt ? new Date(fields.paidAt) : null,
        fields?.providerTransactionId || null,
        fields?.providerPaymentId || null,
        now,
        orderId,
      ]
    );
  }

  /**
   * Finds confirmed payments that do NOT yet have an effective SETTLED ranking settlement.
   * Essential for restart recovery and settlement reconciliation workers.
   */
  async getUnsettledConfirmedPayments(limit = 50, client?: pg.PoolClient): Promise<PaymentOrder[]> {
    const db = this.getClient(client);
    const result = await db.query(
      `SELECT po.id, po.bid_intent_id AS "bidIntentId", po.business_id AS "businessId", po.market_id AS "marketId",
              po.created_by_user_id AS "createdByUserId", po.membership_id AS "membershipId",
              po.provider, po.provider_order_id AS "providerOrderId", po.provider_transaction_id AS "providerTransactionId",
              po.provider_payment_id AS "providerPaymentId", po.amount_minor AS "amountMinor", po.amount_rupees AS "amountRupees",
              po.currency, po.status, po.idempotency_key AS "idempotencyKey", po.paid_at AS "paidAt",
              po.created_at AS "createdAt", po.updated_at AS "updatedAt"
       FROM payment_orders po
       LEFT JOIN ranking_settlements rs ON rs.payment_order_id = po.id
       WHERE po.status = 'CONFIRMED'
         AND (rs.id IS NULL OR rs.status <> 'SETTLED')
       ORDER BY po.created_at ASC
       LIMIT $1`,
      [limit]
    );

    return result.rows.map((row) => this.mapOrderRow(row));
  }

  /**
   * Provider Event Methods
   */
  async findEventByFingerprint(
    provider: string,
    payloadHash: string,
    client?: pg.PoolClient
  ): Promise<PaymentProviderEvent | null> {
    const db = this.getClient(client);
    const result = await db.query(
      `SELECT id, provider, provider_event_id AS "providerEventId", event_type AS "eventType",
              payment_order_id AS "paymentOrderId", provider_transaction_id AS "providerTransactionId",
              payload_hash AS "payloadHash", processing_status AS "processingStatus",
              received_at AS "receivedAt", processed_at AS "processedAt"
       FROM payment_provider_events
       WHERE provider = $1 AND payload_hash = $2`,
      [provider, payloadHash]
    );

    if (result.rows.length === 0) return null;
    return this.mapEventRow(result.rows[0]);
  }

  async recordProviderEvent(
    event: PaymentProviderEvent,
    client?: pg.PoolClient
  ): Promise<PaymentProviderEvent> {
    const db = this.getClient(client);
    await db.query(
      `INSERT INTO payment_provider_events (
        id, provider, provider_event_id, event_type, payment_order_id,
        provider_transaction_id, payload_hash, processing_status,
        received_at, processed_at
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10
      )`,
      [
        event.id,
        event.provider,
        event.providerEventId || null,
        event.eventType,
        event.paymentOrderId || null,
        event.providerTransactionId || null,
        event.payloadHash,
        event.processingStatus,
        new Date(event.receivedAt),
        event.processedAt ? new Date(event.processedAt) : null,
      ]
    );

    return event;
  }

  async updateEventStatus(
    id: string,
    status: ProviderEventProcessingStatus,
    client?: pg.PoolClient
  ): Promise<void> {
    const db = this.getClient(client);
    await db.query(
      `UPDATE payment_provider_events
       SET processing_status = $1, processed_at = NOW()
       WHERE id = $2`,
      [status, id]
    );
  }

  /**
   * Finds unresolved payment orders (PENDING or CREATED) older than a cooldown window.
   * Reconciliation worker sweeps these to check for provider confirmation or expiration.
   */
  async getUnresolvedPayments(
    limit = 50,
    olderThanMinutes = 2,
    client?: pg.PoolClient
  ): Promise<PaymentOrder[]> {
    const db = this.getClient(client);
    const result = await db.query(
      `SELECT id, bid_intent_id AS "bidIntentId", business_id AS "businessId", market_id AS "marketId",
              created_by_user_id AS "createdByUserId", membership_id AS "membershipId",
              provider, provider_order_id AS "providerOrderId", provider_transaction_id AS "providerTransactionId",
              provider_payment_id AS "providerPaymentId", amount_minor AS "amountMinor", amount_rupees AS "amountRupees",
              currency, status, idempotency_key AS "idempotencyKey", paid_at AS "paidAt",
              created_at AS "createdAt", updated_at AS "updatedAt"
       FROM payment_orders
       WHERE status IN ('PENDING', 'CREATED', 'SUCCEEDED')
         AND created_at <= NOW() - ($2 || ' minutes')::INTERVAL
       ORDER BY created_at ASC
       LIMIT $1`,
      [limit, olderThanMinutes]
    );

    return result.rows.map((row) => this.mapOrderRow(row));
  }

  /**
   * Paginated, searchable query for administrative payment operations.
   */
  async getPaginatedPaymentOrders(
    options: {
      page?: number;
      limit?: number;
      status?: string;
      search?: string;
    } = {},
    client?: pg.PoolClient
  ): Promise<{ orders: PaymentOrder[]; totalCount: number }> {
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

    if (options.search && options.search.trim().length > 0) {
      params.push(`%${options.search.trim()}%`);
      whereClauses.push(
        `(id ILIKE $${params.length} OR bid_intent_id ILIKE $${params.length} OR provider_transaction_id ILIKE $${params.length} OR business_id ILIKE $${params.length})`
      );
    }

    const whereSql = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

    const countResult = await db.query(`SELECT COUNT(*) AS total FROM payment_orders ${whereSql}`, params);
    const totalCount = parseInt(String(countResult.rows[0]?.total || 0), 10);

    const queryParams = [...params, limit, offset];
    const dataResult = await db.query(
      `SELECT id, bid_intent_id AS "bidIntentId", business_id AS "businessId", market_id AS "marketId",
              created_by_user_id AS "createdByUserId", membership_id AS "membershipId",
              provider, provider_order_id AS "providerOrderId", provider_transaction_id AS "providerTransactionId",
              provider_payment_id AS "providerPaymentId", amount_minor AS "amountMinor", amount_rupees AS "amountRupees",
              currency, status, idempotency_key AS "idempotencyKey", paid_at AS "paidAt",
              created_at AS "createdAt", updated_at AS "updatedAt"
       FROM payment_orders
       ${whereSql}
       ORDER BY created_at DESC
       LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
      queryParams
    );

    return {
      orders: dataResult.rows.map((row) => this.mapOrderRow(row)),
      totalCount,
    };
  }

  /**
   * Paginated provider events for administrative event audit.
   */
  async getPaginatedProviderEvents(
    options: {
      page?: number;
      limit?: number;
      status?: string;
    } = {},
    client?: pg.PoolClient
  ): Promise<{ events: PaymentProviderEvent[]; totalCount: number }> {
    const db = this.getClient(client);
    const page = Math.max(1, options.page || 1);
    const limit = Math.min(100, Math.max(1, options.limit || 20));
    const offset = (page - 1) * limit;

    const whereClauses: string[] = [];
    const params: unknown[] = [];

    if (options.status && options.status !== 'ALL') {
      params.push(options.status);
      whereClauses.push(`processing_status = $${params.length}`);
    }

    const whereSql = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

    const countResult = await db.query(`SELECT COUNT(*) AS total FROM payment_provider_events ${whereSql}`, params);
    const totalCount = parseInt(String(countResult.rows[0]?.total || 0), 10);

    const queryParams = [...params, limit, offset];
    const dataResult = await db.query(
      `SELECT id, provider, provider_event_id AS "providerEventId", event_type AS "eventType",
              payment_order_id AS "paymentOrderId", provider_transaction_id AS "providerTransactionId",
              payload_hash AS "payloadHash", processing_status AS "processingStatus",
              received_at AS "receivedAt", processed_at AS "processedAt"
       FROM payment_provider_events
       ${whereSql}
       ORDER BY received_at DESC
       LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
      queryParams
    );

    return {
      events: dataResult.rows.map((row) => this.mapEventRow(row)),
      totalCount,
    };
  }

  /**
   * Summary operational metrics for overview dashboards.
   */
  async getPaymentOperationalStats(client?: pg.PoolClient): Promise<{
    unresolvedCount: number;
    awaitingVerificationCount: number;
    confirmedUnsettledCount: number;
    oldestUnresolvedAgeMinutes: number;
  }> {
    const db = this.getClient(client);

    const statsResult = await db.query(`
      SELECT
        COUNT(*) FILTER (WHERE status IN ('PENDING', 'CREATED')) AS unresolved_count,
        COUNT(*) FILTER (WHERE status = 'PENDING') AS awaiting_verification_count,
        EXTRACT(EPOCH FROM (NOW() - MIN(created_at) FILTER (WHERE status IN ('PENDING', 'CREATED')))) / 60.0 AS oldest_unresolved_minutes
      FROM payment_orders
    `);

    const unsettledResult = await db.query(`
      SELECT COUNT(*) AS count
      FROM payment_orders po
      LEFT JOIN ranking_settlements rs ON rs.payment_order_id = po.id
      WHERE po.status = 'CONFIRMED'
        AND (rs.id IS NULL OR rs.status <> 'SETTLED')
    `);

    const row = statsResult.rows[0] || {};
    return {
      unresolvedCount: parseInt(String(row.unresolved_count || 0), 10),
      awaitingVerificationCount: parseInt(String(row.awaiting_verification_count || 0), 10),
      confirmedUnsettledCount: parseInt(String(unsettledResult.rows[0]?.count || 0), 10),
      oldestUnresolvedAgeMinutes: Math.round(Number(row.oldest_unresolved_minutes || 0)),
    };
  }

  private mapOrderRow(row: Record<string, unknown>): PaymentOrder {
    return {
      id: String(row.id),
      bidIntentId: String(row.bidIntentId),
      businessId: String(row.businessId),
      marketId: String(row.marketId),
      createdByUserId: String(row.createdByUserId),
      membershipId: String(row.membershipId),
      provider: 'PAYU',
      providerOrderId: row.providerOrderId ? String(row.providerOrderId) : undefined,
      providerTransactionId: String(row.providerTransactionId || ''),
      providerPaymentId: row.providerPaymentId ? String(row.providerPaymentId) : undefined,
      amountMinor: Number(row.amountMinor),
      amountRupees: Number(row.amountRupees),
      currency: 'INR',
      status: row.status as PaymentOrderStatus,
      idempotencyKey: String(row.idempotencyKey),
      paidAt: row.paidAt ? new Date(row.paidAt as string | Date).toISOString() : undefined,
      createdAt: new Date(row.createdAt as string | Date).toISOString(),
      updatedAt: new Date(row.updatedAt as string | Date).toISOString(),
    };
  }

  private mapEventRow(row: Record<string, unknown>): PaymentProviderEvent {
    return {
      id: String(row.id),
      provider: 'PAYU',
      providerEventId: row.providerEventId ? String(row.providerEventId) : undefined,
      eventType: String(row.eventType),
      paymentOrderId: row.paymentOrderId ? String(row.paymentOrderId) : undefined,
      providerTransactionId: row.providerTransactionId ? String(row.providerTransactionId) : undefined,
      payloadHash: String(row.payloadHash),
      processingStatus: row.processingStatus as ProviderEventProcessingStatus,
      receivedAt: new Date(row.receivedAt as string | Date).toISOString(),
      processedAt: row.processedAt ? new Date(row.processedAt as string | Date).toISOString() : undefined,
    };
  }
}
