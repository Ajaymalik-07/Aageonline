import type { MarketPageData } from '../../types/market';
import { resolveMarket } from '../../lib/taxonomy/resolver.ts';
import {
  JAIPUR_INTERIOR_DESIGNERS_MARKET,
  JAIPUR_INTERIOR_DESIGNERS_RANKINGS,
  RELATED_JAIPUR_MARKETS,
  RELATED_CATEGORIES,
} from './jaipur-interior-designers.ts';
import { JAIPUR_EDITORIAL_CONTENT } from './jaipur-interior-designers-content.ts';

import {
  DELHI_INTERIOR_DESIGNERS_MARKET,
  DELHI_INTERIOR_DESIGNERS_RANKINGS,
  RELATED_DELHI_MARKETS,
  RELATED_DELHI_CATEGORIES,
} from './delhi-interior-designers.ts';
import { DELHI_EDITORIAL_CONTENT } from './delhi-interior-designers-content.ts';

import {
  MUMBAI_INTERIOR_DESIGNERS_MARKET,
  MUMBAI_INTERIOR_DESIGNERS_RANKINGS,
  RELATED_MUMBAI_MARKETS,
  RELATED_MUMBAI_CATEGORIES,
} from './mumbai-interior-designers.ts';
import { MUMBAI_EDITORIAL_CONTENT } from './mumbai-interior-designers-content.ts';

import {
  JAIPUR_RESTAURANTS_MARKET,
  JAIPUR_RESTAURANTS_RANKINGS,
  RELATED_JAIPUR_RESTAURANT_MARKETS,
  RELATED_JAIPUR_RESTAURANT_CATEGORIES,
} from './jaipur-restaurants.ts';
import { JAIPUR_RESTAURANTS_CONTENT } from './jaipur-restaurants-content.ts';

import {
  DELHI_RESTAURANTS_MARKET,
  DELHI_RESTAURANTS_RANKINGS,
  RELATED_DELHI_RESTAURANT_MARKETS,
  RELATED_DELHI_RESTAURANT_CATEGORIES,
} from './delhi-restaurants.ts';
import { DELHI_RESTAURANTS_CONTENT } from './delhi-restaurants-content.ts';

import {
  MUMBAI_RESTAURANTS_MARKET,
  MUMBAI_RESTAURANTS_RANKINGS,
  RELATED_MUMBAI_RESTAURANT_MARKETS,
  RELATED_MUMBAI_RESTAURANT_CATEGORIES,
} from './mumbai-restaurants.ts';
import { MUMBAI_RESTAURANTS_CONTENT } from './mumbai-restaurants-content.ts';

export const SUPPORTED_MARKETS: Record<string, MarketPageData> = {
  'jaipur/interior-designers': {
    market: JAIPUR_INTERIOR_DESIGNERS_MARKET,
    rankings: JAIPUR_INTERIOR_DESIGNERS_RANKINGS,
    editorialContent: JAIPUR_EDITORIAL_CONTENT,
    relatedMarkets: RELATED_JAIPUR_MARKETS,
    relatedCategories: RELATED_CATEGORIES,
    seo: {
      title: 'Interior Designers in Jaipur — Market Rankings | AageOnline',
      description:
        'Explore interior designers in Jaipur, view paid visibility rankings, understand qualifying amounts, and learn how the AageOnline market works.',
    },
  },
  'delhi/interior-designers': {
    market: DELHI_INTERIOR_DESIGNERS_MARKET,
    rankings: DELHI_INTERIOR_DESIGNERS_RANKINGS,
    editorialContent: DELHI_EDITORIAL_CONTENT,
    relatedMarkets: RELATED_DELHI_MARKETS,
    relatedCategories: RELATED_DELHI_CATEGORIES,
    seo: {
      title: 'Interior Designers in Delhi — Market Rankings | AageOnline',
      description:
        'Explore interior designers in Delhi, view paid visibility rankings, understand qualifying amounts, and learn how the AageOnline market works.',
    },
  },
  'mumbai/interior-designers': {
    market: MUMBAI_INTERIOR_DESIGNERS_MARKET,
    rankings: MUMBAI_INTERIOR_DESIGNERS_RANKINGS,
    editorialContent: MUMBAI_EDITORIAL_CONTENT,
    relatedMarkets: RELATED_MUMBAI_MARKETS,
    relatedCategories: RELATED_MUMBAI_CATEGORIES,
    seo: {
      title: 'Interior Designers in Mumbai — Market Rankings | AageOnline',
      description:
        'Explore interior designers in Mumbai, view paid visibility rankings, understand qualifying amounts, and learn how the AageOnline market works.',
    },
  },
  'jaipur/restaurants': {
    market: JAIPUR_RESTAURANTS_MARKET,
    rankings: JAIPUR_RESTAURANTS_RANKINGS,
    editorialContent: JAIPUR_RESTAURANTS_CONTENT,
    relatedMarkets: RELATED_JAIPUR_RESTAURANT_MARKETS,
    relatedCategories: RELATED_JAIPUR_RESTAURANT_CATEGORIES,
    seo: {
      title: 'Restaurants in Jaipur — Market Rankings | AageOnline',
      description:
        'Explore restaurants in Jaipur, view paid visibility rankings, understand qualifying amounts, and learn how the AageOnline market works.',
    },
  },
  'delhi/restaurants': {
    market: DELHI_RESTAURANTS_MARKET,
    rankings: DELHI_RESTAURANTS_RANKINGS,
    editorialContent: DELHI_RESTAURANTS_CONTENT,
    relatedMarkets: RELATED_DELHI_RESTAURANT_MARKETS,
    relatedCategories: RELATED_DELHI_RESTAURANT_CATEGORIES,
    seo: {
      title: 'Restaurants in Delhi — Market Rankings | AageOnline',
      description:
        'Explore restaurants in Delhi, view paid visibility rankings, understand qualifying amounts, and learn how the AageOnline market works.',
    },
  },
  'mumbai/restaurants': {
    market: MUMBAI_RESTAURANTS_MARKET,
    rankings: MUMBAI_RESTAURANTS_RANKINGS,
    editorialContent: MUMBAI_RESTAURANTS_CONTENT,
    relatedMarkets: RELATED_MUMBAI_RESTAURANT_MARKETS,
    relatedCategories: RELATED_MUMBAI_RESTAURANT_CATEGORIES,
    seo: {
      title: 'Restaurants in Mumbai — Market Rankings | AageOnline',
      description:
        'Explore restaurants in Mumbai, view paid visibility rankings, understand qualifying amounts, and learn how the AageOnline market works.',
    },
  },
};

