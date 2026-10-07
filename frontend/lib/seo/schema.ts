import { siteConfig } from '../../config/site.ts';
import type { BreadcrumbItem } from '../../types/seo';
import type { Market, RankingEntry } from '../../types/market';

/**
 * Generates Organization / WebSite JSON-LD Schema.
 */
export function generateWebsiteSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: siteConfig.name,
    alternateName: siteConfig.tagline,
    url: siteConfig.url,
    description: siteConfig.description,
    potentialAction: {
      '@type': 'SearchAction',
      target: `${siteConfig.url}/explore?q={search_term_string}`,
      'query-input': 'required name=search_term_string',
    },
  };
}

/**
 * Generates BreadcrumbList Schema.
 */
export function generateBreadcrumbSchema(items: BreadcrumbItem[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.label,
      item: item.url.startsWith('http') ? item.url : `${siteConfig.url}${item.url}`,
    })),
  };
}

/**
 * Generates Market Ranking Page ItemList Schema with transparent Paid Visibility disclosure.
 */
export function generateMarketRankingSchema(market: Market, rankings: RankingEntry[]) {
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
        url: `${siteConfig.url}/${market.slug}/${entry.businessSlug}`,
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
