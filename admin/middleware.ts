import { NextRequest, NextResponse } from 'next/server';
import { ADMIN_COOKIE_NAME, verifyAdminSessionCookie } from './lib/auth.ts';

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // 1. Allow public health checks and Next.js static assets
  if (
    pathname.startsWith('/api/health') ||
    pathname.startsWith('/_next') ||
    pathname === '/favicon.ico'
  ) {
    return NextResponse.next();
  }

  const sessionCookie = req.cookies.get(ADMIN_COOKIE_NAME)?.value;
  const isAuthenticated = await verifyAdminSessionCookie(sessionCookie);

  // 2. Handle login page: if already authenticated, redirect to /
  if (pathname === '/login') {
    if (isAuthenticated) {
      return NextResponse.redirect(new URL('/', req.url));
    }
    return NextResponse.next();
  }

  // 3. Allow public auth endpoints (/api/auth)
  if (pathname.startsWith('/api/auth')) {
    return NextResponse.next();
  }

  // 4. Validate session for protected routes
  if (!isAuthenticated) {
    // Return 401 for internal API requests
    if (pathname.startsWith('/api/')) {
      return NextResponse.json(
        { error: 'UNAUTHORIZED', message: 'Admin authentication required' },
        { status: 401 }
      );
    }

    // Redirect browser requests to /login with safe from query parameter
    const loginUrl = new URL('/login', req.url);
    if (pathname !== '/' && pathname.startsWith('/')) {
      loginUrl.searchParams.set('from', pathname);
    }
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
