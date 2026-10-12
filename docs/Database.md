# AageOnline — Database Schema & Data Integrity Invariants

## 1. System of Record & Engine Principles

- **Primary Database:** PostgreSQL 16+ (ACID compliant).
- **Isolation Level:** `READ COMMITTED` by default with explicit `SELECT ... FOR UPDATE` row locks on markets during ranking mutations; or `SERIALIZABLE` on high-concurrency markets.
- **Append-Only Financial Integrity:** Tables recording financial events, position transitions, and audit records are strictly immutable. Row updates or deletions on completed records are forbidden.
- **Integer Minor Units:** All monetary columns store exact 64-bit integers (`BIGINT`) representing paise (₹1.00 = `100`). Floating-point types (`FLOAT`, `DOUBLE PRECISION`, `REAL`) are prohibited.

---

## 2. Core Entities & Relational Rules

```text
users
  ├── businesses
  │     ├── business_owners (User to Business mapping)
  │     ├── business_claims
  │     ├── business_verifications
  │     └── ranking_entries
  └── transactions
        ├── bids
        └── position_history

markets (Location + Category)
  ├── categories
  ├── locations (State + District + City)
  └── ranking_entries

audit_logs
webhook_events
```

---

## 3. Authoritative Table Schemas

### 3.1 `markets`
Defines a unique competitive visibility landscape.
```sql
CREATE TABLE markets (
    id VARCHAR(64) PRIMARY KEY,
    location_id VARCHAR(64) NOT NULL REFERENCES locations(id),
    category_id VARCHAR(64) NOT NULL REFERENCES categories(id),
    slug VARCHAR(128) NOT NULL UNIQUE,
    status VARCHAR(32) NOT NULL DEFAULT 'ACTIVE', -- ACTIVE, LOCKED_FOR_RECONCILIATION
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_market_location_category UNIQUE (location_id, category_id)
);
```

### 3.2 `ranking_entries`
The authoritative current visibility ladder for a market.
```sql
CREATE TABLE ranking_entries (
    id VARCHAR(64) PRIMARY KEY,
    market_id VARCHAR(64) NOT NULL REFERENCES markets(id) ON DELETE RESTRICT,
    business_id VARCHAR(64) NOT NULL REFERENCES businesses(id) ON DELETE RESTRICT,
    position INT NOT NULL CHECK (position >= 1 AND position <= 100),
    qualifying_amount_minor BIGINT NOT NULL CHECK (qualifying_amount_minor > 0),
    transaction_id VARCHAR(64) NOT NULL REFERENCES transactions(id),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_market_position UNIQUE (market_id, position),
    CONSTRAINT uq_market_business UNIQUE (market_id, business_id)
);

CREATE INDEX idx_ranking_entries_market_pos ON ranking_entries (market_id, position ASC);
```

### 3.3 `transactions` (Append-Only Ledger)
```sql
CREATE TABLE transactions (
    id VARCHAR(64) PRIMARY KEY,
    business_id VARCHAR(64) NOT NULL REFERENCES businesses(id),
    user_id VARCHAR(64) NOT NULL REFERENCES users(id),
    market_id VARCHAR(64) NOT NULL REFERENCES markets(id),
    target_position INT NOT NULL CHECK (target_position >= 1),
    amount_minor BIGINT NOT NULL CHECK (amount_minor > 0),
    currency VARCHAR(3) NOT NULL DEFAULT 'INR' CHECK (currency = 'INR'),
    provider VARCHAR(32) NOT NULL, -- RAZORPAY, CASHFREE
    provider_transaction_id VARCHAR(128) UNIQUE,
    idempotency_key UUID NOT NULL UNIQUE,
    status VARCHAR(32) NOT NULL, -- CREATED, VALIDATING, PAYMENT_PENDING, PAYMENT_CONFIRMED, RANKING_CONFIRMED, FAILED, EXPIRED, CANCELLED, REJECTED, RECONCILIATION_REQUIRED
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    succeeded_at TIMESTAMPTZ,
    metadata JSONB NOT NULL DEFAULT '{}'
);

CREATE INDEX idx_transactions_business ON transactions (business_id, created_at DESC);
CREATE INDEX idx_transactions_provider_id ON transactions (provider_transaction_id);
```

### 3.4 `position_history` (Append-Only Audit)
```sql
CREATE TABLE position_history (
    id VARCHAR(64) PRIMARY KEY,
    business_id VARCHAR(64) NOT NULL REFERENCES businesses(id),
    market_id VARCHAR(64) NOT NULL REFERENCES markets(id),
    previous_position INT CHECK (previous_position >= 1),
    new_position INT NOT NULL CHECK (new_position >= 1),
    amount_minor BIGINT NOT NULL CHECK (amount_minor > 0),
    cause VARCHAR(32) NOT NULL, -- POSITION_GAINED, POSITION_LOST, ENTERED_RANKING, ADMINISTRATIVE
    transaction_id VARCHAR(64) REFERENCES transactions(id),
    occurred_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_position_history_biz_time ON position_history (business_id, occurred_at DESC);
CREATE INDEX idx_position_history_market_time ON position_history (market_id, occurred_at DESC);
```

