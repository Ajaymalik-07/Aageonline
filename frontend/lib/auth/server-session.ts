/**
 * AageOnline — Server-Side Session Resolver & Persistent Authenticator
 * Milestone 0.20.10: Persistent Authentication & Production Session Security
 *
 * Authoritative session resolver for Next.js Route Handlers and Server Actions:
 * 1. Reads session token strictly from request cookies or Authorization header.
 * 2. Uses PostgreSQL `user_sessions` with SHA-256 token hashing in production.
 * 3. Enforces session expiration and user ACTIVE status.
 * 4. Fails closed when session store is unavailable in production.
 * 5. Strict Zero-Fallback Invariant: Production requests without valid credentials NEVER
 *    receive development identities.
 */

import type { AuthSession, User } from '../../types/auth.ts';
import { isDatabaseConfigured } from '../db/client.ts';
import { PostgresSessionRepository } from '../db/repositories/session-repository.ts';
import {
  extractSessionTokenFromRequest,
  generateSessionToken,
  hashSessionToken,
} from './session-token.ts';
import {
  createSessionForUser,
  getSessionByToken,
  getUserById,
  invalidateSession,
} from './store.ts';

let cachedSessionRepo: PostgresSessionRepository | null = null;

function getSessionRepo(): PostgresSessionRepository {
  if (!cachedSessionRepo) {
    cachedSessionRepo = new PostgresSessionRepository();
  }
  return cachedSessionRepo;
}

/**
 * Resolves the authenticated session from an incoming HTTP request.
 * Returns null if no valid credentials are provided or if the session has expired/been revoked.
 */
export async function getServerSession(
  req?: Request | { headers: Headers; cookies?: { get(name: string): { value: string } | undefined } }
): Promise<AuthSession | null> {
  const rawToken = extractSessionTokenFromRequest(req);

  // 1. Production Invariant: Unauthenticated requests MUST NEVER receive a development identity
  if (!rawToken) {
    return null;
  }

  // 2. Persistent Database Session Resolution (Production & Database-Linked Environments)
  if (isDatabaseConfigured()) {
    try {
      const repo = getSessionRepo();
      const tokenHash = hashSessionToken(rawToken);
      const sessionWithUser = await repo.getSessionByTokenHash(tokenHash);

      if (!sessionWithUser) {
        return null;
      }

      const { session: record, user } = sessionWithUser;

      return {
        token: rawToken,
        userId: user.id,
        user,
        expiresAt: record.expiresAt,
        createdAt: record.createdAt,
      };
    } catch (err) {
      // Security Invariant: Fail closed if database session store fails in production
      console.error('Failed to resolve persistent session from PostgreSQL, failing closed:', err);
      return null;
    }
  }

  // 3. Local Development / Non-Database Testing Fallback
  // If in production mode, fail closed if database is unconfigured
  if (process.env.NODE_ENV === 'production') {
    return null;
  }

  // Validate the provided token against in-memory session store
  const memorySession = getSessionByToken(rawToken);
  return memorySession;
}

/**
 * Resolves the authenticated User from an incoming HTTP request.
 */
export async function getCurrentUser(
  req?: Request | { headers: Headers; cookies?: { get(name: string): { value: string } | undefined } }
): Promise<User | null> {
  const session = await getServerSession(req);
  return session ? session.user : null;
}

export interface CreatedSessionResult {
  session: AuthSession;
  rawToken: string;
}

/**
 * Creates a persistent server-side session for an authenticated user.
 * Generates a high-entropy 256-bit token and stores its SHA-256 hash in PostgreSQL.
 */
export async function createPersistentSession(
  userId: string,
  options?: { ipAddressHash?: string; userAgent?: string; durationDays?: number }
): Promise<CreatedSessionResult> {
  const rawToken = generateSessionToken();
  const tokenHash = hashSessionToken(rawToken);
  const durationDays = options?.durationDays || 7;
  const expiresAt = new Date(Date.now() + durationDays * 24 * 60 * 60 * 1000);

  // 1. Persistent Storage in PostgreSQL if configured
  if (isDatabaseConfigured()) {
    const repo = getSessionRepo();
    const sessionRecord = await repo.createSession({
      userId,
      tokenHash,
      expiresAt,
      ipAddressHash: options?.ipAddressHash,
      userAgent: options?.userAgent,
    });

    const user = getUserById(userId) || {
      id: userId,
      email: `${userId}@example.com`,
      displayName: userId,
      status: 'ACTIVE',
      role: 'USER',
      createdAt: sessionRecord.createdAt,
      updatedAt: sessionRecord.updatedAt,
    };

    const session: AuthSession = {
      token: rawToken,
      userId,
      user,
      expiresAt: sessionRecord.expiresAt,
      createdAt: sessionRecord.createdAt,
    };

    return { session, rawToken };
  }

  // 2. In-Memory Storage for non-database local development & testing
  const memorySession = createSessionForUser(userId);
  return {
    session: memorySession,
    rawToken: memorySession.token,
  };
}

/**
 * Revokes a session explicitly upon user logout.
 */
export async function revokePersistentSession(rawToken: string): Promise<void> {
  if (isDatabaseConfigured()) {
    try {
      const repo = getSessionRepo();
      const tokenHash = hashSessionToken(rawToken);
      await repo.revokeSession(tokenHash);
    } catch (err) {
      console.error('Failed to revoke session in PostgreSQL:', err);
    }
  }

  // Also invalidate from in-memory cache if present
  invalidateSession(rawToken);
}
