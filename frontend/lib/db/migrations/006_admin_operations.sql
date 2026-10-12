-- Migration 006: Administrative Operations, Reconciliation Runs & Worker Heartbeat Schema

-- 1. Durable reconciliation run history
CREATE TABLE IF NOT EXISTS reconciliation_runs (
  id VARCHAR(64) PRIMARY KEY,
  run_type VARCHAR(64) NOT NULL, -- PAYMENT_RECONCILIATION, SETTLEMENT_RECOVERY, FULL_RECONCILIATION
  trigger_source VARCHAR(32) NOT NULL, -- SCHEDULED, MANUAL
  status VARCHAR(32) NOT NULL DEFAULT 'RUNNING', -- RUNNING, COMPLETED, FAILED
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  candidate_count INT NOT NULL DEFAULT 0,
  processed_count INT NOT NULL DEFAULT 0,
  successful_count INT NOT NULL DEFAULT 0,
  retryable_count INT NOT NULL DEFAULT 0,
  permanent_failed_count INT NOT NULL DEFAULT 0,
  summary JSONB NOT NULL DEFAULT '{}',
  error_message TEXT,
  actor_user_id VARCHAR(64),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_reconciliation_runs_started ON reconciliation_runs (started_at DESC);
CREATE INDEX IF NOT EXISTS idx_reconciliation_runs_type_status ON reconciliation_runs (run_type, status);

-- 2. Worker heartbeat & liveness tracking
CREATE TABLE IF NOT EXISTS worker_heartbeats (
  worker_id VARCHAR(64) PRIMARY KEY,
  worker_type VARCHAR(64) NOT NULL,
  last_heartbeat_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  status VARCHAR(32) NOT NULL DEFAULT 'ACTIVE',
  metadata JSONB NOT NULL DEFAULT '{}'
);

CREATE INDEX IF NOT EXISTS idx_worker_heartbeats_type ON worker_heartbeats (worker_type, last_heartbeat_at DESC);

-- 3. Additional operational ordering indexes for pagination
CREATE INDEX IF NOT EXISTS idx_payment_orders_created ON payment_orders (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ranking_settlements_created ON ranking_settlements (created_at DESC);