### 3.5 `webhook_events` (Deduplication & Replay Guard)
```sql
CREATE TABLE webhook_events (
    id VARCHAR(64) PRIMARY KEY,
    provider VARCHAR(32) NOT NULL,
    event_id VARCHAR(128) NOT NULL,
    event_type VARCHAR(64) NOT NULL,
    payload_hash VARCHAR(64) NOT NULL,
    received_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    processed_at TIMESTAMPTZ,
    status VARCHAR(32) NOT NULL, -- PROCESSED, DUPLICATE_SKIPPED, FAILED
    CONSTRAINT uq_provider_event UNIQUE (provider, event_id)
);
```

### 3.6 `audit_logs` (Security & Operations Audit)
```sql
CREATE TABLE audit_logs (
    id VARCHAR(64) PRIMARY KEY,
    correlation_id UUID NOT NULL,
    actor_id VARCHAR(64) NOT NULL,
    actor_role VARCHAR(32) NOT NULL,
    action VARCHAR(64) NOT NULL,
    resource_type VARCHAR(64) NOT NULL,
    resource_id VARCHAR(64) NOT NULL,
    ip_address INET,
    status VARCHAR(32) NOT NULL, -- SUCCESS, FAILURE, DENIED
    metadata JSONB NOT NULL DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_audit_logs_correlation ON audit_logs (correlation_id);
CREATE INDEX idx_audit_logs_actor ON audit_logs (actor_id, created_at DESC);
CREATE INDEX idx_audit_logs_resource ON audit_logs (resource_type, resource_id);
```

### 3.7 `categories` (Business Taxonomy)
Defines business industry verticals and qualification scopes.
```sql
CREATE TABLE categories (
    id VARCHAR(64) PRIMARY KEY,
    name VARCHAR(128) NOT NULL,
    slug VARCHAR(128) NOT NULL UNIQUE,
    description TEXT,
    status VARCHAR(32) NOT NULL DEFAULT 'ACTIVE', -- ACTIVE, ARCHIVED
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_categories_slug ON categories (slug);
```

### 3.8 `businesses` (Commercial Entity Identity)
Defines independent commercial organizations and legal identities.
```sql
CREATE TABLE businesses (
    id VARCHAR(64) PRIMARY KEY,
    name VARCHAR(256) NOT NULL,
    slug VARCHAR(256) NOT NULL UNIQUE,
    legal_name VARCHAR(256),
    tagline VARCHAR(512),
    description TEXT NOT NULL,
    logo_url VARCHAR(512),
    cover_image_url VARCHAR(512),
    website VARCHAR(512),
    phone VARCHAR(32),
    email VARCHAR(256),
    address TEXT,
    primary_city_id VARCHAR(64) REFERENCES locations(id),
    primary_state_id VARCHAR(64),
    primary_country_id VARCHAR(64),
    verification_status VARCHAR(32) NOT NULL DEFAULT 'UNVERIFIED', -- UNVERIFIED, PENDING, VERIFIED, REJECTED
    publication_status VARCHAR(32) NOT NULL DEFAULT 'DRAFT',        -- DRAFT, REVIEW, PUBLISHED, ARCHIVED
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_businesses_slug ON businesses (slug);
CREATE INDEX idx_businesses_pub_status ON businesses (publication_status);
```

### 3.9 `business_categories` & `business_locations` (Taxonomy Associations)
Enforces multi-category membership and multi-location service areas.
```sql
CREATE TABLE business_categories (
    business_id VARCHAR(64) NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
    category_id VARCHAR(64) NOT NULL REFERENCES categories(id) ON DELETE RESTRICT,
    is_primary BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (business_id, category_id)
);

CREATE TABLE business_locations (
    business_id VARCHAR(64) NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
    city_id VARCHAR(64) NOT NULL REFERENCES locations(id) ON DELETE RESTRICT,
    is_primary BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (business_id, city_id)
);
```

### 3.10 `market_participations` (Business + Market Association)
Explicit competitive participation linking a business to a defined market.
```sql
CREATE TABLE market_participations (
    id VARCHAR(64) PRIMARY KEY,
    business_id VARCHAR(64) NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
    market_id VARCHAR(64) NOT NULL REFERENCES markets(id) ON DELETE CASCADE,
    status VARCHAR(32) NOT NULL DEFAULT 'ACTIVE', -- ACTIVE, ELIGIBLE, SUSPENDED, REMOVED
    eligibility_status VARCHAR(32) NOT NULL DEFAULT 'ELIGIBLE', -- ELIGIBLE, INELIGIBLE
    joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_business_market UNIQUE (business_id, market_id)
);

CREATE INDEX idx_market_part_business ON market_participations (business_id);
CREATE INDEX idx_market_part_market ON market_participations (market_id);
```

### 3.11 `users` (Identity Provider Entity)
Represents the human authentication identity.
```sql
CREATE TABLE users (
    id VARCHAR(64) PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    display_name VARCHAR(255),
    avatar_url VARCHAR(512),
    status VARCHAR(32) NOT NULL DEFAULT 'ACTIVE', -- ACTIVE, SUSPENDED, DELETED
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_users_email ON users (email);
```

