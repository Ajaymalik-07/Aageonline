import type { Market, MilestoneTier } from '../types/market';

export const MILESTONE_LADDER: { threshold: number; tier: MilestoneTier }[] = [
  { threshold: 1, tier: 'TOP_1' },
  { threshold: 5, tier: 'TOP_5' },
  { threshold: 10, tier: 'TOP_10' },
  { threshold: 20, tier: 'TOP_20' },
  { threshold: 30, tier: 'TOP_30' },
  { threshold: 50, tier: 'TOP_50' },
  { threshold: 75, tier: 'TOP_75' },
  { threshold: 100, tier: 'TOP_100' },
];

export const INITIAL_FEATURED_MARKETS: Market[] = [
  {
    id: 'mkt-jaipur-interior-designers',
    slug: 'jaipur/interior-designers',
    location: {
      id: 'loc-jaipur',
      name: 'Jaipur',
      slug: 'jaipur',
      state: 'Rajasthan',
      stateSlug: 'rajasthan',
      country: 'India',
    },
    category: {
      id: 'cat-interior-designers',
      name: 'Interior Designers',
      slug: 'interior-designers',
      description: 'Residential, commercial, and modular interior designing specialists.',
    },
    totalBusinesses: 48,
    activePositions: 24,
    topQualifyingAmountMinor: 2600000, // ₹26,000
    updatedAt: new Date().toISOString(),
    status: 'ACTIVE',
  },
  {
    id: 'mkt-noida-restaurants',
    slug: 'noida/restaurants',
    location: {
      id: 'loc-noida',
      name: 'Noida',
      slug: 'noida',
      state: 'Uttar Pradesh',
      stateSlug: 'uttar-pradesh',
      country: 'India',
    },
    category: {
      id: 'cat-restaurants',
      name: 'Restaurants & Dining',
      slug: 'restaurants',
      description: 'Fine dining, cafes, and family restaurants.',
    },
    totalBusinesses: 72,
    activePositions: 35,
    topQualifyingAmountMinor: 3200000, // ₹32,000
    updatedAt: new Date().toISOString(),
    status: 'ACTIVE',
  },
  {
    id: 'mkt-hisar-hospitals',
    slug: 'hisar/hospitals',
    location: {
      id: 'loc-hisar',
      name: 'Hisar',
      slug: 'hisar',
      state: 'Haryana',
      stateSlug: 'haryana',
      country: 'India',
    },
    category: {
      id: 'cat-hospitals',
      name: 'Hospitals & Healthcare',
      slug: 'hospitals',
      description: 'Multi-speciality medical centers and clinics.',
    },
    totalBusinesses: 29,
    activePositions: 15,
    topQualifyingAmountMinor: 1850000, // ₹18,500
    updatedAt: new Date().toISOString(),
    status: 'ACTIVE',
  },
  {
    id: 'mkt-delhi-digital-marketing',
    slug: 'delhi/digital-marketing-agencies',
    location: {
      id: 'loc-delhi',
      name: 'Delhi',
      slug: 'delhi',
      state: 'Delhi NCR',
      stateSlug: 'delhi-ncr',
      country: 'India',
    },
    category: {
      id: 'cat-digital-marketing',
      name: 'Digital Marketing Agencies',
      slug: 'digital-marketing-agencies',
      description: 'SEO, performance marketing, and branding firms.',
    },
    totalBusinesses: 94,
    activePositions: 50,
    topQualifyingAmountMinor: 4500000, // ₹45,000
    updatedAt: new Date().toISOString(),
    status: 'ACTIVE',
  },
];
