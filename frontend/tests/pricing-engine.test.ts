import { describe, it } from 'node:test';
import assert from 'node:assert';
import {
  validateWholeRupees,
  validateMinorUnits,
  rupeesToMinor,
  minorToRupees,
  formatRupeesINR,
  formatMinorINR,
} from '../lib/pricing/money.ts';
import {
  validateTargetPosition,
  calculateSupersedingAmountMinor,
  calculateSupersedingAmountRupees,
  DEFAULT_MARKET_CAPACITY,
  DEFAULT_MARKET_BASE_FLOOR_RUPEES,
} from '../lib/pricing/rules.ts';
import {
  PricingCalculator,
} from '../lib/pricing/calculator.ts';
import {
  InvalidTargetPositionError,
  InvalidMoneyAmountError,
  InvalidMarketError,
  MarketUnavailableError,
} from '../lib/pricing/errors.ts';
import { CanonicalRankingStateProvider } from '../lib/pricing/canonical-provider.ts';
import { LocalPricingDataSource } from '../data-access/pricing/local-adapter.ts';
import { PricingService } from '../data-access/pricing/service.ts';
import type { RankingStateProvider } from '../lib/pricing/types.ts';

describe('Pricing Engine — Whole Rupee and Money Validation', () => {
  it('should accept valid positive whole Indian Rupees', () => {
    assert.strictEqual(validateWholeRupees(1), 1);
    assert.strictEqual(validateWholeRupees(20000), 20000);
    assert.strictEqual(validateWholeRupees(20001), 20001);
    assert.strictEqual(validateWholeRupees(20050), 20050);
    assert.strictEqual(validateWholeRupees(38500), 38500);
    assert.strictEqual(validateWholeRupees(100000), 100000);
  });

  it('should REJECT decimal rupees without rounding or ceiling', () => {
    assert.throws(() => validateWholeRupees(20000.5), InvalidMoneyAmountError);
    assert.throws(() => validateWholeRupees(20000.1), InvalidMoneyAmountError);
    assert.throws(() => validateWholeRupees(0.5), InvalidMoneyAmountError);
    assert.throws(() => validateWholeRupees(20.5), InvalidMoneyAmountError);
    assert.throws(() => validateWholeRupees(20.99), InvalidMoneyAmountError);
  });

  it('should REJECT zero, negative, NaN, and infinite rupee values', () => {
    assert.throws(() => validateWholeRupees(0), InvalidMoneyAmountError);
    assert.throws(() => validateWholeRupees(-1), InvalidMoneyAmountError);
    assert.throws(() => validateWholeRupees(-20000), InvalidMoneyAmountError);
    assert.throws(() => validateWholeRupees(NaN), InvalidMoneyAmountError);
    assert.throws(() => validateWholeRupees(Infinity), InvalidMoneyAmountError);
    assert.throws(() => validateWholeRupees(Number.MAX_SAFE_INTEGER + 1), InvalidMoneyAmountError);
  });

  it('should validate integer minor units (paise) where amountMinor % 100 === 0', () => {
    assert.strictEqual(validateMinorUnits(100), 100); // ₹1
    assert.strictEqual(validateMinorUnits(2000000), 2000000); // ₹20,000
    assert.strictEqual(validateMinorUnits(2000100), 2000100); // ₹20,001

    // Fractional paise or non-whole-rupee minor units
    assert.throws(() => validateMinorUnits(2000050), InvalidMoneyAmountError); // 50 paise
    assert.throws(() => validateMinorUnits(15), InvalidMoneyAmountError); // 15 paise
    assert.throws(() => validateMinorUnits(0), InvalidMoneyAmountError);
    assert.throws(() => validateMinorUnits(-100), InvalidMoneyAmountError);
    assert.throws(() => validateMinorUnits(100.5), InvalidMoneyAmountError);
  });

  it('should correctly convert whole rupees to minor units and vice versa', () => {
    assert.strictEqual(rupeesToMinor(1), 100);
    assert.strictEqual(rupeesToMinor(20000), 2000000);
    assert.strictEqual(rupeesToMinor(20001), 2000100);

    assert.strictEqual(minorToRupees(100), 1);
    assert.strictEqual(minorToRupees(2000000), 2000000 / 100);
    assert.strictEqual(minorToRupees(2000100), 20001);
  });

  it('should format Indian Rupee representations accurately', () => {
    assert.strictEqual(formatRupeesINR(20000), '₹20,000');
    assert.strictEqual(formatRupeesINR(20001), '₹20,001');
    assert.strictEqual(formatMinorINR(2000000), '₹20,000');
    assert.strictEqual(formatMinorINR(2000100), '₹20,001');
  });
});

