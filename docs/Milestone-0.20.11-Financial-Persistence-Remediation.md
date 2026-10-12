# AageOnline — Milestone 0.20.11
## Financial Persistence Remediation — PostgreSQL as the Source of Truth

**Project:** AageOnline  
**Tagline:** Get Seen. Get Ahead.  
**Milestone:** 0.20.11 — Financial Persistence Remediation  
**Status:** COMPLETE (Milestone Objectives Achieved)  
**Overall Production Readiness Verdict:** PARTIALLY COMPLETE (Financial persistence & settlement locking unified; blocked on live cloud provisioning, production database instance, and production webhook verification secret keys)  
**Date:** 2026-10-12  
**Harness / Workspace:** Local Repository (`frontend/`)

---

## 1. Executive Summary

Milestone 0.20.11 executes the critical financial remediation identified during the Milestone 0.20.9 Production Readiness Audit. Prior to this milestone, financial operations (`bid_intents`, `payment_orders`, and `ranking_settlements`) were written to and read from in-process Node.js memory stores (`BID_INTENTS_STORE`, `PAYMENT_ORDERS_STORE`, `RANKING_SETTLEMENTS_STORE`). Consequently, application restarts or multiple container instances risked state loss, desynchronization between web handlers and background workers, and uncoordinated concurrency.

This milestone establishes **PostgreSQL as the single, authoritative, durable source of truth** for all financial transactions, bid intents, and ranking settlements.

### Key Architectural Transformations:
1. **Durable BidIntent Persistence:** Every BidIntent creation, cancellation, and retrieval persists directly to the `bid_intents` PostgreSQL table with scoped idempotency (`uq_bid_intents_actor_business_key`).
2. **Durable PaymentOrder Persistence:** Every PaymentOrder creation, status update, provider transaction ID, and provider event fingerprint persists directly to `payment_orders` and `payment_provider_events` with strict unique constraints (`uq_payment_orders_bid_intent_provider`, `uq_payment_orders_idempotency`, and `uq_payment_provider_events_fingerprint`).
3. **Fail-Closed Production Guard:** In production environments (`NODE_ENV === 'production'` or `APP_ENV === 'production'` or `PERSISTENCE_MODE === 'postgres'`), if `DATABASE_URL` is absent or PostgreSQL queries fail, financial routines immediately fail closed and throw critical configuration/persistence errors. Silent fallbacks to in-memory Maps are strictly forbidden and eliminated.
4. **Unified Web APIs & Background Daemons:** Web route handlers (`/api/bid-intents`, `/api/payments`, `/api/businesses/...`) and background reconciliation daemons (`runPaymentReconciliationCycle`, `runSettlementRecoveryCycle`) query and mutate the exact same PostgreSQL repositories.
5. **Real PostgreSQL Transactional Ranking Settlement:** Upgraded `RankingTransactionContext` and `settleRanking` to execute inside real PostgreSQL transaction blocks (`BEGIN` ... `COMMIT` / `ROLLBACK`) with market-level transactional advisory locks (`SELECT pg_advisory_xact_lock(hashtext($1))`) and row-level locks (`SELECT id FROM markets WHERE id = $1 FOR UPDATE`).

---

## 2. Inventory & Schema Alignment

Existing database migrations (`001` through `011`) were inspected and confirmed to contain the required schema structures and integrity constraints:

- **Migration 002 (`002_bid_intents.sql`):**
  - Table `bid_intents` with primary key `id`.
  - Foreign keys to `businesses`, `markets`, `users`, and `business_memberships` (`ON DELETE RESTRICT`).
  - Integer minor units (`qualifying_amount_minor BIGINT CHECK (qualifying_amount_minor > 0 AND qualifying_amount_minor % 100 = 0)`).
  - Whole-rupee check (`qualifying_amount_rupees INT CHECK (qualifying_amount_rupees > 0)`).
  - Scoped idempotency constraint: `CONSTRAINT uq_bid_intents_actor_business_key UNIQUE (created_by_user_id, business_id, idempotency_key)`.
  - Indexing: `idx_bid_intents_business_status`, `idx_bid_intents_market`, `idx_bid_intents_expires_at`.

