/**
 * AageOnline — Bid Intent Domain Types & Invariants
 *
 * Defines the authenticated, immutable BidIntent domain entity,
 * pricing snapshot, lifecycle states, and idempotency boundaries.
 *
 * Invariant: BidIntent is preparation for payment, NOT payment itself.
 * Zero financial mutation, zero ranking mutation, zero position reservation.
 */

import type { CalculationMode, MoneyMinor, MoneyRupees } from '../lib/pricing/types.ts';

export type BidIntentStatus = 'PENDING_PAYMENT' | 'EXPIRED' | 'CANCELLED';

export const BID_INTENT_TTL_MINUTES = 15;

export interface PricingSnapshot {
  marketId: string;
  marketSlug: string;
  targetPosition: number;
  relevantCurrentQualifyingAmountMinor?: MoneyMinor | null;
  relevantCurrentQualifyingAmountRupees?: MoneyRupees | null;
  requiredQualifyingAmountMinor: MoneyMinor;
  requiredQualifyingAmountRupees: MoneyRupees;
  calculationMode: CalculationMode;
  reason: string;
  calculatedAt: string;
  disclaimer: string;
}

export interface BidIntent {
  id: string; // e.g. bi_...
  businessId: string;
  marketId: string;
  createdByUserId: string;
  membershipId: string;
  targetPosition: number;
  qualifyingAmountMinor: MoneyMinor;
  qualifyingAmountRupees: MoneyRupees;
  currency: 'INR';
  pricingCalculationId?: string;
  pricingSnapshot: PricingSnapshot;
  status: BidIntentStatus;
  idempotencyKey: string;
  expiresAt: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateBidIntentInput {
  businessId: string;
  marketId: string;
  targetPosition: number;
  clientCalculatedAmountMinor?: MoneyMinor;
  offeredAmountMinor?: MoneyMinor;
  idempotencyKey: string;
}

export interface CancelBidIntentInput {
  bidIntentId: string;
  actorUserId: string;
  businessId: string;
}

export interface BidIntentFilter {
  businessId: string;
  marketId?: string;
  status?: BidIntentStatus;
  limit?: number;
  offset?: number;
}
