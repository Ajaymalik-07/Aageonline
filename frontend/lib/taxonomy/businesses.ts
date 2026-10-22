/**
 * AageOnline — Business Registry & Market Participation Store
 * Authoritative registry for Business entities, multi-category relationships,
 * multi-location service areas, and Market Participation states.
 *
 * Enforces composite uniqueness on (businessId, marketId).
 */

import type {
  BusinessEntity,
  BusinessCategoryRelation,
  BusinessLocationRelation,
  MarketParticipation,
} from '../../types/business';

// ---------------------------------------------------------------------------
// In-Memory Canonical Stores
// ---------------------------------------------------------------------------

const BUSINESSES_STORE: Map<string, BusinessEntity> = new Map();
const BUSINESS_CATEGORIES_STORE: Map<string, BusinessCategoryRelation[]> = new Map();
const BUSINESS_LOCATIONS_STORE: Map<string, BusinessLocationRelation[]> = new Map();
const MARKET_PARTICIPATIONS_STORE: Map<string, MarketParticipation> = new Map();

// ---------------------------------------------------------------------------
// Seed Data Initialization
// ---------------------------------------------------------------------------

function seedCanonicalBusinesses(): void {
  BUSINESSES_STORE.clear();
  BUSINESS_CATEGORIES_STORE.clear();
  BUSINESS_LOCATIONS_STORE.clear();
  MARKET_PARTICIPATIONS_STORE.clear();

  const now = '2026-01-01T00:00:00.000Z';

  // 1. Royal Interiors Studio (Jaipur Interior Designers - Featured)
  const royalInteriors: BusinessEntity = {
    id: 'biz-royal-interiors',
    slug: 'royal-interiors-jaipur',
    name: 'Royal Interiors Studio',
    legalName: 'Royal Interiors Architectural Solutions Pvt Ltd',
    tagline: 'Refined bespoke architectural & modular interior living spaces across Rajasthan.',
    description:
      'Royal Interiors Studio is an architectural interior design firm delivering luxury residences, modern turn-key apartments, and heritage restorations with high spatial precision.',
    website: 'https://royalinteriors.example.com',
    phone: '+91 141 278 4900',
    address: 'C-Scheme, Ashok Nagar, Jaipur, Rajasthan 302001',
    socialLinks: {
      instagram: 'https://instagram.com/royalinteriors_jaipur',
      linkedin: 'https://linkedin.com/company/royal-interiors-studio',
      facebook: 'https://facebook.com/royalinteriorsjaipur',
      whatsapp: '+919829012345',
    },
    primaryCityId: 'city-jaipur',
    primaryStateId: 'state-rajasthan',
    primaryCountryId: 'country-in',
    verificationStatus: 'VERIFIED',
    publicationStatus: 'PUBLISHED',
    createdAt: now,
    updatedAt: now,
  };
  BUSINESSES_STORE.set(royalInteriors.id, royalInteriors);
  BUSINESS_CATEGORIES_STORE.set(royalInteriors.id, [
    { businessId: royalInteriors.id, categoryId: 'cat-interior-designers', isPrimary: true },
  ]);
  BUSINESS_LOCATIONS_STORE.set(royalInteriors.id, [
    { businessId: royalInteriors.id, cityId: 'city-jaipur', isPrimary: true },
  ]);
  MARKET_PARTICIPATIONS_STORE.set(`${royalInteriors.id}:mkt-jaipur-interior-designers`, {
    id: 'mp-royal-interiors-jaipur',
    businessId: royalInteriors.id,
    marketId: 'mkt-jaipur-interior-designers',
    status: 'ACTIVE',
    eligibilityStatus: 'ELIGIBLE',
    currentPosition: 3,
    qualifyingAmountRupees: 24500,
    joinedAt: now,
    updatedAt: now,
  });

  // 2. ABC Interiors & Spacecraft Studio
  const abcInteriors: BusinessEntity = {
    id: 'biz-abc-interiors',
    slug: 'abc-interiors-jaipur',
    name: 'ABC Interiors & Spacecraft Studio',
    legalName: 'ABC Spacecraft Interior Design LLP',
    tagline: 'Luxury residential, commercial, and modular living systems.',
    description:
      'Established studio specializing in bespoke architectural interiors and modern turnkey residential projects throughout central and southern Jaipur.',
    website: 'https://abcinteriors.example.com',
    phone: '+91 141 222 1890',
    email: 'contact@abcinteriors.example.com',
    address: 'C-Scheme, Jaipur, Rajasthan 302001',
    socialLinks: {
      instagram: 'https://instagram.com/abcinteriors_jaipur',
      linkedin: 'https://linkedin.com/company/abc-interiors-jaipur',
      whatsapp: '+919829123456',
      facebook: 'https://facebook.com/abcinteriorsjaipur',
    },
    primaryCityId: 'city-jaipur',
    primaryStateId: 'state-rajasthan',
    primaryCountryId: 'country-in',
    verificationStatus: 'VERIFIED',
    publicationStatus: 'PUBLISHED',
    createdAt: now,
    updatedAt: now,
  };
  BUSINESSES_STORE.set(abcInteriors.id, abcInteriors);
  BUSINESS_CATEGORIES_STORE.set(abcInteriors.id, [
    { businessId: abcInteriors.id, categoryId: 'cat-interior-designers', isPrimary: true },
  ]);
  BUSINESS_LOCATIONS_STORE.set(abcInteriors.id, [
    { businessId: abcInteriors.id, cityId: 'city-jaipur', isPrimary: true },
  ]);
  MARKET_PARTICIPATIONS_STORE.set(`${abcInteriors.id}:mkt-jaipur-interior-designers`, {
    id: 'mp-abc-interiors-jaipur',
    businessId: abcInteriors.id,
    marketId: 'mkt-jaipur-interior-designers',
    status: 'ACTIVE',
    eligibilityStatus: 'ELIGIBLE',
    currentPosition: 1,
    qualifyingAmountRupees: 28500,
    joinedAt: now,
    updatedAt: now,
  });

  // 3. Studio XYZ Architectural Living
  const studioXyz: BusinessEntity = {
    id: 'biz-studio-xyz',
    slug: 'studio-xyz-jaipur',
    name: 'Studio XYZ Architectural Living',
    legalName: 'Studio XYZ Living Pvt Ltd',
    tagline: 'Modern spatial layouts, modular engineering, and corporate transformations.',
    description:
      'Design and execution practice focused on clean spatial layouts, modular engineering, and ergonomic corporate workspace transformations.',
    website: 'https://studioxyz.example.com',
    address: 'Malviya Nagar, Jaipur, Rajasthan 302017',
    primaryCityId: 'city-jaipur',
    primaryStateId: 'state-rajasthan',
    primaryCountryId: 'country-in',
    verificationStatus: 'VERIFIED',
    publicationStatus: 'PUBLISHED',
    createdAt: now,
    updatedAt: now,
  };
  BUSINESSES_STORE.set(studioXyz.id, studioXyz);
  BUSINESS_CATEGORIES_STORE.set(studioXyz.id, [
    { businessId: studioXyz.id, categoryId: 'cat-interior-designers', isPrimary: true },
  ]);
  BUSINESS_LOCATIONS_STORE.set(studioXyz.id, [
    { businessId: studioXyz.id, cityId: 'city-jaipur', isPrimary: true },
  ]);
  MARKET_PARTICIPATIONS_STORE.set(`${studioXyz.id}:mkt-jaipur-interior-designers`, {
    id: 'mp-studio-xyz-jaipur',
    businessId: studioXyz.id,
    marketId: 'mkt-jaipur-interior-designers',
    status: 'ACTIVE',
    eligibilityStatus: 'ELIGIBLE',
    currentPosition: 2,
    qualifyingAmountRupees: 27000,
    joinedAt: now,
    updatedAt: now,
  });

  // 4. Heritage Haveli Fine Dining (Delhi Restaurants)
  const heritageHaveli: BusinessEntity = {
    id: 'biz-heritage-haveli',
    slug: 'heritage-haveli-delhi',
    name: 'Heritage Haveli Fine Dining',
    legalName: 'Heritage Haveli Hospitality Pvt Ltd',
    tagline: 'Traditional North Indian and Mughlai culinary experiences in Central Delhi.',
    description:
      'Flagship fine dining restaurant known for authentic heritage recipes, artisanal tandoor grills, and banquet hospitality in Connaught Place.',
    website: 'https://heritagehaveli.example.com',
    address: 'Connaught Place, New Delhi, Delhi 110001',
    primaryCityId: 'city-delhi',
    primaryStateId: 'state-delhi',
    primaryCountryId: 'country-in',
    verificationStatus: 'VERIFIED',
    publicationStatus: 'PUBLISHED',
    createdAt: now,
    updatedAt: now,
  };
  BUSINESSES_STORE.set(heritageHaveli.id, heritageHaveli);
  BUSINESS_CATEGORIES_STORE.set(heritageHaveli.id, [
    { businessId: heritageHaveli.id, categoryId: 'cat-restaurants', isPrimary: true },
  ]);
  BUSINESS_LOCATIONS_STORE.set(heritageHaveli.id, [
    { businessId: heritageHaveli.id, cityId: 'city-delhi', isPrimary: true },
  ]);
  MARKET_PARTICIPATIONS_STORE.set(`${heritageHaveli.id}:mkt-delhi-restaurants`, {
    id: 'mp-heritage-haveli-delhi',
    businessId: heritageHaveli.id,
    marketId: 'mkt-delhi-restaurants',
    status: 'ACTIVE',
    eligibilityStatus: 'ELIGIBLE',
    currentPosition: 1,
    qualifyingAmountRupees: 38500,
    joinedAt: now,
    updatedAt: now,
  });

  // 5. Coastal Spice Dining Group (Mumbai Restaurants)
  const coastalSpice: BusinessEntity = {
    id: 'biz-coastal-spice',
    slug: 'coastal-spice-mumbai',
    name: 'Coastal Spice Dining Group',
    legalName: 'Coastal Spice Hospitality Mumbai LLP',
    tagline: 'Contemporary coastal seafood and gourmet dining across South Mumbai.',
    description:
      'Celebrated dining destination pairing coastal seafood traditions with modern culinary gastronomy in Colaba and Bandra.',
    website: 'https://coastalspice.example.com',
    address: 'Colaba, Mumbai, Maharashtra 400005',
    primaryCityId: 'city-mumbai',
    primaryStateId: 'state-maharashtra',
    primaryCountryId: 'country-in',
    verificationStatus: 'VERIFIED',
    publicationStatus: 'PUBLISHED',
    createdAt: now,
    updatedAt: now,
  };
  BUSINESSES_STORE.set(coastalSpice.id, coastalSpice);
  BUSINESS_CATEGORIES_STORE.set(coastalSpice.id, [
    { businessId: coastalSpice.id, categoryId: 'cat-restaurants', isPrimary: true },
  ]);
  BUSINESS_LOCATIONS_STORE.set(coastalSpice.id, [
    { businessId: coastalSpice.id, cityId: 'city-mumbai', isPrimary: true },
  ]);
  MARKET_PARTICIPATIONS_STORE.set(`${coastalSpice.id}:mkt-mumbai-restaurants`, {
    id: 'mp-coastal-spice-mumbai',
    businessId: coastalSpice.id,
    marketId: 'mkt-mumbai-restaurants',
    status: 'ACTIVE',
    eligibilityStatus: 'ELIGIBLE',
    currentPosition: 1,
    qualifyingAmountRupees: 46000,
    joinedAt: now,
    updatedAt: now,
  });

  // 6. Artisanal Decor & Living (Jaipur - Unverified, PUBLISHED, NO market participation)
  const artisanalDecor: BusinessEntity = {
    id: 'biz-artisanal-decor',
    slug: 'artisanal-decor-jaipur',
    name: 'Artisanal Decor & Living',
    tagline: 'Handcrafted homewares and interior accents.',
    description:
      'Boutique decor firm producing artisanal brassware, bespoke lighting fixtures, and custom soft furnishings.',
    primaryCityId: 'city-jaipur',
    primaryStateId: 'state-rajasthan',
    primaryCountryId: 'country-in',
    verificationStatus: 'UNVERIFIED',
    publicationStatus: 'PUBLISHED',
    createdAt: now,
    updatedAt: now,
  };
  BUSINESSES_STORE.set(artisanalDecor.id, artisanalDecor);
  BUSINESS_CATEGORIES_STORE.set(artisanalDecor.id, [
    { businessId: artisanalDecor.id, categoryId: 'cat-interior-designers', isPrimary: true },
  ]);
  BUSINESS_LOCATIONS_STORE.set(artisanalDecor.id, [
    { businessId: artisanalDecor.id, cityId: 'city-jaipur', isPrimary: true },
  ]);
  // Intentionally NO market participation

  // 7. Draft Design Agency (DRAFT status - must be excluded from public queries)
  const draftAgency: BusinessEntity = {
    id: 'biz-draft-agency',
    slug: 'draft-design-agency',
    name: 'Draft Design Agency',
    description: 'Unpublished agency under initial onboarding.',
    verificationStatus: 'PENDING',
    publicationStatus: 'DRAFT',
    createdAt: now,
    updatedAt: now,
  };
  BUSINESSES_STORE.set(draftAgency.id, draftAgency);
}