- **Migration 003 (`003_payments_and_events.sql`):**
  - Table `payment_orders` with primary key `id`.
  - Constraints:
    - `uq_payment_orders_bid_intent_provider UNIQUE (bid_intent_id, provider)`: Exactly one active payment order per BidIntent per payment provider.
    - `uq_payment_orders_idempotency UNIQUE (created_by_user_id, business_id, bid_intent_id, idempotency_key)`: Scoped order idempotency.
    - `uq_payment_orders_provider_txnid UNIQUE (provider_transaction_id)`: Uniqueness of provider transaction references.
  - Table `payment_provider_events` with primary key `id`.
  - Constraint: `uq_payment_provider_events_fingerprint UNIQUE (provider, payload_hash)`: SHA-256 deterministic payload deduplication to prevent double processing of webhooks.

- **Migration 004 (`004_ranking_settlements_and_history.sql`):**
  - Table `ranking_settlements` with primary key `id`.
  - Constraint: `uq_ranking_settlements_payment_order UNIQUE (payment_order_id)`: Ensures a payment order cannot settle into ranking more than once.
  - Table `position_history` with primary key `id`.
  - Constraint: `chk_position_history_movement CHECK (previous_position IS NULL OR previous_position <> new_position)`: Prohibits redundant no-op history records.

---

## 3. Repositories Implemented & Extended

All repositories were unified under `frontend/lib/db/repositories/`:

1. **`PostgresPaymentRepository` (`frontend/lib/db/repositories/payment-repository.ts`):**
   - `createPaymentOrder(order, client?)`
   - `getPaymentOrderById(id, client?)`
   - `getOrderByProviderTxnId(providerTxnId, client?)`
   - `getPaymentOrderByBidIntentId(bidIntentId, client?)`
   - `getPaymentOrdersByBusiness(businessId, limit?, client?)`
   - `findIdempotentOrder(actorUserId, businessId, bidIntentId, idempotencyKey, client?)`
   - `updatePaymentOrderStatus(orderId, status, fields?, client?)`
   - `getUnsettledConfirmedPayments(limit?, client?)`
   - `getUnresolvedPayments(limit?, olderThanMinutes?, client?)`
   - `findEventByFingerprint(provider, payloadHash, client?)`
   - `recordProviderEvent(event, client?)`
   - `updateEventStatus(id, status, client?)`

2. **`PostgresBidIntentRepository` (`frontend/lib/db/repositories/bid-intent-repository.ts`):**
   - `createBidIntent(intent, client?)`
   - `getBidIntentById(id, client?)`
   - `findIdempotentIntent(actorUserId, businessId, idempotencyKey, client?)`
   - `updateBidIntentStatus(id, status, client?)`
   - `getBidIntentsByBusiness(businessId, client?)`
   - `getActiveIntentByMarketAndBusiness(businessId, marketId, client?)`

3. **`PostgresRankingSettlementRepository` (`frontend/lib/db/repositories/ranking-settlement-repository.ts`):**
   - `createSettlement(settlement, client?)`
   - `getSettlementById(id, client?)`
   - `getSettlementByPaymentOrderId(paymentOrderId, client?)`
   - `getSettlementsByBusiness(businessId, client?)`

4. **`PostgresMarketParticipationRepository` & `PostgresPositionHistoryRepository`:**
   - Supports atomic multi-row position updates and history insertions taking optional PostgreSQL transaction clients (`client?: pg.PoolClient`).

---

## 4. Production Request Paths Remediated

Every affected API route and domain service was updated to utilize asynchronous, durable PostgreSQL queries:

| Route / Service Path | Previous State | Remediated Production State |
| :--- | :--- | :--- |
| `POST /api/bid-intents` | Created in `BID_INTENTS_STORE` | Persists to PostgreSQL via `createBidIntent` with `PostgresBidIntentRepository`; verifies active RBAC and checks scoped idempotency. |
| `GET /api/bid-intents/[id]` | Read from synchronous `BID_INTENTS_STORE` | Queries PostgreSQL via `getBidIntentByIdAsync(id, actorUserId)`. |
| `POST /api/bid-intents/[id]/cancel` | Mutated in-memory `BID_INTENTS_STORE` | Persists `CANCELLED` status to PostgreSQL via `cancelBidIntentAsync(id, actorUserId)`. |
| `GET /api/businesses/[businessId]/bid-intents` | Read from in-memory Map | Queries PostgreSQL via `getBidIntentsByBusinessAsync(businessId, actorUserId)`. |
| `POST /api/bid-intents/[id]/payment-order` | Created in `PAYMENT_ORDERS_STORE` | Persists order to PostgreSQL via `createPaymentOrder` with `PostgresPaymentRepository`; checks `uq_payment_orders_bid_intent_provider`. |
| `GET /api/bid-intents/[id]/payment` | Read from `PAYMENT_ORDERS_STORE` | Queries PostgreSQL via `getPaymentOrderByBidIntentIdAsync(bidIntentId, actorUserId)`. |
| `POST /api/payments/[id]/cancel` | Mutated in-memory Map | Persists `CANCELLED` status to PostgreSQL via `cancelPaymentOrderAsync(id, actorUserId)`. |
| `POST /api/payments/webhooks/payu` | Updated in-memory Map | Stores payload fingerprint in `payment_provider_events`, updates order status in `payment_orders`, handles duplicates idempotently. |
| `POST /api/payments/callback/payu` | Rendered without durable lock | Validates reverse-hash and defers durable settlement to server confirmation gate. |
| `POST /api/payments/[id]/settle-ranking` | Settled in in-memory transaction | Queries PostgreSQL via `getRankingSettlementByPaymentOrderIdAsync` and invokes transactional settlement with database row locking. |
| `runPaymentReconciliationCycle` | Swept in-memory Map | Sweeps `paymentRepo.getUnresolvedPayments` from PostgreSQL. |
| `runSettlementRecoveryCycle` | Swept in-memory Map | Sweeps `paymentRepo.getUnsettledConfirmedPayments` from PostgreSQL. |

---

## 5. Ranking Settlement & Database Concurrency Locking

In `frontend/lib/ranking-settlement/transaction.ts` and `settlement-service.ts`:
- **Transactional Client Acquisition:** `RankingTransactionManager.runInTransaction` acquires a dedicated PostgreSQL connection from the connection pool (`pool.connect()`).
- **Transaction Block:** Issues `BEGIN`.
- **Market-Level Advisory Lock:** Executes `SELECT pg_advisory_xact_lock(hashtext($1))` with `marketId`. This ensures that all competing settlement processes across multiple Node.js instances are serialized at the database engine level until transaction completion.
- **Row-Level Lock:** Executes `SELECT id FROM markets WHERE id = $1 FOR UPDATE`.
- **Atomic Operations Inside Transaction:**
  - Upserts winner's market participation.
  - Updates displaced participants' positions and qualification amounts.
  - Appends immutable `position_history` records.
  - Inserts the `ranking_settlements` record.
  - Updates `payment_orders` status to `SETTLED`.
- **Atomicity / Rollback:** On any error or simulated fault injection, executes `ROLLBACK` and releases the connection back to the pool. All mutations are undone atomically.
- **Commit:** On success, executes `COMMIT` and automatically releases the advisory and row locks.

---

## 6. Verification and Test Results

### 1. Dedicated Integration & Durability Test Suite
Created `frontend/tests/financial-persistence-and-durability.test.ts` covering 21 comprehensive test assertions across 6 categories:

- **Category 1: Production Persistence Guard & Fail-Closed Invariants**
  - Allows in-memory storage strictly in development/test when `DATABASE_URL` is unset.
  - Strictly throws and refuses silent fallback when in production without `DATABASE_URL`.
  - Strictly throws when `PERSISTENCE_MODE=postgres` is set without `DATABASE_URL`.