### 3.12 `business_memberships` (Authorized Access & RBAC)
Connects Users to Businesses with explicit roles and permissions.
```sql
CREATE TABLE business_memberships (
    id VARCHAR(64) PRIMARY KEY,
    business_id VARCHAR(64) NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
    user_id VARCHAR(64) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role VARCHAR(32) NOT NULL, -- OWNER, ADMIN, EDITOR, FINANCE
    status VARCHAR(32) NOT NULL DEFAULT 'ACTIVE', -- ACTIVE, INVITED, SUSPENDED, REMOVED
    invited_by VARCHAR(64) REFERENCES users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_business_membership UNIQUE (business_id, user_id)
);

CREATE INDEX idx_memberships_user ON business_memberships (user_id);
CREATE INDEX idx_memberships_business ON business_memberships (business_id);
```

### 3.13 `business_claims` (Verification & Ownership Requests)
Represents an auditable verification claim for a canonical business.
```sql
CREATE TABLE business_claims (
    id VARCHAR(64) PRIMARY KEY,
    business_id VARCHAR(64) NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
    claimant_user_id VARCHAR(64) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    claimant_name VARCHAR(255) NOT NULL,
    claimant_email VARCHAR(255) NOT NULL,
    claimant_role_description VARCHAR(255),
    status VARCHAR(32) NOT NULL DEFAULT 'PENDING', -- PENDING, UNDER_REVIEW, APPROVED, REJECTED, CANCELLED, EXPIRED
    evidence_type VARCHAR(64) NOT NULL, -- GSTIN, BUSINESS_EMAIL, OFFICIAL_DOCUMENT, PHONE_VERIFICATION
    evidence_reference VARCHAR(512) NOT NULL,
    submitted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    reviewed_at TIMESTAMPTZ,
    reviewed_by VARCHAR(64) REFERENCES users(id),
    rejection_reason TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_claims_business ON business_claims (business_id);
CREATE INDEX idx_claims_claimant ON business_claims (claimant_user_id);
```

---

## 4. Key Constraints & Data Invariants

1. **Unique Ranking Constraint:** `UNIQUE (market_id, position)` ensures no two businesses can ever be assigned the same rank within a market.
2. **One Rank per Business:** `UNIQUE (market_id, business_id)` ensures a business cannot duplicate its presence in the same market.
3. **Strict Minor Units:** `CHECK (amount_minor > 0)` prevents zero or negative transactions from persisting.
4. **Currency Lock:** `CHECK (currency = 'INR')` prevents cross-currency drift.
5. **Immutable Financial History:** Database roles assigned to application services are revoked `UPDATE` and `DELETE` permissions on `transactions`, `position_history`, and `audit_logs`.

---

## 5. Periodic Reconciliation Query

A scheduled worker executes an hourly integrity check:

```sql
-- Detect impossible states: Ranking entries without a confirmed transaction
SELECT re.market_id, re.position, re.business_id, re.transaction_id
FROM ranking_entries re
LEFT JOIN transactions t ON re.transaction_id = t.id
WHERE t.id IS NULL OR t.status != 'RANKING_CONFIRMED';
```
Any records returned trigger an immediate platform halt on the affected market and page engineering on-call.

---

## 6. Database Independence & Public Contract Decoupling

Frontend UI components never directly bind to or query database entities, internal UUID primary keys, or raw SQL tables. All public presentation states are mediated by the Typed Domain Data-Access layer (`frontend/data-access/`), transforming storage rows into public-safe `MarketSummary`, `LocationSummary`, `CategorySummary`, and `BusinessSummary`/`BusinessProfile` representations. Internal administrative flags, audit correlations, risk scores, and payment gateway references are masked at the service boundary. In City Pages (`/[location]`), Category Pages (`/categories/[category]`), Business Profiles (`/businesses/[business]`), and directories (`/locations`, `/categories`, `/businesses`), market count aggregation, location derivation, and category derivation execute strictly behind `LocationService`, `CategoryService`, `BusinessService`, and `MarketService`, ensuring full database decoupling.

---

## 7. Read-Only Pricing Engine & Zero Persistence Guarantee

The Market Position Pricing Calculator operates with a strict **zero-persistence guarantee**:
- **Zero Rows Created:** Evaluating target position pricing writes 0 rows to `transactions`, 0 rows to `position_history`, 0 rows to `bids`, 0 rows to `audit_logs`, and leaves `ranking_entries` and `market_participations` completely untouched.
- **Stateless Read-Only Querying:** The calculator exclusively reads committed ranking snapshots and market capacity configuration via `RankingStateProvider`.
- **No Hold / Reservation Tokens:** Pricing calculations generate no database locks, no row reservations, and no temporary position holds. Future mutations occur only after payment gateway confirmation within an atomic transaction with `SELECT ... FOR UPDATE` market locks.

---

## 8. Bid Intent Persistence & Idempotency Boundary (Milestone 0.11.0)

### 8.1 Schema Definition: `bid_intents`

```sql
CREATE TYPE bid_intent_status AS ENUM (
  'PENDING_PAYMENT',
  'EXPIRED',
  'CANCELLED'
);

CREATE TABLE bid_intents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE RESTRICT,
  market_id UUID NOT NULL REFERENCES markets(id) ON DELETE RESTRICT,
  created_by_user_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  membership_id UUID NOT NULL REFERENCES business_memberships(id) ON DELETE RESTRICT,
  target_position INTEGER NOT NULL CHECK (target_position > 0),
  qualifying_amount_minor BIGINT NOT NULL CHECK (qualifying_amount_minor > 0 AND qualifying_amount_minor % 100 = 0),
  qualifying_amount_rupees BIGINT NOT NULL CHECK (qualifying_amount_rupees > 0),
  currency VARCHAR(3) NOT NULL DEFAULT 'INR' CHECK (currency = 'INR'),
  status bid_intent_status NOT NULL DEFAULT 'PENDING_PAYMENT',
  idempotency_key VARCHAR(128) NOT NULL,
  pricing_snapshot JSONB NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Scoped Idempotency Constraint
  CONSTRAINT uq_bid_intents_actor_business_key UNIQUE (created_by_user_id, business_id, idempotency_key)
);

CREATE INDEX idx_bid_intents_business_status ON bid_intents(business_id, status);
CREATE INDEX idx_bid_intents_expires_at ON bid_intents(expires_at) WHERE status = 'PENDING_PAYMENT';
```

