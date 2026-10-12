/**
 * AageOnline — Pricing Data Access Service Contract
 */

import type { MarketPricingRequest, MarketPricingResult } from '../../lib/pricing/types.ts';

export interface PricingDataSource {
  calculateRequiredQualifyingAmount(req: MarketPricingRequest): Promise<MarketPricingResult>;
}

export class PricingService {
  private readonly dataSource: PricingDataSource;

  constructor(dataSource: PricingDataSource) {
    this.dataSource = dataSource;
  }

  async calculateRequiredQualifyingAmount(
    req: MarketPricingRequest
  ): Promise<MarketPricingResult> {
    return this.dataSource.calculateRequiredQualifyingAmount(req);
  }
}
