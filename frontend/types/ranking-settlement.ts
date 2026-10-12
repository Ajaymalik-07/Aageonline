/**
 * AageOnline — Ranking Settlement Domain Types (Milestone 0.13.0)
 *
 * Defines authoritative types for atomic ranking settlement:
 * - RankingSettlement entity and state machine
 * - PositionHistoryRecord append-only audit trail
 * - RankingMutationPlan pure calculation plan
 * - PositionChange delta descriptors
 */

export type RankingSettlementStatus =
  | 'PENDING'
  | 'PROCESSING'
  | 'SETTLED'
  | 'FAILED'
  | 'RETRYABLE';

export type RankingSettlementFailureReason =
  | 'TARGET_NO_LONGER_ACHIEVABLE'
  | 'TARGET_BEYOND_CAPACITY'
  | 'BUSINESS_INELIGIBLE'
  | 'MARKET_UNAVAILABLE'
  | 'BID_INTENT_INVALID'
  | 'PAYMENT_NOT_CONFIRMED'
  | 'TRANSACTION_FAILURE';

export interface PositionChange {
  businessId: string;
  previousPosition: number | null;
  newPosition: number;
  isTargetBusiness: boolean;
}

export interface PositionHistoryRecord {
  id: string;
  businessId: string;
  marketId: string;
  previousPosition: number | null;
  newPosition: number;
  cause: 'PAID_VISIBILITY_SETTLEMENT';
  paymentOrderId: string;
  bidIntentId: string;
  rankingSettlementId: string;
  createdAt: string;
}

export interface RankingMutationPlan {
  marketId: string;
  targetBusinessId: string;
  previousPosition: number | null;
  targetPosition: number;
  finalPosition: number;
  qualifyingAmountMinor: number;
  qualifyingAmountRupees: number;
  isNoOp: boolean;
  positionChanges: PositionChange[];
}

export interface RankingSettlement {
  id: string;
  paymentOrderId: string;
  bidIntentId: string;
  businessId: string;
  marketId: string;
  status: RankingSettlementStatus;
  targetPosition: number;
  paidAmountMinor: number;
  paidAmountRupees: number;
  previousPosition?: number | null;
  finalPosition?: number | null;
  failureReason?: string | null;
  createdAt: string;
  updatedAt: string;
  settledAt?: string | null;
}

export interface SettleRankingInput {
  paymentOrderId: string;
  actorUserId?: string;
}

export interface RankingSettlementResult {
  settlement: RankingSettlement;
  plan?: RankingMutationPlan;
  positionHistoryRecords?: PositionHistoryRecord[];
  rankingChangeEvents?: import('./notification.ts').RankingChangeEvent[];
}
