-- Migration 004: Ranking Settlements & Position History Schema

CREATE TABLE IF NOT EXISTS ranking_settlements (
  id VARCHAR(64) PRIMARY KEY,
  payment_order_id VARCHAR(64) NOT NULL REFERENCES payment_orders(id) ON DELETE RESTRICT,
  bid_intent_id VARCHAR(64) NOT NULL REFERENCES bid_intents(id) ON DELETE RESTRICT,
  business_id VARCHAR(64) NOT NULL REFERENCES businesses(id) ON DELETE RESTRICT,
  market_id VARCHAR(64) NOT NULL REFERENCES markets(id) ON DELETE RESTRICT,
  status VARCHAR(32) NOT NULL DEFAULT 'PENDING',
  failure_reason VARCHAR(128),
  target_position INT NOT NULL CHECK (target_position >= 1 AND target_position <= 100),
  paid_amount_minor BIGINT NOT NULL CHECK (paid_amount_minor > 0 AND paid_amount_minor % 100 = 0),
  paid_amount_rupees INT NOT NULL CHECK (paid_amount_rupees > 0),
  previous_position INT CHECK (previous_position >= 1),
  final_position INT CHECK (final_position >= 1 AND final_position <= 100),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  settled_at TIMESTAMPTZ,

  -- Invariant: Exactly one effective ranking settlement per payment order
  CONSTRAINT uq_ranking_settlements_payment_order UNIQUE (payment_order_id)
);

CREATE INDEX IF NOT EXISTS idx_ranking_settlements_business ON ranking_settlements(business_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ranking_settlements_market ON ranking_settlements(market_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ranking_settlements_status ON ranking_settlements(status);

CREATE TABLE IF NOT EXISTS position_history (
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

  -- PositionHistory records cannot overwrite no-ops
  CONSTRAINT chk_position_history_movement CHECK (
    previous_position IS NULL OR previous_position <> new_position
  )
);

CREATE INDEX IF NOT EXISTS idx_position_history_business ON position_history(business_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_position_history_market ON position_history(market_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_position_history_settlement ON position_history(ranking_settlement_id);