describe('Pricing Engine — Target Position Rules & Capacity', () => {
  it('should accept valid integer positions from 1 to capacity', () => {
    assert.strictEqual(validateTargetPosition(1, 100), 1);
    assert.strictEqual(validateTargetPosition(2, 100), 2);
    assert.strictEqual(validateTargetPosition(50, 100), 50);
    assert.strictEqual(validateTargetPosition(100, 100), 100);
  });

  it('should REJECT non-positive positions (0, negative)', () => {
    assert.throws(() => validateTargetPosition(0, 100), InvalidTargetPositionError);
    assert.throws(() => validateTargetPosition(-1, 100), InvalidTargetPositionError);
    assert.throws(() => validateTargetPosition(-10, 100), InvalidTargetPositionError);
  });

  it('should REJECT fractional and decimal positions', () => {
    assert.throws(() => validateTargetPosition(1.5, 100), InvalidTargetPositionError);
    assert.throws(() => validateTargetPosition(2.1, 100), InvalidTargetPositionError);
    assert.throws(() => validateTargetPosition(0.9, 100), InvalidTargetPositionError);
  });

  it('should REJECT NaN, Infinity, and non-numeric positions', () => {
    assert.throws(() => validateTargetPosition(NaN, 100), InvalidTargetPositionError);
    assert.throws(() => validateTargetPosition(Infinity, 100), InvalidTargetPositionError);
    assert.throws(() => validateTargetPosition(-Infinity, 100), InvalidTargetPositionError);
  });

  it('should REJECT positions exceeding market capacity', () => {
    assert.throws(() => validateTargetPosition(101, 100), InvalidTargetPositionError);
    assert.throws(() => validateTargetPosition(500, 100), InvalidTargetPositionError);
    assert.throws(() => validateTargetPosition(21, 20), InvalidTargetPositionError);
  });
});

describe('Pricing Engine — Strict Superseding Rules', () => {
  it('should require strictly exceeding current amount by at least ₹1 (100 paise)', () => {
    // Current occupant: ₹20,000 (2,000,000 paise)
    const currentMinor = 2000000;
    const requiredMinor = calculateSupersedingAmountMinor(currentMinor);

    assert.strictEqual(requiredMinor, 2000100); // ₹20,001
    assert.strictEqual(calculateSupersedingAmountRupees(20000), 20001);
  });

  it('should enforce that equal or lower amounts are invalid superseding amounts', () => {
    const currentMinor = 2000000; // ₹20,000
    const requiredMinor = calculateSupersedingAmountMinor(currentMinor);

    // Any proposed amount must strictly satisfy proposedMinor >= requiredMinor
    assert.strictEqual(2000000 >= requiredMinor, false, 'Equal amount must not qualify');
    assert.strictEqual(1999900 >= requiredMinor, false, 'Lower amount must not qualify');
    assert.strictEqual(2000100 >= requiredMinor, true, 'Next integer amount qualifies');
    assert.strictEqual(2500000 >= requiredMinor, true, 'Higher amount qualifies');
  });
});