// Seed upon module load
seedCanonicalBusinesses();

// ---------------------------------------------------------------------------
// Store Query & Mutation Functions
// ---------------------------------------------------------------------------

export function getAllBusinesses(): BusinessEntity[] {
  return Array.from(BUSINESSES_STORE.values());
}

export function getBusinessById(id: string): BusinessEntity | undefined {
  return BUSINESSES_STORE.get(id);
}

export function getBusinessBySlug(slug: string): BusinessEntity | undefined {
  const norm = slug.trim().toLowerCase();
  for (const b of BUSINESSES_STORE.values()) {
    if (b.slug.toLowerCase() === norm) {
      return b;
    }
  }
  return undefined;
}

export function createBusiness(entity: BusinessEntity): BusinessEntity {
  if (BUSINESSES_STORE.has(entity.id)) {
    throw new Error(`Business with ID "${entity.id}" already exists.`);
  }
  const existingSlug = getBusinessBySlug(entity.slug);
  if (existingSlug) {
    throw new Error(`Business with slug "${entity.slug}" already exists.`);
  }
  BUSINESSES_STORE.set(entity.id, entity);
  return entity;
}

export function registerBusinessInStore(entity: BusinessEntity): BusinessEntity {
  BUSINESSES_STORE.set(entity.id, entity);
  return entity;
}