export function getMarketPageData(locationSlug: string, categorySlug: string): MarketPageData | null {
  const key = `${locationSlug.toLowerCase()}/${categorySlug.toLowerCase()}`;
  if (SUPPORTED_MARKETS[key]) {
    return SUPPORTED_MARKETS[key];
  }

  // Dynamic resolution for approved, published markets
  const resolution = resolveMarket(locationSlug, categorySlug, { autoDiscover: false });

  if (resolution.found && resolution.isPublished && resolution.market && resolution.city && resolution.category) {
    const { market, city, state, country, category } = resolution;
    return {
      market: {
        id: market.id,
        slug: market.slug,
        location: {
          id: city.id,
          name: city.name,
          slug: city.slug,
          state: state?.name || 'India',
          stateSlug: state?.slug || 'india',
          country: country?.name || 'India',
        },
        category: {
          id: category.id,
          name: category.name,
          slug: category.slug,
          description: category.description || `Specialized ${category.name} in ${city.name}.`,
        },
        totalBusinesses: market.totalBusinesses,
        activePositions: market.activePositions,
        topQualifyingAmountMinor: market.topQualifyingAmountMinor,
        updatedAt: market.updatedAt,
        status: 'ACTIVE',
      },
      rankings: [],
      editorialContent: [
        {
          id: 'market-overview',
          navTitle: 'Overview',
          heading: `${category.name} in ${city.name} — Market Visibility Overview`,
          subheading: 'Transparent Competitive Positioning',
          intro: `Welcome to the official ${city.name} marketplace for ${category.name.toLowerCase()}. Eligible businesses participate in transparent, paid positioning.`,
          paragraphs: [
            `AageOnline offers direct commercial clarity in ${city.name}. Businesses acquire visibility slots under strict audit rules and real-time ledger accounting.`,
          ],
        },
      ],
      relatedMarkets: [],
      relatedCategories: [],
      seo: {
        title: `${category.name} in ${city.name} — Market Rankings | AageOnline`,
        description: `Explore ${category.name.toLowerCase()} in ${city.name}, view paid visibility rankings, understand qualifying amounts, and learn how the AageOnline market works.`,
      },
    };
  }

  return null;
}

export function getAllMarketStaticParams(): { location: string; category: string }[] {
  return [
    { location: 'jaipur', category: 'interior-designers' },
    { location: 'delhi', category: 'interior-designers' },
    { location: 'mumbai', category: 'interior-designers' },
    { location: 'jaipur', category: 'restaurants' },
    { location: 'delhi', category: 'restaurants' },
    { location: 'mumbai', category: 'restaurants' },
  ];
}

