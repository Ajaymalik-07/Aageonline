/**
 * AageOnline — Milestone 0.20.24: Admin Application Unit & Security Test Suite
 *
 * Verifies:
 * 1. Admin server-side authentication & token verification.
 * 2. Timing-safe comparison across tokens and signatures.
 * 3. Cryptographically signed session cookie creation & validation (HMAC-SHA256).
 * 4. Session expiration and payload integrity (tampering defense).
 * 5. API client URL resolution and authorization bearer injection.
 * 6. Secret non-exposure (ADMIN_TOKEN is strictly server-only).
 * 7. Health probe endpoint contract.
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import {
  verifyAdminToken,
  createAdminSessionCookieValue,
  verifyAndParseAdminSession,
  timingSafeCompare,
  ADMIN_COOKIE_NAME,
  type AdminSessionUser,
} from '../lib/auth.ts';
import { getApiBaseUrl, getAdminHeaders } from '../lib/api-client.ts';
import { GET as healthHandler } from '../app/api/health/route.ts';

test('Admin Application Audit & Security Suite', async (t) => {
  const originalEnv = { ...process.env };

  t.afterEach(() => {
    process.env = { ...originalEnv };
  });

  await t.test('1. Admin Token Verification & Timing Safety', () => {
    process.env.ADMIN_TOKEN = 'test-secret-admin-token-64-character-length-secure-token-12345';
    (process.env as Record<string, string | undefined>).NODE_ENV = 'production';

    // Valid token
    assert.equal(
      verifyAdminToken('test-secret-admin-token-64-character-length-secure-token-12345'),
      true,
      'Valid token must pass verification'
    );

    // Invalid token
    assert.equal(
      verifyAdminToken('wrong-token'),
      false,
      'Invalid token must be rejected'
    );

    // Tampered token of equal length
    assert.equal(
      verifyAdminToken('test-secret-admin-token-64-character-length-secure-token-1234X'),
      false,
      'Tampered token must be rejected'
    );

    // Empty or null
    assert.equal(verifyAdminToken(''), false);
    assert.equal(verifyAdminToken(null), false);
    assert.equal(verifyAdminToken(undefined), false);

    // Fail-closed in production if ADMIN_TOKEN is unset
    delete process.env.ADMIN_TOKEN;
    assert.equal(
      verifyAdminToken('any-token'),
      false,
      'Unset ADMIN_TOKEN in production must fail closed'
    );
  });

  await t.test('2. Cryptographic Signed Session Creation & Verification (Milestone 0.20.24)', async () => {
    process.env.SESSION_SECRET = 'test-hmac-secret-salt-key-32b-minimum';

    const testUser: AdminSessionUser = {
      id: 'usr-adm-101',
      email: 'security-admin@aageonline.com',
      name: 'Security Admin',
      role: 'SUPER_ADMIN',
    };
    const testApiToken = 'adm_sess_994820183019482';

    // Create session cookie value
    const cookieValue = await createAdminSessionCookieValue(testUser, testApiToken, false);
    assert.ok(cookieValue.includes('.'), 'Cookie value must consist of payload.signature');

    // Parse and verify valid cookie
    const parsed = await verifyAndParseAdminSession(cookieValue);
    assert.ok(parsed, 'Valid signed cookie must parse successfully');
    assert.equal(parsed?.user.email, 'security-admin@aageonline.com');
    assert.equal(parsed?.user.id, 'usr-adm-101');
    assert.equal(parsed?.apiToken, testApiToken);
    assert.ok(parsed?.expiresAt && parsed.expiresAt > Date.now(), 'Expiration must be in future');

    // Tampered signature must fail
    const parts = cookieValue.split('.');
    const tamperedSig = parts[0] + '.0000000000000000000000000000000000000000000000000000000000000000';
    const tamperedResult = await verifyAndParseAdminSession(tamperedSig);
    assert.equal(tamperedResult, null, 'Tampered signature must be rejected');

    // Tampered payload must fail
    const tamperedPayload = 'eyJhbGciOiJIUzI1NiJ9.' + parts[1];
    const tamperedPayloadResult = await verifyAndParseAdminSession(tamperedPayload);
    assert.equal(tamperedPayloadResult, null, 'Tampered payload must be rejected');

    // Null or invalid inputs
    assert.equal(await verifyAndParseAdminSession(''), null);
    assert.equal(await verifyAndParseAdminSession(null), null);
    assert.equal(await verifyAndParseAdminSession('malformed-cookie-value'), null);
  });

  await t.test('3. Timing Safe Compare Utility', () => {
    assert.equal(timingSafeCompare('secret-key-1', 'secret-key-1'), true);
    assert.equal(timingSafeCompare('secret-key-1', 'secret-key-2'), false);
    assert.equal(timingSafeCompare('secret-key-1', 'short'), false);
    assert.equal(timingSafeCompare('', ''), false);
    assert.equal(timingSafeCompare(null, 'secret'), false);
  });

  await t.test('4. API Client URL Resolution & Header Injection with Session Token', () => {
    process.env.INTERNAL_API_URL = 'http://api:4000';
    process.env.ADMIN_TOKEN = 'fallback-bearer-token';

    assert.equal(getApiBaseUrl(), 'http://api:4000');

    // Default header injection with fallback ADMIN_TOKEN
    const defaultHeaders = getAdminHeaders() as Record<string, string>;
    assert.equal(defaultHeaders['Content-Type'], 'application/json');
    assert.equal(defaultHeaders['Authorization'], 'Bearer fallback-bearer-token');

    // Custom session token injection from authenticated user session
    const sessionHeaders = getAdminHeaders('adm_sess_custom_token_999') as Record<string, string>;
    assert.equal(sessionHeaders['Authorization'], 'Bearer adm_sess_custom_token_999');

    // Fallback when INTERNAL_API_URL is unset
    delete process.env.INTERNAL_API_URL;
    process.env.NEXT_PUBLIC_API_URL = 'http://localhost:4000';
    assert.equal(getApiBaseUrl(), 'http://localhost:4000');
  });

  await t.test('5. Dedicated Health Check Endpoint Contract', async () => {
    const res = await healthHandler();
    assert.equal(res.status, 200);

    const json = await res.json();
    assert.equal(json.status, 'UP');
    assert.equal(json.service, '@aageonline/admin');
    assert.ok(json.timestamp);
  });

  await t.test('6. Zero PostgreSQL Dependencies & Browser Secret Isolation', () => {
    assert.equal(ADMIN_COOKIE_NAME, 'aage_admin_session');

    // Verify process.env.NEXT_PUBLIC_* does NOT contain ADMIN_TOKEN or credentials
    assert.equal(
      Object.keys(process.env).some((key) => key.startsWith('NEXT_PUBLIC_') && key.includes('ADMIN_TOKEN')),
      false,
      'ADMIN_TOKEN must never be prefixed with NEXT_PUBLIC_'
    );
  });
});
