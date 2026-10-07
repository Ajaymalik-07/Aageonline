import { formatINR } from '../utils/format.ts';

/**
 * Minimum increment in minor units (100 paise = ₹1.00) required to supersede a qualifying bid.
 */
export const MINIMUM_BID_INCREMENT_PAISE = 100;

export interface BidValidationResult {
  isValid: boolean;
  minimumRequiredMinor: number;
  differenceMinor: number;
  errorMessage?: string;
}

/**
 * Validates a proposed bid amount against an existing position's qualifying amount.
 * STRICT PRODUCT RULE (Section 20):
 * A new bid must be STRICTLY GREATER than the existing qualifying amount:
 * new_amount > existing_qualifying_amount
 * Equal or lower amounts are rejected unconditionally.
 */
export function validateBidAmount(
  proposedAmountMinor: number,
  currentQualifyingAmountMinor: number
): BidValidationResult {
  const minimumRequiredMinor = currentQualifyingAmountMinor + MINIMUM_BID_INCREMENT_PAISE;
  const differenceMinor = proposedAmountMinor - currentQualifyingAmountMinor;

  if (
    typeof proposedAmountMinor !== 'number' ||
    !Number.isFinite(proposedAmountMinor) ||
    !Number.isInteger(proposedAmountMinor) ||
    proposedAmountMinor <= 0
  ) {
    return {
      isValid: false,
      minimumRequiredMinor,
      differenceMinor,
      errorMessage: 'Bid amount must be a valid positive integer in minor units (paise).',
    };
  }

  // INVARIANT 13: Whole Rupee Bids Only (No fractional rupee / paise bidding permitted)
  if (proposedAmountMinor % 100 !== 0) {
    return {
      isValid: false,
      minimumRequiredMinor,
      differenceMinor,
      errorMessage: 'Bid amount must be a positive whole Indian Rupee amount. Decimal/fractional rupee bidding is not permitted.',
    };
  }

  if (proposedAmountMinor < currentQualifyingAmountMinor) {
    return {
      isValid: false,
      minimumRequiredMinor,
      differenceMinor,
      errorMessage: `Proposed amount ${formatINR(proposedAmountMinor)} is lower than current qualifying amount of ${formatINR(currentQualifyingAmountMinor)}.`,
    };
  }

  if (proposedAmountMinor === currentQualifyingAmountMinor) {
    return {
      isValid: false,
      minimumRequiredMinor,
      differenceMinor: 0,
      errorMessage: `Equal amount ${formatINR(proposedAmountMinor)} cannot displace the current position. New bid must be strictly greater than current qualifying amount. Minimum qualifying amount is ${formatINR(minimumRequiredMinor)}.`,
    };
  }

  if (proposedAmountMinor < minimumRequiredMinor) {
    return {
      isValid: false,
      minimumRequiredMinor,
      differenceMinor,
      errorMessage: `Amount must be at least ${formatINR(minimumRequiredMinor)} to qualify for this position.`,
    };
  }

  return {
    isValid: true,
    minimumRequiredMinor,
    differenceMinor,
  };
}

/**
 * Derives the minimum required amount in minor units to target any position.
 * If position currently has a qualifying amount of ₹20,000, returns ₹20,001 (in paise).
 * If position is vacant (0 paise), returns minimum base entry fee (e.g. ₹500 / 50000 paise).
 */
export function calculateMinimumTargetAmount(
  currentQualifyingAmountMinor: number,
  baseEntryFeeMinor: number = 50000 // Default base fee: ₹500
): number {
  if (currentQualifyingAmountMinor <= 0) {
    return baseEntryFeeMinor;
  }
  return currentQualifyingAmountMinor + MINIMUM_BID_INCREMENT_PAISE;
}

/**
 * Validates a user-entered rupee amount or input string.
 * INVARIANT 13: Whole Rupee Bids Only.
 * Rejects decimals (e.g. 20000.50, "20.10"), 0, negative values, NaN, and Infinity.
 * NEVER rounds decimal input into a whole number.
 */
export function validateWholeRupeeInput(input: string | number): {
  isValid: boolean;
  rupees?: number;
  paise?: number;
  errorMessage?: string;
} {
  const str = String(input).trim();
  if (!str) {
    return { isValid: false, errorMessage: 'Bid amount is required.' };
  }

  // Reject any decimal point / fractional rupee
  if (str.includes('.') || str.includes(',')) {
    return {
      isValid: false,
      errorMessage: 'Bid amount must be a whole Indian Rupee amount without decimals or paise (e.g. ₹20,001).',
    };
  }

  // Check valid whole digits
  if (!/^\d+$/.test(str)) {
    return {
      isValid: false,
      errorMessage: 'Bid amount must contain only valid numeric digits.',
    };
  }

  const num = Number(str);
  if (!Number.isSafeInteger(num) || num <= 0) {
    return {
      isValid: false,
      errorMessage: 'Bid amount must be a positive whole integer greater than zero.',
    };
  }

  return {
    isValid: true,
    rupees: num,
    paise: num * 100,
  };
}
