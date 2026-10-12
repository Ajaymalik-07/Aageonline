/**
 * AageOnline — Public Domain Contracts & Data-Access Types
 *
 * Defines typed public data representations decoupled from internal
 * database entities and persistence models.
 */

// ---------------------------------------------------------------------------
// Pagination & Common API Envelopes
// ---------------------------------------------------------------------------

export interface PaginationParams {
  page?: number;
  pageSize?: number;
}

export interface PaginationMeta {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: PaginationMeta;
}

// ---------------------------------------------------------------------------
// Public Market Summary Contract
// ---------------------------------------------------------------------------

export interface PublicMarketMetrics {
  totalBusinesses?: number;
  activePositions?: number;
  topQualifyingAmountMinor?: number; // In paise (e.g. 2600000 = ₹26,000)
}

export interface MarketSummary {
  id: string;
  slug: string; // e.g. "jaipur/interior-designers"
  cityId: string;
  cityName: string;
  citySlug: string;
  stateId: string;
  stateName: string;
  countryName: string;
  categoryId: string;
  categoryName: string;
  categorySlug: string;
  publicUrl: string; // e.g. "/jaipur/interior-designers"
  publicationStatus: 'PUBLISHED';
  relevantPublicMetrics: PublicMarketMetrics;
  publishedAt?: string;
}

// ---------------------------------------------------------------------------
// Public Location & Category Contracts
// ---------------------------------------------------------------------------

export interface LocationSummary {
  id: string;
  name: string;
  slug: string;
  state: string;
  stateName: string;
  stateSlug: string;
  country: string;
  countryName: string;
  countrySlug: string;
  status: 'PUBLISHED';
  marketCount: number;
  activeMarketCount: number;
  publicUrl: string;
}

export interface LocationSearchResult {
  type: 'LOCATION';
  id?: string;
  name: string;
  slug?: string;
  stateName?: string;
  countryName?: string;
  marketCount: number;
  publicUrl?: string;
  found: boolean;
  query: string;
}

export interface StateSummary {
  id: string;
  name: string;
  slug: string;
  locationCount: number;
  marketCount: number;
}

export interface CategorySummary {
  id: string;
  name: string;
  slug: string;
  description?: string;
  status: 'PUBLISHED';
  marketCount: number;
  activeMarketCount: number;
  publicUrl: string;
}

export interface CategorySearchResult {
  type: 'CATEGORY';
  id?: string;
  name: string;
  slug?: string;
  description?: string;
  marketCount: number;
  publicUrl?: string;
  found: boolean;
  query: string;
}

// ---------------------------------------------------------------------------
// Search & Filter Contracts
// ---------------------------------------------------------------------------

export type MarketSortOption =
  | 'qualifying_amount_desc'
  | 'alphabetical'
  | 'recent';

export interface MarketSearchParams extends PaginationParams {
  query?: string;
  locationSlug?: string;
  categorySlug?: string;
  sortBy?: MarketSortOption;
}

export interface MarketSearchResult {
  type: 'MARKET' | 'CITY' | 'CATEGORY';
  label: string;
  sublabel?: string;
  href?: string;
  market?: MarketSummary;
  citySlug?: string;
  categorySlug?: string;
  found: boolean;
}

// ---------------------------------------------------------------------------
// Public Business Contracts & Market Participation
// ---------------------------------------------------------------------------

export type PublicBusinessVerificationStatus = 'VERIFIED' | 'UNVERIFIED' | 'PENDING';

export interface BusinessSummary {
  id: string;
  name: string;
  slug: string;
  description: string;
  logo?: string;
  website?: string;
  verificationStatus: PublicBusinessVerificationStatus;
  publicationStatus: 'PUBLISHED';
  primaryCategory?: {
    id: string;
    name: string;
    slug: string;
  };
  primaryLocation?: {
    id: string;
    name: string;
    slug: string;
    stateName?: string;
  };
  activeMarketCount: number;
  publicUrl: string; // e.g. "/businesses/royal-interiors-jaipur"
}

export interface BusinessMarketParticipation {
  id: string;
  marketId: string;
  marketSlug: string;
  marketName: string;
  marketUrl: string;
  cityName: string;
  citySlug: string;
  categoryName: string;
  categorySlug: string;
  participationStatus: 'ACTIVE' | 'ELIGIBLE' | 'SUSPENDED' | 'REMOVED';
  currentPosition?: number | null; // Authoritative paid position in this market, or null if unranked
  qualifyingAmountRupees?: number;
}

export interface BusinessProfile extends BusinessSummary {
  legalName?: string;
  tagline?: string;
  phone?: string;
  email?: string;
  address?: string;
  categories: {
    id: string;
    name: string;
    slug: string;
    publicUrl: string;
  }[];
  locationsServed: {
    id: string;
    name: string;
    slug: string;
    stateName?: string;
    publicUrl: string;
  }[];
  marketParticipations: BusinessMarketParticipation[];
  createdAt: string;
  updatedAt: string;
}

export interface BusinessSearchParams extends PaginationParams {
  query?: string;
  categorySlug?: string;
  locationSlug?: string;
  verificationStatus?: string;
}

export interface BusinessSearchResult {
  type: 'BUSINESS';
  id?: string;
  name: string;
  slug?: string;
  description?: string;
  primaryCategory?: string;
  primaryLocation?: string;
  publicUrl?: string;
  isVerified: boolean;
  found: boolean;
  query: string;
}

// ---------------------------------------------------------------------------
// Discovery Request Contracts
// ---------------------------------------------------------------------------

export type DiscoveryType = 'CATEGORY' | 'STATE' | 'CITY' | 'MARKET' | 'BUSINESS';

export interface DiscoveryRequestInput {
  rawInput: string;
  requestType: DiscoveryType;
  cityId?: string;
  categoryId?: string;
  businessId?: string;
}

export interface DiscoveryRequestResult {
  id: string;
  requestType: DiscoveryType;
  normalizedValue: string;
  requestCount: number;
  status: string;
  success: boolean;
}

// ---------------------------------------------------------------------------
// Data Validation & Error Handling
// ---------------------------------------------------------------------------

export class DataValidationError extends Error {
  public readonly details?: Record<string, unknown>;

  constructor(
    message: string,
    details?: Record<string, unknown>
  ) {
    super(message);
    this.name = 'DataValidationError';
    this.details = details;
  }
}

export class ServiceUnavailableError extends Error {
  constructor(
    message: string = 'Market service is temporarily unavailable.'
  ) {
    super(message);
    this.name = 'ServiceUnavailableError';
  }
}
