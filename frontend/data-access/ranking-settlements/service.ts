/**
 * AageOnline — Ranking Settlement Data Access Service
 *
 * Defines the contract and orchestration for ranking settlement operations:
 * - Decoupled data source interface
 * - Strongly typed domain validation
 * - Node strip-only mode compatibility
 */

import type {
  RankingSettlement,
  RankingSettlementResult,
  SettleRankingInput,
} from '../../types/ranking-settlement.ts';

export interface RankingSettlementDataSource {
  settleRanking(input: SettleRankingInput): Promise<RankingSettlementResult>;
  getSettlementById(id: string, actorUserId?: string): Promise<RankingSettlement | undefined>;
  getSettlementByPaymentOrderId(
    paymentOrderId: string,
    actorUserId?: string
  ): Promise<RankingSettlement | undefined>;
  getBusinessSettlements(
    businessId: string,
    actorUserId?: string
  ): Promise<RankingSettlement[]>;
}

export class RankingSettlementService {
  private dataSource: RankingSettlementDataSource;

  constructor(dataSource: RankingSettlementDataSource) {
    this.dataSource = dataSource;
  }

  async settleRanking(input: SettleRankingInput): Promise<RankingSettlementResult> {
    return this.dataSource.settleRanking(input);
  }

  async getSettlementById(
    id: string,
    actorUserId?: string
  ): Promise<RankingSettlement | undefined> {
    return this.dataSource.getSettlementById(id, actorUserId);
  }

  async getSettlementByPaymentOrderId(
    paymentOrderId: string,
    actorUserId?: string
  ): Promise<RankingSettlement | undefined> {
    return this.dataSource.getSettlementByPaymentOrderId(paymentOrderId, actorUserId);
  }

  async getBusinessSettlements(
    businessId: string,
    actorUserId?: string
  ): Promise<RankingSettlement[]> {
    return this.dataSource.getBusinessSettlements(businessId, actorUserId);
  }
}
