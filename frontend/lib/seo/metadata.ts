import type { Metadata } from 'next';
import { siteConfig } from '../../config/site';

interface PageMetadataOptions {
  title: string;
  description: string;
  pathname: string;
  noIndex?: boolean;
  ogType?: 'website' | 'article';
  publishedTime?: string;
}

/**
 * Generates canonical, OpenGraph, and Twitter metadata complying with Next.js 15+ standards.
 */
export function generatePageMetadata({
  title,
  description,
  pathname,
  noIndex = false,
  ogType = 'website',
  publishedTime,
}: PageMetadataOptions): Metadata {
  const fullTitle = `${title} | ${siteConfig.name}`;
  const canonicalUrl = `${siteConfig.url}${pathname.startsWith('/') ? pathname : `/${pathname}`}`;

  return {
    title: fullTitle,
    description,
    alternates: {
      canonical: canonicalUrl,
    },
    robots: noIndex
      ? { index: false, follow: false }
      : {
          index: true,
          follow: true,
          googleBot: {
            index: true,
            follow: true,
            'max-video-preview': -1,
            'max-image-preview': 'large',
            'max-snippet': -1,
          },
        },
    openGraph: {
      title: fullTitle,
      description,
      url: canonicalUrl,
      siteName: siteConfig.name,
      locale: 'en_IN',
      type: ogType,
      images: [
        {
          url: `${siteConfig.url}/images/og-default.png`,
          width: 1200,
          height: 630,
          alt: `${siteConfig.name} - ${siteConfig.tagline}`,
        },
      ],
      ...(publishedTime && { publishedTime }),
    },
    twitter: {
      card: 'summary_large_image',
      title: fullTitle,
      description,
      images: [`${siteConfig.url}/images/og-default.png`],
    },
  };
}

/**
 * Generates market ranking page metadata with GEO/AEO optimization.
 */
export function generateMarketMetadata(cityName: string, categoryName: string, slug: string): Metadata {
  const title = `${categoryName} in ${cityName} — Visibility Ranking`;
  const description = `Explore paid competitive visibility rankings for ${categoryName.toLowerCase()} in ${cityName}. Compare verified businesses and their active positioning on AageOnline.`;

  return generatePageMetadata({
    title,
    description,
    pathname: `/${slug}`,
  });
}
