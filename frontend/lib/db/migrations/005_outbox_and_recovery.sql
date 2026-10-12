-- Migration 005: Settlement Recovery & Transactional Outbox Schema

CREATE TABLE IF NOT EXISTS settlement_recovery_jobs (
  id VARCHAR(64) PRIMARY KEY,
  job_type VARCHAR(64) NOT NULL, -- SETTLE_CONFIRMED_PAYMENT, RECONCILE_PAYMENT, PROCESS_PAYMENT_WEBHOOK
  payment_order_id VARCHAR(64) REFERENCES payment_orders(id) ON DELETE CASCADE,
  market_id VARCHAR(64) REFERENCES markets(id) ON DELETE CASCADE,
  business_id VARCHAR(64) REFERENCES businesses(id) ON DELETE CASCADE,
  status VARCHAR(32) NOT NULL DEFAULT 'PENDING', -- PENDING, PROCESSING, COMPLETED, FAILED, RETRYABLE
  attempts INT NOT NULL DEFAULT 0,
  max_attempts INT NOT NULL DEFAULT 5,
  next_run_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  locked_until TIMESTAMPTZ,
  last_error TEXT,
  payload JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Fast polling index for recovery workers with skip-locked support
CREATE INDEX IF NOT EXISTS idx_recovery_jobs_poll 
ON settlement_recovery_jobs (status, next_run_at) 
WHERE status IN ('PENDING', 'RETRYABLE');

CREATE INDEX IF NOT EXISTS idx_recovery_jobs_order ON settlement_recovery_jobs (payment_order_id);
