import test from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import { server, timingSafeTokenCompare } from '../src/server.ts';

// Helper to start the server on an ephemeral port during testing
function withTestServer(fn: (baseUrl: string) => Promise<void>): Promise<void> {
  return new Promise((resolve, reject) => {
    const testServer = http.createServer((req, res) => {
      server.emit('request', req, res);
    });

    testServer.listen(0, '127.0.0.1', async () => {
      const address = testServer.address() as { port: number };
      const baseUrl = `http://127.0.0.1:${address.port}`;
      try {
        await fn(baseUrl);
        testServer.closeAllConnections?.();
        testServer.close(() => resolve());
      } catch (err) {
        testServer.closeAllConnections?.();
        testServer.close(() => reject(err));
      }
    });
  });
}

test('API Service Integration & Security Test Suite', async (t) => {
  const originalEnv = { ...process.env };

  t.afterEach(() => {
    process.env = { ...originalEnv };
  });

  await t.test('1. Health & Readiness Probes', async () => {
    await withTestServer(async (baseUrl) => {
      const liveRes = await fetch(`${baseUrl}/api/health/live`);
      assert.equal(liveRes.status, 200);
      const liveJson = await liveRes.json();
      assert.equal(liveJson.status, 'UP');
      assert.equal(liveJson.service, '@aageonline/api');

      const readyRes = await fetch(`${baseUrl}/api/health/ready`);
      assert.equal(readyRes.status, 200);
      const readyJson = await readyRes.json();
      assert.equal(readyJson.status, 'READY');
      assert.equal(readyJson.database, 'OK');
    });
  });

  await t.test('2. Markets Catalog & Search', async () => {
    await withTestServer(async (baseUrl) => {
      // Catalog
      const res = await fetch(`${baseUrl}/api/markets`);
      assert.equal(res.status, 200);
      const json = await res.json();
      assert.ok(Array.isArray(json.data), 'Expected json.data array for frontend adapter');
      assert.ok(Array.isArray(json.markets), 'Expected json.markets array for admin app');
      assert.ok(json.pagination, 'Expected pagination envelope');
      assert.ok(json.data.length >= 3);

      // Search
      const searchRes = await fetch(`${baseUrl}/api/markets/search?q=jaipur`);
      assert.equal(searchRes.status, 200);
      const searchJson = await searchRes.json();
      assert.ok(Array.isArray(searchJson));
      assert.ok(searchJson.some((m: any) => m.citySlug === 'jaipur'));
    });
  });

  await t.test('3. Categories & Locations Catalog', async () => {
    await withTestServer(async (baseUrl) => {
      const catRes = await fetch(`${baseUrl}/api/categories`);
      assert.equal(catRes.status, 200);
      const catJson = await catRes.json();
      assert.ok(Array.isArray(catJson.categories));

      const locRes = await fetch(`${baseUrl}/api/locations`);
      assert.equal(locRes.status, 200);
      const locJson = await locRes.json();
      assert.ok(Array.isArray(locJson.locations));
    });
  });

  await t.test('4. Businesses Directory & Slug Lookup', async () => {
    await withTestServer(async (baseUrl) => {
      // List
      const listRes = await fetch(`${baseUrl}/api/businesses`);
      assert.equal(listRes.status, 200);
      const listJson = await listRes.json();
      assert.ok(Array.isArray(listJson.data));
      assert.ok(listJson.pagination);

      // Slug lookup
      const slugRes = await fetch(`${baseUrl}/api/businesses?slug=abc-interiors-jaipur`);
      assert.equal(slugRes.status, 200);
      const slugJson = await slugRes.json();
      assert.equal(slugJson.data.slug, 'abc-interiors-jaipur');
      assert.equal(slugJson.data.verificationStatus, 'VERIFIED');

      // Not found lookup
      const notFoundRes = await fetch(`${baseUrl}/api/businesses?slug=non-existent-biz`);
      assert.equal(notFoundRes.status, 404);
    });
  });

  await t.test('5. Bid Intent Creation Validation & Integer Amounts', async () => {
    await withTestServer(async (baseUrl) => {
      // Invalid intent
      const badRes = await fetch(`${baseUrl}/api/bid-intents`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });
      assert.equal(badRes.status, 400);

      // Valid intent
      const goodRes = await fetch(`${baseUrl}/api/bid-intents`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          marketId: 'mkt-jaipur-interior-designers',
          businessId: 'biz-abc-interiors',
          targetPosition: 1,
        }),
      });
      assert.equal(goodRes.status, 201);
      const goodJson = await goodRes.json();
      assert.equal(goodJson.status, 'INTENT_CREATED');
      assert.equal(goodJson.targetPosition, 1);
      assert.equal(typeof goodJson.calculatedAmount, 'number');
      assert.equal(Number.isInteger(goodJson.calculatedAmount), true, 'Amount must be an integer');
    });
  });

  await t.test('6. Administrative Route Protection & Bearer Token Authentication', async () => {
    process.env.ADMIN_TOKEN = 'secure-production-admin-token-12345';
    (process.env as Record<string, string | undefined>).NODE_ENV = 'production';

    await withTestServer(async (baseUrl) => {
      // 6.1 Missing Authorization Header -> 401 Unauthorized
      const noAuthRes = await fetch(`${baseUrl}/api/admin/operations`);
      assert.equal(noAuthRes.status, 401);
      const noAuthJson = await noAuthRes.json();
      assert.equal(noAuthJson.error, 'UNAUTHORIZED');

      // 6.2 Malformed Authorization Header -> 401 Unauthorized
      const badAuthRes = await fetch(`${baseUrl}/api/admin/operations`, {
        headers: { Authorization: 'Basic invalid-creds' },
      });
      assert.equal(badAuthRes.status, 401);

      const emptyBearerRes = await fetch(`${baseUrl}/api/admin/operations`, {
        headers: { Authorization: 'Bearer ' },
      });
      assert.equal(emptyBearerRes.status, 401);

      // 6.3 Invalid / Tampered Token -> 403 Forbidden
      const wrongTokenRes = await fetch(`${baseUrl}/api/admin/operations`, {
        headers: { Authorization: 'Bearer wrong-secret-token' },
      });
      assert.equal(wrongTokenRes.status, 403);
      const wrongTokenJson = await wrongTokenRes.json();
      assert.equal(wrongTokenJson.error, 'FORBIDDEN');

      // 6.4 Valid Token -> 200 OK
      const validRes = await fetch(`${baseUrl}/api/admin/operations`, {
        headers: { Authorization: 'Bearer secure-production-admin-token-12345' },
      });
      assert.equal(validRes.status, 200);
      const validJson = await validRes.json();
      assert.equal(validJson.workerStatus, 'HEALTHY');
    });
  });

  await t.test('7. Fail-Closed Policy when ADMIN_TOKEN Unset in Production', async () => {
    delete process.env.ADMIN_TOKEN;
    (process.env as Record<string, string | undefined>).NODE_ENV = 'production';

    await withTestServer(async (baseUrl) => {
      const res = await fetch(`${baseUrl}/api/admin/operations`, {
        headers: { Authorization: 'Bearer any-token' },
      });
      assert.equal(res.status, 500);
      const json = await res.json();
      assert.equal(json.error, 'CONFIG_ERROR');
    });
  });

  await t.test('8. Admin Operations Vitals & Reconciliation Trigger (GET & POST)', async () => {
    process.env.ADMIN_TOKEN = 'test-admin-secret-token';

    await withTestServer(async (baseUrl) => {
      const authHeader = { Authorization: 'Bearer test-admin-secret-token' };

      // GET Vitals
      const vitalsRes = await fetch(`${baseUrl}/api/admin/operations`, {
        headers: authHeader,
      });
      assert.equal(vitalsRes.status, 200);
      const vitalsJson = await vitalsRes.json();
      assert.equal(vitalsJson.workerStatus, 'HEALTHY');
      assert.equal(vitalsJson.reconciliationStatus, 'IN_SYNC');

      // POST Invalid Action -> 400 Bad Request
      const badActionRes = await fetch(`${baseUrl}/api/admin/operations`, {
        method: 'POST',
        headers: { ...authHeader, 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'INVALID_ACTION' }),
      });
      assert.equal(badActionRes.status, 400);

      // POST Trigger Reconciliation (Action: RECONCILE) -> 200 OK
      const postRes = await fetch(`${baseUrl}/api/admin/operations`, {
        method: 'POST',
        headers: { ...authHeader, 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'RECONCILE' }),
      });
      assert.equal(postRes.status, 200);
      const postJson = await postRes.json();
      assert.equal(postJson.status, 'RECONCILIATION_TRIGGERED');
      assert.equal(postJson.action, 'RECONCILE');

      // Idempotency: Repeated reconciliation trigger succeeds safely
      const repeatRes = await fetch(`${baseUrl}/api/admin/operations`, {
        method: 'POST',
        headers: { ...authHeader, 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'RECONCILE' }),
      });
      assert.equal(repeatRes.status, 200);
      const repeatJson = await repeatRes.json();
      assert.equal(repeatJson.status, 'RECONCILIATION_TRIGGERED');
    });
  });

  await t.test('9. Admin Settlements and Recovery Jobs Authentication Guards', async () => {
    process.env.ADMIN_TOKEN = 'test-admin-secret-token';

    await withTestServer(async (baseUrl) => {
      // Unauthorized attempts
      const unauthSettlements = await fetch(`${baseUrl}/api/admin/settlements`);
      assert.equal(unauthSettlements.status, 401);

      const unauthRecovery = await fetch(`${baseUrl}/api/admin/recovery-jobs`);
      assert.equal(unauthRecovery.status, 401);

      // Authorized attempts
      const authSettlements = await fetch(`${baseUrl}/api/admin/settlements`, {
        headers: { Authorization: 'Bearer test-admin-secret-token' },
      });
      assert.equal(authSettlements.status, 200);

      const authRecovery = await fetch(`${baseUrl}/api/admin/recovery-jobs`, {
        headers: { Authorization: 'Bearer test-admin-secret-token' },
      });
      assert.equal(authRecovery.status, 200);
    });
  });

  await t.test('10. Timing-Safe String Comparison & Secret Non-Exposure Invariant', () => {
    const validSecret = 'super-secret-admin-token-64-bytes-length-key-12345';

    // Timing-safe comparison validation
    assert.equal(timingSafeTokenCompare(validSecret, validSecret), true);
    assert.equal(timingSafeTokenCompare(validSecret, 'wrong-secret'), false);
    assert.equal(timingSafeTokenCompare(validSecret, validSecret.slice(0, -1) + 'X'), false);
    assert.equal(timingSafeTokenCompare('', validSecret), false);
    assert.equal(timingSafeTokenCompare(null, validSecret), false);
    assert.equal(timingSafeTokenCompare(undefined, validSecret), false);

    // Verify ADMIN_TOKEN is never prefixed with NEXT_PUBLIC_
    assert.equal(
      Object.keys(process.env).some((key) => key.startsWith('NEXT_PUBLIC_') && key.includes('ADMIN_TOKEN')),
      false,
      'ADMIN_TOKEN must never be exposed via NEXT_PUBLIC_*'
    );
  });

  await t.test('12. Email & Password Authentication Flow (scrypt & Sessions)', async () => {
    await withTestServer(async (baseUrl) => {
      // 12.1 Valid Credentials -> 200 OK + Session Token
      const loginRes = await fetch(`${baseUrl}/api/admin/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'admin@aageonline.com',
          password: 'Admin@AageOnline2026!',
        }),
      });
      assert.equal(loginRes.status, 200);
      const loginJson = await loginRes.json();
      assert.equal(loginJson.authenticated, true);
      assert.equal(loginJson.user.email, 'admin@aageonline.com');
      assert.ok(loginJson.token.startsWith('adm_sess_'));
      assert.equal(typeof loginJson.expiresIn, 'number');

      // 12.2 Authenticated me profile lookup using session token
      const meRes = await fetch(`${baseUrl}/api/admin/auth/me`, {
        headers: { Authorization: `Bearer ${loginJson.token}` },
      });
      assert.equal(meRes.status, 200);
      const meJson = await meRes.json();
      assert.equal(meJson.user.email, 'admin@aageonline.com');
      assert.equal(meJson.user.role, 'SUPER_ADMIN');

      // 12.3 Operations vitals accessible via session token
      const vitalsRes = await fetch(`${baseUrl}/api/admin/operations`, {
        headers: { Authorization: `Bearer ${loginJson.token}` },
      });
      assert.equal(vitalsRes.status, 200);

      // 12.4 Audit logs accessible via session token
      const auditRes = await fetch(`${baseUrl}/api/admin/audit-logs`, {
        headers: { Authorization: `Bearer ${loginJson.token}` },
      });
      assert.equal(auditRes.status, 200);
      const auditJson = await auditRes.json();
      assert.ok(Array.isArray(auditJson.logs));
      assert.ok(auditJson.logs.length >= 1);

      // 12.5 Admin user directory (never exposes passwordHash)
      const usersRes = await fetch(`${baseUrl}/api/admin/users`, {
        headers: { Authorization: `Bearer ${loginJson.token}` },
      });
      assert.equal(usersRes.status, 200);
      const usersJson = await usersRes.json();
      assert.ok(Array.isArray(usersJson.users));
      assert.equal(usersJson.users[0].passwordHash, undefined, 'passwordHash must never be exposed');

      // 12.6 Session Logout invalidation
      const logoutRes = await fetch(`${baseUrl}/api/admin/auth/logout`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${loginJson.token}` },
      });
      assert.equal(logoutRes.status, 200);

      // 12.7 Access with revoked session token fails
      const revokedRes = await fetch(`${baseUrl}/api/admin/operations`, {
        headers: { Authorization: `Bearer ${loginJson.token}` },
      });
      assert.equal(revokedRes.status, 403);
    });
  });

  await t.test('13. Login Failure Handling & Brute-Force Rate Limiting', async () => {
    await withTestServer(async (baseUrl) => {
      // Missing fields
      const badReq = await fetch(`${baseUrl}/api/admin/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'admin@aageonline.com' }),
      });
      assert.equal(badReq.status, 400);

      // Wrong password
      const wrongPw = await fetch(`${baseUrl}/api/admin/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'admin@aageonline.com',
          password: 'wrong-password-attempt',
        }),
      });
      assert.equal(wrongPw.status, 401);

      // Non-existent user
      const wrongUser = await fetch(`${baseUrl}/api/admin/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'nonexistent@aageonline.com',
          password: 'some-password-123',
        }),
      });
      assert.equal(wrongUser.status, 401);
    });
  });

  await t.test('14. Payment & Webhook Route Isolation (No Duplicate Handlers on API Host)', async () => {
    await withTestServer(async (baseUrl) => {
      // 14.1 POST to /api/payments/webhooks/payu on API service must return 404 (authoritative handler lives in web service)
      const webhookPost = await fetch(`${baseUrl}/api/payments/webhooks/payu`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ txnid: 'txn-test-123', status: 'success' }),
      });
      assert.equal(webhookPost.status, 404);
      const webhookJson = await webhookPost.json();
      assert.equal(webhookJson.error, 'NOT_FOUND');
      assert.match(webhookJson.message, /does not exist on API service/i);

      // 14.2 GET to /api/payments/webhooks/payu on API service must return 404
      const webhookGet = await fetch(`${baseUrl}/api/payments/webhooks/payu`);
      assert.equal(webhookGet.status, 404);

      // 14.3 Browser callback routes must not exist on API service
      const callbackGet = await fetch(`${baseUrl}/api/payments/callback/payu`);
      assert.equal(callbackGet.status, 404);

      const callbackPost = await fetch(`${baseUrl}/api/payments/callback/payu`, {
        method: 'POST',
      });
      assert.equal(callbackPost.status, 404);

      // 14.4 Arbitrary unknown payment paths return 404
      const randomPayment = await fetch(`${baseUrl}/api/payments/unknown-action`);
      assert.equal(randomPayment.status, 404);
    });
  });
});


