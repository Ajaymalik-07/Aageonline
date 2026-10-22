/**
 * AageOnline API — Markets, Categories & Locations Repository
 * Milestone 0.20.26: Authoritative Server-Side Persistence
 */

import { query } from '../client.ts';

export interface DbMarket {
  id: string;
  slug: string;
  locationId: string;
  categoryId: string;
  cityName: string;
  citySlug: string;
  categoryName: string;
  categorySlug: string;
  status: string;
  publicationStatus: string;
  currentFloorRupees: number;
  activeCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface DbCategory {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface DbLocation {
  id: string;
  slug: string;
  name: string;
  type: string;
  stateId: string | null;
  countryId: string;
  createdAt: string;
  updatedAt: string;
}

export const marketsRepository = {
  async getAll(location?: string, category?: string): Promise<DbMarket[]> {
    let sql = `
      SELECT 
        m.id,
        m.slug,
        m.location_id AS "locationId",
        m.category_id AS "categoryId",
        l.name AS "cityName",
        l.slug AS "citySlug",
        c.name AS "categoryName",
        c.slug AS "categorySlug",
        m.status,
        m.publication_status AS "publicationStatus",
        COALESCE(MIN(mp.qualifying_amount_rupees), 1000) AS "currentFloorRupees",
        COUNT(mp.id)::int AS "activeCount",
        m.created_at AS "createdAt",
        m.updated_at AS "updatedAt"
      FROM markets m
      JOIN locations l ON m.location_id = l.id
      JOIN categories c ON m.category_id = c.id
      LEFT JOIN market_participations mp ON m.id = mp.market_id AND mp.status = 'ACTIVE'
    `;

    const where: string[] = [];
    const params: any[] = [];

    if (location) {
      params.push(location.toLowerCase());
      where.push(`(LOWER(l.slug) = $${params.length} OR LOWER(l.name) = $${params.length})`);
    }

    if (category) {
      params.push(category.toLowerCase());
      where.push(`(LOWER(c.slug) = $${params.length} OR LOWER(c.name) = $${params.length})`);
    }

    if (where.length > 0) {
      sql += ` WHERE ${where.join(' AND ')}`;
    }

    sql += ` GROUP BY m.id, l.id, c.id ORDER BY m.created_at DESC`;

    const res = await query<DbMarket>(sql, params);
    return res.rows;
  },

  async getByIdOrSlug(idOrSlug: string): Promise<DbMarket | null> {
    const sql = `
      SELECT 
        m.id,
        m.slug,
        m.location_id AS "locationId",
        m.category_id AS "categoryId",
        l.name AS "cityName",
        l.slug AS "citySlug",
        c.name AS "categoryName",
        c.slug AS "categorySlug",
        m.status,
        m.publication_status AS "publicationStatus",
        COALESCE(MIN(mp.qualifying_amount_rupees), 1000) AS "currentFloorRupees",
        COUNT(mp.id)::int AS "activeCount",
        m.created_at AS "createdAt",
        m.updated_at AS "updatedAt"
      FROM markets m
      JOIN locations l ON m.location_id = l.id
      JOIN categories c ON m.category_id = c.id
      LEFT JOIN market_participations mp ON m.id = mp.market_id AND mp.status = 'ACTIVE'
      WHERE m.id = $1 OR m.slug = $1
      GROUP BY m.id, l.id, c.id
    `;
    const res = await query<DbMarket>(sql, [idOrSlug]);
    return res.rows[0] || null;
  },

  async create(data: { locationId: string; categoryId: string; slug: string; status?: string }): Promise<DbMarket> {
    const id = `mkt-${Date.now()}`;
    const status = data.status || 'PUBLISHED';
    const sql = `
      INSERT INTO markets (id, location_id, category_id, slug, status, publication_status, created_at, updated_at)
      VALUES ($1, $2, $3, $4, $5, $5, NOW(), NOW())
      RETURNING id, slug, location_id AS "locationId", category_id AS "categoryId", status, publication_status AS "publicationStatus", created_at AS "createdAt", updated_at AS "updatedAt"
    `;
    await query(sql, [id, data.locationId, data.categoryId, data.slug, status]);
    const created = await this.getByIdOrSlug(id);
    if (!created) throw new Error('Failed to retrieve newly created market.');
    return created;
  },

  async getCategories(): Promise<DbCategory[]> {
    const sql = `SELECT id, slug, name, description, created_at AS "createdAt", updated_at AS "updatedAt" FROM categories ORDER BY name ASC`;
    const res = await query<DbCategory>(sql);
    return res.rows;
  },

  async createCategory(data: { id?: string; slug: string; name: string; description?: string }): Promise<DbCategory> {
    const id = data.id || `cat-${Date.now()}`;
    const sql = `
      INSERT INTO categories (id, slug, name, description, created_at, updated_at)
      VALUES ($1, $2, $3, $4, NOW(), NOW())
      ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name, description = EXCLUDED.description, updated_at = NOW()
      RETURNING id, slug, name, description, created_at AS "createdAt", updated_at AS "updatedAt"
    `;
    const res = await query<DbCategory>(sql, [id, data.slug, data.name, data.description || null]);
    return res.rows[0];
  },

  async getLocations(): Promise<DbLocation[]> {
    const sql = `SELECT id, slug, name, type, state_id AS "stateId", country_id AS "countryId", created_at AS "createdAt", updated_at AS "updatedAt" FROM locations ORDER BY name ASC`;
    const res = await query<DbLocation>(sql);
    return res.rows;
  },

  async createLocation(data: { id?: string; slug: string; name: string; type?: string; stateId?: string }): Promise<DbLocation> {
    const id = data.id || `loc-${Date.now()}`;
    const type = data.type || 'CITY';
    const sql = `
      INSERT INTO locations (id, slug, name, type, state_id, country_id, created_at, updated_at)
      VALUES ($1, $2, $3, $4, $5, 'country-in', NOW(), NOW())
      ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name, type = EXCLUDED.type, updated_at = NOW()
      RETURNING id, slug, name, type, state_id AS "stateId", country_id AS "countryId", created_at AS "createdAt", updated_at AS "updatedAt"
    `;
    const res = await query<DbLocation>(sql, [id, data.slug, data.name, type, data.stateId || null]);
    return res.rows[0];
  },
};
