import { describe, it } from 'node:test';
import assert from 'node:assert';
import { formatINR, rupeesToPaise, paiseToRupees, formatRelativeTime } from '../lib/utils/format.ts';

describe('Precision Currency & Relative Time Formatting', () => {
  it('should format minor units (paise) into Indian Rupees without decimals by default', () => {
    // 2,600,000 paise = ₹26,000
    assert.strictEqual(formatINR(2600000), '₹26,000');
    // 10,000,000 paise = ₹1,00,000 (1 Lakh)
    assert.strictEqual(formatINR(10000000), '₹1,00,000');
    // 0 paise = ₹0
    assert.strictEqual(formatINR(0), '₹0');
  });

  it('should format minor units with paise when showDecimals is true or paise > 0', () => {
    // 2,600,050 paise = ₹26,000.50
    assert.strictEqual(formatINR(2600050), '₹26,000.50');
    // 2,600,000 paise with showDecimals = ₹26,000.00
    assert.strictEqual(formatINR(2600000, { showDecimals: true }), '₹26,000.00');
  });

  it('should convert Rupees to integer paise without floating-point errors', () => {
    assert.strictEqual(rupeesToPaise(26000), 2600000);
    assert.strictEqual(rupeesToPaise('26000.50'), 2600050);
    assert.strictEqual(rupeesToPaise('₹26,000'), 2600000);
  });

  it('should convert paise to whole Rupees', () => {
    assert.strictEqual(paiseToRupees(2600000), 26000);
    assert.strictEqual(paiseToRupees(2600099), 26000);
  });

  it('should format relative timestamps accurately', () => {
    const now = Date.now();
    assert.strictEqual(formatRelativeTime(now - 2000), 'Just now');
    assert.strictEqual(formatRelativeTime(now - 15000), '15 seconds ago');
    assert.strictEqual(formatRelativeTime(now - 120000), '2 minutes ago');
  });
});
