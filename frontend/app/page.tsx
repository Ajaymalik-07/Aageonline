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

      {/* 2. Live Markets (#F8FAFC Soft Surface with Crisp White Cards) */}
      <LiveMarketsCarousel markets={INITIAL_FEATURED_MARKETS} />

      {/* 3. Explore Business Categories (#FFFFFF Clean Light Surface) */}
      <section style={{ backgroundColor: '#ffffff', padding: 'clamp(var(--space-8), 5vw, var(--space-12)) 0' }}>
        <CategoryRail />
      </section>

      {/* 4. Competitive Spotlight (#0B1F3B Dark Immersive Surface + Deterministic Transaction Demo) */}
      <CompetitiveSpotlight />

      {/* 5. Active Local Markets (#F8FAFC Soft Surface with Large Visual Cards) */}
      <section
        style={{
          backgroundColor: 'var(--surface-soft)',
          borderTop: '1px solid var(--border-subtle)',
          borderBottom: '1px solid var(--border-subtle)',
          padding: 'clamp(var(--space-8), 5vw, var(--space-12)) 0',
        }}
      >
        <div className="container">
          <FeaturedMarketsShuffle markets={INITIAL_FEATURED_MARKETS} />
        </div>
      </section>

      {/* 6. What is AageOnline? (#FFFFFF Clean Surface + 5-Stage Architecture Pipeline) */}
      <WhatIsAageOnline />

      {/* 7. Markets Gaining Momentum (#F8FAFC Soft Neutral Band + Velocity Shift Metrics) */}
      <div className="section-neutral-soft" style={{ padding: 'clamp(var(--space-8), 5vw, var(--space-12)) 0' }}>
        <MomentumMarkets markets={INITIAL_FEATURED_MARKETS} />
      </div>

      {/* 8. How AageOnline Works (#064E3B Deep Brand Dark Infographic Journey) */}
      <HowItWorksJourney />

      {/* 9. Trust & Governance (#FFFFFF Clean White / 4 Integrity Pillars) */}
      <section style={{ backgroundColor: '#ffffff', padding: 'clamp(var(--space-8), 5vw, var(--space-12)) 0' }}>
        <TrustGovernance />
      </section>

      {/* 10. AageOnline Knowledge / Guides (#F8FAFC Soft Editorial Layout) */}
      <KnowledgeGuides />

      {/* 11. Business CTA (#0B1F3B / Deep Navy Immersive Network Visual Banner) */}
      <section
        style={{
          backgroundColor: '#071324',
          borderTop: '1px solid rgba(255, 255, 255, 0.08)',
          padding: 'clamp(var(--space-8), 5vw, var(--space-12)) 0',
        }}
      >
        <BusinessCtaBanner />
      </section>
    </div>
  );
}
