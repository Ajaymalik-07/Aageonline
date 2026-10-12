/**
 * AageOnline — Authoritative Server-Side Authorization Guard
 * Milestone 0.20.10: Persistent Authentication & Production Session Security
 *
 * Enforces strict authentication and multi-tenant isolation on the server:
 * 1. Validates authenticated session token per request.
 * 2. Verifies business membership and RBAC role against the authoritative store.
 * 3. Never trusts client-supplied roles, user IDs, or business credentials.
 * 4. Fails closed with appropriate HTTP 401 or 403 responses.
 */

import type { User } from '../../types/auth.ts';
import type { BusinessMembership, PermissionAction } from '../../types/membership.ts';
import { getServerSession } from './server-session.ts';
import { assertAuthorized, AuthorizationError } from './rbac.ts';
import { assertPlatformAdmin } from './admin-guard.ts';
import { getMembership } from '../memberships/store.ts';

export class AuthenticationRequiredError extends Error {
  statusCode = 401;
  code = 'UNAUTHENTICATED';

  constructor(message = 'Authentication required to perform this action.') {
    super(message);
    this.name = 'AuthenticationRequiredError';
  }
}

export class BusinessForbiddenError extends Error {
  statusCode = 403;
  code = 'FORBIDDEN_TENANT_ACCESS';

  constructor(message = 'You do not have active authorized access to this business.') {
    super(message);
    this.name = 'BusinessForbiddenError';
  }
}

/**
 * Asserts that the incoming request originates from a valid, authenticated user.
 * Throws AuthenticationRequiredError (HTTP 401) if unauthenticated.
 */
export async function requireAuthenticatedUser(
  req?: Request | { headers: Headers; cookies?: { get(name: string): { value: string } | undefined } }
): Promise<User> {
  const session = await getServerSession(req);
  if (!session || !session.user) {
    throw new AuthenticationRequiredError();
  }

  if (session.user.status !== 'ACTIVE') {
    throw new AuthorizationError(`Account is ${session.user.status}. Access denied.`, 403);
  }

  return session.user;
}

/**
 * Asserts that the incoming request is authenticated AND authorized to operate on the specified business.
 * Validates tenant membership and RBAC permissions server-side.
 */
export async function requireBusinessMembership(
  req: Request | { headers: Headers; cookies?: { get(name: string): { value: string } | undefined } },
  businessId: string,
  action: PermissionAction
): Promise<{ user: User; membership: BusinessMembership }> {
  const user = await requireAuthenticatedUser(req);

  if (!businessId || typeof businessId !== 'string') {
    throw new BusinessForbiddenError('Valid business ID required.');
  }

  const membership = getMembership(businessId, user.id);
  if (!membership || membership.status !== 'ACTIVE') {
    throw new BusinessForbiddenError(`User "${user.id}" is not an active member of business "${businessId}".`);
  }

  assertAuthorized(membership, action);

  return { user, membership };
}

/**
 * Asserts that the incoming request originates from an authenticated Platform Administrator.
 */
export async function requirePlatformAdminUser(
  req: Request | { headers: Headers; cookies?: { get(name: string): { value: string } | undefined } }
): Promise<User> {
  const user = await requireAuthenticatedUser(req);
  assertPlatformAdmin(user);
  return user;
}

/**
 * Asserts that the incoming request originates from either an authorized worker or platform admin.
 */
export async function requireAdminOrWorker(
  req: Request | { headers: Headers; cookies?: { get(name: string): { value: string } | undefined } }
): Promise<import('./admin-guard.ts').AdminOrWorkerContext> {
  const { assertAdminOrWorker } = await import('./admin-guard.ts');
  const user = await getServerSession(req).then((s) => s?.user || null).catch(() => null);
  return assertAdminOrWorker(req.headers, user);
}

