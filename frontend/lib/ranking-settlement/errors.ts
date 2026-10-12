/**
 * AageOnline — Ranking Settlement Domain Errors
 *
 * Specific typed domain errors with HTTP mapping and domain codes.
 * Node strip-only mode compatibility: all fields declared explicitly.
 */

export abstract class RankingSettlementDomainError extends Error {
  readonly code: string;
  readonly statusCode: number;

  constructor(message: string, code: string, statusCode: number = 400) {
    super(message);
    this.name = this.constructor.name;
    this.code = code;
    this.statusCode = statusCode;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export class UnauthenticatedSettlementError extends RankingSettlementDomainError {
  constructor(message: string = 'Authentication required to execute ranking settlement.') {
    super(message, 'UNAUTHENTICATED_SETTLEMENT', 401);
  }
}

export class UnauthorizedSettlementAccessError extends RankingSettlementDomainError {
  readonly businessId: string;
  readonly actorUserId: string;

  constructor(
    businessId: string,
    actorUserId: string,
    message?: string
  ) {
    super(
      message || `User "${actorUserId}" is unauthorized to settle ranking for business "${businessId}".`,
      'UNAUTHORIZED_SETTLEMENT_ACCESS',
      403
    );
    this.businessId = businessId;
    this.actorUserId = actorUserId;
  }
}

export class PaymentOrderNotFoundError extends RankingSettlementDomainError {
  readonly paymentOrderId: string;

  constructor(paymentOrderId: string) {
    super(`PaymentOrder "${paymentOrderId}" was not found.`, 'PAYMENT_ORDER_NOT_FOUND', 404);
    this.paymentOrderId = paymentOrderId;
  }
}

export class PaymentNotConfirmedError extends RankingSettlementDomainError {
  readonly paymentOrderId: string;
  readonly status: string;

  constructor(paymentOrderId: string, status: string) {
    super(
      `PaymentOrder "${paymentOrderId}" has status "${status}". Only CONFIRMED payments may settle into ranking.`,
      'PAYMENT_NOT_CONFIRMED',
      422
    );
    this.paymentOrderId = paymentOrderId;
    this.status = status;
  }
}

export class BidIntentNotFoundError extends RankingSettlementDomainError {
  readonly bidIntentId: string;

  constructor(bidIntentId: string) {
    super(`BidIntent "${bidIntentId}" was not found.`, 'BID_INTENT_NOT_FOUND', 404);
    this.bidIntentId = bidIntentId;
  }
}

export class BidIntentMismatchError extends RankingSettlementDomainError {
  readonly expected: string;
  readonly actual: string;

  constructor(expected: string, actual: string) {
    super(
      `BidIntent mismatch: expected "${expected}", received "${actual}".`,
      'BID_INTENT_MISMATCH',
      400
    );
    this.expected = expected;
    this.actual = actual;
  }
}

export class MarketUnavailableSettlementError extends RankingSettlementDomainError {
  readonly marketId: string;

  constructor(marketId: string) {
    super(`Market "${marketId}" is not available for ranking settlement.`, 'MARKET_UNAVAILABLE', 422);
    this.marketId = marketId;
  }
}

export class BusinessIneligibleSettlementError extends RankingSettlementDomainError {
  readonly businessId: string;

  constructor(businessId: string, reason: string = 'Business is not eligible for active participation.') {
    super(`Business "${businessId}" is ineligible: ${reason}`, 'BUSINESS_INELIGIBLE', 422);
    this.businessId = businessId;
  }
}

export class TargetNoLongerAchievableError extends RankingSettlementDomainError {
  readonly targetPosition: number;
  readonly paidAmountRupees: number;
  readonly currentQualifyingRupees: number;

  constructor(
    targetPosition: number,
    paidAmountRupees: number,
    currentQualifyingRupees: number
  ) {
    super(
      `Target Position #${targetPosition} is no longer achievable with paid amount ₹${paidAmountRupees}. Current required qualifying floor is strictly > ₹${currentQualifyingRupees}.`,
      'RANKING_TARGET_NO_LONGER_ACHIEVABLE',
      409
    );
    this.targetPosition = targetPosition;
    this.paidAmountRupees = paidAmountRupees;
    this.currentQualifyingRupees = currentQualifyingRupees;
  }
}

export class TargetBeyondCapacityError extends RankingSettlementDomainError {
  readonly targetPosition: number;
  readonly capacity: number;

  constructor(targetPosition: number, capacity: number) {
    super(
      `Target position #${targetPosition} exceeds market capacity of ${capacity}.`,
      'TARGET_BEYOND_CAPACITY',
      422
    );
    this.targetPosition = targetPosition;
    this.capacity = capacity;
  }
}

export class RankingTransactionError extends RankingSettlementDomainError {
  readonly isRetryable: boolean;

  constructor(message: string, isRetryable: boolean = true) {
    super(message, isRetryable ? 'RANKING_SETTLEMENT_RETRYABLE' : 'RANKING_SETTLEMENT_FAILED', isRetryable ? 503 : 500);
    this.isRetryable = isRetryable;
  }
}
