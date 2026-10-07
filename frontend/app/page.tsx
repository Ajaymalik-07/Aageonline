import React from 'react';
import type { Metadata } from 'next';
import { siteConfig } from '../config/site';
import { INITIAL_FEATURED_MARKETS } from '../config/markets';
import { LiveSpotlight } from '../features/ranking/LiveSpotlight';
import { HeroMarketVisual } from '../features/ranking/HeroMarketVisual';
import { HowItWorksJourney } from '../features/process/HowItWorksJourney';
import { FeaturedMarketsShuffle } from '../features/markets/FeaturedMarketsShuffle';
import { VisibilityDisclosure } from '../components/ui/VisibilityDisclosure';
import type { MarketSpotlight } from '../types/market';

export const metadata: Metadata = {
  title: `${siteConfig.name} — Get Seen. Get Ahead.`,
  description:
    'AageOnline is a competitive business visibility platform. Businesses compete for transparent, paid visibility positions within defined Location + Category markets.',
};

export default function HomePage() {
  const primaryMarket = INITIAL_FEATURED_MARKETS[0];

  const defaultSpotlight: MarketSpotlight = {
    market: primaryMarket,
    topBusiness: {
      position: 1,
      businessId: 'biz-abc-interiors',
      businessName: 'ABC Interiors',
      businessSlug: 'abc-interiors',
      isVerified: true,
      visibilityAmountMinor: primaryMarket.topQualifyingAmountMinor,
      updatedAt: new Date().toISOString(),
    },
    totalMovementsLast24h: 18,
    competitiveScore: 94,
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-12)' }}>
      {/* 1. Hero Section — Split Editorial / Product Hero with 2.5D Interactive Market Demonstration */}
      <section
        className="bg-ambient-market"
        style={{
          padding: 'clamp(var(--space-8), 5vw, var(--space-12)) 0',
          borderBottom: '1px solid var(--border-subtle)',
          position: 'relative',
        }}
      >
        <div
          className="container hero-grid"
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
            gap: 'var(--space-8)',
            alignItems: 'center',
          }}
        >
          {/* Left Column: Brand Vision & Core Action */}
          <div>
            <div style={{ display: 'inline-flex', marginBottom: 'var(--space-4)' }}>
              <span
                style={{
                  fontSize: '12px',
                  fontWeight: 800,
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em',
                  padding: '4px 14px',
                  borderRadius: 'var(--radius-pill)',
                  backgroundColor: 'rgba(5, 150, 105, 0.1)',
                  color: 'var(--brand-emerald)',
                  border: '1px solid rgba(5, 150, 105, 0.25)',
                }}
              >
                Market = Location + Category
              </span>
            </div>

            <h1
              style={{
                fontSize: 'clamp(38px, 6vw, 64px)',
                fontWeight: 900,
                color: 'var(--brand-deep-navy)',
                lineHeight: 1.08,
                letterSpacing: '-0.035em',
                marginBottom: 'var(--space-4)',
              }}
            >
              Get Seen.{' '}
              <span style={{ color: 'var(--brand-emerald)' }}>Get Ahead.</span>
            </h1>

            <p
              style={{
                fontSize: 'clamp(16px, 2.2vw, 19px)',
                color: 'var(--text-secondary)',
                lineHeight: 1.6,
                marginBottom: 'var(--space-6)',
                maxWidth: '560px',
              }}
            >
              Businesses compete for transparent paid visibility positions in defined local markets. Real local businesses, verifiable ranking, zero algorithmic black boxes.
            </p>

            {/* CTAs */}
            <div
              style={{
                display: 'flex',
                gap: 'var(--space-3)',
                flexWrap: 'wrap',
                marginBottom: 'var(--space-6)',
              }}
            >
              <a
                href="/explore"
                style={{
                  padding: '14px 28px',
                  borderRadius: 'var(--radius-pill)',
                  backgroundColor: 'var(--action-primary)',
                  color: '#ffffff',
                  fontWeight: 800,
                  fontSize: '15px',
                  textDecoration: 'none',
                  minHeight: '44px',
                  display: 'inline-flex',
                  alignItems: 'center',
                  boxShadow: 'var(--elevation-2)',
                  transition: 'all var(--motion-fast)',
                }}
              >
                Explore Local Markets →
              </a>

              <a
                href="/claim"
                style={{
                  padding: '14px 28px',
                  borderRadius: 'var(--radius-pill)',
                  backgroundColor: 'transparent',
                  border: '2px solid var(--border-strong)',
                  color: 'var(--text-primary)',
                  fontWeight: 700,
                  fontSize: '15px',
                  textDecoration: 'none',
                  minHeight: '44px',
                  display: 'inline-flex',
                  alignItems: 'center',
                  transition: 'all var(--motion-fast)',
                }}
              >
                Claim Your Business
              </a>
            </div>

            {/* Platform Trust Guarantees */}
            <div
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: '12px',
                fontSize: '12px',
                color: 'var(--text-muted)',
                fontWeight: 600,
              }}
            >
              <span>✓ 100% Paid Visibility Disclosed</span>
              <span>•</span>
              <span>✓ Atomic Server Recalculation</span>
              <span>•</span>
              <span>✓ Whole Rupee Pricing (INR)</span>
            </div>
          </div>

          {/* Right Column: Crystal-Clear 2.5D Spatial Stage Demonstration */}
          <div>
            <HeroMarketVisual />
          </div>
        </div>
      </section>

      {/* 2. Live Spotlight Section — Spatial Podium Stage */}
      <section className="container">
        <LiveSpotlight spotlight={defaultSpotlight} />
      </section>

      {/* 3. How AageOnline Works — Interactive Infographic Journey */}
      <section className="container">
        <HowItWorksJourney />
      </section>

      {/* 4. Featured Local Markets Grid with 1-by-1 Card Shuffle */}
      <section className="container">
        <FeaturedMarketsShuffle markets={INITIAL_FEATURED_MARKETS} />
      </section>

      {/* 5. Mandatory Statutory Paid Visibility Transparency Banner */}
      <section className="container">
        <VisibilityDisclosure />
      </section>
    </div>
  );
}
