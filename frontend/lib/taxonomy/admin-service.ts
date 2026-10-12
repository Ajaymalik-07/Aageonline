/**
 * AageOnline — Administrative Taxonomy & Discovery Governance Service
 * Enforces role-based authorization, validates mutation integrity,
 * updates entity lifecycles, and logs all actions to the audit trail.
 */

import type {
  CategoryHierarchy,
  City,
  StateRegion,
  MarketEntity,
  DiscoveryRequest,
  MarketPublicationStatus,
  MarketIndexabilityStatus,
} from '../../types/taxonomy';
import {
  createCategory,
  updateCategory,
  getCategoryById,
} from './categories.ts';
import {
  createCity,
  updateCity,
  createState,
  getCityById,
  getStateById,
  getCountryById,
} from './locations.ts';
import {
  createMarket,
  updateMarket,
  getMarketById,
  getAllMarkets,
} from './markets.ts';
import {
  getAllDiscoveryRequests,
  getDiscoveryRequestsByType,
  getDiscoveryRequestById,
  updateDiscoveryStatus,
} from './discovery.ts';
import { invalidateSitemapCache } from '../seo/sitemap-service.ts';
import { triggerMarketRankingInvalidation } from '../cache/invalidation.ts';
import { recordAuditLog } from './audit.ts';
import { generateSlug } from './normalization.ts';

export interface AdminActor {
  id: string;
  name: string;
  role: 'SUPERADMIN' | 'TAXONOMY_ADMIN' | 'CONTENT_EDITOR' | 'USER';
}

/**
 * Enforce strict server-side authorization check.
 */
export function assertAdminAuthorized(actor: AdminActor): void {
  if (actor.role !== 'SUPERADMIN' && actor.role !== 'TAXONOMY_ADMIN') {
    throw new Error(
      `Unauthorized: Actor "${actor.name}" (${actor.role}) does not have administrative permissions.`
    );
  }
}

// -------------------------------------------------------------
// CATEGORY ACTIONS
// -------------------------------------------------------------

export function adminCreateCategory(
  actor: AdminActor,
  data: {
    name: string;
    slug?: string;
    description?: string;
    parentId?: string;
    aliases?: string[];
  },
  discoveryRequestId?: string
): CategoryHierarchy {
  assertAdminAuthorized(actor);

  const slug = data.slug || generateSlug(data.name);
  const id = `cat-${slug}`;

  const category = createCategory({
    id,
    name: data.name,
    slug,
    description: data.description,
    status: 'ACTIVE',
    parentId: data.parentId,
    aliases: data.aliases || [data.name.toLowerCase()],
  });

  recordAuditLog({
    actor: actor.name,
    action: 'CATEGORY_CREATED',
    entityType: 'CATEGORY',
    entityId: category.id,
    newState: { ...category } as unknown as Record<string, unknown>,
    reason: discoveryRequestId ? `Created from discovery request ${discoveryRequestId}` : 'Admin manual creation',
  });

  if (discoveryRequestId) {
    updateDiscoveryStatus(discoveryRequestId, 'APPROVED', {
      mappedEntityId: category.id,
      notes: `Created category ${category.name}`,
    });
  }

  return category;
}

export function adminMapCategoryDiscovery(
  actor: AdminActor,
  discoveryRequestId: string,
  targetCategoryId: string
): DiscoveryRequest {
  assertAdminAuthorized(actor);

  const category = getCategoryById(targetCategoryId);
  if (!category) {
    throw new Error(`Target category "${targetCategoryId}" does not exist.`);
  }

  const updatedReq = updateDiscoveryStatus(discoveryRequestId, 'MAPPED', {
    mappedEntityId: category.id,
    notes: `Mapped to existing category ${category.name}`,
  });

  // Add alias to target category
  if (!category.aliases?.includes(updatedReq.normalizedValue)) {
    updateCategory(category.id, {
      aliases: [...(category.aliases || []), updatedReq.normalizedValue],
    });
  }

  recordAuditLog({
    actor: actor.name,
    action: 'CATEGORY_MAPPED',
    entityType: 'DISCOVERY',
    entityId: discoveryRequestId,
    newState: { status: 'MAPPED', mappedEntityId: category.id },
    reason: `Mapped alias "${updatedReq.normalizedValue}" to ${category.name}`,
  });

  return updatedReq;
}

// -------------------------------------------------------------
// LOCATION ACTIONS
// -------------------------------------------------------------