### 8.2 JSONB Pricing Snapshot Structure
The `pricing_snapshot` column stores an immutable record of market and calculation parameters at creation time:
```json
{
  "marketId": "mkt-jaipur-interior-designers",
  "marketSlug": "jaipur/interior-designers",
  "targetPosition": 1,
  "relevantCurrentQualifyingAmountMinor": 2850000,
  "relevantCurrentQualifyingAmountRupees": 28500,
  "requiredQualifyingAmountMinor": 2850100,
  "requiredQualifyingAmountRupees": 28501,
  "calculationMode": "STRICT_SUPERSEDING",
  "reason": "Supersedes incumbent at Position #1 (₹28,500) by minimum increment of ₹1.",
  "calculatedAt": "2026-10-08T10:30:00.000Z"
}
```

### 8.3 Invariants and Zero-Mutation Boundary
1. **Zero Financial Mutation:** Inserts to `bid_intents` generate 0 rows in `transactions`, `payment_orders`, or payment ledgers.
2. **Zero Ranking Mutation:** Inserts to `bid_intents` leave `ranking_entries`, `market_participations`, and `position_history` untouched.
3. **No Position Lock:** Multiple businesses can create concurrent pending `bid_intents` for the same target position. Position exclusivity is resolved only at future atomic ranking mutation upon verified payment.
4. **Append-Only Immutability:** Updating `target_position`, amounts, currency, user, or snapshot on existing records is strictly disallowed.

---

## 9. Payment Order & Provider Event Persistence (Milestone 0.12.0)

### 9.1 Schema Definition: `payment_orders`

```sql
CREATE TYPE payment_order_status AS ENUM (
  'CREATED',
  'PENDING',
  'SUCCEEDED',
  'CONFIRMED',
  'FAILED',
  'CANCELLED',
  'EXPIRED',
  'UNKNOWN'
);

CREATE TABLE payment_orders (
  id VARCHAR(64) PRIMARY KEY,
  bid_intent_id VARCHAR(64) NOT NULL REFERENCES bid_intents(id) ON DELETE RESTRICT,
  business_id VARCHAR(64) NOT NULL REFERENCES businesses(id) ON DELETE RESTRICT,
  market_id VARCHAR(64) NOT NULL REFERENCES markets(id) ON DELETE RESTRICT,
  created_by_user_id VARCHAR(64) NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  membership_id VARCHAR(64) NOT NULL REFERENCES business_memberships(id) ON DELETE RESTRICT,
  provider VARCHAR(32) NOT NULL DEFAULT 'PAYU',
  provider_order_id VARCHAR(128),
  provider_transaction_id VARCHAR(128),
  provider_payment_id VARCHAR(128),
  amount_minor BIGINT NOT NULL CHECK (amount_minor > 0 AND amount_minor % 100 = 0),
  amount_rupees BIGINT NOT NULL CHECK (amount_rupees > 0),
  currency VARCHAR(3) NOT NULL DEFAULT 'INR' CHECK (currency = 'INR'),
  status payment_order_status NOT NULL DEFAULT 'CREATED',
  idempotency_key VARCHAR(128) NOT NULL,
  paid_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- One active payment order per BidIntent per provider
  CONSTRAINT uq_payment_orders_bid_intent_provider UNIQUE (bid_intent_id, provider),

  -- Scoped idempotency constraint for creation
  CONSTRAINT uq_payment_orders_idempotency UNIQUE (created_by_user_id, business_id, bid_intent_id, idempotency_key),

  -- Provider transaction reference uniqueness
  CONSTRAINT uq_payment_orders_provider_txnid UNIQUE (provider_transaction_id)
);

CREATE INDEX idx_payment_orders_business_status ON payment_orders(business_id, status);
CREATE INDEX idx_payment_orders_bid_intent ON payment_orders(bid_intent_id);
```

### 9.2 Schema Definition: `payment_provider_events`

```sql
CREATE TYPE payment_event_processing_status AS ENUM (
  'RECEIVED',
  'PROCESSED',
  'DUPLICATE',
  'REJECTED',
  'FAILED'
);

CREATE TABLE payment_provider_events (
  id VARCHAR(64) PRIMARY KEY,
  provider VARCHAR(32) NOT NULL DEFAULT 'PAYU',
  provider_event_id VARCHAR(128),
  event_type VARCHAR(64) NOT NULL,
  payment_order_id VARCHAR(64) REFERENCES payment_orders(id) ON DELETE SET NULL,
  provider_transaction_id VARCHAR(128),
  payload_hash VARCHAR(128) NOT NULL,
  processing_status payment_event_processing_status NOT NULL DEFAULT 'RECEIVED',
  received_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  processed_at TIMESTAMPTZ,

  -- Deterministic event fingerprint duplicate protection
  CONSTRAINT uq_payment_provider_events_fingerprint UNIQUE (provider, payload_hash)
);

CREATE INDEX idx_payment_provider_events_order ON payment_provider_events(payment_order_id);
CREATE INDEX idx_payment_provider_events_txnid ON payment_provider_events(provider_transaction_id);
```

