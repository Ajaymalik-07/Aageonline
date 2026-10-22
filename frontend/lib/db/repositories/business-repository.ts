/**
 * AageOnline — PostgreSQL Business Repository
 * Milestone 0.20.30: Business Owner Identity & Registration Flow
 */

import type pg from 'pg';
import type { BusinessEntity, BusinessPublicationStatus, BusinessVerificationStatus } from '../../../types/business.ts';
import { getDbPool } from '../client.ts';
import { assertProductionPersistence } from '../guard.ts';

export interface OwnedBusinessItem {
  business: BusinessEntity;
  membershipRole: string;
  cityName?: string;
  categoryName?: string;
}

export class PostgresBusinessRepository {
  constructor() {
    assertProductionPersistence();
  }

  private getClient(client?: pg.PoolClient): pg.PoolClient | pg.Pool {
    return client || getDbPool();
  }

  async getBusinessesByOwner(userId: string, client?: pg.PoolClient): Promise<OwnedBusinessItem[]> {
    const db = this.getClient(client);
    const sql = `
      SELECT 
        b.id,
        b.slug,
        b.name,
        b.legal_name AS "legalName",
        b.tagline,
        b.description,
        b.website,
        b.phone,
        b.whatsapp_phone AS "whatsappPhone",
        b.email,
        b.address,
        b.primary_city_id AS "primaryCityId",
        l.name AS "primaryCityName",
        l.slug AS "primaryCitySlug",
        c.id AS "primaryCategoryId",
        c.name AS "primaryCategoryName",
        c.slug AS "primaryCategorySlug",
        b.verification_status AS "verificationStatus",
        b.publication_status AS "publicationStatus",
        b.evidence_type AS "evidenceType",
        b.evidence_reference AS "evidenceReference",
        b.evidence_status AS "evidenceStatus",
        b.created_at AS "createdAt",
        b.updated_at AS "updatedAt",
        bm.role AS "membershipRole"
      FROM businesses b
      INNER JOIN business_memberships bm ON b.id = bm.business_id
      LEFT JOIN locations l ON b.primary_city_id = l.id
      LEFT JOIN business_categories bc ON b.id = bc.business_id AND bc.is_primary = true
      LEFT JOIN categories c ON bc.category_id = c.id
      WHERE bm.user_id = $1 AND bm.status = 'ACTIVE'
      ORDER BY b.created_at DESC
    `;
    const res = await db.query(sql, [userId]);
    return res.rows.map((row) => ({
      business: this.mapRowToBusiness(row),
      membershipRole: String(row.membershipRole || 'OWNER'),
      cityName: row.primaryCityName ? String(row.primaryCityName) : undefined,
      categoryName: row.primaryCategoryName ? String(row.primaryCategoryName) : undefined,
    }));
  }

  async getBusinessByIdForOwner(
    businessId: string,
    userId: string,
    client?: pg.PoolClient
  ): Promise<BusinessEntity | null> {
    const db = this.getClient(client);
    const sql = `
      SELECT 
        b.id,
        b.slug,
        b.name,
        b.legal_name AS "legalName",
        b.tagline,
        b.description,
        b.website,
        b.phone,
        b.whatsapp_phone AS "whatsappPhone",
        b.email,
        b.address,
        b.primary_city_id AS "primaryCityId",
        l.name AS "primaryCityName",
        c.id AS "primaryCategoryId",
        c.name AS "primaryCategoryName",
        b.verification_status AS "verificationStatus",
        b.publication_status AS "publicationStatus",
        b.evidence_type AS "evidenceType",
        b.evidence_reference AS "evidenceReference",
        b.evidence_status AS "evidenceStatus",
        b.created_at AS "createdAt",
        b.updated_at AS "updatedAt"
      FROM businesses b
      INNER JOIN business_memberships bm ON b.id = bm.business_id
      LEFT JOIN locations l ON b.primary_city_id = l.id
      LEFT JOIN business_categories bc ON b.id = bc.business_id AND bc.is_primary = true
      LEFT JOIN categories c ON bc.category_id = c.id
      WHERE (b.id = $1 OR b.slug = $1)
        AND bm.user_id = $2
        AND bm.status = 'ACTIVE'
      LIMIT 1
    `;
    const res = await db.query(sql, [businessId, userId]);
    if (res.rows.length === 0) return null;
    return this.mapRowToBusiness(res.rows[0]);
  }

