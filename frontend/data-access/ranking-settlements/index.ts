/**
 * AageOnline — Ranking Settlement Data Access Module
 */

import { LocalRankingSettlementDataSource } from './local-adapter.ts';
import { ApiRankingSettlementDataSource } from './api-adapter.ts';
import { RankingSettlementService } from './service.ts';

export * from './service.ts';
export * from './local-adapter.ts';
export * from './api-adapter.ts';

const isProductionApi = process.env.NEXT_PUBLIC_USE_REMOTE_API === 'true';

export const rankingSettlementDataSource = isProductionApi
  ? new ApiRankingSettlementDataSource()
  : new LocalRankingSettlementDataSource();

export const rankingSettlementService = new RankingSettlementService(
  rankingSettlementDataSource
);
