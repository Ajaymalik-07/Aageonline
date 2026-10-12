-- Migration 002: BidIntents Schema & Idempotency Constraints

CREATE TABLE IF NOT EXISTS bid_intents (
  id VARCHAR(64) PRIMARY KEY,
  business_id VARCHAR(64) NOT NULL REFERENCES businesses(id) ON DELETE RESTRICT,
  market_id VARCHAR(64) NOT NULL REFERENCES markets(id) ON DELETE RESTRICT,
  created_by_user_id VARCHAR(64) NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  membership_id VARCHAR(64) NOT NULL REFERENCES business_memberships(id) ON DELETE RESTRICT,
  target_position INTEGER NOT NULL CHECK (target_position >= 1 AND target_position <= 100),
  qualifying_amount_minor BIGINT NOT NULL CHECK (qualifying_amount_minor > 0 AND qualifying_amount_minor % 100 = 0),
  qualifying_amount_rupees INT NOT NULL CHECK (qualifying_amount_rupees > 0),
  currency VARCHAR(3) NOT NULL DEFAULT 'INR' CHECK (currency = 'INR'),
  status VARCHAR(32) NOT NULL DEFAULT 'PENDING_PAYMENT',
  idempotency_key VARCHAR(128) NOT NULL,
  pricing_snapshot JSONB NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Scoped Idempotency Constraint: Exactly one intent per actor, business, and idempotency key
  CONSTRAINT uq_bid_intents_actor_business_key UNIQUE (created_by_user_id, business_id, idempotency_key)
);

CREATE INDEX IF NOT EXISTS idx_bid_intents_business_status ON bid_intents(business_id, status);
CREATE INDEX IF NOT EXISTS idx_bid_intents_market ON bid_intents(market_id, status);
CREATE INDEX IF NOT EXISTS idx_bid_intents_expires_at ON bid_intents(expires_at) WHERE status = 'PENDING_PAYMENT';