  async findDuplicateBusiness(
    name: string,
    cityId?: string,
    ownerUserId?: string,
    client?: pg.PoolClient
  ): Promise<{
    ownedDuplicate: boolean;
    existingBusiness: BusinessEntity | null;
  }> {
    const db = this.getClient(client);
    const trimmedName = name.trim();

    // 1. Check if the authenticated owner already owns an active business with this exact name in this city (or overall)
    if (ownerUserId) {
      const ownedSql = `
        SELECT b.*, bm.role AS "membershipRole"
        FROM businesses b
        INNER JOIN business_memberships bm ON b.id = bm.business_id
        WHERE bm.user_id = $1
          AND bm.status = 'ACTIVE'
          AND LOWER(TRIM(b.name)) = LOWER($2)
          ${cityId ? 'AND (b.primary_city_id = $3 OR b.primary_city_id IS NULL)' : ''}
        LIMIT 1
      `;
      const ownedParams = cityId ? [ownerUserId, trimmedName, cityId] : [ownerUserId, trimmedName];
      const ownedRes = await db.query(ownedSql, ownedParams);
      if (ownedRes.rows.length > 0) {
        return {
          ownedDuplicate: true,
          existingBusiness: this.mapRowToBusiness(ownedRes.rows[0]),
        };
      }
    }

    // 2. Check if ANY business with this exact name already exists in this city
    if (cityId) {
      const citySql = `
        SELECT b.*
        FROM businesses b
        WHERE LOWER(TRIM(b.name)) = LOWER($1)
          AND b.primary_city_id = $2
        LIMIT 1
      `;
      const cityRes = await db.query(citySql, [trimmedName, cityId]);
      if (cityRes.rows.length > 0) {
        return {
          ownedDuplicate: false,
          existingBusiness: this.mapRowToBusiness(cityRes.rows[0]),
        };
      }
    }

    return { ownedDuplicate: false, existingBusiness: null };
  }

