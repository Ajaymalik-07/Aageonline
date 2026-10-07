export interface Location {
  id: string;
  name: string;
  slug: string;
  state: string;
  stateSlug: string;
  country: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
  icon?: string;
}

export interface Market {
  id: string;
  location: Location;
  category: Category;
  slug: string; // e.g. "jaipur/interior-designers"
  totalBusinesses: number;
  activePositions: number;
  topQualifyingAmountMinor: number; // In paise (minor units, e.g. 2600000 = ₹26,000)
  updatedAt: string;
  status: 'ACTIVE' | 'EMERGING' | 'MAINTENANCE';
}

export interface RankingEntry {
  position: number;
  businessId: string;
  businessName: string;
  businessSlug: string;
  isVerified: boolean;
  visibilityAmountMinor: number; // Current paid visibility amount in paise
  previousPosition?: number;
  movementType?: 'GAINED' | 'LOST' | 'UNCHANGED' | 'ENTERED';
  updatedAt: string;
}

export interface MarketSpotlight {
  market: Market;
  topBusiness: RankingEntry;
  totalMovementsLast24h: number;
  competitiveScore: number;
}

export type MilestoneTier =
  | 'TOP_1'
  | 'TOP_5'
  | 'TOP_10'
  | 'TOP_20'
  | 'TOP_30'
  | 'TOP_50'
  | 'TOP_75'
  | 'TOP_100';

export interface MilestoneEvent {
  businessId: string;
  marketId: string;
  fromPosition: number;
  toPosition: number;
  tier: MilestoneTier;
  timestamp: string;
}
