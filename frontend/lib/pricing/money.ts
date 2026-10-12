/**
 * AageOnline — Pricing Money & Whole Rupee Validator
 *
 * Invariant: All qualifying amounts must be positive whole Indian Rupees only.
 * ₹1 = 100 paise (integer minor units).
 * Decimals, fractional rupees, and fractional paise are strictly rejected.
 */

import type { MoneyMinor, MoneyRupees } from './types.ts';
import { InvalidMoneyAmountError } from './errors.ts';

/**
 * Validates that an amount in whole Indian Rupees satisfies:
 * 1. Type is number and is finite.
 * 2. Is a safe integer (strictly no decimals/fractions).
 * 3. Is strictly positive (> 0).
 */
export function validateWholeRupees(amountRupees: unknown): MoneyRupees {
  if (typeof amountRupees !== 'number' || !Number.isFinite(amountRupees)) {
    throw new InvalidMoneyAmountError(
      'Qualifying amount must be a finite number in whole Indian Rupees.'
    );
  }

  if (!Number.isSafeInteger(amountRupees)) {
    throw new InvalidMoneyAmountError(
      `Qualifying amount ${amountRupees} is not a valid whole integer rupee amount. Decimal or fractional rupees are not permitted.`
    );
  }

  if (amountRupees <= 0) {
    throw new InvalidMoneyAmountError(
      `Qualifying amount must be strictly greater than zero (received ${amountRupees}).`
    );
  }

  return amountRupees;
}

/**
 * Validates that an amount in minor units (paise) satisfies:
 * 1. Is a safe positive integer.
 * 2. Corresponds strictly to a whole Rupee (minor % 100 === 0).
 */
export function validateMinorUnits(amountMinor: unknown): MoneyMinor {
  if (typeof amountMinor !== 'number' || !Number.isFinite(amountMinor)) {
    throw new InvalidMoneyAmountError(
      'Minor amount must be a finite integer in paise.'
    );
  }

  if (!Number.isSafeInteger(amountMinor)) {
    throw new InvalidMoneyAmountError(
      `Minor amount ${amountMinor} must be a safe integer in paise.`
    );
  }

  if (amountMinor <= 0) {
    throw new InvalidMoneyAmountError(
      `Minor amount must be strictly positive (received ${amountMinor}).`
    );
  }

  if (amountMinor % 100 !== 0) {
    throw new InvalidMoneyAmountError(
      `Minor amount ${amountMinor} paise is not a whole rupee equivalent. Decimal/fractional rupee bidding is not permitted.`
    );
  }

  return amountMinor;
}

export function rupeesToMinor(amountRupees: MoneyRupees): MoneyMinor {
  const validRupees = validateWholeRupees(amountRupees);
  return validRupees * 100;
}

export function minorToRupees(amountMinor: MoneyMinor): MoneyRupees {
  const validMinor = validateMinorUnits(amountMinor);
  return validMinor / 100;
}

export function formatRupeesINR(amountRupees: MoneyRupees): string {
  validateWholeRupees(amountRupees);
  return `₹${amountRupees.toLocaleString('en-IN')}`;
}

export function formatMinorINR(amountMinor: MoneyMinor): string {
  const rupees = minorToRupees(amountMinor);
  return formatRupeesINR(rupees);
}
