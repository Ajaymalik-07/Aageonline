/**
 * AageOnline — Dynamic Taxonomy, Location & Market Types
 * Authoritative types for Country, State, City, Category, Market lifecycle,
 * Discovery requests, and Admin audit logging.
 */

export type EntityStatus = 'ACTIVE' | 'INACTIVE';

export interface Country {
  id: string;
  name: string;
  slug: string;
  code: string; // ISO 3166-1 alpha-2, e.g. "IN"
  status: EntityStatus;
  createdAt: string;
  updatedAt: string;
}

export interface StateRegion {
  id: string;
  countryId: string;
  name: string;
  slug: string;
  code: string; // State code, e.g. "RJ", "DL", "MH", "HR"
  status: EntityStatus;
  createdAt: string;
  updatedAt: string;
}

export interface City {
  id: string;
  countryId: string;
  stateId: string;
  name: string;
  slug: string;
  postalCodes?: string[];
  aliases?: string[];
  status: EntityStatus;
  createdAt: string;
  updatedAt: string;
}

export interface CategoryHierarchy {
  id: string;
  name: string;
  slug: string;
  description?: string;
  status: EntityStatus;
  parentId?: string;
  aliases?: string[];
  createdAt: string;
  updatedAt: string;
}

export type MarketLifecycleStatus =
  | 'DISCOVERED'
  | 'DRAFT'
  | 'REVIEW'
  | 'PUBLISHED'
  | 'ARCHIVED';

export type MarketPublicationStatus =
  | 'DISCOVERED'
  | 'DRAFT'
  | 'REVIEW'
  | 'PUBLISHED'
  | 'ARCHIVED';

export type MarketIndexabilityStatus = 'NOINDEX' | 'INDEXABLE';

export type MarketContentStatus =
  | 'MISSING'
  | 'DRAFT'
  | 'READY'
  | 'REVIEW'
  | 'APPROVED';

export interface MarketEntity {
  id: string;
  cityId: string;
  categoryId: string;
  slug: string; // e.g. "jaipur/interior-designers"
  status: MarketLifecycleStatus;
  publicationStatus: MarketPublicationStatus;
  indexabilityStatus: MarketIndexabilityStatus;
  contentStatus: MarketContentStatus;
  totalBusinesses: number;
  activePositions: number;
  topQualifyingAmountMinor: number;
  createdAt: string;
  updatedAt: string;
  publishedAt?: string;
}

export type DiscoveryRequestType = 'CATEGORY' | 'STATE' | 'CITY' | 'MARKET' | 'BUSINESS';

export type DiscoveryStatus =
  | 'NEEDS_REVIEW'
  | 'APPROVED'
  | 'REJECTED'
  | 'MAPPED'
  | 'IGNORED';

export interface DiscoveryRequest {
  id: string;
  requestType: DiscoveryRequestType;
  rawInput: string;
  normalizedValue: string;
  countryId?: string;
  stateId?: string;
  cityId?: string;
  categoryId?: string;
  marketId?: string;
  requestCount: number;
  firstRequestedAt: string;
  lastRequestedAt: string;
  status: DiscoveryStatus;
  mappedEntityId?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export type AuditAction =
  | 'CATEGORY_CREATED'
  | 'CATEGORY_MAPPED'
  | 'CATEGORY_EDITED'
  | 'CATEGORY_ARCHIVED'
  | 'STATE_CREATED'
  | 'CITY_CREATED'
  | 'CITY_CORRECTED'
  | 'CITY_ARCHIVED'
  | 'MARKET_CREATED'
  | 'MARKET_PUBLISHED'
  | 'MARKET_ARCHIVED'
  | 'INDEXABILITY_CHANGED'
  | 'DISCOVERY_REVIEWED'
  | 'DISCOVERY_REJECTED'
  | 'DISCOVERY_MAPPED';

export interface AuditLogEntry {
  id: string;
  actor: string;
  action: AuditAction;
  entityType: 'COUNTRY' | 'STATE' | 'CITY' | 'CATEGORY' | 'MARKET' | 'DISCOVERY';
  entityId: string;
  previousState?: Record<string, unknown> | null;
  newState?: Record<string, unknown> | null;
  timestamp: string;
  reason?: string;
  metadata?: Record<string, unknown>;
}

export interface MarketResolutionResult {
  found: boolean;
  market?: MarketEntity;
  city?: City;
  state?: StateRegion;
  country?: Country;
  category?: CategoryHierarchy;
  isPublished: boolean;
  isIndexable: boolean;
  contentReady: boolean;
  discoveryCreated?: boolean;
  reason?: string;
}