### 9.3 Invariants and Zero-Mutation Boundary
1. **Zero Ranking Mutation:** Inserts or status updates on `payment_orders` write 0 rows to `ranking_entries`, 0 rows to `position_history`, and modify zero columns in `market_participations`.
2. **Deterministic Amount Integrity:** `amount_minor` must match `bid_intents.qualifying_amount_minor` exactly. Fractional paise or decimal amounts are rejected by database constraints.
3. **No Financial Overwrite:** Webhooks and callbacks update status monotonically. Terminal states (`SUCCEEDED`, `CONFIRMED`, `CANCELLED`, `EXPIRED`) cannot be downgraded to `PENDING` or `FAILED`.

---

## 10. Ranking Settlement & Position History Persistence (Milestone 0.13.0)

### 10.1 Schema Definition: `ranking_settlements`

Stores immutable settlement outcome transitioning confirmed payments to authoritative ranking positions.

```sql
CREATE TYPE ranking_settlement_status AS ENUM (
  'PENDING',
  'PROCESSING',
  'SETTLED',
  'FAILED',
  'RETRYABLE'
);

CREATE TABLE ranking_settlements (
  id VARCHAR(64) PRIMARY KEY,
  payment_order_id VARCHAR(64) NOT NULL REFERENCES payment_orders(id) ON DELETE RESTRICT,
  bid_intent_id VARCHAR(64) NOT NULL REFERENCES bid_intents(id) ON DELETE RESTRICT,
  business_id VARCHAR(64) NOT NULL REFERENCES businesses(id) ON DELETE RESTRICT,
  market_id VARCHAR(64) NOT NULL REFERENCES markets(id) ON DELETE RESTRICT,
  
  status ranking_settlement_status NOT NULL DEFAULT 'PENDING',
  failure_reason VARCHAR(128),
  
  target_position INT NOT NULL CHECK (target_position >= 1 AND target_position <= 100),
  paid_amount_minor BIGINT NOT NULL CHECK (paid_amount_minor > 0 AND paid_amount_minor % 100 = 0),
  paid_amount_rupees INT NOT NULL CHECK (paid_amount_rupees > 0),
  
  previous_position INT CHECK (previous_position >= 1),
  final_position INT CHECK (final_position >= 1 AND final_position <= 100),
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  settled_at TIMESTAMPTZ,

  -- Invariant 2: A confirmed payment can cause at most one effective ranking settlement
  CONSTRAINT uq_ranking_settlements_payment_order UNIQUE (payment_order_id)
);

CREATE INDEX idx_ranking_settlements_business ON ranking_settlements(business_id, created_at DESC);
CREATE INDEX idx_ranking_settlements_market ON ranking_settlements(market_id, created_at DESC);
CREATE INDEX idx_ranking_settlements_status ON ranking_settlements(status);
```

### 10.2 Schema Definition: `position_history`

Append-only audit ledger recording every verified upward and downward movement within a market.

```sql
CREATE TABLE position_history (
  id VARCHAR(64) PRIMARY KEY,
  business_id VARCHAR(64) NOT NULL REFERENCES businesses(id) ON DELETE RESTRICT,
  market_id VARCHAR(64) NOT NULL REFERENCES markets(id) ON DELETE RESTRICT,
  
  previous_position INT CHECK (previous_position >= 1),
  new_position INT NOT NULL CHECK (new_position >= 1 AND new_position <= 100),
  
  cause VARCHAR(64) NOT NULL DEFAULT 'PAID_VISIBILITY_SETTLEMENT',
  
  payment_order_id VARCHAR(64) REFERENCES payment_orders(id) ON DELETE SET NULL,
  bid_intent_id VARCHAR(64) REFERENCES bid_intents(id) ON DELETE SET NULL,
  ranking_settlement_id VARCHAR(64) REFERENCES ranking_settlements(id) ON DELETE RESTRICT,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- PositionHistory records cannot be updated or overwriting no-ops
  CONSTRAINT chk_position_history_movement CHECK (
    previous_position IS NULL OR previous_position <> new_position
  )
);

CREATE INDEX idx_position_history_business ON position_history(business_id, created_at DESC);
CREATE INDEX idx_position_history_market ON position_history(market_id, created_at DESC);
CREATE INDEX idx_position_history_settlement ON position_history(ranking_settlement_id);
```

### 10.3 Active Position Uniqueness Constraint on `market_participations`

To guarantee that duplicate positions can never be persisted inside a market:

```sql
-- Enforces that at most one active business occupies each integer position in a market
CREATE UNIQUE INDEX uq_market_participations_active_position 
ON market_participations(market_id, current_position) 
WHERE status = 'ACTIVE' AND current_position IS NOT NULL;
```

---

## 11. Production Migrations & Durable Settlement Recovery (Milestone 0.14.0)

### 11.1 Migration Harness & Version Tracking

Database evolution is managed via version-controlled raw SQL migrations located in `frontend/lib/db/migrations/` and executed via `npm run db:migrate` (`frontend/scripts/migrate.ts`).

