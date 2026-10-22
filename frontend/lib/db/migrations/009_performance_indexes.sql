-- Migration 009: Performance, Caching & Query Optimization Indexes
-- Milestone 0.18.0: Performance, Caching & Edge Optimization

-- 1. Business Directory & Sitemap Candidate Scanning
CREATE INDEX IF NOT EXISTS idx_businesses_pub_verif 
  ON businesses(publication_status, verification_status);

CREATE INDEX IF NOT EXISTS idx_businesses_slug 
  ON businesses(slug);

-- 2. Market Ranking Ladder & Settlement Displacement Scanning
CREATE INDEX IF NOT EXISTS idx_market_participations_ladder 
  ON market_participations(market_id, status, current_position ASC NULLS LAST);

CREATE INDEX IF NOT EXISTS idx_market_participations_biz_status 
  ON market_participations(business_id, status);

-- 3. Business Workspace Position History Filtering
CREATE INDEX IF NOT EXISTS idx_position_history_biz_market 
  ON position_history(business_id, market_id, created_at DESC);

-- 4. Fast Taxonomy & Route Resolution Lookups
CREATE INDEX IF NOT EXISTS idx_markets_lookup 
  ON markets(slug, status);

CREATE INDEX IF NOT EXISTS idx_locations_slug 
  ON locations(slug);

CREATE INDEX IF NOT EXISTS idx_categories_slug 
  ON categories(slug);