  async createBusinessWithOwner(
    data: {
      id?: string;
      slug: string;
      name: string;
      legalName?: string;
      tagline?: string;
      description?: string;
      website?: string;
      phone: string;
      whatsappPhone: string;
      email?: string;
      address?: string;
      cityId?: string;
      citySlug?: string;
      cityName?: string;
      categoryId?: string;
      categorySlug?: string;
      categoryName?: string;
      evidenceType?: string;
      evidenceReference?: string;
      evidenceStatus?: string;
    },
    ownerUserId: string
  ): Promise<BusinessEntity> {
    const pool = getDbPool();
    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      const id = data.id || `biz-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
      const now = new Date();

      // Ensure referenced location exists in PostgreSQL
      if (data.cityId) {
        const cSlug = data.citySlug || data.cityId.replace(/^city-/, '');
        const cName = data.cityName || cSlug.charAt(0).toUpperCase() + cSlug.slice(1);
        await client.query(
          `INSERT INTO locations (id, slug, name, type)
           VALUES ($1, $2, $3, 'CITY')
           ON CONFLICT (id) DO NOTHING`,
          [data.cityId, cSlug, cName]
        );
      }

      // Ensure referenced category exists in PostgreSQL
      if (data.categoryId) {
        const catSlug = data.categorySlug || data.categoryId.replace(/^cat-/, '');
        const catName = data.categoryName || catSlug.replace(/-/g, ' ');
        await client.query(
          `INSERT INTO categories (id, slug, name)
           VALUES ($1, $2, $3)
           ON CONFLICT (id) DO NOTHING`,
          [data.categoryId, catSlug, catName]
        );
      }

      const insertBizSql = `
        INSERT INTO businesses (
          id, slug, name, legal_name, tagline, description, website,
          phone, whatsapp_phone, email, address, primary_city_id,
          verification_status, publication_status,
          evidence_type, evidence_reference, evidence_status,
          created_at, updated_at
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, 'PUBLISHED', $14, $15, $16, $17, $18)
        RETURNING *
      `;

      const bizResult = await client.query(insertBizSql, [
        id,
        data.slug,
        data.name.trim(),
        (data.legalName || data.name).trim(),
        (data.tagline || '').trim() || null,
        (data.description || '').trim() || null,
        data.website?.trim() || null,
        data.phone.trim(),
        data.whatsappPhone.trim(),
        data.email?.trim() || null,
        data.address?.trim() || null,
        data.cityId || null,
        'PENDING', // Default to PENDING until formally verified
        data.evidenceType || null,
        data.evidenceReference || null,
        data.evidenceStatus || 'PENDING',
        now,
        now,
      ]);

      // Category relation
      if (data.categoryId) {
        await client.query(
          `INSERT INTO business_categories (business_id, category_id, is_primary) VALUES ($1, $2, true) ON CONFLICT DO NOTHING`,
          [id, data.categoryId]
        );
      }

      // Location relation
      if (data.cityId) {
        await client.query(
          `INSERT INTO business_locations (business_id, city_id, is_primary) VALUES ($1, $2, true) ON CONFLICT DO NOTHING`,
          [id, data.cityId]
        );
      }

      // Authoritative OWNER membership
      const membershipId = `mem-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 8)}`;
      await client.query(
        `INSERT INTO business_memberships (id, business_id, user_id, role, status, created_at, updated_at)
         VALUES ($1, $2, $3, 'OWNER', 'ACTIVE', $4, $5)
         ON CONFLICT (business_id, user_id) DO UPDATE SET role = 'OWNER', status = 'ACTIVE', updated_at = $5`,
        [membershipId, id, ownerUserId, now, now]
      );

      // Audit Log
      const auditId = `aud-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
      await client.query(
        `INSERT INTO audit_logs (id, event_type, entity_type, entity_id, actor_user_id, metadata, created_at)
         VALUES ($1, 'BUSINESS_REGISTERED', 'Business', $2, $3, $4, $5)`,
        [
          auditId,
          id,
          ownerUserId,
          JSON.stringify({
            name: data.name,
            phone: data.phone,
            whatsappPhone: data.whatsappPhone,
            evidenceType: data.evidenceType,
          }),
          now,
        ]
      );

      await client.query('COMMIT');
      return this.mapRowToBusiness(bizResult.rows[0]);
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }

  async updateBusinessProfile(
    businessId: string,
    ownerUserId: string,
    updates: {
      name?: string;
      legalName?: string;
      tagline?: string;
      description?: string;
      website?: string;
      phone?: string;
      email?: string;
      address?: string;
    }
  ): Promise<BusinessEntity> {
    const pool = getDbPool();
    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      // Verify owner authorization
      const checkSql = `
        SELECT bm.role 
        FROM business_memberships bm
        WHERE bm.business_id = $1 AND bm.user_id = $2 AND bm.status = 'ACTIVE'
        LIMIT 1
      `;
      const checkRes = await client.query(checkSql, [businessId, ownerUserId]);
      if (checkRes.rows.length === 0) {
        throw new Error('Unauthorized: You do not have ownership or management permissions for this business.');
      }

      // Safe update - whatsapp_phone is strictly not allowed to change here!
      const updateSql = `
        UPDATE businesses
        SET 
          name = COALESCE($2, name),
          legal_name = COALESCE($3, legal_name),
          tagline = COALESCE($4, tagline),
          description = COALESCE($5, description),
          website = COALESCE($6, website),
          phone = COALESCE($7, phone),
          email = COALESCE($8, email),
          address = COALESCE($9, address),
          updated_at = NOW()
        WHERE id = $1
        RETURNING *
      `;

      const res = await client.query(updateSql, [
        businessId,
        updates.name?.trim() || null,
        updates.legalName?.trim() || null,
        updates.tagline?.trim() || null,
        updates.description?.trim() || null,
        updates.website?.trim() || null,
        updates.phone?.trim() || null,
        updates.email?.trim() || null,
        updates.address?.trim() || null,
      ]);

      if (res.rows.length === 0) {
        throw new Error(`Business ${businessId} not found.`);
      }

      await client.query('COMMIT');
      return this.mapRowToBusiness(res.rows[0]);
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }

  private mapRowToBusiness(row: any): BusinessEntity {
    return {
      id: String(row.id),
      slug: String(row.slug),
      name: String(row.name),
      legalName: row.legalName || row.legal_name || undefined,
      tagline: row.tagline || undefined,
      description: row.description || '',
      website: row.website || undefined,
      phone: row.phone || undefined,
      email: row.email || undefined,
      address: row.address || undefined,
      socialLinks: {
        whatsapp: row.whatsappPhone || row.whatsapp_phone || undefined,
      },
      primaryCityId: row.primaryCityId || row.primary_city_id || undefined,
      primaryStateId: row.primaryStateId || row.primary_state_id || undefined,
      primaryCountryId: row.primaryCountryId || row.primary_country_id || 'country-in',
      verificationStatus: (row.verificationStatus || row.verification_status || 'PENDING') as BusinessVerificationStatus,
      publicationStatus: (row.publicationStatus || row.publication_status || 'PUBLISHED') as BusinessPublicationStatus,
      createdAt: new Date(row.createdAt || row.created_at).toISOString(),
      updatedAt: new Date(row.updatedAt || row.updated_at).toISOString(),
    };
  }
}
