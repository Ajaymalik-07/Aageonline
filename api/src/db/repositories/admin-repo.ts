/**
 * AageOnline API — Admin Users, Leads, Newsletter, Discovery & Governance Repository
 * Milestone 0.20.26: Authoritative Server-Side Persistence
 */

import { query } from '../client.ts';

export interface DbAdminUser {
  id: string;
  email: string;
  name: string;
  role: string;
  passwordHash: string;
  status: string;
  lastLoginAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface DbNewsletterSubscriber {
  id: string;
  email: string;
  status: string;
  consentRecordedAt: string;
  source: string;
  createdAt: string;
}

export interface DbLeadProspect {
  id: string;
  businessName: string;
  contactName: string | null;
  contactEmail: string | null;
  contactPhone: string | null;
  city: string;
  category: string;
  status: string;
  source: string;
  website?: string | null;
  notes: string | null;
  createdAt: string;
}

export interface DbDiscoveryRequest {
  id: string;
  locationQuery: string;
  categoryQuery: string;
  requesterEmail: string | null;
  status: string;
  mappedMarketId: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface DbAuditLog {
  id: string;
  eventType: string;
  entityType: string;
  entityId: string;
  actorUserId: string | null;
  metadata: any;
  createdAt: string;
}

export const adminRepository = {
  // 1. Admin Users
  async getAdminUsers(): Promise<Omit<DbAdminUser, 'passwordHash'>[]> {
    const sql = `
      SELECT id, email, name, role, status, last_login_at AS "lastLoginAt", created_at AS "createdAt", updated_at AS "updatedAt"
      FROM admin_users
      ORDER BY created_at ASC
    `;
    const res = await query(sql);
    return res.rows;
  },

  async getAdminUserByEmail(email: string): Promise<DbAdminUser | null> {
    const sql = `
      SELECT id, email, name, role, password_hash AS "passwordHash", status, last_login_at AS "lastLoginAt", created_at AS "createdAt", updated_at AS "updatedAt"
      FROM admin_users
      WHERE LOWER(email) = LOWER($1)
    `;
    const res = await query<DbAdminUser>(sql, [email]);
    return res.rows[0] || null;
  },

  async createAdminUser(data: {
    id?: string;
    email: string;
    name: string;
    role: string;
    passwordHash: string;
  }): Promise<Omit<DbAdminUser, 'passwordHash'>> {
    const id = data.id || `usr-admin-${Date.now()}`;
    const sql = `
      INSERT INTO admin_users (id, email, name, role, password_hash, status, created_at, updated_at)
      VALUES ($1, LOWER($2), $3, $4, $5, 'ACTIVE', NOW(), NOW())
      RETURNING id, email, name, role, status, last_login_at AS "lastLoginAt", created_at AS "createdAt", updated_at AS "updatedAt"
    `;
    const res = await query(sql, [id, data.email, data.name, data.role, data.passwordHash]);
    return res.rows[0];
  },

  async updateLastLogin(id: string): Promise<void> {
    await query('UPDATE admin_users SET last_login_at = NOW(), updated_at = NOW() WHERE id = $1', [id]);
  },

  // 2. Newsletter Subscribers
  async getNewsletterSubscribers(): Promise<DbNewsletterSubscriber[]> {
    const sql = `
      SELECT id, email, status, consent_recorded_at AS "consentRecordedAt", source, created_at AS "createdAt"
      FROM newsletter_subscribers
      ORDER BY created_at DESC
    `;
    const res = await query<DbNewsletterSubscriber>(sql);
    return res.rows;
  },

  async addNewsletterSubscriber(email: string, source = 'FOOTER'): Promise<DbNewsletterSubscriber> {
    const id = `sub-${Date.now()}`;
    const sql = `
      INSERT INTO newsletter_subscribers (id, email, status, consent_recorded_at, source, created_at, updated_at)
      VALUES ($1, LOWER($2), 'ACTIVE', NOW(), $3, NOW(), NOW())
      ON CONFLICT (email) DO UPDATE SET status = 'ACTIVE', updated_at = NOW()
      RETURNING id, email, status, consent_recorded_at AS "consentRecordedAt", source, created_at AS "createdAt"
    `;
    const res = await query<DbNewsletterSubscriber>(sql, [id, email, source]);
    return res.rows[0];
  },

  // 3. Leads
  async getLeads(): Promise<DbLeadProspect[]> {
    const sql = `
      SELECT id, business_name AS "businessName", contact_name AS "contactName", contact_email AS "contactEmail",
             contact_phone AS "contactPhone", city, category, status, source, notes, created_at AS "createdAt"
      FROM lead_prospects
      ORDER BY created_at DESC
    `;
    const res = await query<DbLeadProspect>(sql);
    return res.rows;
  },

  async createLead(data: {
    businessName: string;
    contactName?: string;
    contactEmail?: string;
    contactPhone?: string;
    city: string;
    category: string;
    source?: string;
    notes?: string;
  }): Promise<DbLeadProspect> {
    const id = `lead-${Date.now()}`;
    const sql = `
      INSERT INTO lead_prospects (id, business_name, contact_name, contact_email, contact_phone, city, category, status, source, notes, created_at, updated_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, 'NEW', $8, $9, NOW(), NOW())
      RETURNING id, business_name AS "businessName", contact_name AS "contactName", contact_email AS "contactEmail",
                contact_phone AS "contactPhone", city, category, status, source, notes, created_at AS "createdAt"
    `;
    const res = await query<DbLeadProspect>(sql, [
      id,
      data.businessName,
      data.contactName || null,
      data.contactEmail || null,
      data.contactPhone || null,
      data.city,
      data.category,
      data.source || 'INBOUND',
      data.notes || null,
    ]);
    return res.rows[0];
  },

  // 4. Discovery Requests
  async getDiscoveryRequests(): Promise<DbDiscoveryRequest[]> {
    const sql = `
      SELECT id, location_query AS "locationQuery", category_query AS "categoryQuery", requester_email AS "requesterEmail",
             status, mapped_market_id AS "mappedMarketId", notes, created_at AS "createdAt", updated_at AS "updatedAt"
      FROM discovery_requests
      ORDER BY created_at DESC
    `;
    const res = await query<DbDiscoveryRequest>(sql);
    return res.rows;
  },

  async createDiscoveryRequest(data: {
    locationQuery: string;
    categoryQuery: string;
    requesterEmail?: string;
    notes?: string;
  }): Promise<DbDiscoveryRequest> {
    const id = `dsc-${Date.now()}`;
    const sql = `
      INSERT INTO discovery_requests (id, location_query, category_query, requester_email, status, notes, created_at, updated_at)
      VALUES ($1, $2, $3, $4, 'PENDING', $5, NOW(), NOW())
      RETURNING id, location_query AS "locationQuery", category_query AS "categoryQuery", requester_email AS "requesterEmail",
                status, mapped_market_id AS "mappedMarketId", notes, created_at AS "createdAt", updated_at AS "updatedAt"
    `;
    const res = await query<DbDiscoveryRequest>(sql, [
      id,
      data.locationQuery,
      data.categoryQuery,
      data.requesterEmail || null,
      data.notes || null,
    ]);
    return res.rows[0];
  },

  // 5. Audit Logs
  async recordAudit(data: {
    eventType: string;
    entityType: string;
    entityId: string;
    actorUserId?: string;
    metadata?: any;
  }): Promise<void> {
    const id = `aud-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const sql = `
      INSERT INTO audit_logs (id, event_type, entity_type, entity_id, actor_user_id, metadata, created_at)
      VALUES ($1, $2, $3, $4, $5, $6, NOW())
    `;
    await query(sql, [
      id,
      data.eventType,
      data.entityType,
      data.entityId,
      data.actorUserId || null,
      JSON.stringify(data.metadata || {}),
    ]);
  },

  async getAuditLogs(limit = 100): Promise<DbAuditLog[]> {
    const sql = `
      SELECT id, event_type AS "eventType", entity_type AS "entityType", entity_id AS "entityId",
             actor_user_id AS "actorUserId", metadata, created_at AS "createdAt"
      FROM audit_logs
      ORDER BY created_at DESC
      LIMIT $1
    `;
    const res = await query<DbAuditLog>(sql, [limit]);
    return res.rows;
  },

  // 6. System Settings
  async getSetting(key: string): Promise<any | null> {
    const sql = `SELECT value FROM system_settings WHERE key = $1`;
    const res = await query(sql, [key]);
    return res.rows[0] ? res.rows[0].value : null;
  },

  async setSetting(key: string, value: any, description?: string, updatedBy?: string): Promise<void> {
    const sql = `
      INSERT INTO system_settings (key, value, description, updated_by, updated_at)
      VALUES ($1, $2, $3, $4, NOW())
      ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, description = EXCLUDED.description, updated_by = EXCLUDED.updated_by, updated_at = NOW()
    `;
    await query(sql, [key, JSON.stringify(value), description || null, updatedBy || null]);
  },
};
