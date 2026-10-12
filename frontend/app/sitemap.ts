import type { MetadataRoute } from 'next';
import { generateAuthoritativeSitemap } from '../lib/seo/sitemap-service.ts';
import { getAuthoritativeOrigin } from '../lib/seo/canonical.ts';

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  try {
    return await generateAuthoritativeSitemap();
  } catch {
    // Safe emergency fallback returning minimal canonical base route
    const origin = getAuthoritativeOrigin();
    return [
      {
        url: origin,
        changeFrequency: 'daily',
        priority: 1.0,
      },
      {
        url: `${origin}/markets`,
        changeFrequency: 'daily',
        priority: 0.9,
      },
    ];
  }
}