- **Category 2: Durable BidIntent Persistence & Scoped Idempotency**
  - Creates and retrieves immutable BidIntent with independent server pricing.
  - Replays the exact same BidIntent upon identical scoped idempotency request.
  - Rejects reused idempotency key if target position or market is altered.
  - Enforces RBAC permissions (`OWNER`/`ADMIN` permitted, `EDITOR`/`FINANCE` denied).
  - Persists and validates `CANCELLED` status.
- **Category 3: Durable PaymentOrder Persistence & Webhook Processing**
  - Creates PaymentOrder with stable identifier and whole-rupee amounts.
  - Rejects payment creation on cancelled or expired BidIntents.
  - Handles duplicate PayU webhook callbacks idempotently without double processing.
  - Rejects webhooks with tampered reverse-hash signatures.
- **Category 4: Real Ranking Settlement & Concurrency Invariants**
  - Strictly rejects ranking settlement on unconfirmed payment orders (`PAYMENT_NOT_CONFIRMED`).
  - Atomically settles ranking once payment is `CONFIRMED`.
  - Atomically rolls back all mutations if an error occurs inside the transaction.
  - Serializes and isolates concurrent settlements on the same market.
- **Category 5: Background Worker Visibility & Reconciliation Cycles**
  - Executes bounded payment reconciliation cycle discovering unresolved payments.
  - Executes bounded settlement recovery cycle recovering confirmed payments after restart.
- **Category 6: PostgreSQL Repository Contract Verification**
  - Verifies `PostgresPaymentRepository` interface compliance.
  - Verifies `PostgresBidIntentRepository` interface compliance.
  - Verifies `PostgresRankingSettlementRepository` interface compliance.

**Test Run Result:**
```text
✔ 1. Production Persistence Guard & Fail-Closed Invariants (3 tests)
✔ 2. Durable BidIntent Persistence & Scoped Idempotency (5 tests)
✔ 3. Durable PaymentOrder Persistence & Webhook Processing (4 tests)
✔ 4. Real Ranking Settlement & Concurrency Invariants (4 tests)
✔ 5. Background Worker Visibility & Reconciliation Cycles (2 tests)
✔ 6. PostgreSQL Repository Contract Verification (3 tests)
TOTAL: 21 tests passed (0 failed, 100% success)
```

### 2. Full Test Suite Regression Verification
Executed `npm test` across the entire frontend repository:
```text
Total Test Suites: 160
Total Tests: 509
Passing: 509
Failing: 0
Duration: 1.42s
```

### 3. Static Type Verification
Executed `npm run typecheck` (`tsc --noEmit`):
```text
> @aageonline/frontend@0.1.0 typecheck
> tsc --noEmit
Exit code: 0 (0 errors)
```

### 4. Production Build Verification
Executed `npm run build` (`next build`):
```text
▲ Next.js 15.5.27
✓ Generating static pages (70/70)
✓ Finalizing page optimization
Exit code: 0 (0 errors)
```

---

## 7. Remaining Limitations & Production Gate

While the internal persistence logic and ranking transaction contracts are completely remediated, the following external items remain pending before launching live money in production:

1. **Live Managed Database Provisioning:** A dedicated PostgreSQL database instance (Neon / Supabase / DigitalOcean Managed) must be provisioned with connection pooling (`pgbouncer`), SSL certificate verification, and automated daily backup routines.
2. **Production PayU Merchant Credentials:** Production merchant key and salt must be populated in the production secrets manager; test sandbox keys are blocked by the deployment gate.
3. **Continuous Reconciliation Cron / Worker Process:** The background reconciliation runner (`scripts/run-reconciler.ts` or Docker background worker daemon) must be deployed as a durable supervisor process alongside the web application.

---

## 8. Final Verdict

**Milestone 0.20.11 Verdict:** `COMPLETE`  
**Platform Production Readiness Verdict:** `PARTIALLY COMPLETE` (Codebase is persistence-ready and concurrency-hardened; awaiting production database provisioning and live merchant credential deployment).
