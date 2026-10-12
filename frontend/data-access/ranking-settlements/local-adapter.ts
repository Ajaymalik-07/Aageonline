/**
 * AageOnline — Local Ranking Settlement Data Source Adapter
 *
 * Direct in-memory adapter executing within synchronous/test/server contexts.
 */

import type { RankingSettlementDataSource } from './service.ts';
import type {
  RankingSettlement,
  RankingSettlementResult,
  SettleRankingInput,
} from '../../types/ranking-settlement.ts';
import {
  getRankingSettlementById,
  getRankingSettlementByPaymentOrderId,
  getRankingSettlementsByBusiness,
  settleRanking,
} from '../../lib/ranking-settlement/settlement-service.ts';
import { getActiveDevSession } from '../../lib/auth/store.ts';

export class LocalRankingSettlementDataSource implements RankingSettlementDataSource {
  private resolveActorUserId(actorUserId?: string): string | undefined {
    if (process.env.NODE_ENV === 'production') {
      return actorUserId;
    }
    return actorUserId || getActiveDevSession()?.userId;
  }

  async settleRanking(input: SettleRankingInput): Promise<RankingSettlementResult> {
    const actor = this.resolveActorUserId(input.actorUserId);
    return settleRanking({
      ...input,
      actorUserId: actor,
    });
  }

  async getSettlementById(
    id: string,
    actorUserId?: string
  ): Promise<RankingSettlement | undefined> {
    const actor = this.resolveActorUserId(actorUserId);
    return getRankingSettlementById(id, actor);
  }

  async getSettlementByPaymentOrderId(
    paymentOrderId: string,
    actorUserId?: string
  ): Promise<RankingSettlement | undefined> {
    const actor = this.resolveActorUserId(actorUserId);
    return getRankingSettlementByPaymentOrderId(paymentOrderId, actor);
  }

  async getBusinessSettlements(
    businessId: string,
    actorUserId?: string
  ): Promise<RankingSettlement[]> {
    const actor = this.resolveActorUserId(actorUserId);
    return getRankingSettlementsByBusiness(businessId, actor);
  }
}
