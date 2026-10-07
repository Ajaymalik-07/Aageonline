/**
 * Precision Currency & Date Formatting Utilities for AageOnline.
 * Guarantees zero floating-point corruption by converting integer paise (minor units).
 */

/**
 * Formats minor units (paise) into INR currency string with Indian numbering convention.
 * e.g. 2600000 paise -> ₹26,000
 */
export function formatINR(
  amountMinor: number,
  options: { includeSymbol?: boolean; showDecimals?: boolean } = {}
): string {
  const { includeSymbol = true, showDecimals = false } = options;

  if (typeof amountMinor !== 'number' || isNaN(amountMinor)) {
    return includeSymbol ? '₹0' : '0';
  }

  // Integer division for Rupees, modulo for remaining paise
  const rupees = Math.floor(Math.abs(amountMinor) / 100);
  const paise = Math.abs(amountMinor) % 100;
  const isNegative = amountMinor < 0;

  // Indian Numbering System formatting (en-IN)
  const formattedRupees = new Intl.NumberFormat('en-IN').format(rupees);

  let result = formattedRupees;
  if (showDecimals || paise > 0) {
    result += `.${paise.toString().padStart(2, '0')}`;
  }

  if (includeSymbol) {
    result = `₹${result}`;
  }

  return isNegative ? `-${result}` : result;
}

/**
 * Converts whole Rupee inputs (e.g. from user input box) into integer minor units (paise).
 * Protects against floating-point inaccuracy.
 */
export function rupeesToPaise(rupees: number | string): number {
  if (typeof rupees === 'string') {
    const cleaned = rupees.replace(/[^\d.]/g, '');
    const num = parseFloat(cleaned);
    if (isNaN(num)) return 0;
    return Math.round(num * 100);
  }
  return Math.round(rupees * 100);
}

/**
 * Converts minor units (paise) to whole rupees (integer).
 */
export function paiseToRupees(paise: number): number {
  return Math.floor(paise / 100);
}

/**
 * Relative time formatter for live ranking freshness indicators.
 * e.g. "Updated 12 seconds ago"
 */
export function formatRelativeTime(timestamp: string | number | Date): string {
  const now = Date.now();
  const past = new Date(timestamp).getTime();
  const diffSec = Math.floor((now - past) / 1000);

  if (diffSec < 5) return 'Just now';
  if (diffSec < 60) return `${diffSec} seconds ago`;

  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin} minute${diffMin === 1 ? '' : 's'} ago`;

  const diffHours = Math.floor(diffMin / 60);
  if (diffHours < 24) return `${diffHours} hour${diffHours === 1 ? '' : 's'} ago`;

  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays} day${diffDays === 1 ? '' : 's'} ago`;
}