The execution sequence is recorded in `schema_migrations`:

```sql
CREATE TABLE IF NOT EXISTS schema_migrations (
  id SERIAL PRIMARY KEY,
  version VARCHAR(64) NOT NULL UNIQUE,
  applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

### 11.2 Canonical Migration Suite

| Migration | File | Tables / Indexes Added | Invariant Enforced |
|---|---|---|---|
| `001` | `001_initial_schema.sql` | `locations`, `categories`, `markets`, `businesses`, `business_memberships`, `business_claims`, `market_participations`, `audit_logs` | `uq_market_participations_active_position` ensures zero duplicate active positions per market. |
| `002` | `002_bid_intents.sql` | `bid_intents` | `uq_bid_intents_actor_business_key` scoped idempotency; `chk_bid_intents_minor_units` whole-rupee check. |
| `003` | `003_payments_and_events.sql` | `payment_orders`, `payment_provider_events` | `uq_payment_orders_scoped_idem` scoped idempotency; `uq_payment_provider_events_fingerprint` payload hash deduplication. |
| `004` | `004_ranking_settlements_and_history.sql` | `ranking_settlements`, `position_history` | `uq_ranking_settlements_payment_order` one-settlement-per-order; `chk_position_history_movement` no-op check. |
| `005` | `005_outbox_and_recovery.sql` | `settlement_recovery_jobs` | `uq_recovery_jobs_payment_order` idempotent recovery queue; `idx_recovery_jobs_poll` for `SKIP LOCKED`. |
| `006` | `006_admin_operations.sql` | `reconciliation_runs`, `payment_orders.reconciliation_status` | `uq_reconciliation_runs_window` window-level reconciliation tracking; operational auditing. |
| `007` | `007_ranking_notifications.sql` | `ranking_change_events`, `business_notifications`, `notification_preferences` | `uq_ranking_change_event` transactional settlement outbox uniqueness; `uq_notification_event_user_type` idempotent notification creation; `uq_notification_preference_user_biz` tenant-scoped preferences. |

### 11.3 Settlement Recovery Job Queue Schema

Enables background recovery workers to discover confirmed-but-unsettled payment orders and retry ranking settlement safely:

```sql
CREATE TABLE IF NOT EXISTS settlement_recovery_jobs (
  id VARCHAR(64) PRIMARY KEY,
  payment_order_id VARCHAR(64) NOT NULL REFERENCES payment_orders(id) ON DELETE CASCADE,
  status VARCHAR(32) NOT NULL DEFAULT 'PENDING', -- PENDING, PROCESSING, COMPLETED, FAILED, RETRYABLE
  attempts INT NOT NULL DEFAULT 0,
  max_attempts INT NOT NULL DEFAULT 5,
  next_run_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_error TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  CONSTRAINT uq_recovery_jobs_payment_order UNIQUE (payment_order_id)
);

-- Fast polling index for concurrent worker claiming:
CREATE INDEX IF NOT EXISTS idx_recovery_jobs_poll
ON settlement_recovery_jobs (status, next_run_at)
WHERE status IN ('PENDING', 'RETRYABLE');
```

### 11.4 Milestone 0.16.0 Ranking Notification & History Outbox Schema

```sql
-- 1. Committed Ranking Change Events Outbox
CREATE TABLE IF NOT EXISTS ranking_change_events (
    id VARCHAR(64) PRIMARY KEY,
    ranking_settlement_id VARCHAR(64) NOT NULL REFERENCES ranking_settlements(id) ON DELETE RESTRICT,
    payment_order_id VARCHAR(64) REFERENCES payment_orders(id) ON DELETE SET NULL,
    business_id VARCHAR(64) NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
    market_id VARCHAR(64) NOT NULL REFERENCES markets(id) ON DELETE RESTRICT,
    previous_position INT CHECK (previous_position >= 1 AND previous_position <= 100),
    new_position INT NOT NULL CHECK (new_position >= 1 AND new_position <= 100),
    direction VARCHAR(16) NOT NULL CHECK (direction IN ('UP', 'DOWN', 'ENTRY', 'NO_CHANGE')),
    is_target_business BOOLEAN NOT NULL DEFAULT false,
    status VARCHAR(32) NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'PROCESSED', 'FAILED')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    processed_at TIMESTAMPTZ,
    CONSTRAINT uq_ranking_change_event UNIQUE (ranking_settlement_id, business_id)
);

