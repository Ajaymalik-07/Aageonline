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
import { KnowledgeGuides } from '../features/knowledge/KnowledgeGuides';
import { BusinessCtaBanner } from '../features/cta/BusinessCtaBanner';

export const metadata: Metadata = {
  title: `${siteConfig.name} — Get Seen. Get Ahead.`,
  description:
    'AageOnline is a competitive business visibility platform. Businesses compete for transparent, paid visibility positions within defined Location + Category markets.',
};

export default function HomePage() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column' }}>
      {/* 1. Hero / Market Introduction (Dark Immersive + 2.5D Interactive Ladder) */}
      <HeroSection />

      {/* 2. Live Markets (Light Marketplace Carousel Rhythm) */}
      <LiveMarketsCarousel markets={INITIAL_FEATURED_MARKETS} />

      {/* 3. Explore Business Categories (Editorial Clean Category Browsing Rail) */}
      <div style={{ padding: 'clamp(var(--space-8), 5vw, var(--space-12)) 0' }}>
        <CategoryRail />
      </div>

      {/* 4. Active Local Markets (Marketplace Grid with 1-by-1 FLIP Card Shuffle) */}
      <section className="container" style={{ padding: 'clamp(var(--space-8), 5vw, var(--space-12)) 0' }}>
        <FeaturedMarketsShuffle markets={INITIAL_FEATURED_MARKETS} />
      </section>

      {/* 5. Competitive Spotlight (Dark Immersive Signature Visual + Deterministic Transaction Demo) */}
      <CompetitiveSpotlight />

      {/* 6. What is AageOnline? (Editorial Asymmetric Manifesto + SVG Connected Diagram) */}
      <div style={{ padding: 'clamp(var(--space-8), 5vw, var(--space-12)) 0' }}>
        <WhatIsAageOnline />
      </div>

      {/* 7. Markets Gaining Momentum (Soft Neutral Band + Velocity Shift Metrics) */}
      <div className="section-neutral-soft" style={{ padding: 'clamp(var(--space-8), 5vw, var(--space-12)) 0' }}>
        <MomentumMarkets markets={INITIAL_FEATURED_MARKETS} />
      </div>

      {/* 8. How AageOnline Works (6-Step Interactive Infographic Journey) */}
      <HowItWorksJourney />

      {/* 9. Trust & Governance (Clean White / 4 Integrity Pillars + Statutory Disclosure) */}
      <div style={{ padding: 'clamp(var(--space-8), 5vw, var(--space-12)) 0' }}>
        <TrustGovernance />
      </div>

      {/* 10. AageOnline Knowledge / Guides (Asymmetric Editorial: Featured Guide + Stacked Entries) */}
      <KnowledgeGuides />

      {/* 11. Business CTA (Dark Immersive Network Visual Banner) */}
      <section className="container" style={{ padding: 'clamp(var(--space-8), 5vw, var(--space-12)) 0' }}>
        <BusinessCtaBanner />
      </section>
    </div>
  );
}