describe('Pricing Engine — Deterministic Calculator Calculations', () => {
  // Mock ranking provider conforming to RankingStateProvider
  const mockRankingProvider: RankingStateProvider = {
    async getMarket(marketId: string) {
      if (marketId === 'non-existent') return null;

      if (marketId === 'mkt-draft') {
        return {
          id: 'mkt-draft',
          slug: 'draft/market',
          status: 'DRAFT',
          publicationStatus: 'DRAFT',
        };
      }

      if (marketId === 'mkt-empty') {
        return {
          id: 'mkt-empty',
          slug: 'empty/market',
          status: 'ACTIVE',
          publicationStatus: 'PUBLISHED',
        };
      }

      if (marketId === 'mkt-sample') {
        return {
          id: 'mkt-sample',
          slug: 'sample/market',
          status: 'ACTIVE',
          publicationStatus: 'PUBLISHED',
        };
      }

      return null;
    },

    async getMarketRankings(marketId: string) {
      if (marketId === 'mkt-sample') {
        return [
          {
            position: 1,
            businessId: 'biz-leader',
            businessName: 'Leader Co',
            qualifyingAmountRupees: 40000,
            qualifyingAmountMinor: 4000000,
          },
          {
            position: 2,
            businessId: 'biz-second',
            businessName: 'Second Co',
            qualifyingAmountRupees: 30000,
            qualifyingAmountMinor: 3000000,
          },
          {
            position: 3,
            businessId: 'biz-third',
            businessName: 'Third Co',
            qualifyingAmountRupees: 25000,
            qualifyingAmountMinor: 2500000,
          },
          {
            position: 5,
            businessId: 'biz-challenger',
            businessName: 'Challenger Co',
            qualifyingAmountRupees: 15000,
            qualifyingAmountMinor: 1500000,
          },
        ];
      }
      return [];
    },

    async getBusinessMarketPosition(marketId: string, businessId: string) {
      if (marketId === 'mkt-sample') {
        if (businessId === 'biz-leader') return 1;
        if (businessId === 'biz-challenger') return 5;
      }
      return null;
    },

    async getPricingConfig(marketId: string) {
      return {
        marketId,
        capacity: 50,
        baseFloorRupees: 1000,
        baseFloorMinor: 100000,
        incrementRupees: 1,
        incrementMinor: 100,
        currency: 'INR',
      };
    },
  };

  const calculator = new PricingCalculator(mockRankingProvider);

  it('should calculate target #1 strictly exceeding current occupant amount', async () => {
    const res = await calculator.calculateRequiredQualifyingAmount({
      marketId: 'mkt-sample',
      targetPosition: 1,
    });

    assert.strictEqual(res.marketId, 'mkt-sample');
    assert.strictEqual(res.targetPosition, 1);
    assert.strictEqual(res.currentPosition, null);
    assert.strictEqual(res.currentQualifyingAmountMinor, 4000000); // ₹40,000
    assert.strictEqual(res.requiredQualifyingAmountMinor, 4000100); // ₹40,001
    assert.strictEqual(res.requiredQualifyingAmountRupees, 40001);
    assert.strictEqual(res.calculationMode, 'STRICT_SUPERSEDING');
    assert.strictEqual(res.currency, 'INR');
    assert.ok(res.reason.includes('₹40,000'));
    assert.ok(res.reason.includes('by at least ₹1'));
  });

  it('should calculate target for vacant position using market base floor', async () => {
    // Position 4 is vacant in mkt-sample
    const res = await calculator.calculateRequiredQualifyingAmount({
      marketId: 'mkt-sample',
      targetPosition: 4,
    });

    assert.strictEqual(res.targetPosition, 4);
    assert.strictEqual(res.currentQualifyingAmountMinor, null);
    assert.strictEqual(res.requiredQualifyingAmountMinor, 100000); // ₹1,000
    assert.strictEqual(res.requiredQualifyingAmountRupees, 1000);
    assert.strictEqual(res.calculationMode, 'INITIAL_FLOOR');
    assert.ok(res.reason.includes('unoccupied'));
  });

  it('should handle completely empty market using base floor', async () => {
    const res = await calculator.calculateRequiredQualifyingAmount({
      marketId: 'mkt-empty',
      targetPosition: 1,
    });

    assert.strictEqual(res.targetPosition, 1);
    assert.strictEqual(res.requiredQualifyingAmountMinor, 100000); // ₹1,000
    assert.strictEqual(res.requiredQualifyingAmountRupees, 1000);
    assert.strictEqual(res.calculationMode, 'INITIAL_FLOOR');
  });

  it('should identify when a business targets its own position (ALREADY_HOLDING_POSITION)', async () => {
    const res = await calculator.calculateRequiredQualifyingAmount({
      marketId: 'mkt-sample',
      targetPosition: 1,
      businessId: 'biz-leader',
    });

    assert.strictEqual(res.currentPosition, 1);
    assert.strictEqual(res.targetPosition, 1);
    assert.strictEqual(res.calculationMode, 'ALREADY_HOLDING_POSITION');
    assert.strictEqual(res.requiredQualifyingAmountMinor, 4000000);
    assert.strictEqual(res.requiredQualifyingAmountRupees, 40000);
    assert.ok(res.reason.includes('already holds'));
  });

  it('should identify when a business targets a lower position (LOWER_POSITION)', async () => {
    const res = await calculator.calculateRequiredQualifyingAmount({
      marketId: 'mkt-sample',
      targetPosition: 3,
      businessId: 'biz-leader', // Holds #1, targeting #3
    });

    assert.strictEqual(res.currentPosition, 1);
    assert.strictEqual(res.targetPosition, 3);
    assert.strictEqual(res.calculationMode, 'LOWER_POSITION');
    assert.strictEqual(res.requiredQualifyingAmountMinor, 2500000); // Floor of #3
    assert.ok(res.reason.includes('lower visibility position (#3)'));
    assert.ok(res.reason.includes('current position (#1)'));
  });

  it('should calculate upward jump correctly (biz-challenger holding #5 targeting #2)', async () => {
    const res = await calculator.calculateRequiredQualifyingAmount({
      marketId: 'mkt-sample',
      targetPosition: 2,
      businessId: 'biz-challenger',
    });

    assert.strictEqual(res.currentPosition, 5);
    assert.strictEqual(res.targetPosition, 2);
    assert.strictEqual(res.calculationMode, 'STRICT_SUPERSEDING');
    assert.strictEqual(res.currentQualifyingAmountMinor, 3000000); // #2 is held at ₹30,000
    assert.strictEqual(res.requiredQualifyingAmountMinor, 3000100); // ₹30,001
    assert.strictEqual(res.requiredQualifyingAmountRupees, 30001);
  });

  it('should reject non-existent market with InvalidMarketError', async () => {
    await assert.rejects(
      () =>
        calculator.calculateRequiredQualifyingAmount({
          marketId: 'non-existent',
          targetPosition: 1,
        }),
      InvalidMarketError
    );
  });

  it('should reject unpermitted market status with MarketUnavailableError', async () => {
    await assert.rejects(
      () =>
        calculator.calculateRequiredQualifyingAmount({
          marketId: 'mkt-draft',
          targetPosition: 1,
        }),
      MarketUnavailableError
    );
  });

  it('should reject invalid target positions beyond capacity', async () => {
    await assert.rejects(
      () =>
        calculator.calculateRequiredQualifyingAmount({
          marketId: 'mkt-sample',
          targetPosition: 51, // capacity is 50
        }),
      InvalidTargetPositionError
    );
  });

  it('should produce strictly deterministic outputs across 10 iterations', async () => {
    const firstRes = await calculator.calculateRequiredQualifyingAmount({
      marketId: 'mkt-sample',
      targetPosition: 3,
    });

    for (let i = 0; i < 10; i++) {
      const subsequentRes = await calculator.calculateRequiredQualifyingAmount({
        marketId: 'mkt-sample',
        targetPosition: 3,
      });

      assert.strictEqual(subsequentRes.requiredQualifyingAmountMinor, firstRes.requiredQualifyingAmountMinor);
      assert.strictEqual(subsequentRes.requiredQualifyingAmountRupees, firstRes.requiredQualifyingAmountRupees);
      assert.strictEqual(subsequentRes.calculationMode, firstRes.calculationMode);
    }
  });
});

