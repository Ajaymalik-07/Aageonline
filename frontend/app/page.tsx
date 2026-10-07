import React from 'react';
import type { Metadata } from 'next';
import { siteConfig } from '../config/site';
import { INITIAL_FEATURED_MARKETS } from '../config/markets';
import { HeroSection } from '../features/hero/HeroSection';
import { LiveMarketsCarousel } from '../features/markets/LiveMarketsCarousel';
import { CategoryRail } from '../features/categories/CategoryRail';
import { FeaturedMarketsShuffle } from '../features/markets/FeaturedMarketsShuffle';
import { CompetitiveSpotlight } from '../features/spotlight/CompetitiveSpotlight';
import { WhatIsAageOnline } from '../features/about/WhatIsAageOnline';
import { MomentumMarkets } from '../features/momentum/MomentumMarkets';
import { HowItWorksJourney } from '../features/process/HowItWorksJourney';
import { TrustGovernance } from '../features/trust/TrustGovernance';
import { FaqAccordion } from '../features/faq/FaqAccordion';
import { KnowledgeGuides } from '../features/knowledge/KnowledgeGuides';
import { BusinessCtaBanner } from '../features/cta/BusinessCtaBanner';
import { VisibilityDisclosure } from '../components/ui/VisibilityDisclosure';

export const metadata: Metadata = {
  title: `${siteConfig.name} — Get Seen. Get Ahead.`,
  description:
    'AageOnline is a competitive business visibility platform. Businesses compete for transparent, paid visibility positions within defined Location + Category markets.',
};

export default function HomePage() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-12)' }}>
      {/* 1. Hero / Market Introduction (Homepage 2 Split Editorial + AageOnline 2.5D Interactive Ladder) */}
      <HeroSection />

      {/* 2. Live Markets (Homepage 1 Carousel Rhythm) */}
      <LiveMarketsCarousel markets={INITIAL_FEATURED_MARKETS} />

      {/* 3. Explore Business Categories (Category Browsing Rail) */}
      <CategoryRail />

      {/* 4. Active Local Markets (Marketplace Grid with Smooth 1-by-1 Card Shuffle) */}
      <section className="container">
        <FeaturedMarketsShuffle markets={INITIAL_FEATURED_MARKETS} />
      </section>

      {/* 5. Competitive Spotlight (Large Visual / Promotional Stage + Payment-to-Ranking Sequence) */}
      <CompetitiveSpotlight />

      {/* 6. What is AageOnline? (Editorial Split + Node Architecture Diagram) */}
      <WhatIsAageOnline />

      {/* 7. Markets Gaining Momentum (Velocity & Shift Metrics) */}
      <MomentumMarkets markets={INITIAL_FEATURED_MARKETS} />

      {/* 8. How AageOnline Works (5-Step Interactive Infographic Journey) */}
      <section className="container">
        <HowItWorksJourney />
      </section>

      {/* 9. Trust & Governance (4 Integrity Pillars + Disclosure) */}
      <TrustGovernance />

      {/* 10. Frequently Asked Questions (Interactive Accordion) */}
      <FaqAccordion />

      {/* 11. AageOnline Knowledge / Guides (Editorial Cards) */}
      <KnowledgeGuides />

      {/* 12. Business CTA (Large Visual Banner) */}
      <BusinessCtaBanner />

      {/* 13. Mandatory Statutory Paid Visibility Transparency Banner */}
      <section className="container">
        <VisibilityDisclosure />
      </section>
    </div>
  );
}
