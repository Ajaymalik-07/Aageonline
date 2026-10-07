export type BidFlowState =
  | 'IDLE'
  | 'TARGET_SELECTED'
  | 'LOCAL_VALIDATION_ERROR'
  | 'QUOTING'
  | 'QUOTED'
  | 'SUBMITTING'
  | 'PAYMENT_PENDING'
  | 'AMOUNT_HELD'
  | 'VERIFYING_WITH_SERVER'
  | 'CONFIRMED'
  | 'RACE_CONDITION_DETECTED'
  | 'FAILED'
  | 'EXPIRED';

export interface PositionQuote {
  marketId: string;
  targetPosition: number;
  currentQualifyingAmountMinor: number;
  minimumRequiredAmountMinor: number; // Strictly currentQualifyingAmountMinor + 100 paise (or ₹1)
  expiresAt: string;
  currency: 'INR';
}

export interface BidSubmissionPayload {
  marketId: string;
  businessId: string;
  targetPosition: number;
  offeredAmountMinor: number;
  idempotencyKey: string;
}

export interface BidSubmissionResult {
  bidId: string;
  paymentIntentId: string;
  marketId: string;
  targetPosition: number;
  amountMinor: number;
  status: 'PAYMENT_REQUIRED' | 'CONFIRMED' | 'REJECTED';
  rejectionReason?: 'AMOUNT_INSUFFICIENT' | 'POSITION_OCCUPIED_BY_HIGHER_BID' | 'INELIGIBLE_BUSINESS';
  updatedQualifyingAmountMinor?: number; // In case of race condition
}

export interface ConcurrencyRaceEvent {
  targetPosition: number;
  previousWinningAmountMinor: number;
  newWinningAmountMinor: number;
  minimumNewTargetAmountMinor: number;
  displacedBusinessName?: string;
  timestamp: string;
}
