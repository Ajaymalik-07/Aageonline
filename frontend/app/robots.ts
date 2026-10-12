import type { MetadataRoute } from 'next';
import { siteConfig } from '../config/site.ts';

export default function robots(): MetadataRoute.Robots {
  const isStaging =
    process.env.APP_ENV === 'staging' ||
    process.env.NEXT_PUBLIC_APP_ENV === 'staging';

  if (isStaging) {
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
