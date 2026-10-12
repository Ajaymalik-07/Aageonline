/**
 * AageOnline — Canonical Ranking State Provider
 * Connects the pricing calculator to authoritative in-memory market and participation registries.
 */

import { getBusinessById, getMarketParticipationsByMarket } from '../taxonomy/businesses.ts';
import { getMarketById } from '../taxonomy/markets.ts';
import { SUPPORTED_MARKETS } from '../../data/markets/index.ts';
import type {
  MarketPricingConfig,
  MarketRankingEntry,
  RankingStateProvider,
} from './types.ts';
import { DEFAULT_BASE_FLOOR_PAISE, DEFAULT_BASE_FLOOR_RUPEES, DEFAULT_MARKET_CAPACITY } from './rules.ts';

export class CanonicalRankingStateProvider implements RankingStateProvider {
  async getMarket(marketId: string) {
    const market = getMarketById(marketId);
    if (!market) return null;
    return {
      id: market.id,
      slug: market.slug,
      status: market.status,
      publicationStatus: market.publicationStatus,
    };
  }

  async getMarketRankings(marketId: string): Promise<MarketRankingEntry[]> {
    // 1. First check dynamic business participations store
    const participations = getMarketParticipationsByMarket(marketId);
    const rankedParticipations = participations.filter(
      (p) => typeof p.currentPosition === 'number' && p.currentPosition > 0 && p.status === 'ACTIVE'
    );

    if (rankedParticipations.length > 0) {
      return rankedParticipations
        .map((p) => {
          const biz = getBusinessById(p.businessId);
          const rupees = p.qualifyingAmountRupees || 1000;
          return {
            position: p.currentPosition!,
            businessId: p.businessId,
            businessName: biz?.name || 'Commercial Entity',
            qualifyingAmountRupees: rupees,
            qualifyingAmountMinor: rupees * 100,
          };
        })
        .sort((a, b) => a.position - b.position);
    }

    // 2. Fall back to curated supported market rankings
    const market = getMarketById(marketId);
    if (market && SUPPORTED_MARKETS[market.slug]) {
      const pageData = SUPPORTED_MARKETS[market.slug];
      return pageData.rankings.map((r) => ({
        position: r.rank,
        businessId: r.id,
        businessName: r.name,
        qualifyingAmountRupees: r.qualifyingAmountRupees,
        qualifyingAmountMinor: r.qualifyingAmountRupees * 100,
      }));
    }

    return [];
  }

  async getBusinessMarketPosition(
    marketId: string,
    businessId: string
  ): Promise<number | null> {
    const participations = getMarketParticipationsByMarket(marketId);
    const part = participations.find((p) => p.businessId === businessId && p.status === 'ACTIVE');
    if (part && typeof part.currentPosition === 'number' && part.currentPosition > 0) {
      return part.currentPosition;
    }

    const market = getMarketById(marketId);
    if (market && SUPPORTED_MARKETS[market.slug]) {
      const pageData = SUPPORTED_MARKETS[market.slug];
      const found = pageData.rankings.find((r) => r.id === businessId);
      if (found) return found.rank;
    }

    return null;
  }

  async getPricingConfig(marketId: string): Promise<MarketPricingConfig> {
    const market = getMarketById(marketId);
    const capacity = market?.activePositions ? Math.max(market.activePositions, DEFAULT_MARKET_CAPACITY) : DEFAULT_MARKET_CAPACITY;

    return {
      marketId,
      capacity,
      baseFloorRupees: DEFAULT_BASE_FLOOR_RUPEES,
      baseFloorMinor: DEFAULT_BASE_FLOOR_PAISE,
      incrementRupees: 1,
      incrementMinor: 100,
      currency: 'INR',
    };
  }
}