export function addBusinessCategory(relation: BusinessCategoryRelation): void {
  const existing = BUSINESS_CATEGORIES_STORE.get(relation.businessId) || [];
  if (!existing.some((r) => r.categoryId === relation.categoryId)) {
    existing.push(relation);
    BUSINESS_CATEGORIES_STORE.set(relation.businessId, existing);
  }
}

export function getBusinessCategories(businessId: string): BusinessCategoryRelation[] {
  return BUSINESS_CATEGORIES_STORE.get(businessId) || [];
}

export function addBusinessLocation(relation: BusinessLocationRelation): void {
  const existing = BUSINESS_LOCATIONS_STORE.get(relation.businessId) || [];
  if (!existing.some((r) => r.cityId === relation.cityId)) {
    existing.push(relation);
    BUSINESS_LOCATIONS_STORE.set(relation.businessId, existing);
  }
}

export function getBusinessLocations(businessId: string): BusinessLocationRelation[] {
  return BUSINESS_LOCATIONS_STORE.get(businessId) || [];
}

export function addMarketParticipation(participation: MarketParticipation): MarketParticipation {
  const compositeKey = `${participation.businessId}:${participation.marketId}`;
  if (MARKET_PARTICIPATIONS_STORE.has(compositeKey)) {
    throw new Error(
      `Market participation already exists for business "${participation.businessId}" in market "${participation.marketId}".`
    );
  }
  MARKET_PARTICIPATIONS_STORE.set(compositeKey, { ...participation });
  return participation;
}