export function adminCreateState(
  actor: AdminActor,
  data: { countryId: string; name: string; slug?: string; code: string }
): StateRegion {
  assertAdminAuthorized(actor);

  const slug = data.slug || generateSlug(data.name);
  const id = `state-${slug}`;

  const state = createState({
    id,
    countryId: data.countryId,
    name: data.name,
    slug,
    code: data.code,
    status: 'ACTIVE',
  });

  recordAuditLog({
    actor: actor.name,
    action: 'STATE_CREATED',
    entityType: 'STATE',
    entityId: state.id,
    newState: { ...state } as unknown as Record<string, unknown>,
  });

  return state;
}

export function adminCreateCity(
  actor: AdminActor,
  data: {
    countryId: string;
    stateId: string;
    name: string;
    slug?: string;
    postalCodes?: string[];
    aliases?: string[];
  },
  discoveryRequestId?: string
): City {
  assertAdminAuthorized(actor);

  const slug = data.slug || generateSlug(data.name);
  const id = `city-${slug}`;

  const city = createCity({
    id,
    countryId: data.countryId,
    stateId: data.stateId,
    name: data.name,
    slug,
    postalCodes: data.postalCodes,
    aliases: data.aliases || [data.name.toLowerCase()],
    status: 'ACTIVE',
  });

  recordAuditLog({
    actor: actor.name,
    action: 'CITY_CREATED',
    entityType: 'CITY',
    entityId: city.id,
    newState: { ...city } as unknown as Record<string, unknown>,
    reason: discoveryRequestId ? `Created from discovery request ${discoveryRequestId}` : 'Admin manual creation',
  });

  if (discoveryRequestId) {
    updateDiscoveryStatus(discoveryRequestId, 'APPROVED', {
      mappedEntityId: city.id,
      notes: `Created canonical city ${city.name}`,
    });
  }

  return city;
}

export function adminCorrectCityDiscovery(
  actor: AdminActor,
  discoveryRequestId: string,
  canonicalCityId: string
): DiscoveryRequest {
  assertAdminAuthorized(actor);

  const city = getCityById(canonicalCityId);
  if (!city) {
    throw new Error(`Canonical city "${canonicalCityId}" does not exist.`);
  }

  const updatedReq = updateDiscoveryStatus(discoveryRequestId, 'MAPPED', {
    mappedEntityId: city.id,
    notes: `Corrected and mapped to canonical city ${city.name}`,
  });

  // Add alias to city
  if (!city.aliases?.includes(updatedReq.normalizedValue)) {
    updateCity(city.id, {
      aliases: [...(city.aliases || []), updatedReq.normalizedValue],
    });
  }

  recordAuditLog({
    actor: actor.name,
    action: 'CITY_CORRECTED',
    entityType: 'DISCOVERY',
    entityId: discoveryRequestId,
    newState: { status: 'MAPPED', mappedEntityId: city.id },
    reason: `Corrected raw input "${updatedReq.rawInput}" to ${city.name}`,
  });

  return updatedReq;
}

// -------------------------------------------------------------
// MARKET ACTIONS & LIFECYCLE
// -------------------------------------------------------------

export function adminCreateMarket(
  actor: AdminActor,
  data: {
    cityId: string;
    categoryId: string;
    publicationStatus?: MarketPublicationStatus;
    indexabilityStatus?: MarketIndexabilityStatus;
  }
): MarketEntity {
  assertAdminAuthorized(actor);

  const city = getCityById(data.cityId);
  if (!city) throw new Error(`City "${data.cityId}" does not exist.`);

  const category = getCategoryById(data.categoryId);
  if (!category) throw new Error(`Category "${data.categoryId}" does not exist.`);

  const id = `mkt-${city.slug}-${category.slug}`;

  const market = createMarket({
    id,
    cityId: data.cityId,
    categoryId: data.categoryId,
    slug: `${city.slug}/${category.slug}`,
    status: data.publicationStatus === 'PUBLISHED' ? 'PUBLISHED' : 'DRAFT',
    publicationStatus: data.publicationStatus || 'DRAFT',
    indexabilityStatus: data.indexabilityStatus || 'NOINDEX',
    contentStatus: 'MISSING',
    totalBusinesses: 0,
    activePositions: 0,
    topQualifyingAmountMinor: 100000,
  });

  recordAuditLog({
    actor: actor.name,
    action: 'MARKET_CREATED',
    entityType: 'MARKET',
    entityId: market.id,
    newState: { ...market } as unknown as Record<string, unknown>,
  });

  return market;
}

