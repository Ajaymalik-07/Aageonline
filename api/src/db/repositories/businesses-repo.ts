/**
 * AageOnline API — Businesses Repository
 * Milestone 0.20.26: Authoritative Server-Side Persistence
 */

import { query } from '../client.ts';

export interface DbBusiness {
  id: string;
  slug: string;
  name: string;
  legalName?: string;
  tagline?: string;
  description?: string;
  website?: string;
  phone?: string;
  email?: string;
  address?: string;
  primaryCityId?: string;
  primaryCityName?: string;
  primaryCategoryId?: string;
  primaryCategoryName?: string;
  verificationStatus: string;
  publicationStatus: string;
  createdAt: string;
  updatedAt: string;
}

export const businessesRepository = {
  async getAll(city?: string, category?: string): Promise<DbBusiness[]> {
    let sql = `
      SELECT 
        b.id,
        b.slug,
        b.name,
        b.legal_name AS "legalName",
        b.tagline,
        b.description,
        b.website,
        b.phone,
        b.email,
        b.address,
        b.primary_city_id AS "primaryCityId",
        l.name AS "primaryCityName",
        c.id AS "primaryCategoryId",
        c.name AS "primaryCategoryName",
        b.verification_status AS "verificationStatus",
        b.publication_status AS "publicationStatus",
        b.created_at AS "createdAt",
        b.updated_at AS "updatedAt"
      FROM businesses b
      LEFT JOIN locations l ON b.primary_city_id = l.id
      LEFT JOIN business_categories bc ON b.id = bc.business_id AND bc.is_primary = true
      LEFT JOIN categories c ON bc.category_id = c.id
    `;

    const where: string[] = [];
    const params: any[] = [];

    if (city) {
      params.push(city.toLowerCase());
      where.push(`(LOWER(l.slug) = $${params.length} OR LOWER(l.name) = $${params.length})`);
    }

    if (category) {
      params.push(category.toLowerCase());
      where.push(`(LOWER(c.slug) = $${params.length} OR LOWER(c.name) = $${params.length})`);
    }

    if (where.length > 0) {
      sql += ` WHERE ${where.join(' AND ')}`;
    }

    sql += ` ORDER BY b.created_at DESC`;

    const res = await query<DbBusiness>(sql, params);
    return res.rows;
  },

  async getByIdOrSlug(idOrSlug: string): Promise<DbBusiness | null> {
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
        b.email,
        b.address,
        b.primary_city_id AS "primaryCityId",
        l.name AS "primaryCityName",
        c.id AS "primaryCategoryId",
        c.name AS "primaryCategoryName",
        b.verification_status AS "verificationStatus",
        b.publication_status AS "publicationStatus",
        b.created_at AS "createdAt",
        b.updated_at AS "updatedAt"
      FROM businesses b
      LEFT JOIN locations l ON b.primary_city_id = l.id
      LEFT JOIN business_categories bc ON b.id = bc.business_id AND bc.is_primary = true
      LEFT JOIN categories c ON bc.category_id = c.id
      WHERE b.id = $1 OR b.slug = $1
    `;
    const res = await query<DbBusiness>(sql, [idOrSlug]);
    return res.rows[0] || null;
  },

  async create(data: {
    id?: string;
    slug: string;
    name: string;
    legalName?: string;
    tagline?: string;
    description?: string;
    website?: string;
    phone?: string;
    email?: string;
    address?: string;
    cityId?: string;
    categoryId?: string;
    verificationStatus?: string;
  }): Promise<DbBusiness> {
    const id = data.id || `biz-${Date.now()}`;
    const vStatus = data.verificationStatus || 'VERIFIED';

    const sql = `
      INSERT INTO businesses (
        id, slug, name, legal_name, tagline, description, website, phone, email, address,
        primary_city_id, verification_status, publication_status, created_at, updated_at
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, 'PUBLISHED', NOW(), NOW())
      RETURNING id
    `;

    await query(sql, [
      id,
      data.slug,
      data.name,
      data.legalName || data.name,
      data.tagline || null,
      data.description || null,
      data.website || null,
      data.phone || null,
      data.email || null,
      data.address || null,
      data.cityId || null,
      vStatus,
    ]);

    if (data.categoryId) {
      await query(
        `INSERT INTO business_categories (business_id, category_id, is_primary) VALUES ($1, $2, true) ON CONFLICT DO NOTHING`,
        [id, data.categoryId]
      );
    }

    if (data.cityId) {
      await query(
        `INSERT INTO business_locations (business_id, city_id, is_primary) VALUES ($1, $2, true) ON CONFLICT DO NOTHING`,
        [id, data.cityId]
      );
    }

    const created = await this.getByIdOrSlug(id);
    if (!created) throw new Error('Failed to retrieve newly created business record.');
    return created;
  },

  async updateVerification(id: string, verificationStatus: string): Promise<DbBusiness | null> {
    const sql = `
      UPDATE businesses 
      SET verification_status = $2, updated_at = NOW() 
      WHERE id = $1 
      RETURNING id
    `;
    const res = await query(sql, [id, verificationStatus]);
    if (res.rows.length === 0) return null;
    return this.getByIdOrSlug(id);
  },
};
