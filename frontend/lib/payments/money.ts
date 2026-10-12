/**
 * AageOnline — Payment Money Validation & Invariants
 * Enforces positive whole Indian Rupee amounts in integer minor units (paise).
 *
 * Invariant: 1 INR = 100 Paise.
 * Fractional paise and decimal rupees are strictly rejected without rounding.
 */

export function validatePaymentAmount(amountMinor: number, currency: string = 'INR'): { amountMinor: number; amountRupees: number } {
  if (currency !== 'INR') {
    throw new Error(`Only "INR" currency is supported. Received "${currency}".`);
  }

  if (!Number.isFinite(amountMinor) || !Number.isSafeInteger(amountMinor)) {
    throw new Error(`Invalid amountMinor: must be a safe integer. Received ${amountMinor}.`);
  }

  if (amountMinor <= 0) {
    throw new Error(`Invalid amountMinor: must be greater than zero. Received ${amountMinor}.`);
  }

  if (amountMinor % 100 !== 0) {
    throw new Error(
      `Fractional or non-whole-rupee amounts are prohibited. amountMinor (${amountMinor}) must be a multiple of 100 paise.`
    );
  }

  const amountRupees = amountMinor / 100;

  if (!Number.isSafeInteger(amountRupees) || amountRupees <= 0) {
    throw new Error(`Derived amountRupees must be a positive integer. Derived ${amountRupees}.`);
  }

  return { amountMinor, amountRupees };
}

export function rupeesToPaise(amountRupees: number): number {
  if (!Number.isFinite(amountRupees) || !Number.isSafeInteger(amountRupees) || amountRupees <= 0) {
    throw new Error(`amountRupees must be a positive integer. Received ${amountRupees}.`);
  }
  return amountRupees * 100;
}

export function paiseToRupees(amountMinor: number): number {
  return validatePaymentAmount(amountMinor).amountRupees;
}
