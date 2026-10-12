import type { Market, RankingEntry } from '../../types/market';

export interface MarketBusinessItem {
  id: string;
  name: string;
  slug: string;
  rank: number;
  area: string;
  category: string;
  qualifyingAmountRupees: number;
  isVerified: boolean;
  specialties: string[];
  description: string;
}

export interface DirectAnswerBlock {
  question: string;
  answer: string;
}

export interface FAQItem {
  question: string;
  answer: string;
}

export interface RelatedMarketLink {
  title: string;
  location: string;
  category: string;
  slug: string;
  qualifyingAmountRupees: number;
}

export interface RelatedCategoryLink {
  title: string;
  slug: string;
  description: string;
}

export const JAIPUR_INTERIOR_DESIGNERS_MARKET: Market = {
  id: 'mkt-jaipur-interior-designers',
  slug: 'jaipur/interior-designers',
  location: {
    id: 'loc-jaipur',
    name: 'Jaipur',
    slug: 'jaipur',
    state: 'Rajasthan',
    stateSlug: 'rajasthan',
    country: 'India',
  },
  category: {
    id: 'cat-interior-designers',
    name: 'Interior Designers',
    slug: 'interior-designers',
    description: 'Residential, commercial, and modular interior designing specialists across Jaipur.',
  },
  totalBusinesses: 20,
  activePositions: 24,
  topQualifyingAmountMinor: 2850000, // ₹28,500
  updatedAt: '2026-10-08T06:00:00.000Z',
  status: 'ACTIVE',
};

export const JAIPUR_INTERIOR_DESIGNERS_RANKINGS: MarketBusinessItem[] = [
  {
    id: 'biz-jpr-01',
    name: 'ABC Interiors & Spacecraft Studio',
    slug: 'abc-interiors-jaipur',
    rank: 1,
    area: 'C-Scheme',
    category: 'Interior Designers',
    qualifyingAmountRupees: 28500,
    isVerified: true,
    specialties: ['Luxury Residential', 'Boutique Commercial', 'Heritage Contemporary Fusion'],
    description: 'Established studio specializing in bespoke architectural interiors and modern turnkey residential projects throughout central and southern Jaipur.',
  },
  {
    id: 'biz-jpr-02',
    name: 'Studio XYZ Architectural Living',
    slug: 'studio-xyz-jaipur',
    rank: 2,
    area: 'Malviya Nagar',
    category: 'Interior Designers',
    qualifyingAmountRupees: 27000,
    isVerified: true,
    specialties: ['Modern Apartments', 'Modular Kitchen Systems', 'Executive Corporate Offices'],
    description: 'Design and execution practice focused on clean spatial layouts, modular engineering, and ergonomic corporate workspace transformations.',
  },
  {
    id: 'biz-jpr-03',
    name: 'Design House Rajasthan',
    slug: 'design-house-rajasthan',
    rank: 3,
    area: 'Vaishali Nagar',
    category: 'Interior Designers',
    qualifyingAmountRupees: 24500,
    isVerified: true,
    specialties: ['Luxury Villas', 'Havelis & Heritage Renovation', 'Artisanal Woodwork'],
    description: 'Specialists in expansive bungalow environments, traditional Rajasthani stone integration, and comprehensive bespoke furniture fabrication.',
  },
  {
    id: 'biz-jpr-04',
    name: 'Urban Craft Interiors',
    slug: 'urban-craft-jaipur',
    rank: 4,
    area: 'Mansarovar',
    category: 'Interior Designers',
    qualifyingAmountRupees: 22000,
    isVerified: true,
    specialties: ['Budget-Optimized Flats', 'Modular Storage', 'Turnkey Execution'],
    description: 'End-to-end residential interiors team delivering high-efficiency storage solutions, custom wardrobes, and smart modular kitchens.',
  },
  {
    id: 'biz-jpr-05',
    name: 'SpaceCraft Atelier Jaipur',
    slug: 'spacecraft-atelier-jaipur',
    rank: 5,
    area: 'Civil Lines',
    category: 'Interior Designers',
    qualifyingAmountRupees: 19000,
    isVerified: true,
    specialties: ['Bespoke Penthouse Living', 'Minimalist Aesthetics', 'Lighting Architecture'],
    description: 'Boutique consultancy known for architectural lighting integration, refined color palettes, and curated contemporary furniture styling.',
  },
  {
    id: 'biz-jpr-06',
    name: 'Heritage Line Living Concepts',
    slug: 'heritage-line-jaipur',
    rank: 6,
    area: 'Raja Park',
    category: 'Interior Designers',
    qualifyingAmountRupees: 16500,
    isVerified: true,
    specialties: ['Retail Showrooms', 'Hospitality Lounges', 'Theme Cafes'],
    description: 'Commercial interior practice with extensive experience in restaurant branding, lifestyle retail display systems, and customer flow optimization.',
  },
  {
    id: 'biz-jpr-07',
    name: 'Jaipur Living Modular Studio',
    slug: 'jaipur-living-modular',
    rank: 7,
    area: 'Jagatpura',
    category: 'Interior Designers',
    qualifyingAmountRupees: 14000,
    isVerified: true,
    specialties: ['High-Rise Apartments', 'Acrylic Kitchens', 'Walk-In Wardrobes'],
    description: 'Fast-track modular execution team focused on rapid-delivery turnkey packages for new homeowners in emerging residential sectors.',
  },
  {
    id: 'biz-jpr-08',
    name: 'Pink City Spatial Design',
    slug: 'pink-city-spatial-design',
    rank: 8,
    area: 'Tonk Road',
    category: 'Interior Designers',
    qualifyingAmountRupees: 12500,
    isVerified: true,
    specialties: ['Commercial Clinics', 'Law Chambers', 'Educational Consultancies'],
    description: 'Professional spatial planners focusing on compact commercial chambers, acoustic partitions, and functional office environments.',
  },
];

