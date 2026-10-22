/**
 * AageOnline — PostgreSQL User Repository
 * Milestone 0.20.30: Business Owner Identity & Registration Flow
 */

import type pg from 'pg';
import type { User, UserRole, UserStatus } from '../../../types/auth.ts';
import { getDbPool } from '../client.ts';
import { assertProductionPersistence } from '../guard.ts';

export class PostgresUserRepository {
  constructor() {
    assertProductionPersistence();
  }

  private getClient(client?: pg.PoolClient): pg.PoolClient | pg.Pool {
    return client || getDbPool();
  }

  async findByPhone(phone: string, client?: pg.PoolClient): Promise<User | null> {
    const db = this.getClient(client);
    const sql = `
      SELECT id, email, phone, name, role, status, created_at, updated_at
      FROM users
      WHERE phone = $1
      LIMIT 1
    `;
    const res = await db.query(sql, [phone]);
    if (res.rows.length === 0) return null;
    return this.mapRowToUser(res.rows[0]);
  }

  async findById(id: string, client?: pg.PoolClient): Promise<User | null> {
    const db = this.getClient(client);
    const sql = `
      SELECT id, email, phone, name, role, status, created_at, updated_at
      FROM users
      WHERE id = $1
      LIMIT 1
    `;
    const res = await db.query(sql, [id]);
    if (res.rows.length === 0) return null;
    return this.mapRowToUser(res.rows[0]);
  }

  async createOrGetUserByPhone(
    phone: string,
    data?: { email?: string; name?: string },
    client?: pg.PoolClient
  ): Promise<User> {
    const existing = await this.findByPhone(phone, client);
    if (existing) {
      if ((data?.email && !existing.email) || (data?.name && !existing.displayName)) {
        return this.updateContact(existing.id, data, client);
      }
      return existing;
    }

    const db = this.getClient(client);
    const id = `user-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
    const email = data?.email || `${phone}@owner.aageonline.in`;
    const name = data?.name || null;
    const now = new Date();

    const sql = `
      INSERT INTO users (id, email, phone, name, role, status, created_at, updated_at)
      VALUES ($1, $2, $3, $4, 'USER', 'ACTIVE', $5, $6)
      RETURNING id, email, phone, name, role, status, created_at, updated_at
    `;
    const res = await db.query(sql, [id, email, phone, name, now, now]);
    return this.mapRowToUser(res.rows[0]);
  }

  async updateContact(
    id: string,
    data: { email?: string; name?: string },
    client?: pg.PoolClient
  ): Promise<User> {
    const db = this.getClient(client);
    const sql = `
      UPDATE users
      SET 
        email = COALESCE($2, email),
        name = COALESCE($3, name),
        updated_at = NOW()
      WHERE id = $1
      RETURNING id, email, phone, name, role, status, created_at, updated_at
    `;
    const res = await db.query(sql, [id, data.email || null, data.name || null]);
    if (res.rows.length === 0) {
      throw new Error(`User ${id} not found for contact update.`);
    }
    return this.mapRowToUser(res.rows[0]);
  }

  private mapRowToUser(row: any): User {
    return {
      id: String(row.id),
      email: row.email ? String(row.email) : '',
      phone: row.phone ? String(row.phone) : undefined,
      displayName: row.name ? String(row.name) : undefined,
      role: (row.role || 'USER') as UserRole,
      status: (row.status || 'ACTIVE') as UserStatus,
      createdAt: new Date(row.created_at).toISOString(),
      updatedAt: new Date(row.updated_at).toISOString(),
    };
  }
}
