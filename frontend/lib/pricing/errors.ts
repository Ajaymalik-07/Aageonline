/**
 * AageOnline — Market Pricing Domain Errors
 * Standard typed errors for calculation boundaries.
 */

export class PricingError extends Error {
  code: string;
  statusCode: number;

  constructor(message: string, code = 'PRICING_ERROR', statusCode = 400) {
    super(message);
    this.name = 'PricingError';
    this.code = code;
    this.statusCode = statusCode;
  }
}

export class InvalidMarketError extends PricingError {
  constructor(marketId: string) {
    super(`Market with ID "${marketId}" does not exist.`, 'INVALID_MARKET', 404);
    this.name = 'InvalidMarketError';
  }
}

export class MarketUnavailableError extends PricingError {
  constructor(marketId: string, status: string) {
    super(
      `Market "${marketId}" is currently in ${status} status and does not permit pricing calculation.`,
      'MARKET_UNAVAILABLE',
      422
    );
    this.name = 'MarketUnavailableError';
  }
}

export class InvalidTargetPositionError extends PricingError {
  constructor(message: string) {
    super(message, 'INVALID_TARGET_POSITION', 400);
    this.name = 'InvalidTargetPositionError';
  }
}

export class InvalidMoneyAmountError extends PricingError {
  constructor(message: string) {
    super(message, 'INVALID_MONEY_AMOUNT', 400);
    this.name = 'InvalidMoneyAmountError';
  }
}

export class PricingConfigurationError extends PricingError {
  constructor(message: string) {
    super(message, 'PRICING_CONFIGURATION_ERROR', 500);
    this.name = 'PricingConfigurationError';
  }
}