export const RELATED_JAIPUR_MARKETS: RelatedMarketLink[] = [
  {
    title: 'Restaurants & Dining in Jaipur',
    location: 'Jaipur',
    category: 'Restaurants',
    slug: 'jaipur/restaurants',
    qualifyingAmountRupees: 26000,
  },
  {
    title: 'Interior Designers in Delhi',
    location: 'Delhi',
    category: 'Interior Designers',
    slug: 'delhi/interior-designers',
    qualifyingAmountRupees: 38500,
  },
  {
    title: 'Interior Designers in Mumbai',
    location: 'Mumbai',
    category: 'Interior Designers',
    slug: 'mumbai/interior-designers',
    qualifyingAmountRupees: 46000,
  },
  {
    title: 'Restaurants in Delhi',
    location: 'Delhi',
    category: 'Restaurants',
    slug: 'delhi/restaurants',
    qualifyingAmountRupees: 36000,
  },
  {
    title: 'Restaurants in Mumbai',
    location: 'Mumbai',
    category: 'Restaurants',
    slug: 'mumbai/restaurants',
    qualifyingAmountRupees: 42000,
  },
];

export const RELATED_CATEGORIES: RelatedCategoryLink[] = [
  {
    title: 'Commercial Architects',
    slug: 'architects',
    description: 'Structural planning, building design, elevations, and sanctioned municipal layouts.',
  },
  {
    title: 'Real Estate Advisory',
    slug: 'real-estate',
    description: 'Property acquisition, commercial leases, land consultancy, and residential investments.',
  },
  {
    title: 'Modular Kitchen Specialists',
    slug: 'modular-kitchens',
    description: 'Factory-finish cabinetry, quartz countertops, hardware fittings, and appliance layouts.',
  },
  {
    title: 'Home Automation & Lighting',
    slug: 'home-automation',
    description: 'Smart switches, automated drapery systems, architectural lighting scenes, and security integrations.',
  },
  {
    title: 'Custom Furniture Makers',
    slug: 'furniture-makers',
    description: 'Solid teak, Sheesham woodwork, artisanal upholstery, and bespoke living room furniture.',
  },
];
