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
