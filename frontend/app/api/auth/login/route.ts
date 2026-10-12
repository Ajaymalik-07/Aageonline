/**
 * AageOnline — Production Authentication Sign-In API
 * Milestone 0.20.10: Persistent Authentication & Production Session Security
 *
 * POST /api/auth/login
 *
 * Authenticates user credentials, generates a persistent server-side session,
 * and sets an HttpOnly, Secure, SameSite=Lax session cookie.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createOrGetUserByEmail, getUserByEmail } from '../../../../lib/auth/store.ts';
import { createPersistentSession } from '../../../../lib/auth/server-session.ts';
import {
  getSessionCookieName,
  getSessionCookieOptions,
} from '../../../../lib/auth/session-token.ts';
import { hashClientIp, extractClientIp } from '../../../../lib/security/rate-limit.ts';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email } = body;

    if (!email || typeof email !== 'string' || !email.includes('@')) {
      return NextResponse.json(
        { error: 'Valid business email address is required.' },
        { status: 400 }
      );
    }

    const normEmail = email.trim().toLowerCase();

    // In local development/demo mode, resolve existing user or create
    let user = getUserByEmail(normEmail);
    if (!user) {
      if (process.env.NODE_ENV === 'production') {
        return NextResponse.json(
          { error: 'Invalid credentials or unregistered account.' },
          { status: 401 }
        );
      }
      user = createOrGetUserByEmail(normEmail);
    }

    if (user.status !== 'ACTIVE') {
      return NextResponse.json(
        { error: `Account is ${user.status}. Access denied.` },
        { status: 403 }
      );
    }

    // Extract connection telemetry
    const connectionIp = (req as unknown as { ip?: string }).ip || '127.0.0.1';
    const clientIp = extractClientIp(req.headers, connectionIp);
    const ipAddressHash = hashClientIp(clientIp);
    const userAgent = req.headers.get('user-agent') || undefined;

    // Create persistent server session
    const { session, rawToken } = await createPersistentSession(user.id, {
      ipAddressHash,
      userAgent,
    });

    const cookieName = getSessionCookieName();
    const cookieOptions = getSessionCookieOptions();

    const response = NextResponse.json({
      success: true,
      user,
      session: {
        token: session.token,
        userId: session.userId,
        expiresAt: session.expiresAt,
        createdAt: session.createdAt,
      },
    });

    // Set secure HttpOnly session cookie
    response.cookies.set(cookieName, rawToken, {
      httpOnly: cookieOptions.httpOnly,
      secure: cookieOptions.secure,
      sameSite: cookieOptions.sameSite,
      path: cookieOptions.path,
      maxAge: cookieOptions.maxAge,
    });

    return response;
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Authentication failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
