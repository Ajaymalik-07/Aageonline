import { apiClient } from './client.ts';
import type { Market, RankingEntry } from '../../types/market';
import type { PositionQuote, BidSubmissionPayload, BidSubmissionResult } from '../../types/bidding';

export const rankingApi = {
  /**
   * Fetches all active markets.
   */
  async getMarkets(): Promise<Market[]> {
    const res = await apiClient<Market[]>('/markets', {
      next: { revalidate: 3600 },
    });
    return res.data;
  },

  /**
   * Fetches single market details by ID.
   */
  async getMarket(marketId: string): Promise<Market> {
    const res = await apiClient<Market>(`/markets/${marketId}`, {
      next: { revalidate: 300 },
    });
    return res.data;
  },

  /**
   * Fetches current ranking entries for a market.
   */
  async getRanking(marketId: string): Promise<RankingEntry[]> {
    const res = await apiClient<RankingEntry[]>(`/markets/${marketId}/ranking`, {
      next: { revalidate: 30 },
    });
    return res.data;
  },

  /**
   * Requests a server quote for target position.
   * Server recalculates pricing based on strictly-greater rule.
   */
  async getPositionQuote(marketId: string, targetPosition: number): Promise<PositionQuote> {
    const res = await apiClient<PositionQuote>(`/markets/${marketId}/position-quote`, {
      method: 'POST',
      body: JSON.stringify({ targetPosition }),
      cache: 'no-store',
    });
    return res.data;
  },

  /**
   * Submits a bid/position purchase request with idempotency key.
   */
  async submitBid(payload: BidSubmissionPayload): Promise<BidSubmissionResult> {
    const res = await apiClient<BidSubmissionResult>(`/markets/${payload.marketId}/bids`, {
      method: 'POST',
      headers: {
        'Idempotency-Key': payload.idempotencyKey,
      },
      body: JSON.stringify(payload),
      cache: 'no-store',
      retries: 0, // Never auto-retry mutating bids to avoid duplicate payment/bid creation
    });
    return res.data;
  },
};
