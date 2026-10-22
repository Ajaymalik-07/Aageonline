-- Migration 013: Lead Scraper Framework & Email Automation Engine
-- Milestone 0.20.27: Unified Lead Scraper + Zero-Inspired Email Automation

-- 1. Extend lead_prospects table with provenance, deduplication, and suppression fields
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'lead_prospects') THEN
    ALTER TABLE lead_prospects ADD COLUMN IF NOT EXISTS normalized_name VARCHAR(255);
    ALTER TABLE lead_prospects ADD COLUMN IF NOT EXISTS website VARCHAR(512);
    ALTER TABLE lead_prospects ADD COLUMN IF NOT EXISTS provenance JSONB DEFAULT '{}';
    ALTER TABLE lead_prospects ADD COLUMN IF NOT EXISTS verification_status VARCHAR(32) DEFAULT 'UNVERIFIED';
    ALTER TABLE lead_prospects ADD COLUMN IF NOT EXISTS outreach_eligible BOOLEAN DEFAULT TRUE;
    ALTER TABLE lead_prospects ADD COLUMN IF NOT EXISTS suppressed BOOLEAN DEFAULT FALSE;
    ALTER TABLE lead_prospects ADD COLUMN IF NOT EXISTS suppressed_at TIMESTAMPTZ;
    ALTER TABLE lead_prospects ADD COLUMN IF NOT EXISTS suppression_reason TEXT;
    ALTER TABLE lead_prospects ADD COLUMN IF NOT EXISTS invitation_count INT DEFAULT 0;
    ALTER TABLE lead_prospects ADD COLUMN IF NOT EXISTS last_contacted_at TIMESTAMPTZ;
    ALTER TABLE lead_prospects ADD COLUMN IF NOT EXISTS last_campaign_id VARCHAR(64);
    ALTER TABLE lead_prospects ADD COLUMN IF NOT EXISTS discovery_job_id VARCHAR(64);
  ELSE
    CREATE TABLE lead_prospects (
      id VARCHAR(64) PRIMARY KEY,
      business_name VARCHAR(255) NOT NULL,
      normalized_name VARCHAR(255),
      contact_name VARCHAR(128),
      contact_email VARCHAR(255),
      contact_phone VARCHAR(64),
      website VARCHAR(512),
      city VARCHAR(128) NOT NULL,
      category VARCHAR(128) NOT NULL,
      status VARCHAR(32) NOT NULL DEFAULT 'NEW',
      source VARCHAR(64) NOT NULL DEFAULT 'INBOUND',
      provenance JSONB DEFAULT '{}',
      verification_status VARCHAR(32) DEFAULT 'UNVERIFIED',
      outreach_eligible BOOLEAN DEFAULT TRUE,
      suppressed BOOLEAN DEFAULT FALSE,
      suppressed_at TIMESTAMPTZ,
      suppression_reason TEXT,
      invitation_count INT DEFAULT 0,
      last_contacted_at TIMESTAMPTZ,
      last_campaign_id VARCHAR(64),
      discovery_job_id VARCHAR(64),
      notes TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_lead_prospects_dedup 
ON lead_prospects (city, category, normalized_name);

CREATE INDEX IF NOT EXISTS idx_lead_prospects_email 
ON lead_prospects (contact_email);

CREATE INDEX IF NOT EXISTS idx_lead_prospects_eligibility 
ON lead_prospects (outreach_eligible, suppressed, status);

-- 2. Scraper Configuration
CREATE TABLE IF NOT EXISTS scraper_configs (
  id VARCHAR(64) PRIMARY KEY,
  enabled_connectors JSONB NOT NULL DEFAULT '["google_maps", "website_crawler", "csv_import"]',
  target_locations JSONB NOT NULL DEFAULT '["Hisar", "Noida", "Jaipur"]',
  target_categories JSONB NOT NULL DEFAULT '["Hospitals", "Diagnostic Centres", "Interior Designers"]',
  search_keywords JSONB NOT NULL DEFAULT '[]',
  crawl_depth INT NOT NULL DEFAULT 2,
  per_source_limit INT NOT NULL DEFAULT 50,
  frequency_hours INT NOT NULL DEFAULT 24,
  execution_timezone VARCHAR(64) NOT NULL DEFAULT 'Asia/Kolkata',
  max_concurrency INT NOT NULL DEFAULT 3,
  gemini_enabled BOOLEAN NOT NULL DEFAULT FALSE,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  last_run_at TIMESTAMPTZ,
  next_run_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Scraper Discovery Execution Jobs
CREATE TABLE IF NOT EXISTS scraper_jobs (
  id VARCHAR(64) PRIMARY KEY,
  source VARCHAR(64) NOT NULL,
  target_locations JSONB NOT NULL DEFAULT '[]',
  target_categories JSONB NOT NULL DEFAULT '[]',
  status VARCHAR(32) NOT NULL DEFAULT 'PENDING',
  total_discovered INT NOT NULL DEFAULT 0,
  new_leads_added INT NOT NULL DEFAULT 0,
  existing_updated INT NOT NULL DEFAULT 0,
  duplicates_skipped INT NOT NULL DEFAULT 0,
  invalid_records INT NOT NULL DEFAULT 0,
  connector_errors INT NOT NULL DEFAULT 0,
  error_log JSONB NOT NULL DEFAULT '[]',
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_scraper_jobs_status 
ON scraper_jobs (status, created_at DESC);

-- 4. Email Templates
CREATE TABLE IF NOT EXISTS email_templates (
  id VARCHAR(64) PRIMARY KEY,
  name VARCHAR(128) NOT NULL,
  subject VARCHAR(255) NOT NULL,
  body_html TEXT NOT NULL,
  body_text TEXT NOT NULL,
  variables JSONB NOT NULL DEFAULT '["businessName", "category", "city", "registrationUrl"]',
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. Email Campaigns
CREATE TABLE IF NOT EXISTS email_campaigns (
  id VARCHAR(64) PRIMARY KEY,
  name VARCHAR(128) NOT NULL,
  template_id VARCHAR(64) NOT NULL REFERENCES email_templates(id),
  status VARCHAR(32) NOT NULL DEFAULT 'DRAFT',
  target_locations JSONB NOT NULL DEFAULT '[]',
  target_categories JSONB NOT NULL DEFAULT '[]',
  target_sources JSONB NOT NULL DEFAULT '[]',
  sender_name VARCHAR(128) NOT NULL DEFAULT 'AageOnline Platform',
  sender_email VARCHAR(255) NOT NULL DEFAULT 'invitations@aageonline.com',
  daily_limit INT NOT NULL DEFAULT 100,
  cooldown_days INT NOT NULL DEFAULT 14,
  schedule_cron VARCHAR(64) NOT NULL DEFAULT '0 10 * * *',
  execution_timezone VARCHAR(64) NOT NULL DEFAULT 'Asia/Kolkata',
  total_recipients INT NOT NULL DEFAULT 0,
  sent_count INT NOT NULL DEFAULT 0,
  delivered_count INT NOT NULL DEFAULT 0,
  failed_count INT NOT NULL DEFAULT 0,
  bounced_count INT NOT NULL DEFAULT 0,
  opt_out_count INT NOT NULL DEFAULT 0,
  conversions_count INT NOT NULL DEFAULT 0,
  last_run_at TIMESTAMPTZ,
  next_run_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_email_campaigns_status 
ON email_campaigns (status, next_run_at);

-- 6. Email Outbox / Message History
CREATE TABLE IF NOT EXISTS email_outbox (
  id VARCHAR(64) PRIMARY KEY,
  campaign_id VARCHAR(64) REFERENCES email_campaigns(id) ON DELETE SET NULL,
  lead_id VARCHAR(64) NOT NULL REFERENCES lead_prospects(id) ON DELETE CASCADE,
  recipient_email VARCHAR(255) NOT NULL,
  recipient_name VARCHAR(128),
  business_name VARCHAR(255) NOT NULL,
  subject VARCHAR(255) NOT NULL,
  body_html TEXT NOT NULL,
  status VARCHAR(32) NOT NULL DEFAULT 'QUEUED',
  provider_message_id VARCHAR(128),
  error_message TEXT,
  attempt_count INT NOT NULL DEFAULT 0,
  queued_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  sent_at TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_email_outbox_poll 
ON email_outbox (status, queued_at) 
WHERE status = 'QUEUED';

CREATE INDEX IF NOT EXISTS idx_email_outbox_recipient 
ON email_outbox (recipient_email);

-- 7. Global Email Suppression List (Immediate Opt-Out Registry)
CREATE TABLE IF NOT EXISTS email_suppression_list (
  id VARCHAR(64) PRIMARY KEY,
  email VARCHAR(255) NOT NULL UNIQUE,
  reason VARCHAR(64) NOT NULL DEFAULT 'OPT_OUT',
  source VARCHAR(64) NOT NULL DEFAULT 'ONE_CLICK_UNSUBSCRIBE',
  suppressed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_email_suppression_lookup 
ON email_suppression_list (LOWER(email));
