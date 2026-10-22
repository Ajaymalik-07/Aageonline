import type { MetadataRoute } from 'next';
import { siteConfig } from '../config/site.ts';

/**
 * Evaluates whether the current environment is authorized for search engine indexing.
 * Fails-safe: Defaults to noindex for missing, local, test, preview, or conflicting variables.
 */
export function isProductionRobotsEnvironment(env: Record<string, string | undefined> = process.env): boolean {
  const appEnv = (env.APP_ENV ?? '').toLowerCase().trim();
  const publicAppEnv = (env.NEXT_PUBLIC_APP_ENV ?? '').toLowerCase().trim();
  const nodeEnv = (env.NODE_ENV ?? '').toLowerCase().trim();

  // 1. Explicit non-production environments always fail-safe to noindex
  if (appEnv && appEnv !== 'production' && appEnv !== 'prod') {
    return false;
  }
  if (publicAppEnv && publicAppEnv !== 'production' && publicAppEnv !== 'prod') {
    return false;
  }
  if (nodeEnv && nodeEnv !== 'production' && nodeEnv !== 'prod') {
    return false;
  }

  // 2. Explicit production flags
  if (appEnv === 'production' || appEnv === 'prod') {
    return true;
  }
  if (publicAppEnv === 'production' || publicAppEnv === 'prod') {
    return true;
  }

  // 3. Fallback to NODE_ENV when APP_ENV is unset
  return nodeEnv === 'production' || nodeEnv === 'prod';
}

export default function robots(): MetadataRoute.Robots {
  const isProduction = isProductionRobotsEnvironment();

  if (!isProduction) {
    return {
      rules: [
        {
          userAgent: '*',
          disallow: ['/'],
        },
      ],
    };
  }

  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/workspace/', '/admin/', '/api/'],
      },
    ],
    sitemap: `${siteConfig.url}/sitemap.xml`,
  };
}