-- 2. Durable Business Notifications Queue
CREATE TABLE IF NOT EXISTS business_notifications (
    id VARCHAR(64) PRIMARY KEY,
    business_id VARCHAR(64) NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
    recipient_user_id VARCHAR(64) REFERENCES users(id) ON DELETE SET NULL,
    market_id VARCHAR(64) NOT NULL REFERENCES markets(id) ON DELETE RESTRICT,
    ranking_change_event_id VARCHAR(64) REFERENCES ranking_change_events(id) ON DELETE SET NULL,
    event_type VARCHAR(64) NOT NULL CHECK (event_type IN ('RANKING_DROP_MILESTONE', 'RANKING_IMPROVED', 'RANKING_ENTRY', 'MARKET_OVERTAKEN')),
    milestone VARCHAR(32) CHECK (milestone IN ('#1_TO_#5', '#5_TO_#10', '#10_TO_#20', '#20_TO_#30', '#30_TO_#50', '#50_TO_#75', '#75_TO_#100')),
    previous_position INT CHECK (previous_position >= 1 AND previous_position <= 100),
    new_position INT NOT NULL CHECK (new_position >= 1 AND new_position <= 100),
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    channel VARCHAR(16) NOT NULL DEFAULT 'IN_APP' CHECK (channel IN ('IN_APP', 'EMAIL')),
    status VARCHAR(32) NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'PROCESSING', 'RETRYABLE', 'DELIVERED', 'FAILED')),
    is_read BOOLEAN NOT NULL DEFAULT false,
    read_at TIMESTAMPTZ,
    attempts INT NOT NULL DEFAULT 0,
    max_attempts INT NOT NULL DEFAULT 5,
    next_run_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    locked_until TIMESTAMPTZ,
    last_error TEXT,
    delivery_metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    delivered_at TIMESTAMPTZ,
    CONSTRAINT uq_notification_event_user_type UNIQUE NULLS NOT DISTINCT (
        ranking_change_event_id, recipient_user_id, channel, event_type
    )
);

