/**
 * AageOnline — Payment Domain Error Hierarchy
 * Maps domain failures cleanly to HTTP semantics.
 */

export class PaymentDomainError extends Error {
  readonly code: string;
  readonly statusCode: number;
  readonly details?: Record<string, unknown>;

  constructor(
    message: string,
    code: string,
    statusCode: number,
    details?: Record<string, unknown>
  ) {
    super(message);
    this.name = this.constructor.name;
    this.code = code;
    this.statusCode = statusCode;
    this.details = details;
  }
}

export class UnauthenticatedPaymentError extends PaymentDomainError {
  constructor(message: string = 'Authentication required to access payment services.') {
    super(message, 'UNAUTHENTICATED', 401);
  }
}

export class UnauthorizedPaymentAccessError extends PaymentDomainError {
  constructor(message: string = 'Insufficient permissions to perform payment operations.') {
    super(message, 'UNAUTHORIZED_PAYMENT_ACCESS', 403);
  }
}

export class PaymentOrderNotFoundError extends PaymentDomainError {
  constructor(orderId: string) {
    super(`Payment order "${orderId}" not found.`, 'PAYMENT_ORDER_NOT_FOUND', 404, { orderId });
  }
}

export class PaymentBidIntentNotFoundError extends PaymentDomainError {
  constructor(bidIntentId: string) {
    super(`Associated BidIntent "${bidIntentId}" not found.`, 'BID_INTENT_NOT_FOUND', 404, { bidIntentId });
  }
}

export class PaymentBidIntentExpiredError extends PaymentDomainError {
  constructor(bidIntentId: string, expiresAt: string) {
    super(
      `BidIntent "${bidIntentId}" has expired at ${expiresAt} and cannot be processed for payment.`,
      'BID_INTENT_EXPIRED',
      409,
      { bidIntentId, expiresAt }
    );
  }
}

export class PaymentBidIntentCancelledError extends PaymentDomainError {
  constructor(bidIntentId: string) {
    super(`BidIntent "${bidIntentId}" has been cancelled and cannot accept payment.`, 'BID_INTENT_CANCELLED', 409, {
      bidIntentId,
    });
  }
}

export class PaymentBidIntentNotPayableError extends PaymentDomainError {
  constructor(bidIntentId: string, currentStatus: string) {
    super(
      `BidIntent "${bidIntentId}" is in status "${currentStatus}" and is not eligible for payment order creation.`,
      'BID_INTENT_NOT_PAYABLE',
      422,
      { bidIntentId, currentStatus }
    );
  }
}

export class PaymentIdempotencyKeyRequiredError extends PaymentDomainError {
  constructor() {
    super('The "Idempotency-Key" header is required for payment order operations.', 'IDEMPOTENCY_KEY_REQUIRED', 400);
  }
}

export class PaymentIdempotencyKeyReusedError extends PaymentDomainError {
  constructor(key: string, reason: string) {
    super(
      `Idempotency-Key "${key}" was reused with conflicting parameters: ${reason}`,
      'IDEMPOTENCY_KEY_REUSED',
      409,
      { key, reason }
    );
  }
}

export class PaymentAmountMismatchError extends PaymentDomainError {
  constructor(expectedMinor: number, receivedMinor: number) {
    super(
      `Payment amount mismatch: expected ₹${(expectedMinor / 100).toFixed(2)}, received ₹${(receivedMinor / 100).toFixed(2)}.`,
      'PAYMENT_AMOUNT_MISMATCH',
      400,
      { expectedMinor, receivedMinor }
    );
  }
}

export class PaymentCurrencyMismatchError extends PaymentDomainError {
  constructor(expectedCurrency: string, receivedCurrency: string) {
    super(
      `Payment currency mismatch: expected ${expectedCurrency}, received ${receivedCurrency}.`,
      'PAYMENT_CURRENCY_MISMATCH',
      400,
      { expectedCurrency, receivedCurrency }
    );
  }
}

export class PaymentProviderError extends PaymentDomainError {
  constructor(message: string, details?: Record<string, unknown>) {
    super(message, 'PAYMENT_PROVIDER_ERROR', 502, details);
  }
}

export class PaymentVerificationFailedError extends PaymentDomainError {
  constructor(reason: string, details?: Record<string, unknown>) {
    super(`Payment verification failed: ${reason}`, 'PAYMENT_VERIFICATION_FAILED', 422, details);
  }
}

export class PaymentWebhookInvalidError extends PaymentDomainError {
  constructor(reason: string) {
    super(`Invalid webhook payload or signature: ${reason}`, 'PAYMENT_WEBHOOK_INVALID', 400, { reason });
  }
}

export class PaymentStateConflictError extends PaymentDomainError {
  constructor(fromStatus: string, toStatus: string, reason: string) {
    super(
      `Illegal payment state transition from "${fromStatus}" to "${toStatus}": ${reason}`,
      'PAYMENT_STATE_CONFLICT',
      409,
      { fromStatus, toStatus, reason }
    );
  }
}

export class PaymentOrderNotCancellableError extends PaymentDomainError {
  constructor(orderId: string, currentStatus: string) {
    super(
      `Payment order "${orderId}" cannot be cancelled because it is in status "${currentStatus}".`,
      'PAYMENT_ORDER_NOT_CANCELLABLE',
      422,
      { orderId, currentStatus }
    );
  }
}
