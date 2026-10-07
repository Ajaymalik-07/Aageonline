import type { Category, Location } from './market';

export type BusinessStatus =
  | 'DRAFT'
  | 'CLAIM_PENDING'
  | 'VERIFICATION_PENDING'
  | 'ACTIVE'
  | 'SUSPENDED'
  | 'ARCHIVED';

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
