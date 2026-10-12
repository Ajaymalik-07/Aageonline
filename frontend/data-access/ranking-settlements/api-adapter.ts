/**
 * AageOnline — Remote API Ranking Settlement Data Source Adapter
 *
 * Consumes Next.js App Router REST API endpoints for client-side execution.
 */

import type { RankingSettlementDataSource } from './service.ts';
import type {
  RankingSettlement,
  RankingSettlementResult,
  SettleRankingInput,
} from '../../types/ranking-settlement.ts';

export class ApiRankingSettlementDataSource implements RankingSettlementDataSource {
  private baseUrl: string;

  constructor(baseUrl: string = '') {
    this.baseUrl = baseUrl;
  }

  async settleRanking(input: SettleRankingInput): Promise<RankingSettlementResult> {
    const res = await fetch(`${this.baseUrl}/api/payments/${input.paymentOrderId}/settle-ranking`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({}),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error?.message || `Settlement request failed with HTTP ${res.status}`);
    }

    const data = await res.json();
    return data.data;
  }

  async getSettlementById(
    id: string
  ): Promise<RankingSettlement | undefined> {
    const res = await fetch(`${this.baseUrl}/api/ranking-settlements/${id}`);
    if (!res.ok) return undefined;
    const data = await res.json();
    return data.data;
  }

  async getSettlementByPaymentOrderId(
    paymentOrderId: string
  ): Promise<RankingSettlement | undefined> {
    const res = await fetch(`${this.baseUrl}/api/payments/${paymentOrderId}/settle-ranking`);
    if (!res.ok) return undefined;
    const data = await res.json();
    return data.data?.settlement;
  }

  async getBusinessSettlements(
    businessId: string
  ): Promise<RankingSettlement[]> {
    const res = await fetch(`${this.baseUrl}/api/businesses/${businessId}/ranking-settlements`);
    if (!res.ok) return [];
    const data = await res.json();
    return data.data || [];
  }
}
