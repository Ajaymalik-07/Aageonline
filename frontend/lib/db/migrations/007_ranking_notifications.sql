-- Migration 007: Ranking Change Events, Notifications, and Preferences Schema
-- Milestone 0.16.0: Ranking Visibility, Position History & Notification Engine

-- 1. Transactionally committed ranking change events
CREATE TABLE IF NOT EXISTS ranking_change_events (
  id VARCHAR(64) PRIMARY KEY,
  ranking_settlement_id VARCHAR(64) NOT NULL REFERENCES ranking_settlements(id) ON DELETE RESTRICT,
  payment_order_id VARCHAR(64) REFERENCES payment_orders(id) ON DELETE SET NULL,
  business_id VARCHAR(64) NOT NULL REFERENCES businesses(id) ON DELETE RESTRICT,
  market_id VARCHAR(64) NOT NULL REFERENCES markets(id) ON DELETE RESTRICT,
  previous_position INT CHECK (previous_position >= 1),
  new_position INT NOT NULL CHECK (new_position >= 1 AND new_position <= 100),
  direction VARCHAR(16) NOT NULL CHECK (direction IN ('UP', 'DOWN', 'ENTRY', 'NO_CHANGE')),
  is_target_business BOOLEAN NOT NULL DEFAULT FALSE,
  status VARCHAR(32) NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'PROCESSED', 'SKIPPED')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  processed_at TIMESTAMPTZ,

  -- Invariant: Exactly one ranking change event per business per settlement
  CONSTRAINT uq_ranking_change_event UNIQUE (ranking_settlement_id, business_id)
);

CREATE INDEX IF NOT EXISTS idx_ranking_events_pending ON ranking_change_events (status, created_at) WHERE status = 'PENDING';
CREATE INDEX IF NOT EXISTS idx_ranking_events_settlement ON ranking_change_events (ranking_settlement_id);
CREATE INDEX IF NOT EXISTS idx_ranking_events_business ON ranking_change_events (business_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ranking_events_market ON ranking_change_events (market_id, created_at DESC);

-- 2. Durable business notifications
CREATE TABLE IF NOT EXISTS business_notifications (
  id VARCHAR(64) PRIMARY KEY,
  business_id VARCHAR(64) NOT NULL REFERENCES businesses(id) ON DELETE RESTRICT,
  recipient_user_id VARCHAR(64) REFERENCES users(id) ON DELETE SET NULL,
  market_id VARCHAR(64) NOT NULL REFERENCES markets(id) ON DELETE RESTRICT,
  ranking_change_event_id VARCHAR(64) REFERENCES ranking_change_events(id) ON DELETE SET NULL,
  event_type VARCHAR(64) NOT NULL,
  milestone VARCHAR(32),
  previous_position INT CHECK (previous_position >= 1),
  new_position INT NOT NULL CHECK (new_position >= 1 AND new_position <= 100),
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  channel VARCHAR(32) NOT NULL DEFAULT 'IN_APP' CHECK (channel IN ('IN_APP', 'EMAIL')),
  status VARCHAR(32) NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'PROCESSING', 'DELIVERED', 'FAILED', 'RETRYABLE')),
  is_read BOOLEAN NOT NULL DEFAULT FALSE,
  read_at TIMESTAMPTZ,
  attempts INT NOT NULL DEFAULT 0,
  max_attempts INT NOT NULL DEFAULT 5,
  next_run_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  locked_until TIMESTAMPTZ,
  last_error TEXT,
  delivery_metadata JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  delivered_at TIMESTAMPTZ,

  -- Idempotency: One logical notification per event, recipient, channel, and event type
  CONSTRAINT uq_notification_event_user_type UNIQUE (ranking_change_event_id, recipient_user_id, channel, event_type)
);

CREATE INDEX IF NOT EXISTS idx_notifications_user_biz ON business_notifications (business_id, recipient_user_id, is_read, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_poll ON business_notifications (status, next_run_at) WHERE status IN ('PENDING', 'RETRYABLE');
CREATE INDEX IF NOT EXISTS idx_notifications_biz_market ON business_notifications (business_id, market_id, created_at DESC);

-- 3. Notification preferences
CREATE TABLE IF NOT EXISTS notification_preferences (
  id VARCHAR(64) PRIMARY KEY,
  user_id VARCHAR(64) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  business_id VARCHAR(64) NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  email_ranking_drops BOOLEAN NOT NULL DEFAULT TRUE,
  in_app_ranking_drops BOOLEAN NOT NULL DEFAULT TRUE,
  digest_window_minutes INT NOT NULL DEFAULT 15 CHECK (digest_window_minutes >= 0 AND digest_window_minutes <= 1440),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT uq_notification_preference_user_biz UNIQUE (user_id, business_id)
);

CREATE INDEX IF NOT EXISTS idx_notification_preferences_user ON notification_preferences (user_id, business_id);
