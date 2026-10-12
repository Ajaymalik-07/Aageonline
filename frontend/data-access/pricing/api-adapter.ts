/**
 * AageOnline — Remote API Pricing Data Source Adapter
 */

import type { PricingDataSource } from './service.ts';
import type { MarketPricingRequest, MarketPricingResult } from '../../lib/pricing/types.ts';
import { PricingError } from '../../lib/pricing/errors.ts';

export class ApiPricingDataSource implements PricingDataSource {
  private readonly baseUrl: string;

  constructor(baseUrl = '') {
    this.baseUrl = baseUrl;
  }

  async calculateRequiredQualifyingAmount(
    req: MarketPricingRequest
  ): Promise<MarketPricingResult> {
    const url = new URL(`${this.baseUrl}/api/markets/${encodeURIComponent(req.marketId)}/pricing`, 'http://localhost');
    url.searchParams.set('targetPosition', String(req.targetPosition));
    if (req.businessId) {
      url.searchParams.set('businessId', req.businessId);
    }

    const relativeUrl = `${url.pathname}${url.search}`;
    const res = await fetch(relativeUrl);

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      const message =
        (err as { error?: { message?: string } })?.error?.message ||
        `Pricing API returned status ${res.status}: ${res.statusText}`;
      const code = (err as { error?: { code?: string } })?.error?.code || 'PRICING_API_ERROR';
      throw new PricingError(message, code, res.status);
    }

    const data = await res.json();
    const result: MarketPricingResult = (data as { data: MarketPricingResult }).data;

    // Strict Response Validation
    if (
      !result ||
      typeof result.marketId !== 'string' ||
      typeof result.targetPosition !== 'number' ||
      typeof result.requiredQualifyingAmountRupees !== 'number' ||
      typeof result.requiredQualifyingAmountMinor !== 'number' ||
      result.requiredQualifyingAmountRupees <= 0 ||
      result.requiredQualifyingAmountMinor <= 0 ||
      result.requiredQualifyingAmountMinor % 100 !== 0 ||
      !result.calculationMode
    ) {
      throw new PricingError(
        'Invalid or corrupted pricing response received from server.',
        'MALFORMED_PRICING_RESPONSE',
        500
      );
    }

    return result;
  }
}