describe('Pricing Engine — Canonical Provider & Real Market Data Integration', () => {
  const canonicalProvider = new CanonicalRankingStateProvider();
  const pricingService = new PricingService(new LocalPricingDataSource(new PricingCalculator(canonicalProvider)));

  it('should resolve real market Jaipur Interior Designers (mkt-jaipur-interior-designers)', async () => {
    const res = await pricingService.calculateRequiredQualifyingAmount({
      marketId: 'mkt-jaipur-interior-designers',
      targetPosition: 1,
    });

    assert.strictEqual(res.marketId, 'mkt-jaipur-interior-designers');
    assert.strictEqual(res.targetPosition, 1);
    assert.ok(res.requiredQualifyingAmountMinor > 0);
    assert.ok(res.requiredQualifyingAmountRupees > 0);
    assert.strictEqual(res.requiredQualifyingAmountMinor % 100, 0); // whole rupees
    assert.strictEqual(res.currency, 'INR');
  });

  it('should resolve pricing for unranked position targeting #5', async () => {
    const res = await pricingService.calculateRequiredQualifyingAmount({
      marketId: 'mkt-jaipur-interior-designers',
      targetPosition: 5,
    });

    assert.strictEqual(res.targetPosition, 5);
    assert.ok(res.requiredQualifyingAmountMinor > 0);
  });

  it('should compute base entry floor for vacant tail position (e.g. #99)', async () => {
    const res = await pricingService.calculateRequiredQualifyingAmount({
      marketId: 'mkt-jaipur-interior-designers',
      targetPosition: 99,
    });

    assert.strictEqual(res.targetPosition, 99);
    assert.strictEqual(res.calculationMode, 'INITIAL_FLOOR');
    assert.strictEqual(res.requiredQualifyingAmountRupees, DEFAULT_MARKET_BASE_FLOOR_RUPEES);
  });
});

