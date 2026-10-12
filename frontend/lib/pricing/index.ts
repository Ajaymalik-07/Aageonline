/**
 * AageOnline — Pricing Domain Barrel
 */

import { PricingCalculator } from './calculator.ts';
import { CanonicalRankingStateProvider } from './canonical-provider.ts';

export * from './types.ts';
export * from './errors.ts';
export * from './money.ts';
export * from './rules.ts';
export * from './calculator.ts';
export * from './canonical-provider.ts';

export const canonicalRankingProvider = new CanonicalRankingStateProvider();
export const defaultPricingCalculator = new PricingCalculator(canonicalRankingProvider);
