/**
 * AageOnline — Ranking Settlement Business Rules
 *
 * Enforces:
 * - Positive whole Indian Rupee invariant
 * - Strict greater-than competitive displacement rule (never >=)
 * - Market capacity constraints (1..100)
 * - Base floor requirements
 */

export const DEFAULT_MARKET_CAPACITY = 100;
export const DEFAULT_BASE_FLOOR_RUPEES = 1000;
export const DEFAULT_BASE_FLOOR_PAISE = 100000;

/**
 * Validates that an amount is a positive whole Indian Rupee integer.
 */
export function validateWholeRupeeAmount(amountMinor: number): boolean {
  if (typeof amountMinor !== 'number' || !Number.isSafeInteger(amountMinor) || amountMinor <= 0) {
    return false;
  }
  return amountMinor % 100 === 0;
}

/**
 * Validates that a target position is within valid positive integer capacity bounds.
 */
export function isPositionWithinCapacity(
  position: number,
  capacity: number = DEFAULT_MARKET_CAPACITY
): boolean {
  if (typeof position !== 'number' || !Number.isSafeInteger(position) || position <= 0) {
    return false;
  }
  return position <= capacity;
}

/**
 * Asserts strict greater-than displacement.
 * A new amount MUST be strictly greater than the incumbent amount.
 * Equal amounts (>=) are strictly rejected.
 */
export function canDisplaceIncumbent(
  paidAmountRupees: number,
  incumbentAmountRupees: number
): boolean {
  return paidAmountRupees > incumbentAmountRupees;
}
