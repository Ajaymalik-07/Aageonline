/**
 * AageOnline — Admin Server-Side Authentication & Session Service
 * Milestone 0.20.24: Email/Password Authentication & Complete Redesign
 *
 * Enforces secure server-side authentication for the dedicated Admin portal:
 * 1. Cryptographically signs session payloads with Web Crypto HMAC-SHA256.
 * 2. Manages HttpOnly, SameSite=Strict session cookies.
 * 3. Never exposes backend secrets or passwords to browser client bundles.
 * 4. 100% compatible with both Node.js and Next.js Edge runtime (middleware).
 */

export const ADMIN_COOKIE_NAME = 'aage_admin_session';

export interface AdminSessionUser {
  id: string;
  email: string;
  name: string;
  role: 'SUPER_ADMIN' | 'ADMIN';
}

export interface AdminSessionPayload {
  user: AdminSessionUser;
  apiToken: string;
  createdAt: number;
  expiresAt: number;
}

/**
 * Constant-time string comparison to prevent timing attacks across all JS runtimes.
 */
export function timingSafeCompare(a?: string | null, b?: string | null): boolean {
  if (typeof a !== 'string' || typeof b !== 'string') return false;
  if (!a || !b) return false;

  let mismatch = a.length === b.length ? 0 : 1;
  const len = Math.max(a.length, b.length);
  for (let i = 0; i < len; i++) {
    const charA = a.charCodeAt(i % a.length) || 0;
    const charB = b.charCodeAt(i % b.length) || 0;
    mismatch |= charA ^ charB;
  }
  return mismatch === 0 && a.length === b.length;
}

/**
 * Generates an HMAC-SHA256 signature for data using standard Web Crypto.
 */
export async function signData(data: string): Promise<string> {
  const secret = process.env.SESSION_SECRET || process.env.ADMIN_TOKEN || 'aageonline-admin-session-salt-fallback-32b';
  const enc = new TextEncoder();
  const key = await globalThis.crypto.subtle.importKey(
    'raw',
    enc.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const signature = await globalThis.crypto.subtle.sign('HMAC', key, enc.encode(data));
  return Array.from(new Uint8Array(signature))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

/**
 * Creates a signed session cookie value containing the user profile and API token.
 */
export async function createAdminSessionCookieValue(
  user: AdminSessionUser,
  apiToken: string,
  rememberMe: boolean = false
): Promise<string> {
  const ttlMs = (rememberMe ? 24 * 7 : 8) * 60 * 60 * 1000; // 7 days or 8 hours
  const payload: AdminSessionPayload = {
    user,
    apiToken,
    createdAt: Date.now(),
    expiresAt: Date.now() + ttlMs,
  };
  const json = JSON.stringify(payload);
  const enc = new TextEncoder();
  const b64 = Buffer.from(enc.encode(json)).toString('base64url');
  const signature = await signData(b64);
  return `${b64}.${signature}`;
}

/**
 * Verifies and extracts the session payload from the signed cookie.
 */
export async function verifyAndParseAdminSession(
  cookieValue?: string | null
): Promise<AdminSessionPayload | null> {
  if (!cookieValue || typeof cookieValue !== 'string' || !cookieValue.includes('.')) {
    // Check fallback legacy token hash format
    if (cookieValue && cookieValue.length === 64) {
      const isValid = await verifyLegacyAdminSessionCookie(cookieValue);
      if (isValid) {
        return {
          user: {
            id: 'usr-admin-bootstrap',
            email: 'admin@aageonline.com',
            name: 'Platform Administrator',
            role: 'SUPER_ADMIN',
          },
          apiToken: process.env.ADMIN_TOKEN || 'dev-admin-secret-token',
          createdAt: Date.now(),
          expiresAt: Date.now() + 8 * 60 * 60 * 1000,
        };
      }
    }
    return null;
  }

  const parts = cookieValue.split('.');
  if (parts.length !== 2) return null;
  const [b64, signature] = parts;

  const expectedSignature = await signData(b64);
  if (!timingSafeCompare(signature, expectedSignature)) {
    return null;
  }

  try {
    const raw = Buffer.from(b64, 'base64url').toString('utf8');
    const payload: AdminSessionPayload = JSON.parse(raw);
    if (!payload.expiresAt || Date.now() > payload.expiresAt) {
      return null;
    }
    return payload;
  } catch {
    return null;
  }
}

/**
 * Validates whether the session cookie is valid.
 */
export async function verifyAdminSessionCookie(cookieValue?: string | null): Promise<boolean> {
  const session = await verifyAndParseAdminSession(cookieValue);
  return session !== null;
}

/**
 * Legacy hash verification fallback for testing compatibility.
 */
async function verifyLegacyAdminSessionCookie(cookieValue: string): Promise<boolean> {
  const serverToken = process.env.ADMIN_TOKEN || (process.env.NODE_ENV !== 'production' ? 'dev-admin-secret-token' : '');
  if (!serverToken) return false;
  const expectedHash = await signData(serverToken);
  return timingSafeCompare(cookieValue, expectedHash);
}

/**
 * Legacy helper maintained for unit testing.
 */
export async function createAdminSessionHash(token: string): Promise<string> {
  return await signData(token);
}

export function verifyAdminToken(providedToken?: string | null): boolean {
  const serverToken = process.env.ADMIN_TOKEN;
  if (!serverToken || serverToken.trim().length === 0) {
    if (process.env.NODE_ENV === 'production') return false;
    return providedToken === 'dev-admin-secret-token' || providedToken === 'dev-admin-token-local';
  }
  if (!providedToken) return false;
  return timingSafeCompare(providedToken.trim(), serverToken.trim());
}
