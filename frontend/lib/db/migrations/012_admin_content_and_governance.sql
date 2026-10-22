-- Migration 012: Admin Content, Blog Articles, Redirects, Leads & Governance Schema
-- Milestone 0.20.26: Authoritative API PostgreSQL Persistence

-- 1. Discovery Requests (Market Inquiries)
CREATE TABLE IF NOT EXISTS discovery_requests (
  id VARCHAR(64) PRIMARY KEY,
  location_query VARCHAR(128) NOT NULL,
  category_query VARCHAR(128) NOT NULL,
  requester_email VARCHAR(255),
  status VARCHAR(32) NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'APPROVED', 'REJECTED', 'MAPPED')),
  mapped_market_id VARCHAR(64) REFERENCES markets(id) ON DELETE SET NULL,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_discovery_requests_status ON discovery_requests (status, created_at DESC);

-- 2. Content CMS Blocks
CREATE TABLE IF NOT EXISTS content_blocks (
  id VARCHAR(64) PRIMARY KEY,
  section_key VARCHAR(64) NOT NULL UNIQUE,
  title VARCHAR(255) NOT NULL,
  headline VARCHAR(255),
  lead TEXT,
  content TEXT,
  cta_text VARCHAR(128),
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  publication_status VARCHAR(32) NOT NULL DEFAULT 'PUBLISHED' CHECK (publication_status IN ('DRAFT', 'PUBLISHED', 'ARCHIVED')),
  updated_by VARCHAR(64),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_content_blocks_section ON content_blocks (section_key);

-- 3. Blog Articles & Technical Guides (Image 2 Parity)
CREATE TABLE IF NOT EXISTS blog_posts (
  id VARCHAR(64) PRIMARY KEY,
  slug VARCHAR(128) NOT NULL UNIQUE,
  title VARCHAR(255) NOT NULL,
  category VARCHAR(64) NOT NULL,
  excerpt TEXT,
  body TEXT NOT NULL,
  author VARCHAR(128) NOT NULL DEFAULT 'Ajay',
  status VARCHAR(32) NOT NULL DEFAULT 'DRAFT' CHECK (status IN ('DRAFT', 'PUBLISHED', 'SCHEDULED', 'ARCHIVED')),
  seo_title VARCHAR(255),
  seo_description TEXT,
  target_keywords JSONB NOT NULL DEFAULT '[]'::jsonb,
  canonical_url VARCHAR(255),
  seo_score INT NOT NULL DEFAULT 80 CHECK (seo_score >= 0 AND seo_score <= 100),
  geo_score INT NOT NULL DEFAULT 80 CHECK (geo_score >= 0 AND geo_score <= 100),
  cover_image VARCHAR(255),
  scheduled_at TIMESTAMPTZ,
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_blog_posts_slug ON blog_posts (slug);
CREATE INDEX IF NOT EXISTS idx_blog_posts_status ON blog_posts (status, published_at DESC);
CREATE INDEX IF NOT EXISTS idx_blog_posts_category ON blog_posts (category);

-- 4. High-Performance URL Redirects (301 & 302)
CREATE TABLE IF NOT EXISTS url_redirects (
  id VARCHAR(64) PRIMARY KEY,
  source_path VARCHAR(255) NOT NULL UNIQUE,
  destination_path VARCHAR(255) NOT NULL,
  status_code INT NOT NULL DEFAULT 301 CHECK (status_code IN (301, 302, 307, 308)),
  hit_count BIGINT NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_url_redirects_source ON url_redirects (source_path) WHERE is_active = TRUE;

-- 5. Newsletter Subscribers with Explicit Consent Timestamp
CREATE TABLE IF NOT EXISTS newsletter_subscribers (
  id VARCHAR(64) PRIMARY KEY,
  email VARCHAR(255) NOT NULL UNIQUE,
  status VARCHAR(32) NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'UNSUBSCRIBED')),
  consent_recorded_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  source VARCHAR(64) NOT NULL DEFAULT 'FOOTER',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_newsletter_subscribers_email ON newsletter_subscribers (email);

-- 6. Inbound Lead Prospects
CREATE TABLE IF NOT EXISTS lead_prospects (
  id VARCHAR(64) PRIMARY KEY,
  business_name VARCHAR(255) NOT NULL,
  contact_name VARCHAR(128),
  contact_email VARCHAR(255),
  contact_phone VARCHAR(64),
  city VARCHAR(64) NOT NULL,
  category VARCHAR(64) NOT NULL,
  status VARCHAR(32) NOT NULL DEFAULT 'NEW' CHECK (status IN ('NEW', 'CONTACTED', 'QUALIFIED', 'CONVERTED', 'CLOSED')),
  source VARCHAR(64) NOT NULL DEFAULT 'INBOUND',
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_lead_prospects_status ON lead_prospects (status, created_at DESC);

-- 7. Persistent Admin Users & RBAC
CREATE TABLE IF NOT EXISTS admin_users (
  id VARCHAR(64) PRIMARY KEY,
  email VARCHAR(255) NOT NULL UNIQUE,
  name VARCHAR(255) NOT NULL,
  role VARCHAR(32) NOT NULL CHECK (role IN ('SUPER_ADMIN', 'MARKETPLACE_MANAGER', 'FINANCE_RECONCILER', 'CONTENT_SEO_MANAGER', 'AUDITOR')),
  password_hash VARCHAR(255) NOT NULL,
  status VARCHAR(32) NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'DISABLED')),
  last_login_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_admin_users_email ON admin_users (email);

-- 8. Durable System Settings
CREATE TABLE IF NOT EXISTS system_settings (
  key VARCHAR(64) PRIMARY KEY,
  value JSONB NOT NULL,
  description TEXT,
  updated_by VARCHAR(64),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
