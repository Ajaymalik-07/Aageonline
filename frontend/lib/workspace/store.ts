/**
 * AageOnline — Business Workspace Core Service
 * Server-authoritative workspace context resolution and operations.
 */

import type { BusinessEntity } from '../../types/business.ts';
import type {
  UpdateBusinessProfileInput,
  WorkspaceBusinessItem,
  WorkspaceContext,
  WorkspaceMarketItem,
  WorkspaceOverviewData,
} from '../../types/workspace.ts';
import { assertAuthorized, can, getPermissionsForRole } from '../auth/rbac.ts';
import { getUserById } from '../auth/store.ts';
import { getMembership, getMembershipsByUser } from '../memberships/store.ts';
import {
  getBusinessById,
  getMarketParticipationsByBusiness,
} from '../taxonomy/businesses.ts';
import { getMarketById } from '../taxonomy/markets.ts';
import { getCityById } from '../taxonomy/locations.ts';
import { getCategoryById } from '../taxonomy/categories.ts';
import { recordAuditEvent } from '../audit/store.ts';

export async function resolveWorkspaceContext(
  userId: string,
  targetBusinessId?: string
): Promise<WorkspaceContext> {
  const user = getUserById(userId);
  if (!user || user.status !== 'ACTIVE') {
    throw new Error('Authentication required: Active user session required.');
  }

  const userMemberships = getMembershipsByUser(userId);
  if (userMemberships.length === 0) {
    const err = new Error('You do not belong to any business yet.');
    (err as unknown as { statusCode: number }).statusCode = 403;
    throw err;
  }

  const availableBusinesses: WorkspaceBusinessItem[] = [];
  for (const m of userMemberships) {
    const biz = getBusinessById(m.businessId);
    if (biz) {
      availableBusinesses.push({ business: biz, membership: m });
    }
  }

  if (availableBusinesses.length === 0) {
    const err = new Error('No associated business entities found.');
    (err as unknown as { statusCode: number }).statusCode = 404;
    throw err;
  }

  // Selected business resolution:
  let selectedItem: WorkspaceBusinessItem | undefined;
  if (targetBusinessId) {
    selectedItem = availableBusinesses.find((item) => item.business.id === targetBusinessId);
    if (!selectedItem) {
      const err = new Error('You do not have permission to access this business.');
      (err as unknown as { statusCode: number }).statusCode = 403;
      throw err;
    }
  } else {
    selectedItem = availableBusinesses[0];
  }

  const { business: currentBusiness, membership } = selectedItem;
  const permissions = getPermissionsForRole(membership.role);

  return {
    currentUser: user,
    currentBusiness,
    membership,
    permissions,
    availableBusinesses,
  };
}

export async function getWorkspaceOverview(
  businessId: string,
  userId: string
): Promise<WorkspaceOverviewData> {
  const membership = getMembership(businessId, userId);
  assertAuthorized(membership, 'workspace.access');

  const business = getBusinessById(businessId);
  if (!business) {
    throw new Error(`Business "${businessId}" not found.`);
  }

  const participations = getMarketParticipationsByBusiness(businessId);
  const activeMarkets = participations.filter((p) => p.status === 'ACTIVE');
  const eligibleMarkets = participations.filter((p) => p.status === 'ELIGIBLE');
  const hasPaidPosition = activeMarkets.some(
    (p) => typeof p.currentPosition === 'number' && p.currentPosition > 0
  );

  return {
    business,
    membership: membership!,
    activeMarketsCount: activeMarkets.length,
    eligibleMarketsCount: eligibleMarkets.length,
    participatingMarketsCount: participations.length,
    hasPaidPosition,
    visibilitySummary: {
      status: hasPaidPosition ? 'ACTIVE' : 'NOT_ACTIVE',
      message: hasPaidPosition
        ? 'Business is actively listed with a qualifying paid visibility position.'
        : 'No visibility activity is available yet. Market visibility activity will appear here when the visibility system is active.',
    },
  };
}

export async function getWorkspaceMarkets(
  businessId: string,
  userId: string
): Promise<WorkspaceMarketItem[]> {
  const membership = getMembership(businessId, userId);
  assertAuthorized(membership, 'market.participation.view');

  const participations = getMarketParticipationsByBusiness(businessId);
  const items: WorkspaceMarketItem[] = [];

  for (const part of participations) {
    const market = getMarketById(part.marketId);
    if (!market) continue;

    const city = getCityById(market.cityId);
    const cat = getCategoryById(market.categoryId);
    const marketName = city && cat ? `${city.name} × ${cat.name}` : market.slug;

    const hasPos = typeof part.currentPosition === 'number' && part.currentPosition > 0;
    items.push({
      market: {
        id: market.id,
        slug: market.slug,
        name: marketName,
      },
      participation: part,
      status: part.status === 'ACTIVE' ? 'ACTIVE' : 'ELIGIBLE',
      position: hasPos ? part.currentPosition! : null,
      positionLabel: hasPos ? `Position #${part.currentPosition}` : 'No paid position',
      qualifyingAmountRupees: part.qualifyingAmountRupees,
    });
  }

  return items;
}

export async function updateWorkspaceProfile(
  input: UpdateBusinessProfileInput,
  userId: string
): Promise<BusinessEntity> {
  const membership = getMembership(input.businessId, userId);
  assertAuthorized(membership, 'business.update');

  const business = getBusinessById(input.businessId);
  if (!business) {
    throw new Error(`Business "${input.businessId}" not found.`);
  }

  // Update allowed fields
  if (input.tagline !== undefined) business.tagline = input.tagline.trim();
  if (input.description !== undefined) business.description = input.description.trim();
  if (input.website !== undefined) business.website = input.website.trim();
  if (input.phone !== undefined) business.phone = input.phone.trim();
  if (input.email !== undefined) business.email = input.email.trim();
  if (input.address !== undefined) business.address = input.address.trim();
  if (input.logo !== undefined) business.logo = input.logo.trim();
  if (input.coverImage !== undefined) business.coverImage = input.coverImage.trim();

  business.updatedAt = new Date().toISOString();

  recordAuditEvent('BUSINESS_PROFILE_UPDATED', 'Business', business.id, userId, {
    fieldsUpdated: Object.keys(input).filter((k) => k !== 'businessId'),
  });

  return { ...business };
}
