-- Migration 011: Persistent Server-Side User Sessions Schema
-- Milestone 0.20.10: Persistent Authentication & Production Session Security

CREATE TABLE IF NOT EXISTS user_sessions (
  id VARCHAR(64) PRIMARY KEY,
  user_id VARCHAR(64) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash VARCHAR(64) NOT NULL UNIQUE,
  ip_address_hash VARCHAR(64),
  user_agent TEXT,
  expires_at TIMESTAMPTZ NOT NULL,
  revoked_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Fast lookup index for active unrevoked sessions
CREATE INDEX IF NOT EXISTS idx_user_sessions_lookup 
ON user_sessions (token_hash) 
WHERE revoked_at IS NULL;

-- Index for user session management and session revocation on user logout
CREATE INDEX IF NOT EXISTS idx_user_sessions_user_id 
ON user_sessions (user_id);

-- Index for session expiration sweeps
CREATE INDEX IF NOT EXISTS idx_user_sessions_expires_at 
ON user_sessions (expires_at);