-- 3. Tenant Notification Preferences
CREATE TABLE IF NOT EXISTS notification_preferences (
    id VARCHAR(64) PRIMARY KEY,
    user_id VARCHAR(64) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    business_id VARCHAR(64) NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
    email_ranking_drops BOOLEAN NOT NULL DEFAULT false,
    in_app_ranking_drops BOOLEAN NOT NULL DEFAULT true,
    digest_window_minutes INT NOT NULL DEFAULT 15 CHECK (digest_window_minutes >= 5 AND digest_window_minutes <= 1440),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_notification_preference_user_biz UNIQUE (user_id, business_id)
);
```

### 11.4 Concurrency & Locking Strategy

To ensure strict ACID consistency during ranking mutations across distributed application instances:
1. **Transaction Lifecycle:** `BEGIN ... COMMIT / ROLLBACK` managed through `withTransaction` in `PostgresRankingTransactionContext`.
2. **Market-Level Row Lock:** `SELECT id FROM markets WHERE id = $1 FOR UPDATE` serializes concurrent settlement attempts for the same market.
3. **Queue Polling Lock:** `SELECT ... FOR UPDATE SKIP LOCKED` prevents multiple recovery workers from claiming the same job simultaneously.
4. **Active Position Uniqueness:** The partial index `uq_market_participations_active_position` acts as the ultimate database barrier against duplicate active rankings.

### 11.5 Backup & Disaster Recovery Assumptions

- **Point-in-Time Recovery (PITR):** Production database requires WAL archiving with continuous backup.
- **Append-Only Preservation:** `position_history`, `audit_logs`, and `payment_provider_events` must never be truncated or overwritten during maintenance.

---

## 12. Migration 008: Search Engine Visibility & Discovery Audit

Implemented in `frontend/lib/db/migrations/008_seo_audits.sql` for Milestone 0.17.0.

### 12.1 `seo_audit_runs`
Records durable, auditable SEO eligibility and sitemap generation outcomes.

```sql
CREATE TABLE IF NOT EXISTS seo_audit_runs (
    id VARCHAR(64) PRIMARY KEY,
    started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    completed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    total_candidates INT NOT NULL DEFAULT 0,
    eligible_count INT NOT NULL DEFAULT 0,
    excluded_count INT NOT NULL DEFAULT 0,
    validation_failures INT NOT NULL DEFAULT 0,
    sitemap_checksum VARCHAR(64) NOT NULL,
    exclusions_by_reason JSONB NOT NULL DEFAULT '{}'::jsonb,
    search_console_status JSONB NOT NULL DEFAULT '{}'::jsonb,
    error_summary TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_seo_audit_runs_created 
    ON seo_audit_runs(created_at DESC);
```

### 12.2 `seo_registered_routes`
Maintains the snapshot of all candidate platform URLs with their verified SEO eligibility, exclusion reasons, and content quality ratings.

```sql
CREATE TABLE IF NOT EXISTS seo_registered_routes (
    id VARCHAR(64) PRIMARY KEY,
    url VARCHAR(512) NOT NULL UNIQUE,
    path VARCHAR(512) NOT NULL,
    route_type VARCHAR(32) NOT NULL,
    entity_id VARCHAR(64),
    is_eligible BOOLEAN NOT NULL DEFAULT false,
    exclusion_reasons TEXT[] NOT NULL DEFAULT '{}',
    publication_status VARCHAR(32) NOT NULL,
    indexability_status VARCHAR(32) NOT NULL,
    content_status VARCHAR(32) NOT NULL,
    has_genuine_data BOOLEAN NOT NULL DEFAULT false,
    active_child_count INT NOT NULL DEFAULT 0,
    last_modified TIMESTAMPTZ,
    audited_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_seo_registered_routes_eligible 
    ON seo_registered_routes(is_eligible);
CREATE INDEX IF NOT EXISTS idx_seo_registered_routes_audited 
    ON seo_registered_routes(audited_at DESC);
```

---

## 13. Migration 009: Performance Indexes & Connection Pool Sizing

Implemented in `frontend/lib/db/migrations/009_performance_indexes.sql` for Milestone 0.18.0.

### 13.1 Performance Indexes
Composite indexes designed to optimize high-traffic query paths without weakening constraints or consistency:

```sql
-- 1. Business Directory & Sitemap Candidate Scanning
CREATE INDEX IF NOT EXISTS idx_businesses_pub_verif 
  ON businesses(publication_status, verification_status);

CREATE INDEX IF NOT EXISTS idx_businesses_slug 
  ON businesses(slug);

-- 2. Market Ranking Ladder & Settlement Displacement Scanning
CREATE INDEX IF NOT EXISTS idx_market_participations_ladder 
  ON market_participations(market_id, status, current_position ASC NULLS LAST);

CREATE INDEX IF NOT EXISTS idx_market_participations_biz_status 
  ON market_participations(business_id, status);

-- 3. Business Workspace Position History Filtering
CREATE INDEX IF NOT EXISTS idx_position_history_biz_market 
  ON position_history(business_id, market_id, created_at DESC);

-- 4. Fast Taxonomy & Route Resolution Lookups
CREATE INDEX IF NOT EXISTS idx_markets_lookup 
  ON markets(slug, status);

CREATE INDEX IF NOT EXISTS idx_locations_slug_status 
  ON locations(slug, status);

CREATE INDEX IF NOT EXISTS idx_categories_slug_status 
  ON categories(slug, status);
```

### 13.2 Connection Pool Sizing & Resource Budget

The production database connection pool is managed via `pg.Pool` with bounded timeouts:
- **Max Connections per Container (`DATABASE_MAX_CONNECTIONS`):** Default `10` (configurable, recommended 5–15).
- **Statement Timeout (`DATABASE_STATEMENT_TIMEOUT_MS`):** Default `10000ms` (10s) to abort runaway reporting queries and prevent connection starvation.
- **Connection Timeout (`DATABASE_CONNECTION_TIMEOUT_MS`):** Default `5000ms` (5s).
- **Idle Timeout (`DATABASE_IDLE_TIMEOUT_MS`):** Default `30000ms` (30s).
- **Global Deployment Connection Budget:**
  - Web Instances: Up to 5 containers $\times$ 10 max connections = 50 connections.
  - Background Reconciler / Worker: 2 instances $\times$ 5 max connections = 10 connections.
  - Total Potential Budget: 60 connections (safely within typical cloud PostgreSQL `max_connections = 100`).

---

## 14. Migration 010: Durable Cache Invalidation Outbox & Distributed Rate Limiting

Implemented in `frontend/lib/db/migrations/010_durable_invalidation_and_rate_limits.sql` for Milestone 0.19.0.

### 14.1 `cache_invalidation_jobs` (Durable Outbox Queue)
Replaces volatile in-memory queues (`FAILED_INVALIDATIONS_RECOVERY_QUEUE`) with a durable PostgreSQL-backed queue that survives container and process restarts:

```sql
CREATE TABLE IF NOT EXISTS cache_invalidation_jobs (
  id VARCHAR(64) PRIMARY KEY,
  market_id VARCHAR(64) NOT NULL REFERENCES markets(id) ON DELETE CASCADE,
  paths JSONB NOT NULL DEFAULT '[]',
  tags JSONB NOT NULL DEFAULT '[]',
  status VARCHAR(32) NOT NULL DEFAULT 'PENDING', -- PENDING, PROCESSING, COMPLETED, FAILED, TERMINAL_FAILED
  attempts INT NOT NULL DEFAULT 0,
  max_attempts INT NOT NULL DEFAULT 5,
  next_run_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  locked_until TIMESTAMPTZ,
  version INT NOT NULL DEFAULT 1,
  last_error TEXT,
  trigger_cause VARCHAR(64) NOT NULL DEFAULT 'SETTLEMENT_COMMITTED',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Fast polling index for recovery workers with skip-locked support
CREATE INDEX IF NOT EXISTS idx_invalidation_jobs_poll 
ON cache_invalidation_jobs (status, next_run_at) 
WHERE status IN ('PENDING', 'FAILED');

CREATE INDEX IF NOT EXISTS idx_invalidation_jobs_market 
ON cache_invalidation_jobs (market_id);

CREATE INDEX IF NOT EXISTS idx_invalidation_jobs_created 
ON cache_invalidation_jobs (created_at DESC);
```

### 14.2 `rate_limit_counters` (Multi-Instance Atomic Sliding Window)
Enables shared rate-limiting across horizontally scaled application instances:

```sql
CREATE TABLE IF NOT EXISTS rate_limit_counters (
  token VARCHAR(64) NOT NULL,
  tier VARCHAR(32) NOT NULL,
  window_start TIMESTAMPTZ NOT NULL,
  count INT NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (token, tier, window_start)
);

CREATE INDEX IF NOT EXISTS idx_rate_limit_expiry 
ON rate_limit_counters (window_start);
```

### 14.3 Concurrency & Locking Semantics
- **Atomic Recovery Leases:** Workers claim jobs using `SELECT ... FOR UPDATE SKIP LOCKED` bounded by a 30-second lease (`locked_until = NOW() + INTERVAL '30 seconds'`).
- **Idempotent Invalidation:** Multiple workers claiming different jobs can execute safely without interfering with each other. If a worker crashes mid-invalidation, the lease expires and the job is automatically retried up to 5 times.
- **Fail-Open Rate Limiter:** During temporary database connection issues or failovers, rate limiting degrades safely to process-local memory counters, preventing widespread disruption of legitimate users while logging security alerts.








