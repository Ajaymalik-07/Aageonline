/**
 * AageOnline — Production Authentication Sign-Out API
 * Milestone 0.20.10: Persistent Authentication & Production Session Security
 *
 * POST /api/auth/logout
 *
 * Revokes the server-side persistent session in PostgreSQL and clears the session cookie.
 */

import { NextRequest, NextResponse } from 'next/server';
import { revokePersistentSession } from '../../../../lib/auth/server-session.ts';
import {
  extractSessionTokenFromRequest,
  getSessionCookieName,
  getSessionCookieOptions,
  DEVELOPMENT_COOKIE_NAME,
  PRODUCTION_COOKIE_NAME,
} from '../../../../lib/auth/session-token.ts';

export async function POST(req: NextRequest) {
  try {
    const rawToken = extractSessionTokenFromRequest(req);
    if (rawToken) {
      await revokePersistentSession(rawToken);
    }

    if (process.env.NODE_ENV !== 'production') {
      try {
        const { setActiveDevUser } = await import('../../../../lib/auth/store.ts');
        setActiveDevUser(null);
      } catch {
        // safe to ignore
      }
    }

    const cookieOptions = getSessionCookieOptions();

    const response = NextResponse.json({
      success: true,
      message: 'Logged out successfully.',
    });

    // Clear all possible session cookies across environments
    for (const name of [DEVELOPMENT_COOKIE_NAME, PRODUCTION_COOKIE_NAME]) {
      response.cookies.set(name, '', {
        httpOnly: cookieOptions.httpOnly,
        secure: cookieOptions.secure,
        sameSite: cookieOptions.sameSite,
        path: '/',
        maxAge: 0,
        expires: new Date(0),
      });
    }

    return response;
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Internal error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  await POST(req);
  return NextResponse.redirect(new URL('/business/claim', req.url));
}

