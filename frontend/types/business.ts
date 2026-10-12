import type { Category, Location } from './market';

export type BusinessStatus =
  | 'DRAFT'
  | 'CLAIM_PENDING'
  | 'VERIFICATION_PENDING'
  | 'ACTIVE'
  | 'SUSPENDED'
  | 'ARCHIVED';

export type BusinessVerificationStatus =
  | 'UNVERIFIED'
  | 'PENDING'
  | 'VERIFIED'
  | 'REJECTED';

export type BusinessPublicationStatus =
  | 'PUBLISHED'
  | 'DRAFT'
  | 'REVIEW'
  | 'ARCHIVED';

export interface BusinessEntity {
  id: string;
  slug: string;
  name: string;
  legalName?: string;
  tagline?: string;
  description: string;
  logo?: string;
  coverImage?: string;
  website?: string;
  phone?: string;
  email?: string;
  address?: string;
  primaryCityId?: string;
  primaryStateId?: string;
  primaryCountryId?: string;
  verificationStatus: BusinessVerificationStatus;
  publicationStatus: BusinessPublicationStatus;
  createdAt: string;
  updatedAt: string;
}

export interface BusinessCategoryRelation {
  businessId: string;
  categoryId: string;
  isPrimary?: boolean;
}

export interface BusinessLocationRelation {
  businessId: string;
  cityId: string;
  isPrimary?: boolean;
}

export type MarketParticipationStatus = 'ACTIVE' | 'ELIGIBLE' | 'SUSPENDED' | 'REMOVED';
export type MarketParticipationEligibility = 'ELIGIBLE' | 'INELIGIBLE';

export interface MarketParticipation {
  id: string;
  businessId: string;
  marketId: string;
  status: MarketParticipationStatus;
  eligibilityStatus: MarketParticipationEligibility;
  currentPosition?: number | null; // Authoritative paid position in this market, or null if unranked
  qualifyingAmountRupees?: number;
  joinedAt: string;
  updatedAt: string;
}

export interface Business {
  id: string;
  name: string;
  slug: string;
  tagline?: string;
  description: string;
  category: Category;
  location: Location;
  status: BusinessStatus;
  isVerified: boolean;
  phone?: string;
  email?: string;
  website?: string;
  address?: string;
  currentPositions?: {
    marketId: string;
    marketName: string;
    position: number;
    amountMinor: number;
  }[];
  createdAt: string;
  updatedAt: string;
}

export interface PositionHistoryRecord {
  id: string;
  businessId: string;
  marketId: string;
  marketSlug: string;
  previousPosition: number | null;
  newPosition: number;
  amountMinor?: number;
  cause: 'HIGHER_PAYMENT' | 'OUTBID_DISPLACEMENT' | 'VERIFICATION_CHANGE';
  transactionId?: string;
  timestamp: string;
}

export interface BusinessClaim {
  id: string;
  businessId: string;
  userId: string;
  claimantName: string;
  claimantRole: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  evidenceType: 'BUSINESS_EMAIL' | 'GSTIN' | 'OFFICIAL_DOCUMENT';
  createdAt: string;
}