describe('Pricing Engine — ZERO Financial and State Mutation Guarantee', () => {
  it('should execute 50 pricing calculations without mutating underlying market rankings', async () => {
    const canonicalProvider = new CanonicalRankingStateProvider();
    const calculator = new PricingCalculator(canonicalProvider);

    // Snapshot state before calculations
    const stateBefore = await canonicalProvider.getMarketRankings('mkt-jaipur-interior-designers');
    assert.ok(stateBefore.length > 0);
    const serializedBefore = JSON.stringify(stateBefore);

    // Execute multiple calculations
    const positionsToTest = [1, 2, 3, 5, 8, 20, 99];
    for (let i = 0; i < 50; i++) {
      const pos = positionsToTest[i % positionsToTest.length];
      await calculator.calculateRequiredQualifyingAmount({
        marketId: 'mkt-jaipur-interior-designers',
        targetPosition: pos,
      });
    }

    // Snapshot state after calculations
    const stateAfter = await canonicalProvider.getMarketRankings('mkt-jaipur-interior-designers');
    assert.ok(stateAfter.length > 0);
    const serializedAfter = JSON.stringify(stateAfter);

    assert.strictEqual(
      serializedAfter,
      serializedBefore,
      'Underlying market ranking state MUST remain 100% byte-for-byte identical after calculations.'
    );
  });
});

describe('Pricing Engine — Cross-Business Isolation', () => {
  it('should not leak business context across different businesses', async () => {
    const canonicalProvider = new CanonicalRankingStateProvider();
    const calculator = new PricingCalculator(canonicalProvider);

    // Business A (holding position in jaipur)
    const resA = await calculator.calculateRequiredQualifyingAmount({
      marketId: 'mkt-jaipur-interior-designers',
      targetPosition: 1,
      businessId: 'biz-jpr-01',
    });

    // Business B (different business)
    const resB = await calculator.calculateRequiredQualifyingAmount({
      marketId: 'mkt-jaipur-interior-designers',
      targetPosition: 1,
      businessId: 'biz-nonexistent',
    });

    assert.strictEqual(resA.targetPosition, 1);
    assert.strictEqual(resB.targetPosition, 1);
    assert.strictEqual(resA.calculationMode, 'ALREADY_HOLDING_POSITION');
    assert.strictEqual(resB.calculationMode, 'STRICT_SUPERSEDING');
    assert.strictEqual(resA.requiredQualifyingAmountMinor, 2850000); // Own current qualifying amount
    assert.strictEqual(resB.requiredQualifyingAmountMinor, 2850100); // Superseding amount required for outside business
    assert.strictEqual(resA.currentPosition, 1);
    assert.strictEqual(resB.currentPosition, null);
  });
});