export function updateMarketParticipation(participation: MarketParticipation): MarketParticipation {
  const compositeKey = `${participation.businessId}:${participation.marketId}`;
  MARKET_PARTICIPATIONS_STORE.set(compositeKey, { ...participation });
  return participation;
}

export function getMarketParticipation(businessId: string, marketId: string): MarketParticipation | undefined {
  const compositeKey = `${businessId}:${marketId}`;
  const p = MARKET_PARTICIPATIONS_STORE.get(compositeKey);
  return p ? { ...p } : undefined;
}

export function getMarketParticipationsByBusiness(businessId: string): MarketParticipation[] {
  return Array.from(MARKET_PARTICIPATIONS_STORE.values())
    .filter((p) => p.businessId === businessId)
    .map((p) => ({ ...p }));
}

export function getMarketParticipationsByMarket(marketId: string): MarketParticipation[] {
  return Array.from(MARKET_PARTICIPATIONS_STORE.values())
    .filter((p) => p.marketId === marketId)
    .map((p) => ({ ...p }));
}

export function cloneMarketParticipationsStore(): Map<string, MarketParticipation> {
  const clone = new Map<string, MarketParticipation>();
  for (const [key, val] of MARKET_PARTICIPATIONS_STORE.entries()) {
    clone.set(key, { ...val });
  }
  return clone;
}

export function restoreMarketParticipationsStore(snapshot: Map<string, MarketParticipation>): void {
  MARKET_PARTICIPATIONS_STORE.clear();
  for (const [key, val] of snapshot.entries()) {
    MARKET_PARTICIPATIONS_STORE.set(key, { ...val });
  }
}

export function resetBusinessStoreForTesting(): void {
  seedCanonicalBusinesses();
}
