/**
 * AageOnline — Authoritative Administrative Authorization Guard
 *
 * Enforces strict server-side authorization for platform administration,
 * financial reconciliation, settlement recovery, and worker invocation.
 *
 * Invariants:
 * 1. Never trust client-supplied role or admin flag.
 * 2. Authenticate session server-side; reject unauthenticated users (401).
 * 3. Reject authenticated non-admins (403). Deny by default.
 * 4. Verify worker HTTP invocations via constant-time secret comparison.
 * 5. Log all administrative authorization rejections to audit trail.
 */

import { timingSafeEqual } from 'node:crypto';
import type { User } from '../../types/auth.ts';
import { recordAuditEvent } from '../audit/store.ts';

export class AdminAuthenticationError extends Error {
  statusCode = 401;
  code = 'UNAUTHENTICATED';

  constructor(message = 'Authentication required for administrative operations.') {
    super(message);
    this.name = 'AdminAuthenticationError';
  }
}

export class AdminAuthorizationError extends Error {
  statusCode = 403;
  code = 'FORBIDDEN_NOT_ADMIN';

  constructor(message = 'Administrative privileges required. Access denied.') {
    super(message);
    this.name = 'AdminAuthorizationError';
  }
}

/**
 * Checks whether a user possesses platform administrator privileges.
 */
export function isPlatformAdmin(user: User | null | undefined): boolean {
  if (!user || user.status !== 'ACTIVE') {
    return false;
  }

  // 1. Direct role check on authoritative User record
  if (user.role === 'ADMIN' || user.role === 'SUPERADMIN') {
    return true;
  }

  // 2. Server-side configured admin emails whitelist (bootstrap / production fallback)
  const envAdminEmails = process.env.PLATFORM_ADMIN_EMAILS || process.env.INITIAL_ADMIN_EMAIL;
  if (envAdminEmails && user.email) {
    const list = envAdminEmails.split(',').map((e) => e.trim().toLowerCase());
    if (list.includes(user.email.toLowerCase())) {
      return true;
    }
  }

  return false;
}

/**
 * Strict server-side assertion for platform administration.
 * Throws 401 if unauthenticated, 403 if authenticated non-admin.
 */
export function assertPlatformAdmin(user: User | null | undefined): asserts user is User {
  if (!user) {
    throw new AdminAuthenticationError();
  }

  if (user.status !== 'ACTIVE') {
    recordAuditEvent('ADMIN_AUTH_REJECTED', 'User', user.id, user.id, {
      reason: `User account is ${user.status}`,
    });
    throw new AdminAuthorizationError(`User account is ${user.status}. Access denied.`);
  }

  if (!isPlatformAdmin(user)) {
    recordAuditEvent('ADMIN_AUTH_REJECTED', 'User', user.id, user.id, {
      reason: 'User does not have platform admin privileges',
      role: user.role || 'USER',
      email: user.email,
    });
    throw new AdminAuthorizationError(
      `Access denied: User "${user.email}" (${user.role || 'USER'}) does not possess administrative permissions.`
    );
  }
}

/**
 * Validates a worker secret header using constant-time comparison to prevent timing attacks.
 */
export function verifyWorkerSecret(headers: Headers): boolean {
  const configuredSecret = process.env.ADMIN_WORKER_SECRET || process.env.CRON_SECRET;
  if (!configuredSecret || configuredSecret.trim().length === 0) {
    return false;
  }

  // Check headers: x-admin-worker-secret or Authorization: Bearer <secret>
  const directSecret = headers.get('x-admin-worker-secret');
  let authBearer = headers.get('authorization');
  if (authBearer?.startsWith('Bearer ')) {
    authBearer = authBearer.substring(7).trim();
  }

  const providedSecret = directSecret || authBearer;
  if (!providedSecret) {
    return false;
  }

  const bufProvided = Buffer.from(providedSecret);
  const bufConfigured = Buffer.from(configuredSecret);

  if (bufProvided.length !== bufConfigured.length) {
    return false;
  }

  return timingSafeEqual(bufProvided, bufConfigured);
}

export interface AdminOrWorkerContext {
  isWorker: boolean;
  actorId: string;
}

/**
 * Authorizes a request from either a platform administrator session OR an authenticated worker.
 */
export function assertAdminOrWorker(
  headers: Headers,
  user: User | null | undefined
): AdminOrWorkerContext {
  // 1. Worker secret authentication
  if (verifyWorkerSecret(headers)) {
    return {
      isWorker: true,
      actorId: 'scheduler-worker',
    };
  }

  // 2. User admin session authentication
  assertPlatformAdmin(user);
  return {
    isWorker: false,
    actorId: user.id,
  };
}
