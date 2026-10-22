/**
 * AageOnline API — Content CMS, Blog & Redirects Repository
 * Milestone 0.20.26: Authoritative Server-Side Persistence
 */

import { query } from '../client.ts';

export interface DbContentBlock {
  id: string;
  sectionKey: string;
  title: string;
  headline: string | null;
  lead: string | null;
  content: string | null;
  ctaText: string | null;
  metadata: any;
  publicationStatus: string;
  updatedBy: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface DbBlogPost {
  id: string;
  slug: string;
  title: string;
  category: string;
  excerpt: string | null;
  body: string;
  author: string;
  status: string;
  seoTitle: string | null;
  seoDescription: string | null;
  targetKeywords: string[];
  canonicalUrl: string | null;
  seoScore: number;
  geoScore: number;
  coverImage: string | null;
  scheduledAt: string | null;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface DbRedirect {
  id: string;
  sourcePath: string;
  destinationPath: string;
  statusCode: number;
  hitCount: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export const contentRepository = {
  // 1. Content Blocks
  async getContentBlocks(): Promise<DbContentBlock[]> {
    const sql = `
      SELECT 
        id, section_key AS "sectionKey", title, headline, lead, content, 
        cta_text AS "ctaText", metadata, publication_status AS "publicationStatus",
        updated_by AS "updatedBy", created_at AS "createdAt", updated_at AS "updatedAt"
      FROM content_blocks
      ORDER BY section_key ASC
    `;
    const res = await query<DbContentBlock>(sql);
    return res.rows;
  },

  async upsertContentBlock(data: {
    sectionKey: string;
    title: string;
    headline?: string;
    lead?: string;
    content?: string;
    ctaText?: string;
    metadata?: any;
    updatedBy?: string;
  }): Promise<DbContentBlock> {
    const id = `cb-${Date.now()}`;
    const sql = `
      INSERT INTO content_blocks (
        id, section_key, title, headline, lead, content, cta_text, metadata, updated_by, created_at, updated_at
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW(), NOW())
      ON CONFLICT (section_key) DO UPDATE SET
        title = EXCLUDED.title,
        headline = EXCLUDED.headline,
        lead = EXCLUDED.lead,
        content = EXCLUDED.content,
        cta_text = EXCLUDED.cta_text,
        metadata = EXCLUDED.metadata,
        updated_by = EXCLUDED.updated_by,
        updated_at = NOW()
      RETURNING 
        id, section_key AS "sectionKey", title, headline, lead, content, 
        cta_text AS "ctaText", metadata, publication_status AS "publicationStatus",
        updated_by AS "updatedBy", created_at AS "createdAt", updated_at AS "updatedAt"
    `;
    const res = await query<DbContentBlock>(sql, [
      id,
      data.sectionKey,
      data.title,
      data.headline || null,
      data.lead || null,
      data.content || null,
      data.ctaText || null,
      JSON.stringify(data.metadata || {}),
      data.updatedBy || null,
    ]);
    return res.rows[0];
  },

  // 2. Blog Posts
  async getBlogPosts(publishedOnly = false): Promise<DbBlogPost[]> {
    let sql = `
      SELECT 
        id, slug, title, category, excerpt, body, author, status,
        seo_title AS "seoTitle", seo_description AS "seoDescription",
        target_keywords AS "targetKeywords", canonical_url AS "canonicalUrl",
        seo_score AS "seoScore", geo_score AS "geoScore", cover_image AS "coverImage",
        scheduled_at AS "scheduledAt", published_at AS "publishedAt",
        created_at AS "createdAt", updated_at AS "updatedAt"
      FROM blog_posts
    `;
    const params: any[] = [];
    if (publishedOnly) {
      sql += ` WHERE status = 'PUBLISHED'`;
    }
    sql += ` ORDER BY COALESCE(published_at, created_at) DESC`;
    const res = await query<DbBlogPost>(sql, params);
    return res.rows;
  },

  async getBlogPostBySlug(slug: string): Promise<DbBlogPost | null> {
    const sql = `
      SELECT 
        id, slug, title, category, excerpt, body, author, status,
        seo_title AS "seoTitle", seo_description AS "seoDescription",
        target_keywords AS "targetKeywords", canonical_url AS "canonicalUrl",
        seo_score AS "seoScore", geo_score AS "geoScore", cover_image AS "coverImage",
        scheduled_at AS "scheduledAt", published_at AS "publishedAt",
        created_at AS "createdAt", updated_at AS "updatedAt"
      FROM blog_posts
      WHERE slug = $1 OR id = $1
    `;
    const res = await query<DbBlogPost>(sql, [slug]);
    return res.rows[0] || null;
  },

  async createBlogPost(data: Partial<DbBlogPost>): Promise<DbBlogPost> {
    const id = data.id || `blg-${Date.now()}`;
    const slug = data.slug || `post-${Date.now()}`;
    const status = data.status || 'DRAFT';
    const publishedAt = status === 'PUBLISHED' ? new Date().toISOString() : null;

    const sql = `
      INSERT INTO blog_posts (
        id, slug, title, category, excerpt, body, author, status,
        seo_title, seo_description, target_keywords, canonical_url,
        seo_score, geo_score, cover_image, scheduled_at, published_at, created_at, updated_at
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, NOW(), NOW())
      RETURNING id
    `;

    await query(sql, [
      id,
      slug,
      data.title || 'Untitled Article',
      data.category || 'Web Development',
      data.excerpt || null,
      data.body || '',
      data.author || 'Ajay',
      status,
      data.seoTitle || null,
      data.seoDescription || null,
      JSON.stringify(data.targetKeywords || []),
      data.canonicalUrl || null,
      data.seoScore || 80,
      data.geoScore || 80,
      data.coverImage || null,
      data.scheduledAt || null,
      publishedAt,
    ]);

    const created = await this.getBlogPostBySlug(id);
    if (!created) throw new Error('Failed to retrieve newly created blog post.');
    return created;
  },

  async updateBlogPost(id: string, data: Partial<DbBlogPost>): Promise<DbBlogPost | null> {
    const existing = await this.getBlogPostBySlug(id);
    if (!existing) return null;

    const status = data.status !== undefined ? data.status : existing.status;
    let publishedAt = existing.publishedAt;
    if (status === 'PUBLISHED' && !existing.publishedAt) {
      publishedAt = new Date().toISOString();
    }

    const sql = `
      UPDATE blog_posts SET
        title = COALESCE($2, title),
        slug = COALESCE($3, slug),
        category = COALESCE($4, category),
        excerpt = COALESCE($5, excerpt),
        body = COALESCE($6, body),
        author = COALESCE($7, author),
        status = COALESCE($8, status),
        seo_title = COALESCE($9, seo_title),
        seo_description = COALESCE($10, seo_description),
        target_keywords = COALESCE($11, target_keywords),
        canonical_url = COALESCE($12, canonical_url),
        seo_score = COALESCE($13, seo_score),
        geo_score = COALESCE($14, geo_score),
        cover_image = COALESCE($15, cover_image),
        scheduled_at = COALESCE($16, scheduled_at),
        published_at = $17,
        updated_at = NOW()
      WHERE id = $1 OR slug = $1
      RETURNING id
    `;

    await query(sql, [
      id,
      data.title || null,
      data.slug || null,
      data.category || null,
      data.excerpt || null,
      data.body || null,
      data.author || null,
      status,
      data.seoTitle || null,
      data.seoDescription || null,
      data.targetKeywords ? JSON.stringify(data.targetKeywords) : null,
      data.canonicalUrl || null,
      data.seoScore !== undefined ? data.seoScore : null,
      data.geoScore !== undefined ? data.geoScore : null,
      data.coverImage || null,
      data.scheduledAt || null,
      publishedAt,
    ]);

    return this.getBlogPostBySlug(id);
  },

  async deleteBlogPost(id: string): Promise<boolean> {
    const res = await query('DELETE FROM blog_posts WHERE id = $1 OR slug = $1 RETURNING id', [id]);
    return (res.rowCount || 0) > 0;
  },

  // 3. Redirects
  async getRedirects(): Promise<DbRedirect[]> {
    const sql = `
      SELECT 
        id, source_path AS "sourcePath", destination_path AS "destinationPath",
        status_code AS "statusCode", hit_count AS "hitCount", is_active AS "isActive",
        created_at AS "createdAt", updated_at AS "updatedAt"
      FROM url_redirects
      ORDER BY created_at DESC
    `;
    const res = await query<DbRedirect>(sql);
    return res.rows;
  },

  async createRedirect(data: { sourcePath: string; destinationPath: string; statusCode?: number }): Promise<DbRedirect> {
    const id = `red-${Date.now()}`;
    const statusCode = data.statusCode || 301;
    const sql = `
      INSERT INTO url_redirects (id, source_path, destination_path, status_code, hit_count, is_active, created_at, updated_at)
      VALUES ($1, $2, $3, $4, 0, true, NOW(), NOW())
      RETURNING id, source_path AS "sourcePath", destination_path AS "destinationPath", status_code AS "statusCode", hit_count AS "hitCount", is_active AS "isActive", created_at AS "createdAt", updated_at AS "updatedAt"
    `;
    const res = await query<DbRedirect>(sql, [id, data.sourcePath, data.destinationPath, statusCode]);
    return res.rows[0];
  },

  async deleteRedirect(id: string): Promise<boolean> {
    const res = await query('DELETE FROM url_redirects WHERE id = $1 RETURNING id', [id]);
    return (res.rowCount || 0) > 0;
  },

  async recordRedirectHit(sourcePath: string): Promise<void> {
    await query('UPDATE url_redirects SET hit_count = hit_count + 1 WHERE source_path = $1', [sourcePath]);
  },
};
