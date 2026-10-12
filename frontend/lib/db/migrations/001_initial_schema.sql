-- Migration 001: Initial Core Schema (Taxonomy, Markets, Businesses, Participations, Audit)

CREATE TABLE IF NOT EXISTS users (
  id VARCHAR(64) PRIMARY KEY,
  email VARCHAR(255) NOT NULL UNIQUE,
  name VARCHAR(255) NOT NULL,
  password_hash VARCHAR(255),
  role VARCHAR(32) NOT NULL DEFAULT 'USER',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS categories (
  id VARCHAR(64) PRIMARY KEY,
  slug VARCHAR(128) NOT NULL UNIQUE,
  name VARCHAR(128) NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS locations (
  id VARCHAR(64) PRIMARY KEY,
  slug VARCHAR(128) NOT NULL UNIQUE,
  name VARCHAR(128) NOT NULL,
  type VARCHAR(32) NOT NULL DEFAULT 'CITY',
  state_id VARCHAR(64),
  country_id VARCHAR(64) NOT NULL DEFAULT 'country-in',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS markets (
  id VARCHAR(64) PRIMARY KEY,
  location_id VARCHAR(64) NOT NULL REFERENCES locations(id) ON DELETE RESTRICT,
  category_id VARCHAR(64) NOT NULL REFERENCES categories(id) ON DELETE RESTRICT,
  slug VARCHAR(128) NOT NULL UNIQUE,
  status VARCHAR(32) NOT NULL DEFAULT 'PUBLISHED',
  publication_status VARCHAR(32) NOT NULL DEFAULT 'PUBLISHED',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_markets_location_category UNIQUE (location_id, category_id)
);

CREATE TABLE IF NOT EXISTS businesses (
  id VARCHAR(64) PRIMARY KEY,
  slug VARCHAR(128) NOT NULL UNIQUE,
  name VARCHAR(255) NOT NULL,
  legal_name VARCHAR(255),
  tagline TEXT,
  description TEXT,
  website VARCHAR(255),
  phone VARCHAR(64),
  email VARCHAR(255),
  address TEXT,
  primary_city_id VARCHAR(64) REFERENCES locations(id) ON DELETE SET NULL,
  primary_state_id VARCHAR(64),
  primary_country_id VARCHAR(64) DEFAULT 'country-in',
  verification_status VARCHAR(32) NOT NULL DEFAULT 'UNVERIFIED',
  publication_status VARCHAR(32) NOT NULL DEFAULT 'PUBLISHED',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS business_categories (
  business_id VARCHAR(64) NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  category_id VARCHAR(64) NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
  is_primary BOOLEAN NOT NULL DEFAULT false,
  PRIMARY KEY (business_id, category_id)
);

CREATE TABLE IF NOT EXISTS business_locations (
  business_id VARCHAR(64) NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  city_id VARCHAR(64) NOT NULL REFERENCES locations(id) ON DELETE CASCADE,
  is_primary BOOLEAN NOT NULL DEFAULT false,
  PRIMARY KEY (business_id, city_id)
);

CREATE TABLE IF NOT EXISTS business_memberships (
  id VARCHAR(64) PRIMARY KEY,
  business_id VARCHAR(64) NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  user_id VARCHAR(64) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role VARCHAR(32) NOT NULL DEFAULT 'EDITOR',
  status VARCHAR(32) NOT NULL DEFAULT 'ACTIVE',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_memberships_business_user UNIQUE (business_id, user_id)
);

CREATE TABLE IF NOT EXISTS business_claims (
  id VARCHAR(64) PRIMARY KEY,
  business_id VARCHAR(64) NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  user_id VARCHAR(64) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  claimant_name VARCHAR(255) NOT NULL,
  claimant_email VARCHAR(255) NOT NULL,
  claimant_phone VARCHAR(64) NOT NULL,
  status VARCHAR(32) NOT NULL DEFAULT 'PENDING',
  reviewed_by_user_id VARCHAR(64) REFERENCES users(id) ON DELETE SET NULL,
  reviewed_at TIMESTAMPTZ,
  review_notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS market_participations (
  id VARCHAR(64) PRIMARY KEY,
  business_id VARCHAR(64) NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  market_id VARCHAR(64) NOT NULL REFERENCES markets(id) ON DELETE CASCADE,
  status VARCHAR(32) NOT NULL DEFAULT 'ACTIVE',
  eligibility_status VARCHAR(32) NOT NULL DEFAULT 'ELIGIBLE',
  current_position INT CHECK (current_position >= 1 AND current_position <= 100),
  qualifying_amount_rupees INT NOT NULL DEFAULT 1000,
  joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_market_participations_biz_mkt UNIQUE (business_id, market_id)
);

-- Active position uniqueness constraint: At most one business can occupy each position per market
CREATE UNIQUE INDEX IF NOT EXISTS uq_market_participations_active_position
ON market_participations(market_id, current_position)
WHERE status = 'ACTIVE' AND current_position IS NOT NULL;

CREATE TABLE IF NOT EXISTS audit_logs (
  id VARCHAR(64) PRIMARY KEY,
  event_type VARCHAR(64) NOT NULL,
  entity_type VARCHAR(64) NOT NULL,
  entity_id VARCHAR(64) NOT NULL,
  actor_user_id VARCHAR(64),
  metadata JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_entity ON audit_logs (entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_actor ON audit_logs (actor_user_id, created_at DESC);
