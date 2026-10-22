import type { Market, MilestoneTier } from '../types/market';
import { SUPPORTED_MARKETS } from '../data/markets/index.ts';

export const MILESTONE_LADDER: { threshold: number; tier: MilestoneTier }[] = [
  { threshold: 1, tier: 'TOP_1' },
  { threshold: 5, tier: 'TOP_5' },
  { threshold: 10, tier: 'TOP_10' },
  { threshold: 20, tier: 'TOP_20' },
  { threshold: 30, tier: 'TOP_30' },
  { threshold: 50, tier: 'TOP_50' },
  { threshold: 75, tier: 'TOP_75' },
  { threshold: 100, tier: 'TOP_100' },
];

export const INITIAL_FEATURED_MARKETS: Market[] = Object.values(SUPPORTED_MARKETS).map(
  (entry) => entry.market
);

