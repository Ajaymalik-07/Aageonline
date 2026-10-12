import React from 'react';
import type { Metadata } from 'next';
import { siteConfig } from '../config/site';
import { INITIAL_FEATURED_MARKETS } from '../config/markets';

// Canonical Homepage Section Components
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

export const revalidate = 120;

export const metadata: Metadata = {
  title: `${siteConfig.name} — Get Seen. Get Ahead.`,
  description:
    'AageOnline is a competitive business visibility platform. Businesses compete for transparent, paid visibility positions within defined Location + Category markets.',
};

export default function HomePage() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column' }}>
      {/* 2. Hero / Market Introduction (Dark Immersive) */}
      <HeroSection />

      {/* 3. Live Markets Carousel */}
      <LiveMarketsCarousel markets={INITIAL_FEATURED_MARKETS} />

      {/* 4. Explore Business Categories (Dark Navy Immersive Surface) */}
      <section
        style={{
          backgroundColor: '#071526',
          borderTop: '1px solid rgba(255, 255, 255, 0.08)',
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
          padding: 'clamp(var(--space-8), 5vw, var(--space-12)) 0',
        }}
      >
        <CategoryRail />
      </section>

      {/* 5. Active Local Markets (Warm Soft Surface) */}
      <section
        style={{
          backgroundColor: 'var(--surface-soft)',
          borderBottom: '1px solid var(--border-subtle)',
          padding: 'clamp(var(--space-8), 5vw, var(--space-12)) 0',
        }}
      >
        <div className="container">
          <FeaturedMarketsShuffle markets={INITIAL_FEATURED_MARKETS} />
        </div>
      </section>

      {/* 6. Competitive Spotlight */}
      <CompetitiveSpotlight />

      {/* 7. What is AageOnline? (Clean White Surface + 5-Stage Architecture) */}
      <WhatIsAageOnline />

      {/* 8. Markets Gaining Momentum */}
      <MomentumMarkets markets={INITIAL_FEATURED_MARKETS} />

      {/* 9. How AageOnline Works (Deep Navy Infographic Journey) */}
      <HowItWorksJourney />

      {/* 10. Trust & Governance (Clean White / 4 Integrity Pillars) */}
      <section style={{ backgroundColor: '#ffffff', padding: 'clamp(var(--space-8), 5vw, var(--space-12)) 0' }}>
        <TrustGovernance />
      </section>

      {/* 11. FAQ (Authoritative Rules & Questions) */}
      <FaqAccordion />

      {/* 12. AageOnline Knowledge / Guides (Soft Editorial Layout) */}
      <KnowledgeGuides />

      {/* 13. Business CTA Banner (Deep Navy Network Visual Banner) */}
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
