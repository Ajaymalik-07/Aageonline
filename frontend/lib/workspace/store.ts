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
import { createMembership, getMembership, getMembershipsByUser, getMembershipsByBusiness, registerMembershipInStore } from '../memberships/store.ts';
import {
  getAllBusinesses,
  getBusinessById,
  getBusinessBySlug,
  getMarketParticipationsByBusiness,
  registerBusinessInStore,
} from '../taxonomy/businesses.ts';
import { getMarketById } from '../taxonomy/markets.ts';
import { getCityById } from '../taxonomy/locations.ts';
import { getCategoryById } from '../taxonomy/categories.ts';
import { recordAuditEvent } from '../audit/store.ts';

export function normalizeBusinessIdentifier(input?: string): string {
  if (!input) return '';
  try {
    const decoded = decodeURIComponent(input);
    return decoded
      .trim()
      .toLowerCase()
      .replace(/^biz-/, '')
      .replace(/^biz\s+/, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  } catch {
    return input
      .trim()
      .toLowerCase()
      .replace(/^biz-/, '')
      .replace(/^biz\s+/, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }
}

export async function resolveWorkspaceContext(
  userId: string,
  targetBusinessId?: string
): Promise<WorkspaceContext> {
  let user = getUserById(userId);
  if (!user) {
    if (typeof window !== 'undefined') {
      try {
        const res = await fetch('/api/auth/me');
        if (res.ok) {
          const data = await res.json();
          if (data.user) {
            const { registerUserInStore } = await import('../auth/store.ts');
            registerUserInStore(data.user);
            user = data.user;
          }
        }
      } catch {
        // safe fallback
      }
    } else {
      try {
        const { isDatabaseConfigured } = await import('../db/client.ts');
        if (isDatabaseConfigured()) {
          const { PostgresUserRepository } = await import('../db/repositories/user-repository.ts');
          const userRepo = new PostgresUserRepository();
          const dbUser = await userRepo.findById(userId);
          if (dbUser) {
            const { registerUserInStore } = await import('../auth/store.ts');
            registerUserInStore(dbUser);
            user = dbUser;
          }
        }
      } catch {
        // safe fallback
      }
    }
  }

  if (!user || user.status !== 'ACTIVE') {
    throw new Error('Authentication required: Active user session required.');
  }

  let userMemberships = getMembershipsByUser(userId);

  if (userMemberships.length === 0) {
    if (typeof window !== 'undefined') {
      try {
        const res = await fetch('/api/business/owned');
        if (res.ok) {
          const data = await res.json();
          if (data.businesses && Array.isArray(data.businesses)) {
            for (const item of data.businesses) {
              if (!getBusinessById(item.id)) {
                registerBusinessInStore({
                  id: item.id,
                  slug: item.slug,
                  name: item.name,
                  legalName: item.legalName,
                  description: item.description || item.name,
                  primaryCityId: item.cityName,
                  verificationStatus: item.verificationStatus,
                  publicationStatus: item.publicationStatus,
                  phone: item.phone,
                  socialLinks: { whatsapp: item.whatsappPhone },
                  createdAt: item.createdAt || new Date().toISOString(),
                  updatedAt: item.createdAt || new Date().toISOString(),
                });
              }
              registerMembershipInStore({
                id: `mem-${item.id}-${userId}`,
                businessId: item.id,
                userId,
                role: (item.role as any) || 'OWNER',
                status: 'ACTIVE',
                createdAt: item.createdAt || new Date().toISOString(),
                updatedAt: item.createdAt || new Date().toISOString(),
              });
            }
            userMemberships = getMembershipsByUser(userId);
          }
        }
      } catch {
        // safe fallback
      }
    } else {
      try {
        const { isDatabaseConfigured } = await import('../db/client.ts');
        if (isDatabaseConfigured()) {
          const { PostgresBusinessRepository } = await import('../db/repositories/business-repository.ts');
          const bizRepo = new PostgresBusinessRepository();
          const dbBusinesses = await bizRepo.getBusinessesByOwner(userId);
          for (const item of dbBusinesses) {
            if (!getBusinessById(item.business.id)) {
              registerBusinessInStore(item.business);
            }
            registerMembershipInStore({
              id: `mem-${item.business.id}-${userId}`,
              businessId: item.business.id,
              userId,
              role: (item.membershipRole as any) || 'OWNER',
              status: 'ACTIVE',
              createdAt: item.business.createdAt,
              updatedAt: item.business.updatedAt,
            });
          }
          userMemberships = getMembershipsByUser(userId);
        }
      } catch {
        // safe fallback
      }
    }
  }

  if (userMemberships.length === 0) {
    const err = new Error(`Forbidden: User ${user.email || user.phone || user.id} does not belong to any business yet.`);
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

  // Selected business resolution with slug / space / prefix normalization
  let selectedItem: WorkspaceBusinessItem | undefined;
  if (targetBusinessId) {
    const targetNorm = normalizeBusinessIdentifier(targetBusinessId);

    // 1. Direct match or normalized match strictly within user's available businesses
    selectedItem = availableBusinesses.find((item) => {
      if (item.business.id === targetBusinessId || item.business.slug === targetBusinessId) {
        return true;
      }
      if (targetNorm) {
        const idNorm = normalizeBusinessIdentifier(item.business.id);
        const slugNorm = normalizeBusinessIdentifier(item.business.slug);
        if (idNorm === targetNorm || slugNorm === targetNorm) {
          return true;
        }
      }
      return false;
    });

    // 2. If target was specified but not in user's memberships:
    if (!selectedItem) {
      // Check if this business exists in system registry
      const allBiz = getAllBusinesses();
      const existingBiz = allBiz.find((b) => {
        if (b.id === targetBusinessId || b.slug === targetBusinessId) return true;
        if (targetNorm) {
          const bIdNorm = normalizeBusinessIdentifier(b.id);
          const bSlugNorm = normalizeBusinessIdentifier(b.slug);
          return bIdNorm === targetNorm || bSlugNorm === targetNorm;
        }
        return false;
      });

      if (existingBiz) {
        // Check if this business belongs to another active user
        const existingMemberships = getMembershipsByBusiness(existingBiz.id);
        const ownedByOther = existingMemberships.some(
          (m) => m.userId !== user.id && m.status === 'ACTIVE'
        );

        if (ownedByOther) {
          // Strictly forbid cross-tenant access to another user's business
          const err = new Error(`Forbidden: User is not authorized to access business ${targetBusinessId}.`);
          (err as unknown as { statusCode: number }).statusCode = 403;
          throw err;
        }

        // Unclaimed or unassigned business: allow user to claim it as OWNER
        const newMembership = createMembership(
          {
            businessId: existingBiz.id,
            userId: user.id,
            role: 'OWNER',
            status: 'ACTIVE',
          },
          user.id
        );
        selectedItem = { business: existingBiz, membership: newMembership };
        availableBusinesses.unshift(selectedItem);
      }

      // 3. Graceful fallback: If targetBusinessId is completely unrecognized/non-existent,
      // fall back to the user's primary/first business so the dashboard remains functional
      if (!selectedItem && availableBusinesses.length > 0) {
        selectedItem = availableBusinesses[0];
      }
    }
  } else {
    selectedItem = availableBusinesses[0];
  }

  if (!selectedItem) {
    const err = new Error('You do not have permission to access this business.');
    (err as unknown as { statusCode: number }).statusCode = 403;
    throw err;
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
  if (input.socialLinks !== undefined) {
    business.socialLinks = {
      ...(business.socialLinks || {}),
      ...(input.socialLinks.instagram !== undefined ? { instagram: input.socialLinks.instagram.trim() } : {}),
      ...(input.socialLinks.linkedin !== undefined ? { linkedin: input.socialLinks.linkedin.trim() } : {}),
      ...(input.socialLinks.facebook !== undefined ? { facebook: input.socialLinks.facebook.trim() } : {}),
      ...(input.socialLinks.twitter !== undefined ? { twitter: input.socialLinks.twitter.trim() } : {}),
      ...(input.socialLinks.youtube !== undefined ? { youtube: input.socialLinks.youtube.trim() } : {}),
      ...(input.socialLinks.whatsapp !== undefined ? { whatsapp: input.socialLinks.whatsapp.trim() } : {}),
    };
  }

  business.updatedAt = new Date().toISOString();

  recordAuditEvent('BUSINESS_PROFILE_UPDATED', 'Business', business.id, userId, {
    fieldsUpdated: Object.keys(input).filter((k) => k !== 'businessId'),
  });

  return { ...business };
}
