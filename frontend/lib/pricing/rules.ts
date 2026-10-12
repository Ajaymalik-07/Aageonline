/**
 * AageOnline — Pricing Rules & Position Validations
 */

import { InvalidTargetPositionError } from './errors.ts';
import { validateMinorUnits, validateWholeRupees } from './money.ts';
import type { MoneyMinor, MoneyRupees } from './types.ts';

export const MINIMUM_SUPERSEDING_INCREMENT_RUPEES: MoneyRupees = 1;
export const MINIMUM_SUPERSEDING_INCREMENT_PAISE: MoneyMinor = 100;

export const DEFAULT_MARKET_CAPACITY = 100;
export const DEFAULT_BASE_FLOOR_RUPEES: MoneyRupees = 1000; // ₹1,000 base entry floor
export const DEFAULT_BASE_FLOOR_PAISE: MoneyMinor = 100000; // 100,000 paise
export const DEFAULT_MARKET_BASE_FLOOR_RUPEES = DEFAULT_BASE_FLOOR_RUPEES;
export const DEFAULT_MARKET_BASE_FLOOR_PAISE = DEFAULT_BASE_FLOOR_PAISE;

export const PRICING_DISCLAIMER =
  'This calculation reflects current market conditions and does not reserve a position, lock the required amount, or guarantee future visibility.';

/**
 * Validates requested target position against market capacity.
 * Enforces positive integers: 1 <= position <= capacity.
 */
export function validateTargetPosition(position: unknown, capacity = DEFAULT_MARKET_CAPACITY): number {
  if (typeof position !== 'number' || !Number.isFinite(position)) {
    throw new InvalidTargetPositionError('Target position must be a valid numeric integer.');
  }

  if (!Number.isSafeInteger(position)) {
    throw new InvalidTargetPositionError(
      `Target position ${position} must be a whole positive integer. Decimals are not permitted.`
    );
  }

  if (position <= 0) {
    throw new InvalidTargetPositionError(
      `Target position must be 1 or greater (received ${position}).`
    );
  }

  if (position > capacity) {
    throw new InvalidTargetPositionError(
      `Target position #${position} exceeds this market's maximum capacity of #${capacity}.`
    );
  }

  return position;
}

/**
 * Applies strict superseding rule:
 * new_amount = current_amount + 100 paise (or ₹1).
 */
export function calculateSupersedingAmountMinor(currentMinor: MoneyMinor): MoneyMinor {
  validateMinorUnits(currentMinor);
  const next = currentMinor + MINIMUM_SUPERSEDING_INCREMENT_PAISE;
  return validateMinorUnits(next);
}

/**
 * Applies strict superseding rule in whole rupees:
 * new_amount = current_amount + ₹1.
 */
export function calculateSupersedingAmountRupees(currentRupees: MoneyRupees): MoneyRupees {
  validateWholeRupees(currentRupees);
  const next = currentRupees + MINIMUM_SUPERSEDING_INCREMENT_RUPEES;
  return validateWholeRupees(next);
}
