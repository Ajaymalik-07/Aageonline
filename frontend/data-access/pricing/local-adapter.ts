/**
 * AageOnline — Local Pricing Data Source Adapter
 */

import type { PricingDataSource } from './service.ts';
import type { MarketPricingRequest, MarketPricingResult } from '../../lib/pricing/types.ts';
import { defaultPricingCalculator, PricingCalculator } from '../../lib/pricing/index.ts';

export class LocalPricingDataSource implements PricingDataSource {
  private readonly calculator: PricingCalculator;

  constructor(calculator: PricingCalculator = defaultPricingCalculator) {
    this.calculator = calculator;
  }

  async calculateRequiredQualifyingAmount(
    req: MarketPricingRequest
  ): Promise<MarketPricingResult> {
    return this.calculator.calculateRequiredQualifyingAmount(req);
  }
}
