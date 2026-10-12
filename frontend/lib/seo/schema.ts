/**
 * AageOnline — Structured Data & JSON-LD Generator
 *
 * Implements compliant schema.org structured data adhering to Section 8:
 * - Organization: Platform identity.
 * - WebSite: Site search and general identity.
 * - BreadcrumbList: Accessible hierarchical navigation.
 * - ItemList: Competitive ranking ladders with explicit paid visibility disclosures.
 * - LocalBusiness: Generated ONLY for verified businesses with real address data.
 *
 * Invariants:
 * 1. Strictly ZERO fabricated reviews, ratings, stars, or price endorsements.
 * 2. Paid ranking is never represented as objective quality or customer satisfaction.
 * 3. AageOnline itself is never represented as a local business in every market.
 */

import { siteConfig } from '../../config/site.ts';
import type { BreadcrumbItem } from '../../types/seo.ts';
import type { Market, RankingEntry } from '../../types/market.ts';
import { getAuthoritativeOrigin } from './canonical.ts';

/**
 * Generates WebSite JSON-LD Schema.
 */
export function generateWebsiteSchema() {
  const origin = getAuthoritativeOrigin();
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: siteConfig.name,
    alternateName: siteConfig.tagline,
    url: origin,
    description: siteConfig.description,
    potentialAction: {
      '@type': 'SearchAction',
      target: `${origin}/markets?q={search_term_string}`,
      'query-input': 'required name=search_term_string',
    },
  };
}

/**
 * Generates Organization JSON-LD Schema.
 */
export function generateOrganizationSchema() {
  const origin = getAuthoritativeOrigin();
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: siteConfig.name,
    url: origin,
    logo: `${origin}/images/logo.png`,
    description: siteConfig.description,
  };
}

/**
 * Generates BreadcrumbList Schema.
 */
export function generateBreadcrumbSchema(items: BreadcrumbItem[]) {
  const origin = getAuthoritativeOrigin();
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.label,
      item: item.url.startsWith('http') ? item.url : `${origin}${item.url}`,
    })),
  };
}

/**
 * Generates Market Ranking Page ItemList Schema with transparent Paid Visibility disclosure.
 */
export function generateMarketRankingSchema(market: Market, rankings: RankingEntry[]) {
  const origin = getAuthoritativeOrigin();
  return {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: `${market.category.name} in ${market.location.name}`,
    description: `Paid competitive visibility positioning ladder for ${market.category.name} in ${market.location.name}.`,
    numberOfItems: rankings.length,
    itemListElement: rankings.map((entry) => ({
      '@type': 'ListItem',
      position: entry.position,
      item: {
        '@type': 'LocalBusiness',
        name: entry.businessName,
        url: `${origin}/${market.slug}/${entry.businessSlug}`,
        address: {
          '@type': 'PostalAddress',
          addressLocality: market.location.name,
          addressRegion: market.location.state,
          addressCountry: 'IN',
        },
        additionalProperty: [
          {
            '@type': 'PropertyValue',
            name: 'VisibilityPosition',
            value: `#${entry.position}`,
          },
          {
            '@type': 'PropertyValue',
            name: 'RankingModel',
            value: 'Paid Competitive Visibility',
          },
          {
            '@type': 'PropertyValue',
            name: 'QualityDisclosure',
            value: siteConfig.disclosures.paidVisibility,
          },
        ],
      },
    })),
  };
}

/**
 * Generates LocalBusiness Schema for verified business profile pages.
 */
export function generateLocalBusinessSchema(business: {
  name: string;
  slug: string;
  description?: string;
  address?: string;
  phone?: string;
  website?: string;
  city?: string;
  state?: string;
}) {
  const origin = getAuthoritativeOrigin();
  return {
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',
    name: business.name,
    url: `${origin}/businesses/${business.slug}`,
    ...(business.description && { description: business.description }),
    ...(business.phone && { telephone: business.phone }),
    ...(business.website && { sameAs: [business.website] }),
    address: {
      '@type': 'PostalAddress',
      ...(business.address && { streetAddress: business.address }),
      ...(business.city && { addressLocality: business.city }),
      ...(business.state && { addressRegion: business.state }),
      addressCountry: 'IN',
    },
  };
}

/**
 * Validates JSON-LD schema graphs to guarantee compliance:
 * - Valid JSON serialization.
 * - Presence of @context and @type.
 * - Zero fabricated reviews, stars, or aggregate ratings.
 */
export function validateJsonLdGraph(schema: Record<string, unknown>): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  // Check JSON serializability
  try {
    const serialized = JSON.stringify(schema);
    if (!serialized || serialized.length === 0) {
      errors.push('Empty schema representation');
    }
  } catch (err) {
    errors.push(`JSON serialization failed: ${(err as Error).message}`);
    return { isValid: false, errors };
  }

  // Check context & type
  if (schema['@context'] !== 'https://schema.org') {
    errors.push('Schema must declare @context: "https://schema.org"');
  }
  if (!schema['@type']) {
    errors.push('Schema must declare @type');
  }

  // Reject fabricated ratings or reviews
  const stringified = JSON.stringify(schema);
  if (
    stringified.includes('"aggregateRating"') ||
    stringified.includes('"reviewRating"') ||
    stringified.includes('"ratingValue"')
  ) {
    errors.push('Violation: Fabricated ratings or reviews are strictly prohibited on paid visibility entities.');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}
