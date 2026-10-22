/**
 * AageOnline — Business Workspace Domain Types
 * Types for authenticated business workspace context, overview, and management.
 */

import type { User } from './auth.ts';
import type { BusinessEntity, MarketParticipation } from './business.ts';
import type { BusinessMembership, MembershipRole, PermissionAction } from './membership.ts';
import type { Market } from './market.ts';

export interface WorkspaceBusinessItem {
  business: BusinessEntity;
  membership: BusinessMembership;
}

export interface WorkspaceContext {
  currentUser: User;
  currentBusiness: BusinessEntity;
  membership: BusinessMembership;
  permissions: PermissionAction[];
  availableBusinesses: WorkspaceBusinessItem[];
}

export interface WorkspaceOverviewData {
  business: BusinessEntity;
  membership: BusinessMembership;
  activeMarketsCount: number;
  eligibleMarketsCount: number;
  participatingMarketsCount: number;
  hasPaidPosition: boolean;
  visibilitySummary: {
    status: 'ACTIVE' | 'NOT_ACTIVE' | 'PENDING';
    message: string;
  };
}

export interface WorkspaceMarketEntity {
  id: string;
  slug: string;
  name: string;
}

export interface WorkspaceMarketItem {
  market: WorkspaceMarketEntity;
  participation: MarketParticipation | null;
  status: 'ACTIVE' | 'ELIGIBLE' | 'RESTRICTED';
  position: number | null;
  positionLabel: string;
  qualifyingAmountRupees?: number;
}

export interface UpdateBusinessProfileInput {
  businessId: string;
  tagline?: string;
  description?: string;
  logo?: string;
  coverImage?: string;
  website?: string;
  phone?: string;
  email?: string;
  address?: string;
  socialLinks?: import('./business.ts').BusinessSocialLinks;
}