export function adminPublishMarket(
  actor: AdminActor,
  marketId: string,
  options?: { indexable?: boolean }
): MarketEntity {
  assertAdminAuthorized(actor);

  const existing = getMarketById(marketId);
  if (!existing) throw new Error(`Market "${marketId}" does not exist.`);

  const updated = updateMarket(marketId, {
    status: 'PUBLISHED',
    publicationStatus: 'PUBLISHED',
    indexabilityStatus: options?.indexable ? 'INDEXABLE' : 'NOINDEX',
    contentStatus: existing.contentStatus === 'MISSING' ? 'READY' : existing.contentStatus,
  });

  recordAuditLog({
    actor: actor.name,
    action: 'MARKET_PUBLISHED',
    entityType: 'MARKET',
    entityId: marketId,
    previousState: { publicationStatus: existing.publicationStatus, indexabilityStatus: existing.indexabilityStatus },
    newState: { publicationStatus: updated.publicationStatus, indexabilityStatus: updated.indexabilityStatus },
    reason: `Published by ${actor.name} with indexability=${updated.indexabilityStatus}`,
  });

  // Revalidate caches and sitemap
  invalidateSitemapCache();
  triggerMarketRankingInvalidation({
    marketId,
    actorUserId: actor.id,
    triggerCause: 'ADMIN_MARKET_PUBLISHED',
  }).catch(() => {});

  return updated;
}

export function adminSetMarketIndexability(
  actor: AdminActor,
  marketId: string,
  indexable: boolean
): MarketEntity {
  assertAdminAuthorized(actor);

  const existing = getMarketById(marketId);
  if (!existing) throw new Error(`Market "${marketId}" does not exist.`);

  const updated = updateMarket(marketId, {
    indexabilityStatus: indexable ? 'INDEXABLE' : 'NOINDEX',
  });

  recordAuditLog({
    actor: actor.name,
    action: 'INDEXABILITY_CHANGED',
    entityType: 'MARKET',
    entityId: marketId,
    previousState: { indexabilityStatus: existing.indexabilityStatus },
    newState: { indexabilityStatus: updated.indexabilityStatus },
    reason: `Indexability updated to ${updated.indexabilityStatus}`,
  });

  // Invalidate sitemap cache on indexability changes
  invalidateSitemapCache();

  return updated;
}

export function adminArchiveMarket(
  actor: AdminActor,
  marketId: string,
  reason?: string
): MarketEntity {
  assertAdminAuthorized(actor);

  const existing = getMarketById(marketId);
  if (!existing) throw new Error(`Market "${marketId}" does not exist.`);

  const updated = updateMarket(marketId, {
    status: 'ARCHIVED',
    publicationStatus: 'ARCHIVED',
    indexabilityStatus: 'NOINDEX',
  });

  recordAuditLog({
    actor: actor.name,
    action: 'MARKET_ARCHIVED',
    entityType: 'MARKET',
    entityId: marketId,
    previousState: { status: existing.status, publicationStatus: existing.publicationStatus },
    newState: { status: 'ARCHIVED', publicationStatus: 'ARCHIVED' },
    reason,
  });

  // Revalidate caches and sitemap
  invalidateSitemapCache();
  triggerMarketRankingInvalidation({
    marketId,
    actorUserId: actor.id,
    triggerCause: 'ADMIN_MARKET_ARCHIVED',
  }).catch(() => {});

  return updated;
}

export function adminRejectDiscovery(
  actor: AdminActor,
  discoveryRequestId: string,
  reason: string
): DiscoveryRequest {
  assertAdminAuthorized(actor);

  const updated = updateDiscoveryStatus(discoveryRequestId, 'REJECTED', { notes: reason });

  recordAuditLog({
    actor: actor.name,
    action: 'DISCOVERY_REJECTED',
    entityType: 'DISCOVERY',
    entityId: discoveryRequestId,
    newState: { status: 'REJECTED' },
    reason,
  });

  return updated;
}

// -------------------------------------------------------------
// ADMIN DASHBOARD AGGREGATES
// -------------------------------------------------------------

export function getAdminDiscoveryQueues() {
  const allRequests = getAllDiscoveryRequests();
  const allMarkets = getAllMarkets();

  return {
    categoriesQueue: allRequests.filter((r) => r.requestType === 'CATEGORY'),
    citiesQueue: allRequests.filter((r) => r.requestType === 'CITY'),
    statesQueue: allRequests.filter((r) => r.requestType === 'STATE'),
    marketsQueue: allRequests.filter((r) => r.requestType === 'MARKET'),
    draftMarkets: allMarkets.filter((m) => m.publicationStatus === 'DRAFT' || m.publicationStatus === 'DISCOVERED'),
    publishedMarkets: allMarkets.filter((m) => m.publicationStatus === 'PUBLISHED'),
    archivedMarkets: allMarkets.filter((m) => m.publicationStatus === 'ARCHIVED'),
  };
}
