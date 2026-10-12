-- Migration 003: Payment Orders & Provider Events Schema

CREATE TABLE IF NOT EXISTS payment_orders (
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
  amount_rupees INT NOT NULL CHECK (amount_rupees > 0),
  currency VARCHAR(3) NOT NULL DEFAULT 'INR' CHECK (currency = 'INR'),
  status VARCHAR(32) NOT NULL DEFAULT 'CREATED',
  idempotency_key VARCHAR(128) NOT NULL,
  paid_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- One active payment order per BidIntent per provider
  CONSTRAINT uq_payment_orders_bid_intent_provider UNIQUE (bid_intent_id, provider),

  -- Scoped idempotency constraint for order creation
  CONSTRAINT uq_payment_orders_idempotency UNIQUE (created_by_user_id, business_id, bid_intent_id, idempotency_key),

  -- Provider transaction reference uniqueness
  CONSTRAINT uq_payment_orders_provider_txnid UNIQUE (provider_transaction_id)
);

CREATE INDEX IF NOT EXISTS idx_payment_orders_business_status ON payment_orders(business_id, status);
CREATE INDEX IF NOT EXISTS idx_payment_orders_bid_intent ON payment_orders(bid_intent_id);
CREATE INDEX IF NOT EXISTS idx_payment_orders_status ON payment_orders(status);

CREATE TABLE IF NOT EXISTS payment_provider_events (
  id VARCHAR(64) PRIMARY KEY,
  provider VARCHAR(32) NOT NULL DEFAULT 'PAYU',
  provider_event_id VARCHAR(128),
  event_type VARCHAR(64) NOT NULL,
  payment_order_id VARCHAR(64) REFERENCES payment_orders(id) ON DELETE SET NULL,
  provider_transaction_id VARCHAR(128),
  payload_hash VARCHAR(128) NOT NULL,
  processing_status VARCHAR(32) NOT NULL DEFAULT 'RECEIVED',
  received_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  processed_at TIMESTAMPTZ,

  -- Deterministic event fingerprint duplicate protection
  CONSTRAINT uq_payment_provider_events_fingerprint UNIQUE (provider, payload_hash)
);

CREATE INDEX IF NOT EXISTS idx_payment_provider_events_order ON payment_provider_events(payment_order_id);
CREATE INDEX IF NOT EXISTS idx_payment_provider_events_txnid ON payment_provider_events(provider_transaction_id);
CREATE INDEX IF NOT EXISTS idx_payment_provider_events_status ON payment_provider_events(processing_status);
