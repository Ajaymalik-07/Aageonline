-- Migration 008: SEO Audits, Sitemap Registry, and Search Console Integration Schema
-- Milestone 0.17.0: Search Engine Visibility & Market Discovery Automation

-- 1. Durable SEO Audit Run Records
CREATE TABLE IF NOT EXISTS seo_audit_runs (
  id VARCHAR(64) PRIMARY KEY,
  run_type VARCHAR(32) NOT NULL DEFAULT 'SCHEDULED' CHECK (run_type IN ('SCHEDULED', 'MANUAL')),
  total_candidates INT NOT NULL DEFAULT 0,
  eligible_urls INT NOT NULL DEFAULT 0,
  excluded_urls INT NOT NULL DEFAULT 0,
  findings_count INT NOT NULL DEFAULT 0,
  exclusions_by_reason JSONB NOT NULL DEFAULT '{}'::jsonb,
  findings JSONB NOT NULL DEFAULT '[]'::jsonb,
  sitemap_checksum VARCHAR(64),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_seo_audit_runs_created ON seo_audit_runs (created_at DESC);

-- 2. Registered Evaluated Routes Cache
CREATE TABLE IF NOT EXISTS seo_registered_routes (
  id VARCHAR(128) PRIMARY KEY, -- Normalized path, e.g. '/jaipur/interior-designers'
  route_type VARCHAR(32) NOT NULL,
  canonical_url VARCHAR(255) NOT NULL,
  is_eligible BOOLEAN NOT NULL DEFAULT FALSE,
  exclusion_reason VARCHAR(64),
  entity_id VARCHAR(64),
  sitemap_priority NUMERIC(3,2) NOT NULL DEFAULT 0.50,
  change_frequency VARCHAR(16) NOT NULL DEFAULT 'daily',
  last_audited_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_seo_registered_routes_eligible ON seo_registered_routes (is_eligible, route_type);
CREATE INDEX IF NOT EXISTS idx_seo_registered_routes_audited ON seo_registered_routes (last_audited_at DESC);
