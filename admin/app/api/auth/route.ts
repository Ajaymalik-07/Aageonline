import { NextRequest, NextResponse } from 'next/server';
import {
  ADMIN_COOKIE_NAME,
  createAdminSessionCookieValue,
  verifyAndParseAdminSession,
} from '../../../lib/auth.ts';
import { fetchFromApi } from '../../../lib/api-client.ts';

export async function GET(req: NextRequest) {
  const cookieValue = req.cookies.get(ADMIN_COOKIE_NAME)?.value;
  const session = await verifyAndParseAdminSession(cookieValue);

  if (!session) {
    return NextResponse.json(
      { authenticated: false, message: 'No active administrative session.' },
      { status: 401 }
    );
  }

  return NextResponse.json(
    {
      authenticated: true,
      user: session.user,
      expiresAt: session.expiresAt,
    },
    { status: 200 }
  );
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const email = typeof body?.email === 'string' ? body.email.trim() : '';
    const password = typeof body?.password === 'string' ? body.password : '';
    const rememberMe = Boolean(body?.rememberMe);

    // Validate email format and non-empty password
    if (!email || !password) {
      return NextResponse.json(
        { error: 'INVALID_CREDENTIALS', message: 'Email address and password are required.' },
        { status: 400 }
      );
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'INVALID_FORMAT', message: 'Please provide a valid administrative email address.' },
        { status: 400 }
      );
    }

    // Call API server-to-server: POST /api/admin/auth/login
    const apiResult = await fetchFromApi<{
      authenticated: boolean;
      user: { id: string; email: string; name: string; role: 'SUPER_ADMIN' | 'ADMIN' };
      token: string;
      expiresIn: number;
    }>('/api/admin/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });

    if (!apiResult.ok || !apiResult.data?.authenticated) {
      const status = apiResult.status === 429 ? 429 : 401;
      return NextResponse.json(
        {
          error: apiResult.status === 429 ? 'RATE_LIMIT_EXCEEDED' : 'UNAUTHORIZED',
          message: apiResult.error || 'Invalid administrative credentials.',
        },
        { status }
      );
    }

    const { user, token } = apiResult.data;

    // Create cryptographically signed session cookie value
    const sessionCookieValue = await createAdminSessionCookieValue(user, token, rememberMe);

    const maxAge = rememberMe ? 60 * 60 * 24 * 7 : 60 * 60 * 8; // 7 days or 8 hours

    const response = NextResponse.json(
      {
        authenticated: true,
        user,
        message: 'Administrative authentication successful.',
      },
      { status: 200 }
    );

    // Secure HttpOnly, SameSite=Strict cookie
    response.cookies.set({
      name: ADMIN_COOKIE_NAME,
      value: sessionCookieValue,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/',
      maxAge,
    });

    return response;
  } catch (err: unknown) {
    return NextResponse.json(
      { error: 'BAD_REQUEST', message: 'Malformed authentication request payload.' },
      { status: 400 }
    );
  }
}

export async function DELETE() {
  const response = NextResponse.json(
    { authenticated: false, message: 'Logged out successfully.' },
    { status: 200 }
  );

  response.cookies.set({
    name: ADMIN_COOKIE_NAME,
    value: '',
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/',
    maxAge: 0,
  });

  return response;
}
