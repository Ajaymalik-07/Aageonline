-- Migration 010: Durable Cache Invalidation Outbox & Distributed Rate Limiting Schema

-- 1. Durable Cache Invalidation Jobs Table
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

-- 2. Distributed Rate Limit Counters Table (Multi-Instance Atomic Sliding Window)
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
