import { describe, it } from 'node:test';
import assert from 'node:assert';
import { validateBidAmount, calculateMinimumTargetAmount, MINIMUM_BID_INCREMENT_PAISE } from '../lib/bidding/rules.ts';

describe('Bidding Rules & Qualification Matrix', () => {
  it('should accept a bid strictly greater than current qualifying amount', () => {
    // Current qualifying: ₹20,000 (2,000,000 paise)
    const current = 2000000;
    // Proposed: ₹20,001 (2,000,100 paise)
    const proposed = 2000100;

    const result = validateBidAmount(proposed, current);
    assert.strictEqual(result.isValid, true);
    assert.strictEqual(result.differenceMinor, 100);
    assert.strictEqual(result.minimumRequiredMinor, 2000100);
  });

  it('should REJECT an equal bid amount (Section 20 product rule)', () => {
    // Current qualifying: ₹20,000 (2,000,000 paise)
    const current = 2000000;
    // Proposed equal: ₹20,000 (2,000,000 paise)
    const proposed = 2000000;

    const result = validateBidAmount(proposed, current);
    assert.strictEqual(result.isValid, false);
    assert.match(result.errorMessage || '', /Equal amount/);
  });

  it('should REJECT a lower bid amount', () => {
    // Current qualifying: ₹20,000 (2,000,000 paise)
    const current = 2000000;
    // Proposed lower: ₹19,000 (1,900,000 paise)
    const proposed = 1900000;

    const result = validateBidAmount(proposed, current);
    assert.strictEqual(result.isValid, false);
    assert.match(result.errorMessage || '', /is lower than current/);
  });

  it('should REJECT zero or negative bids', () => {
    const current = 50000;
    const zeroResult = validateBidAmount(0, current);
    assert.strictEqual(zeroResult.isValid, false);

    const negativeResult = validateBidAmount(-100, current);
    assert.strictEqual(negativeResult.isValid, false);
  });

  it('should derive the exact minimum required amount (+100 paise)', () => {
    const current = 2500000; // ₹25,000
    const minTarget = calculateMinimumTargetAmount(current);
    assert.strictEqual(minTarget, 2500100); // ₹25,001
  });

  it('should return base entry fee for an open/vacant position', () => {
    const vacant = 0;
    const minTarget = calculateMinimumTargetAmount(vacant, 50000); // ₹500 base
    assert.strictEqual(minTarget, 50000);
  });

  // INVARIANT 13: Whole Rupee Bids Only
  it('should REJECT fractional rupee / decimal amounts (Invariant 13)', () => {
    const current = 2000000; // ₹20,000

    // ₹20,000.50 (2000050 paise)
    const decimal50 = validateBidAmount(2000050, current);
    assert.strictEqual(decimal50.isValid, false);
    assert.match(decimal50.errorMessage || '', /whole Indian Rupee amount/i);

    // ₹20,000.10 (2000010 paise)
    const decimal10 = validateBidAmount(2000010, current);
    assert.strictEqual(decimal10.isValid, false);

    // ₹20,000.99 (2000099 paise)
    const decimal99 = validateBidAmount(2000099, current);
    assert.strictEqual(decimal99.isValid, false);
  });

  it('should validate whole rupee user input strings and reject decimal strings without rounding', async () => {
    const { validateWholeRupeeInput } = await import('../lib/bidding/rules.ts');

    // Valid whole rupee inputs
    assert.strictEqual(validateWholeRupeeInput('20000').isValid, true);
    assert.strictEqual(validateWholeRupeeInput('20001').isValid, true);
    assert.strictEqual(validateWholeRupeeInput(25500).isValid, true);
    assert.strictEqual(validateWholeRupeeInput('20001').paise, 2000100);

    // Invalid decimal inputs: MUST NOT round up or down
    const decimal50Result = validateWholeRupeeInput('20000.50');
    assert.strictEqual(decimal50Result.isValid, false);
    assert.strictEqual(decimal50Result.rupees, undefined);
    assert.match(decimal50Result.errorMessage || '', /without decimals/i);

    const decimal10Result = validateWholeRupeeInput('20.10');
    assert.strictEqual(decimal10Result.isValid, false);

    const decimal99Result = validateWholeRupeeInput('20000.99');
    assert.strictEqual(decimal99Result.isValid, false);

    // Invalid formats
    assert.strictEqual(validateWholeRupeeInput('0').isValid, false);
    assert.strictEqual(validateWholeRupeeInput('-50').isValid, false);
    assert.strictEqual(validateWholeRupeeInput('abc').isValid, false);
  });
});
