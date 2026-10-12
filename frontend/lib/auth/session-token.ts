/**
 * AageOnline — Production Session Token & Cookie Utilities
 * Milestone 0.20.10: Persistent Authentication & Production Session Security
 *
 * Implements high-entropy session token generation, cryptographically secure
 * SHA-256 token hashing, and strict production cookie policies.
 */

import crypto from 'node:crypto';

export const PRODUCTION_COOKIE_NAME = '__Host-aageonline_session';
export const DEVELOPMENT_COOKIE_NAME = 'aageonline_session';

export function getSessionCookieName(): string {
  // __Host- cookies require HTTPS; in production with HTTPS, use __Host- prefix
  return process.env.NODE_ENV === 'production'
    ? PRODUCTION_COOKIE_NAME
    : DEVELOPMENT_COOKIE_NAME;
}

export interface SessionCookieOptions {
  httpOnly: boolean;
  secure: boolean;
  sameSite: 'lax' | 'strict' | 'none';
  path: string;
  maxAge: number;
}

export function getSessionCookieOptions(): SessionCookieOptions {
  const isProduction = process.env.NODE_ENV === 'production';
  return {
    httpOnly: true,
    secure: isProduction,
    sameSite: 'lax',
    path: '/',
    maxAge: 7 * 24 * 60 * 60, // 7 days in seconds
  };
}

/**
 * Generates a cryptographically random, high-entropy 256-bit session token.
 */
export function generateSessionToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

/**
 * Computes a deterministic SHA-256 hash of a raw session token.
 * Only this hash is stored in PostgreSQL, never the plaintext bearer token.
 */
export function hashSessionToken(rawToken: string): string {
  return crypto.createHash('sha256').update(rawToken.trim()).digest('hex');
}

/**
 * Safely extracts raw session token from incoming request cookies or Authorization header.
 * Inspects both canonical production (__Host-) and development cookie names.
 */
export function extractSessionTokenFromRequest(
  req?: Request | { headers: Headers; cookies?: { get(name: string): { value: string } | undefined } }
): string | null {
  if (!req) return null;

  // 1. Direct NextRequest or cookie reader if available
  if ('cookies' in req && req.cookies && typeof req.cookies.get === 'function') {
    const hostCookie = req.cookies.get(PRODUCTION_COOKIE_NAME);
    if (hostCookie?.value) return hostCookie.value.trim();

    const devCookie = req.cookies.get(DEVELOPMENT_COOKIE_NAME);
    if (devCookie?.value) return devCookie.value.trim();
  }

  // 2. Parse from standard 'cookie' header
  const cookieHeader = req.headers.get('cookie');
  if (cookieHeader) {
    const pairs = cookieHeader.split(';').map((p) => p.trim());
    for (const pair of pairs) {
      const [name, ...rest] = pair.split('=');
      const val = rest.join('=');
      if (name === PRODUCTION_COOKIE_NAME && val) {
        return decodeURIComponent(val).trim();
      }
      if (name === DEVELOPMENT_COOKIE_NAME && val) {
        return decodeURIComponent(val).trim();
      }
    }
  }

  // 3. Fallback: Parse from 'Authorization: Bearer <token>' header
  const authHeader = req.headers.get('authorization');
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const bearerToken = authHeader.substring(7).trim();
    if (bearerToken.length > 0) {
      return bearerToken;
    }
  }

  return null;
}
