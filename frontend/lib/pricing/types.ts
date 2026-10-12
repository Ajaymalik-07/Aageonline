/**
 * AageOnline — Market Position Pricing Calculator Domain Types
 * Pure types for calculating read-only required qualifying amounts.
 */

export type MoneyMinor = number; // Integer minor units (paise, 100 paise = ₹1)
export type MoneyRupees = number; // Whole Indian Rupees

export type CalculationMode =
  | 'STRICT_SUPERSEDING'
  | 'INITIAL_FLOOR'
  | 'ALREADY_HOLDING_POSITION'
  | 'LOWER_POSITION';

export type PricingStatus =
  | 'CALCULATED'
  | 'ALREADY_HOLDING_POSITION'
  | 'LOWER_POSITION';

export interface MarketPricingRequest {
  marketId: string;
  targetPosition: number;
  businessId?: string;
}

export interface MarketPricingResult {
  marketId: string;
  marketSlug: string;
  targetPosition: number;
  currentPosition?: number | null;
  currentBusinessPosition?: number | null;
  currentQualifyingAmountMinor?: MoneyMinor | null;
  relevantCurrentQualifyingAmountMinor?: MoneyMinor | null;
  relevantCurrentQualifyingAmountRupees?: MoneyRupees | null;
  requiredQualifyingAmountMinor: MoneyMinor;
  requiredQualifyingAmountRupees: MoneyRupees;
  currency: 'INR';
  calculationMode: CalculationMode;
  status: PricingStatus;
  reason: string;
  calculatedAt: string;
  disclaimer: string;
}

export interface MarketRankingEntry {
  position: number;
  businessId: string;
  businessName: string;
  qualifyingAmountRupees: MoneyRupees;
  qualifyingAmountMinor: MoneyMinor;
}

export interface MarketPricingConfig {
  marketId: string;
  capacity: number;
  baseFloorRupees: MoneyRupees;
  baseFloorMinor: MoneyMinor;
  incrementRupees: MoneyRupees;
  incrementMinor: MoneyMinor;
  currency: 'INR';
}

export interface RankingStateProvider {
  getMarket(marketId: string): Promise<{
    id: string;
    slug: string;
    status: string;
    publicationStatus: string;
  } | null>;
  getMarketRankings(marketId: string): Promise<MarketRankingEntry[]>;
  getBusinessMarketPosition(marketId: string, businessId: string): Promise<number | null>;
  getPricingConfig(marketId: string): Promise<MarketPricingConfig>;
}
