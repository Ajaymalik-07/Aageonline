/**
 * AageOnline — Next.js Edge Middleware
 * Milestone 0.19.0: Production Readiness, Distributed State & Live Infrastructure Verification
 *
 * Intercepts requests before route execution:
 * 1. Evaluates privacy-preserving rate limits across route tiers.
 * 2. Enforces trusted proxy anti-spoofing and FIPS SHA-256 IP hashing.
 * 3. Verified Crawler Protection: Only infrastructure-verified crawlers receive elevated headroom.
 * 4. Injects standard rate-limit headers (X-RateLimit-Limit, Remaining, Reset, Store).
 * 5. Returns HTTP 429 with Retry-After when limits are exceeded.
 */

import { NextRequest, NextResponse } from 'next/server.js';
import {
  checkRateLimit,
  extractClientIp,
  hashClientIp,
  isVerifiedSearchCrawler,
  type RateLimitTier,
} from './lib/security/rate-limit.ts';

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico, sitemap.xml, robots.txt
     * - static public assets (/assets/*)
     */
    '/admin',
    '/admin/:path*',
    '/api/:path*',
    '/markets/:path*',
    '/categories/:path*',
    '/locations/:path*',
    '/businesses/:path*',
  ],
};

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Legacy frontend admin route retirement / safe redirection
  if (pathname === '/admin' || pathname.startsWith('/admin/')) {
    const adminUrl = process.env.ADMIN_APP_URL || process.env.NEXT_PUBLIC_ADMIN_URL;
    if (adminUrl && adminUrl.trim().length > 0) {
      const subpath = pathname.replace(/^\/admin/, '') || '/';
      return NextResponse.redirect(new URL(subpath, adminUrl));
    }
    return new NextResponse('Not Found', { status: 404 });
  }

  // 0. CSRF Defense-in-depth: Validate Origin and Sec-Fetch-Site on state-changing API mutations
  const isMutation = ['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method);
  const isExempt =
    pathname.startsWith('/api/payments/webhooks/') ||
    pathname.startsWith('/api/payments/callback/');

  if (isMutation && pathname.startsWith('/api/') && !isExempt) {
    const secFetchSite = req.headers.get('sec-fetch-site');
    if (secFetchSite === 'cross-site') {
      return NextResponse.json(
        {
          error: {
            code: 'CSRF_REJECTED',
            message: 'Cross-site request blocked by CSRF defense-in-depth policy.',
          },
        },
        { status: 403 }
      );
    }

    const origin = req.headers.get('origin');
    if (origin) {
      try {
        const originUrl = new URL(origin);
        const host = req.headers.get('host') || req.nextUrl.host;
        if (originUrl.host !== host) {
          return NextResponse.json(
            {
              error: {
                code: 'CSRF_REJECTED',
                message: 'Origin header does not match expected host.',
              },
            },
            { status: 403 }
          );
        }
      } catch {
        return NextResponse.json(
          {
            error: {
              code: 'CSRF_REJECTED',
              message: 'Invalid origin header.',
            },
          },
          { status: 403 }
        );
      }
    }
  }

  // 1. Determine rate limit tier
  let tier: RateLimitTier = 'PUBLIC_DISCOVERY';
  if (
    pathname.startsWith('/api/payments') ||
    pathname.startsWith('/api/bid-intents') ||
    pathname.startsWith('/api/auth')
  ) {
    tier = 'AUTH_AND_PAYMENTS';
  } else if (pathname.startsWith('/api/admin')) {
    tier = 'ADMIN_OPERATIONS';
  } else if (
    pathname.startsWith('/api/markets/search') ||
    pathname.includes('/pricing')
  ) {
    tier = 'SEARCH_API';
  }

  // 2. Extract client IP safely respecting trusted proxy architecture
  const connectionIp = (req as unknown as { ip?: string }).ip || '127.0.0.1';
  const clientIp = extractClientIp(req.headers, connectionIp);
  const clientToken = hashClientIp(clientIp);

  // 3. Check for genuine infrastructure-verified crawler
  const isCrawler = isVerifiedSearchCrawler(req.headers);

  // 4. Evaluate rate limit
  const rateLimit = checkRateLimit(clientToken, tier, isCrawler);

  if (!rateLimit.allowed) {
    return NextResponse.json(
      {
        error: {
          code: 'RATE_LIMIT_EXCEEDED',
          message: 'Too many requests. Please retry after the indicated window.',
          retryAfterSeconds: rateLimit.retryAfterSeconds,
        },
      },
      {
        status: 429,
        headers: {
          'Retry-After': String(rateLimit.retryAfterSeconds || 60),
          'X-RateLimit-Limit': String(rateLimit.limit),
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset': String(rateLimit.resetSeconds),
          'X-RateLimit-Store': rateLimit.store,
          'Cache-Control': 'no-store, max-age=0',
        },
      }
    );
  }

  // 5. Continue with rate-limit telemetry headers attached
  const res = NextResponse.next();
  res.headers.set('X-RateLimit-Limit', String(rateLimit.limit));
  res.headers.set('X-RateLimit-Remaining', String(rateLimit.remaining));
  res.headers.set('X-RateLimit-Reset', String(rateLimit.resetSeconds));
  res.headers.set('X-RateLimit-Store', rateLimit.store);

  // In staging environments, enforce noindex, nofollow headers to prevent indexation
  if (
    process.env.APP_ENV === 'staging' ||
    process.env.NEXT_PUBLIC_APP_ENV === 'staging'
  ) {
    res.headers.set('X-Robots-Tag', 'noindex, nofollow');
  }

  return res;
}

