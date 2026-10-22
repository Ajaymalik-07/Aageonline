/**
 * AageOnline — Remote REST API Bid Intent Data Source Adapter
 */

import type { BidIntentDataSource } from './service.ts';
import type {
  BidIntent,
  BidIntentFilter,
  CancelBidIntentInput,
  CreateBidIntentInput,
} from '../../types/bid-intent.ts';
import {
  BidIntentError,
  IdempotencyKeyReusedError,
  PricingChangedError,
} from '../../lib/bid-intent/errors.ts';

export class ApiBidIntentDataSource implements BidIntentDataSource {
  private readonly baseUrl: string;

  constructor(baseUrl = '') {
    this.baseUrl = baseUrl;
  }

  async createBidIntent(input: CreateBidIntentInput): Promise<BidIntent> {
    const res = await fetch(`${this.baseUrl}/api/bid-intents`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Idempotency-Key': input.idempotencyKey,
      },
      body: JSON.stringify({
        businessId: input.businessId,
        marketId: input.marketId,
        targetPosition: input.targetPosition,
        clientCalculatedAmountMinor: input.clientCalculatedAmountMinor,
        offeredAmountMinor: input.offeredAmountMinor,
      }),
    });

    const json = await res.json();

    if (!res.ok) {
      if (json.error?.code === 'PRICING_CHANGED') {
        throw new PricingChangedError(
          json.error.details?.previousCalculatedAmountMinor || 0,
          json.error.details?.currentRequiredAmountMinor || 0,
          json.error.details?.currentRequiredAmountRupees || 0
        );
      }
      if (json.error?.code === 'IDEMPOTENCY_KEY_REUSED') {
        throw new IdempotencyKeyReusedError(json.error.message);
      }
      throw new BidIntentError(
        json.error?.message || 'Failed to create visibility intent',
        json.error?.code || 'UNKNOWN_ERROR',
        res.status,
        json.error?.details
      );
    }

    return json.data as BidIntent;
  }

  async getBidIntentById(id: string): Promise<BidIntent> {
    const res = await fetch(`${this.baseUrl}/api/bid-intents/${encodeURIComponent(id)}`);
    const json = await res.json();

    if (!res.ok) {
      throw new BidIntentError(
        json.error?.message || 'Failed to load visibility intent',
        json.error?.code || 'UNKNOWN_ERROR',
        res.status
      );
    }

    return json.data as BidIntent;
  }

  async cancelBidIntent(input: CancelBidIntentInput): Promise<BidIntent> {
    const res = await fetch(`${this.baseUrl}/api/bid-intents/${encodeURIComponent(input.bidIntentId)}/cancel`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        businessId: input.businessId,
      }),
    });

    const json = await res.json();

    if (!res.ok) {
      throw new BidIntentError(
        json.error?.message || 'Failed to cancel visibility intent',
        json.error?.code || 'UNKNOWN_ERROR',
        res.status
      );
    }

    return json.data as BidIntent;
  }

  async getBidIntentsByBusiness(
    businessId: string,
    _actorUserId?: string,
    filter?: Omit<BidIntentFilter, 'businessId'>
  ): Promise<{ intents: BidIntent[]; total: number }> {
    const params = new URLSearchParams();
    if (filter?.marketId) params.set('marketId', filter.marketId);
    if (filter?.status) params.set('status', filter.status);
    if (filter?.limit) params.set('limit', filter.limit.toString());
    if (filter?.offset) params.set('offset', filter.offset.toString());

    const qs = params.toString() ? `?${params.toString()}` : '';
    const res = await fetch(`${this.baseUrl}/api/businesses/${encodeURIComponent(businessId)}/bid-intents${qs}`);
    const json = await res.json();

    if (!res.ok) {
      throw new BidIntentError(
        json.error?.message || 'Failed to list business visibility intents',
        json.error?.code || 'UNKNOWN_ERROR',
        res.status
      );
    }

    return {
      intents: json.data as BidIntent[],
      total: json.meta?.total || (json.data as BidIntent[]).length,
    };
  }
}
