/**
 * AageOnline — PostgreSQL User Session Repository
 * Milestone 0.20.10: Persistent Authentication & Production Session Security
 *
 * Implements durable, cryptographically hashed session management in PostgreSQL:
 * 1. Never stores raw bearer tokens in database tables (only high-entropy SHA-256 hashes).
 * 2. Validates session expiration and revocation status on every lookup.
 * 3. Enforces user active status integrity (suspended/deleted users are rejected).
 * 4. Fails closed when database connection is unavailable.
 */

import type pg from 'pg';
import crypto from 'node:crypto';
import type { User, UserRole, UserStatus } from '../../../types/auth.ts';
import { getDbPool } from '../client.ts';
import { assertProductionPersistence } from '../guard.ts';

export interface UserSessionRecord {
  id: string;
  userId: string;
  tokenHash: string;
  ipAddressHash?: string;
  userAgent?: string;
  expiresAt: string;
  revokedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface SessionWithUser {
  session: UserSessionRecord;
  user: User;
}

export class PostgresSessionRepository {
  constructor() {
    assertProductionPersistence();
  }

  private getClient(client?: pg.PoolClient): pg.PoolClient | pg.Pool {
    return client || getDbPool();
  }

  /**
   * Computes cryptographically secure SHA-256 hash of a raw session token.
   * Prevents raw bearer tokens from being exposed in persistent storage dumps.
   */
  static hashToken(rawToken: string): string {
    return crypto.createHash('sha256').update(rawToken).digest('hex');
  }

  /**
   * Persists a newly generated session into PostgreSQL.
   */
  async createSession(
    params: {
      id?: string;
      userId: string;
      tokenHash: string;
      expiresAt: Date;
      ipAddressHash?: string;
      userAgent?: string;
    },
    client?: pg.PoolClient
  ): Promise<UserSessionRecord> {
    const db = this.getClient(client);
    const id = params.id || `sess_${crypto.randomUUID()}`;
    const now = new Date();

    await db.query(
      `INSERT INTO user_sessions (
        id, user_id, token_hash, ip_address_hash, user_agent, expires_at, created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [
        id,
        params.userId,
        params.tokenHash,
        params.ipAddressHash || null,
        params.userAgent || null,
        params.expiresAt,
        now,
        now,
      ]
    );

    return {
      id,
      userId: params.userId,
      tokenHash: params.tokenHash,
      ipAddressHash: params.ipAddressHash,
      userAgent: params.userAgent,
      expiresAt: params.expiresAt.toISOString(),
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
    };
  }

  /**
   * Looks up an active, unrevoked session by its SHA-256 token hash and joins the User record.
   * Fails closed if session is expired, revoked, or if the associated user is suspended/deleted.
   */
  async getSessionByTokenHash(
    tokenHash: string,
    client?: pg.PoolClient
  ): Promise<SessionWithUser | null> {
    const db = this.getClient(client);

    const query = `
      SELECT 
        s.id AS session_id,
        s.user_id,
        s.token_hash,
        s.ip_address_hash,
        s.user_agent,
        s.expires_at,
        s.revoked_at,
        s.created_at AS session_created_at,
        s.updated_at AS session_updated_at,
        u.id AS user_pk,
        u.email,
        u.phone,
        u.name,
        u.role,
        u.status,
        u.created_at AS user_created_at,
        u.updated_at AS user_updated_at
      FROM user_sessions s
      INNER JOIN users u ON u.id = s.user_id
      WHERE s.token_hash = $1
        AND s.revoked_at IS NULL
        AND s.expires_at > NOW()
      LIMIT 1
    `;

    const result = await db.query(query, [tokenHash]);
    if (result.rows.length === 0) {
      return null;
    }

    const row = result.rows[0];

    // Assert User status invariant
    if (row.status !== 'ACTIVE') {
      return null;
    }

    const session: UserSessionRecord = {
      id: String(row.session_id),
      userId: String(row.user_id),
      tokenHash: String(row.token_hash),
      ipAddressHash: row.ip_address_hash ? String(row.ip_address_hash) : undefined,
      userAgent: row.user_agent ? String(row.user_agent) : undefined,
      expiresAt: new Date(row.expires_at).toISOString(),
      revokedAt: row.revoked_at ? new Date(row.revoked_at).toISOString() : undefined,
      createdAt: new Date(row.session_created_at).toISOString(),
      updatedAt: new Date(row.session_updated_at).toISOString(),
    };

    const user: User = {
      id: String(row.user_pk),
      email: row.email ? String(row.email) : '',
      phone: row.phone ? String(row.phone) : undefined,
      displayName: row.name ? String(row.name) : undefined,
      role: (row.role || 'USER') as UserRole,
      status: (row.status || 'ACTIVE') as UserStatus,
      createdAt: new Date(row.user_created_at).toISOString(),
      updatedAt: new Date(row.user_updated_at).toISOString(),
    };

    return { session, user };
  }

  /**
   * Revokes a session immediately by its token hash (Explicit Logout).
   */
  async revokeSession(tokenHash: string, client?: pg.PoolClient): Promise<boolean> {
    const db = this.getClient(client);
    const result = await db.query(
      `UPDATE user_sessions
       SET revoked_at = NOW(), updated_at = NOW()
       WHERE token_hash = $1 AND revoked_at IS NULL`,
      [tokenHash]
    );

    return (result.rowCount ?? 0) > 0;
  }

  /**
   * Revokes all active sessions for a specific user (Security Invalidation / Password Reset).
   */
  async revokeAllUserSessions(userId: string, client?: pg.PoolClient): Promise<number> {
    const db = this.getClient(client);
    const result = await db.query(
      `UPDATE user_sessions
       SET revoked_at = NOW(), updated_at = NOW()
       WHERE user_id = $1 AND revoked_at IS NULL`,
      [userId]
    );

    return result.rowCount ?? 0;
  }

  /**
   * Garbage collects expired or revoked session records older than retention window.
   */
  async sweepExpiredSessions(retentionDays = 30, client?: pg.PoolClient): Promise<number> {
    const db = this.getClient(client);
    const result = await db.query(
      `DELETE FROM user_sessions
       WHERE expires_at < NOW() - ($1 || ' days')::INTERVAL
          OR (revoked_at IS NOT NULL AND revoked_at < NOW() - ($1 || ' days')::INTERVAL)`,
      [retentionDays]
    );

    return result.rowCount ?? 0;
  }
}
