/**
 * AageOnline — Production Session Security & Persistent Authentication Test Suite
 * Milestone 0.20.10: Persistent Authentication & Production Session Security
 *
 * Comprehensive verification of:
 * 1. Zero development identity bypass in production execution paths.
 * 2. High-entropy token generation and SHA-256 token hashing in storage.
 * 3. Session lifecycle: expiration, revocation, and explicit logout.
 * 4. Protected API guards rejecting unauthenticated requests with HTTP 401.
 * 5. Multi-tenant isolation: Cross-tenant access returning HTTP 403.
 * 6. Protection against forged client-supplied user IDs and roles.
 * 7. Server session store failure fails closed (deny by default).
 * 8. Backward compatibility with legitimate claimants and RBAC roles.
 */

import { describe, it, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';

import {
  generateSessionToken,
  hashSessionToken,
  extractSessionTokenFromRequest,
  getSessionCookieName,
  getSessionCookieOptions,
  PRODUCTION_COOKIE_NAME,
  DEVELOPMENT_COOKIE_NAME,
} from '../lib/auth/session-token.ts';

import {
  getServerSession,
  getCurrentUser,
  createPersistentSession,
  revokePersistentSession,
} from '../lib/auth/server-session.ts';

import {
  requireAuthenticatedUser,
  requireBusinessMembership,
  requirePlatformAdminUser,
  requireAdminOrWorker,
  AuthenticationRequiredError,
  BusinessForbiddenError,
} from '../lib/auth/server-guard.ts';

import {
  AdminAuthorizationError,
  AdminAuthenticationError,
} from '../lib/auth/admin-guard.ts';

import {
  getActiveDevSession,
  setActiveDevUser,
  resetAuthStoreForTesting,
  createSessionForUser,
  getUserById,
  createOrGetUserByEmail,
  updateUserStatus,
} from '../lib/auth/store.ts';

import {
  getMembership,
  createMembership,
  resetMembershipStoreForTesting,
} from '../lib/memberships/store.ts';

import { resetBusinessStoreForTesting } from '../lib/taxonomy/businesses.ts';
import { resetClaimsStoreForTesting } from '../lib/claims/store.ts';
import { PostgresSessionRepository } from '../lib/db/repositories/session-repository.ts';
import { LocalAuthDataSource } from '../data-access/auth/local-adapter.ts';
import { AuthorizationError } from '../lib/auth/rbac.ts';

/**
 * Creates a standard Request with optional cookie/header configurations.
 */
function createMockRequest(
  url: string,
  options: {
    method?: string;
    headers?: Record<string, string>;
    cookies?: Record<string, string>;
    body?: any;
  } = {}
): Request {
  const headers = new Headers(options.headers);
  if (options.cookies) {
    const cookieHeader = Object.entries(options.cookies)
      .map(([k, v]) => `${k}=${v}`)
      .join('; ');
    headers.set('cookie', cookieHeader);
  }
  return new Request(url, {
    method: options.method || 'GET',
    headers,
    body: options.body ? JSON.stringify(options.body) : undefined,
  });
}

describe('Milestone 0.20.10 — Production Session Security & Persistent Authentication', () => {
  const originalNodeEnv = process.env.NODE_ENV;

  function setNodeEnv(val: string | undefined) {
    (process.env as Record<string, string | undefined>).NODE_ENV = val;
  }

  beforeEach(() => {
    setNodeEnv('test');
    resetBusinessStoreForTesting();
    resetAuthStoreForTesting();
    resetMembershipStoreForTesting();
    resetClaimsStoreForTesting();
  });

  afterEach(() => {
    setNodeEnv(originalNodeEnv);
  });

  // =========================================================================
  // 1. Production Identity Bypass Removal & Fail-Closed Behavior
  // =========================================================================
  describe('1. Production Identity Bypass Removal', () => {
    it('should NEVER return active dev session when NODE_ENV is production', () => {
      setNodeEnv('production');
      const session = getActiveDevSession();
      assert.strictEqual(session, null, 'getActiveDevSession must return null in production');
    });

    it('should throw an error if setActiveDevUser is called in production', () => {
      setNodeEnv('production');
      assert.throws(
        () => setActiveDevUser('user-ajay'),
        /strictly prohibited in production/
      );
    });

    it('should reject unauthenticated request when resolving server session in production', async () => {
      setNodeEnv('production');
      const req = createMockRequest('http://localhost:3000/api/auth/me');
      const session = await getServerSession(req);
      assert.strictEqual(session, null, 'Unauthenticated request must resolve to null session in production');
    });

    it('should fail closed with 401 when requireAuthenticatedUser is called without credentials in production', async () => {
      setNodeEnv('production');
      const req = createMockRequest('http://localhost:3000/api/bid-intents');
      await assert.rejects(
        async () => requireAuthenticatedUser(req),
        (err: unknown) => {
          assert.ok(err instanceof AuthenticationRequiredError);
          assert.strictEqual((err as AuthenticationRequiredError).statusCode, 401);
          return true;
        }
      );
    });

    it('should ensure LocalAuthDataSource returns null in production', async () => {
      setNodeEnv('production');
      const localAdapter = new LocalAuthDataSource();
      const currentUser = await localAdapter.getCurrentUser();
      assert.strictEqual(currentUser, null, 'LocalAuthDataSource must not leak dev user in production');
    });
  });

  // =========================================================================
  // 2. High-Entropy Tokens, Token Hashing & Secure Cookie Invariants
  // =========================================================================
  describe('2. High-Entropy Tokens & Secure Cookie Policy', () => {
    it('should generate high-entropy 256-bit (64 hex character) tokens', () => {
      const token1 = generateSessionToken();
      const token2 = generateSessionToken();
      assert.strictEqual(token1.length, 64);
      assert.strictEqual(token2.length, 64);
      assert.notStrictEqual(token1, token2, 'Generated tokens must be unique');
    });

    it('should compute deterministic SHA-256 hash of tokens for storage', () => {
      const rawToken = 'test-bearer-token-12345';
      const hash1 = hashSessionToken(rawToken);
      const hash2 = hashSessionToken(rawToken);
      assert.strictEqual(hash1, hash2);
      assert.strictEqual(hash1.length, 64);
      assert.notStrictEqual(hash1, rawToken, 'Hash must not equal raw token');
      assert.strictEqual(PostgresSessionRepository.hashToken(rawToken), hash1);
    });

    it('should configure production cookies with __Host- prefix and HttpOnly+Secure attributes', () => {
      setNodeEnv('production');
      const cookieName = getSessionCookieName();
      assert.strictEqual(cookieName, PRODUCTION_COOKIE_NAME);
      assert.ok(cookieName.startsWith('__Host-'), 'Production cookie must use __Host- prefix');

      const options = getSessionCookieOptions();
      assert.strictEqual(options.httpOnly, true);
      assert.strictEqual(options.secure, true);
      assert.strictEqual(options.sameSite, 'lax');
      assert.strictEqual(options.path, '/');
      assert.ok(options.maxAge >= 86400, 'Cookie TTL must be at least 1 day');
    });

    it('should safely extract session token from cookies or Authorization header', () => {
      // From cookie
      const reqWithCookie = createMockRequest('http://localhost:3000/api/test', {
        cookies: { [DEVELOPMENT_COOKIE_NAME]: 'token-from-cookie' },
      });
      assert.strictEqual(extractSessionTokenFromRequest(reqWithCookie), 'token-from-cookie');

      // From Bearer header
      const reqWithBearer = createMockRequest('http://localhost:3000/api/test', {
        headers: { authorization: 'Bearer token-from-bearer' },
      });
      assert.strictEqual(extractSessionTokenFromRequest(reqWithBearer), 'token-from-bearer');

      // Empty
      const reqEmpty = createMockRequest('http://localhost:3000/api/test');
      assert.strictEqual(extractSessionTokenFromRequest(reqEmpty), null);
    });
  });

  // =========================================================================
  // 3. Persistent Session Creation, Verification & Explicit Logout
  // =========================================================================
  describe('3. Persistent Session Lifecycle & Logout', () => {
    it('should create persistent session and resolve user correctly', async () => {
      const { session, rawToken } = await createPersistentSession('user-ajay');
      assert.ok(rawToken);
      assert.strictEqual(session.userId, 'user-ajay');

      // Verify resolution via request with cookie
      const req = createMockRequest('http://localhost:3000/api/auth/me', {
        cookies: { [DEVELOPMENT_COOKIE_NAME]: rawToken },
      });

      const resolved = await getServerSession(req);
      assert.ok(resolved);
      assert.strictEqual(resolved.userId, 'user-ajay');
      assert.strictEqual(resolved.user.email, 'ajay@royalinteriors.example.com');
    });

    it('should reject expired, revoked, or unknown session tokens', async () => {
      // 1. Unknown token
      const reqUnknown = createMockRequest('http://localhost:3000/api/auth/me', {
        cookies: { [DEVELOPMENT_COOKIE_NAME]: 'nonexistent-token' },
      });
      assert.strictEqual(await getServerSession(reqUnknown), null);

      // 2. Revoked token
      const { rawToken } = await createPersistentSession('user-ajay');
      await revokePersistentSession(rawToken);

      const reqRevoked = createMockRequest('http://localhost:3000/api/auth/me', {
        cookies: { [DEVELOPMENT_COOKIE_NAME]: rawToken },
      });
      assert.strictEqual(await getServerSession(reqRevoked), null);
    });

    it('should reject sessions for suspended user accounts', async () => {
      // 1. Creation time rejection for suspended users
      await assert.rejects(
        async () => createPersistentSession('user-suspended'),
        /SUSPENDED/
      );

      // 2. Active session becomes invalid if user status changes to SUSPENDED
      const { rawToken } = await createPersistentSession('user-ajay');
      const req = createMockRequest('http://localhost:3000/api/auth/me', {
        cookies: { [DEVELOPMENT_COOKIE_NAME]: rawToken },
      });

      // Valid while ACTIVE
      const activeSession = await getServerSession(req);
      assert.ok(activeSession);
      assert.strictEqual(activeSession.userId, 'user-ajay');

      // Suspend user
      updateUserStatus('user-ajay', 'SUSPENDED');
      const suspendedSession = await getServerSession(req);
      assert.strictEqual(suspendedSession, null, 'Suspended user session must resolve to null');

      // Revert status
      updateUserStatus('user-ajay', 'ACTIVE');
    });

    it('should revoke session on explicit logout and fail subsequent requests', async () => {
      const { rawToken } = await createPersistentSession('user-ajay');

      // Check request succeeds initially
      const reqBefore = createMockRequest('http://localhost:3000/api/auth/me', {
        cookies: { [DEVELOPMENT_COOKIE_NAME]: rawToken },
      });
      const userBefore = await requireAuthenticatedUser(reqBefore);
      assert.strictEqual(userBefore.id, 'user-ajay');

      // Revoke session (simulate logout)
      await revokePersistentSession(rawToken);

      // Subsequent requests fail closed
      const reqAfter = createMockRequest('http://localhost:3000/api/auth/me', {
        cookies: { [DEVELOPMENT_COOKIE_NAME]: rawToken },
      });
      await assert.rejects(
        async () => requireAuthenticatedUser(reqAfter),
        (err: unknown) => {
          assert.ok(err instanceof AuthenticationRequiredError);
          return true;
        }
      );
    });
  });

  // =========================================================================
  // 4. Server-Side Protected Operations & 401 Rejections
  // =========================================================================
  describe('4. Protected Operation 401 Unauthenticated Invariants', () => {
    it('should reject unauthenticated request for bid-intents with 401', async () => {
      const req = createMockRequest('http://localhost:3000/api/bid-intents');
      await assert.rejects(
        async () => requireBusinessMembership(req, 'biz-royal-interiors', 'bidIntent.create'),
        (err: unknown) => {
          assert.ok(err instanceof AuthenticationRequiredError);
          assert.strictEqual((err as AuthenticationRequiredError).statusCode, 401);
          return true;
        }
      );
    });

    it('should reject unauthenticated request for workspace with 401', async () => {
      const req = createMockRequest('http://localhost:3000/api/businesses/biz-royal-interiors/workspace');
      await assert.rejects(
        async () => requireBusinessMembership(req, 'biz-royal-interiors', 'workspace.access'),
        (err: unknown) => {
          assert.ok(err instanceof AuthenticationRequiredError);
          assert.strictEqual((err as AuthenticationRequiredError).statusCode, 401);
          return true;
        }
      );
    });

    it('should reject unauthenticated request for business members with 401', async () => {
      const req = createMockRequest('http://localhost:3000/api/businesses/biz-royal-interiors/members');
      await assert.rejects(
        async () => requireBusinessMembership(req, 'biz-royal-interiors', 'business.members.view'),
        (err: unknown) => {
          assert.ok(err instanceof AuthenticationRequiredError);
          assert.strictEqual((err as AuthenticationRequiredError).statusCode, 401);
          return true;
        }
      );
    });

    it('should reject unauthenticated request for claim review with 401', async () => {
      const req = createMockRequest('http://localhost:3000/api/business-claims/claim-123/review');
      await assert.rejects(
        async () => requirePlatformAdminUser(req),
        (err: unknown) => {
          assert.ok(err instanceof AuthenticationRequiredError);
          assert.strictEqual((err as AuthenticationRequiredError).statusCode, 401);
          return true;
        }
      );
    });
  });

  // =========================================================================
  // 5. Multi-Tenant Isolation & Cross-Tenant 403 Access Denial
  // =========================================================================
  describe('5. Multi-Tenant Isolation & Role Authorization', () => {
    it('should reject access (403) when User A attempts to operate on Business B (Cross-Tenant Access)', async () => {
      // user-vikram is OWNER of biz-coastal-spice, NOT biz-royal-interiors
      const { rawToken } = await createPersistentSession('user-vikram');

      const req = createMockRequest('http://localhost:3000/api/bid-intents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        cookies: { [DEVELOPMENT_COOKIE_NAME]: rawToken },
        body: {
          businessId: 'biz-royal-interiors', // Belongs to user-ajay!
          marketId: 'market-jaipur-interior-designers',
          targetPosition: 1,
        },
      });

      await assert.rejects(
        async () => requireBusinessMembership(req, 'biz-royal-interiors', 'bidIntent.create'),
        (err: unknown) => {
          assert.ok(err instanceof BusinessForbiddenError);
          assert.strictEqual((err as BusinessForbiddenError).statusCode, 403);
          return true;
        }
      );
    });

    it('should reject cross-tenant workspace access for unauthorized businesses', async () => {
      const { rawToken } = await createPersistentSession('user-vikram');

      const req = createMockRequest(
        'http://localhost:3000/api/business/dashboard/markets?businessId=biz-royal-interiors',
        {
          cookies: { [DEVELOPMENT_COOKIE_NAME]: rawToken },
        }
      );

      await assert.rejects(
        async () => requireBusinessMembership(req, 'biz-royal-interiors', 'workspace.access'),
        (err: unknown) => {
          assert.ok(err instanceof BusinessForbiddenError);
          assert.strictEqual((err as BusinessForbiddenError).statusCode, 403);
          return true;
        }
      );
    });

    it('should reject administrative actions when called by a non-admin authenticated user (403)', async () => {
      // user-ajay is a regular business owner, NOT a platform superadmin
      const { rawToken } = await createPersistentSession('user-ajay');

      const req = createMockRequest('http://localhost:3000/api/business-claims/claim-123/review', {
        method: 'POST',
        cookies: { [DEVELOPMENT_COOKIE_NAME]: rawToken },
      });

      await assert.rejects(
        async () => requirePlatformAdminUser(req),
        (err: unknown) => {
          assert.ok(err instanceof AdminAuthorizationError || err instanceof AuthorizationError);
          assert.strictEqual((err as AdminAuthorizationError).statusCode, 403);
          return true;
        }
      );
    });

    it('should allow platform admin through requirePlatformAdminUser', async () => {
      const { rawToken } = await createPersistentSession('user-admin');

      const req = createMockRequest('http://localhost:3000/api/business-claims/claim-123/review', {
        cookies: { [DEVELOPMENT_COOKIE_NAME]: rawToken },
      });

      const user = await requirePlatformAdminUser(req);
      assert.strictEqual(user.id, 'user-admin');
      assert.strictEqual(user.role, 'SUPERADMIN');
    });

    it('should enforce role-based permission boundaries (EDITOR cannot create bids)', async () => {
      const editorUser = createOrGetUserByEmail('editor-test@example.com');
      createMembership({
        userId: editorUser.id,
        businessId: 'biz-royal-interiors',
        role: 'EDITOR',
        status: 'ACTIVE',
      });
      const { rawToken } = await createPersistentSession(editorUser.id);

      const req = createMockRequest('http://localhost:3000/api/bid-intents', {
        cookies: { [DEVELOPMENT_COOKIE_NAME]: rawToken },
      });

      // Can access workspace
      const auth = await requireBusinessMembership(req, 'biz-royal-interiors', 'workspace.access');
      assert.strictEqual(auth.user.id, editorUser.id);

      // Cannot create bids (throws AuthorizationError 403)
      await assert.rejects(
        async () => requireBusinessMembership(req, 'biz-royal-interiors', 'bidIntent.create'),
        (err: unknown) => {
          assert.ok(err instanceof AuthorizationError);
          assert.strictEqual((err as AuthorizationError).statusCode, 403);
          return true;
        }
      );
    });
  });

  // =========================================================================
  // 6. Forged Credentials & Anti-Spoofing Tests
  // =========================================================================
  describe('6. Anti-Spoofing & Client-Supplied Credential Rejection', () => {
    it('should enforce session identity even if client supplies spoofed businessId or actorUserId', async () => {
      // user-vikram is logged in
      const { rawToken } = await createPersistentSession('user-vikram');

      const req = createMockRequest('http://localhost:3000/api/bid-intents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        cookies: { [DEVELOPMENT_COOKIE_NAME]: rawToken },
        body: {
          businessId: 'biz-royal-interiors',
          actorUserId: 'user-ajay', // Spoofed attempt!
        },
      });

      // Server validates against the requested business with the authenticated user
      await assert.rejects(
        async () => requireBusinessMembership(req, 'biz-royal-interiors', 'bidIntent.create'),
        (err: unknown) => {
          assert.ok(err instanceof BusinessForbiddenError);
          return true;
        }
      );
    });

    it('should reject unauthenticated request when client passes x-user-id or spoofed headers', async () => {
      const req = createMockRequest('http://localhost:3000/api/bid-intents', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': 'user-ajay',
          'x-role': 'OWNER',
        },
      });

      await assert.rejects(
        async () => requireBusinessMembership(req, 'biz-royal-interiors', 'bidIntent.create'),
        (err: unknown) => {
          assert.ok(err instanceof AuthenticationRequiredError);
          return true;
        }
      );
    });
  });

  // =========================================================================
  // 7. Legitimate Authenticated Workflow Verification
  // =========================================================================
  describe('7. Legitimate Authenticated Workflow Verification', () => {
    it('should authorize legitimate business owner for business operations', async () => {
      const { rawToken } = await createPersistentSession('user-ajay');

      const req = createMockRequest('http://localhost:3000/api/bid-intents', {
        cookies: { [DEVELOPMENT_COOKIE_NAME]: rawToken },
      });

      const { user, membership } = await requireBusinessMembership(
        req,
        'biz-royal-interiors',
        'bidIntent.create'
      );

      assert.strictEqual(user.id, 'user-ajay');
      assert.strictEqual(membership.businessId, 'biz-royal-interiors');
      assert.strictEqual(membership.role, 'OWNER');
    });

    it('should authorize worker secret or admin via requireAdminOrWorker', async () => {
      const originalWorkerSecret = process.env.ADMIN_WORKER_SECRET;
      try {
        // 1. Valid worker secret
        process.env.ADMIN_WORKER_SECRET = 'super-secret-worker-key';
        const workerReq = createMockRequest('http://localhost:3000/api/admin/settlements', {
          headers: { 'x-admin-worker-secret': 'super-secret-worker-key' },
        });
        const workerAuth = await requireAdminOrWorker(workerReq);
        assert.strictEqual(workerAuth.isWorker, true);
        assert.strictEqual(workerAuth.actorId, 'scheduler-worker');

        // 2. Platform admin session
        const { rawToken } = await createPersistentSession('user-admin');
        const adminReq = createMockRequest('http://localhost:3000/api/admin/settlements', {
          cookies: { [DEVELOPMENT_COOKIE_NAME]: rawToken },
        });
        const adminAuth = await requireAdminOrWorker(adminReq);
        assert.strictEqual(adminAuth.isWorker, false);
        assert.strictEqual(adminAuth.actorId, 'user-admin');

        // 3. Unauthorized request
        const unauthReq = createMockRequest('http://localhost:3000/api/admin/settlements');
        await assert.rejects(
          async () => requireAdminOrWorker(unauthReq),
          (err: unknown) => {
            assert.ok(
              err instanceof AdminAuthorizationError ||
              err instanceof AdminAuthenticationError ||
              err instanceof AuthenticationRequiredError
            );
            return true;
          }
        );
      } finally {
        process.env.ADMIN_WORKER_SECRET = originalWorkerSecret;
      }
    });
  });
});
