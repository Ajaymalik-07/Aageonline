/**
 * AageOnline — Bid Intent Domain Errors
 * Strongly typed domain errors mapped to HTTP status codes.
 */

export class BidIntentError extends Error {
  readonly code: string;
  readonly statusCode: number;
  readonly details?: Record<string, unknown>;

  constructor(message: string, code: string, statusCode: number, details?: Record<string, unknown>) {
    super(message);
    this.name = 'BidIntentError';
    this.code = code;
    this.statusCode = statusCode;
    this.details = details;
  }
}

export class UnauthenticatedError extends BidIntentError {
  constructor(message = 'Authentication required to create or manage visibility intents.') {
    super(message, 'UNAUTHENTICATED', 401);
  }
}

export class ForbiddenBusinessAccessError extends BidIntentError {
  constructor(message = 'User is not an active member authorized to manage this business.') {
    super(message, 'FORBIDDEN_BUSINESS_ACCESS', 403);
  }
}

export class BusinessNotEligibleError extends BidIntentError {
  constructor(message = 'Business is not eligible to target this market.') {
    super(message, 'BUSINESS_NOT_ELIGIBLE', 422);
  }
}

export class MarketNotFoundError extends BidIntentError {
  constructor(marketId: string) {
    super(`Market "${marketId}" does not exist.`, 'MARKET_NOT_FOUND', 404, { marketId });
  }
}

export class MarketUnavailableError extends BidIntentError {
  constructor(marketId: string, status: string) {
    super(
      `Market "${marketId}" is currently in ${status} status and does not permit intent creation.`,
      'MARKET_UNAVAILABLE',
      422,
      { marketId, status }
    );
  }
}

export class InvalidTargetPositionError extends BidIntentError {
  constructor(message: string) {
    super(message, 'INVALID_TARGET_POSITION', 400);
  }
}

export class IdempotencyKeyRequiredError extends BidIntentError {
  constructor(message = 'Idempotency-Key header is required for creating a visibility intent.') {
    super(message, 'IDEMPOTENCY_KEY_REQUIRED', 400);
  }
}

export class IdempotencyKeyReusedError extends BidIntentError {
  constructor(message = 'Idempotency-Key was already used with a conflicting payload.') {
    super(message, 'IDEMPOTENCY_KEY_REUSED', 409);
  }
}

export class PricingChangedError extends BidIntentError {
  constructor(
    clientCalculatedAmountMinor: number,
    currentRequiredAmountMinor: number,
    currentRequiredAmountRupees: number
  ) {
    super(
      `The market qualifying amount has changed since your last calculation (previously ₹${(
        clientCalculatedAmountMinor / 100
      ).toLocaleString('en-IN')}, now ₹${currentRequiredAmountRupees.toLocaleString(
        'en-IN'
      )}). Please review the updated requirement.`,
      'PRICING_CHANGED',
      409,
      {
        previousCalculatedAmountMinor: clientCalculatedAmountMinor,
        currentRequiredAmountMinor,
        currentRequiredAmountRupees,
      }
    );
  }
}

export class BidIntentExpiredError extends BidIntentError {
  constructor(bidIntentId: string) {
    super(
      `BidIntent "${bidIntentId}" has expired and is no longer valid for execution.`,
      'BID_INTENT_EXPIRED',
      422,
      { bidIntentId }
    );
  }
}

export class BidIntentNotCancellableError extends BidIntentError {
  constructor(bidIntentId: string, status: string) {
    super(
      `BidIntent "${bidIntentId}" cannot be cancelled because its current status is "${status}".`,
      'BID_INTENT_NOT_CANCELLABLE',
      422,
      { bidIntentId, status }
    );
  }
}

export class BidIntentNotFoundError extends BidIntentError {
  constructor(bidIntentId: string) {
    super(`BidIntent "${bidIntentId}" was not found.`, 'BID_INTENT_NOT_FOUND', 404, { bidIntentId });
  }
}
