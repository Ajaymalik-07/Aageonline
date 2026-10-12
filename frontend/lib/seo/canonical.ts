/**
 * AageOnline — Canonical Metadata & URL Normalization Service
 *
 * Enforces production origin resolution, absolute URL generation,
 * query-string stripping, path lowercasing, and private-route noindex policies.
 */

import type { Metadata } from 'next';
import { siteConfig } from '../../config/site.ts';

/**
 * Resolves the authoritative public origin.
 * Strictly prevents localhost URLs in production environments.
 */
export function getAuthoritativeOrigin(): string {
  const envUrl = process.env.NEXT_PUBLIC_APP_URL || siteConfig.url || 'https://aageonline.com';
  let origin = envUrl.trim().replace(/\/+$/, '');

  // Guard against accidental localhost in production deployments
  if (process.env.NODE_ENV === 'production' && (origin.includes('localhost') || origin.includes('127.0.0.1'))) {
    origin = 'https://aageonline.com';
  }

  return origin;
}

/**
 * Normalizes a route path:
 * 1. Strips query parameters and fragments.
 * 2. Normalizes duplicate slashes.
 * 3. Removes trailing slashes (except root '/').
 * 4. Lowercases path.
 */
export function normalizeCanonicalPath(rawPath: string): string {
  if (!rawPath) return '/';

  // Strip query string and fragment
  const pathWithoutQuery = rawPath.split('?')[0].split('#')[0].trim();

  // Handle root
  if (pathWithoutQuery === '' || pathWithoutQuery === '/') {
    return '/';
  }

  // Normalize slashes: replace duplicate slashes with single slash
  let clean = pathWithoutQuery.replace(/\/+/g, '/');

  // Strip trailing slash
  if (clean.endsWith('/') && clean.length > 1) {
    clean = clean.slice(0, -1);
  }

  // Ensure leading slash
  if (!clean.startsWith('/')) {
    clean = `/${clean}`;
  }

  return clean.toLowerCase();
}

/**
 * Builds an absolute canonical URL from a path.
 */
export function buildCanonicalUrl(path: string): string {
  const origin = getAuthoritativeOrigin();
  const normalizedPath = normalizeCanonicalPath(path);

  if (normalizedPath === '/') {
    return origin;
  }

  return `${origin}${normalizedPath}`;
}

/**
 * Determines whether a route is an internal or private operational path.
 */
export function isPrivateRoute(path: string): boolean {
  const normalized = normalizeCanonicalPath(path);
  const privatePrefixes = [
    '/admin',
    '/api',
    '/auth',
    '/business',
    '/workspace',
  ];

  return privatePrefixes.some(
    (prefix) => normalized === prefix || normalized.startsWith(`${prefix}/`)
  );
}

export interface CanonicalMetadataOptions {
  title: string;
  description: string;
  path: string;
  isIndexable?: boolean;
  publishedTime?: string;
  modifiedTime?: string;
}

/**
 * Generates technical Next.js Metadata with validated canonical tags and robots directives.
 */
export function generateCanonicalMetadata({
  title,
  description,
  path,
  isIndexable = true,
  publishedTime,
  modifiedTime,
}: CanonicalMetadataOptions): Metadata {
  const canonicalUrl = buildCanonicalUrl(path);
  const privatePath = isPrivateRoute(path);
  const shouldIndex = isIndexable && !privatePath;

  const metadata: Metadata = {
    title,
    description,
    metadataBase: new URL(getAuthoritativeOrigin()),
    alternates: {
      canonical: canonicalUrl,
    },
    robots: {
      index: shouldIndex,
      follow: shouldIndex,
      googleBot: {
        index: shouldIndex,
        follow: shouldIndex,
      },
    },
    openGraph: {
      title,
      description,
      url: canonicalUrl,
      siteName: siteConfig.name,
      locale: 'en_IN',
      type: 'website',
      ...(publishedTime && { publishedTime }),
      ...(modifiedTime && { modifiedTime }),
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
    },
  };

  return metadata;
}
