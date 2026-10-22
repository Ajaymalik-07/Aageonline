-- Migration 014: WhatsApp Business Authentication & Business Evidence
-- Milestone 0.20.30: Business Owner Identity & Registration Flow

-- 1. Extend users table for WhatsApp Business phone authentication
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'users') THEN
    ALTER TABLE users ADD COLUMN IF NOT EXISTS phone VARCHAR(32);
    ALTER TABLE users ADD COLUMN IF NOT EXISTS status VARCHAR(32) NOT NULL DEFAULT 'ACTIVE';
    -- Allow email to be nullable for phone-only registered owners
    ALTER TABLE users ALTER COLUMN email DROP NOT NULL;
    ALTER TABLE users ALTER COLUMN name DROP NOT NULL;
    -- Unique constraint on phone if not null
    IF NOT EXISTS (
      SELECT 1 FROM pg_constraint WHERE conname = 'uq_users_phone'
    ) THEN
      ALTER TABLE users ADD CONSTRAINT uq_users_phone UNIQUE (phone);
    END IF;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_users_phone ON users (phone);

-- 2. Extend businesses table with WhatsApp contact and registration evidence fields
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'businesses') THEN
    ALTER TABLE businesses ADD COLUMN IF NOT EXISTS whatsapp_phone VARCHAR(64);
    ALTER TABLE businesses ADD COLUMN IF NOT EXISTS evidence_type VARCHAR(64);
    ALTER TABLE businesses ADD COLUMN IF NOT EXISTS evidence_reference VARCHAR(128);
    ALTER TABLE businesses ADD COLUMN IF NOT EXISTS evidence_status VARCHAR(32) DEFAULT 'PENDING';
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_businesses_whatsapp_phone ON businesses (whatsapp_phone);
CREATE INDEX IF NOT EXISTS idx_businesses_evidence ON businesses (evidence_type, evidence_reference);
