import React from 'react';
import type { Metadata } from 'next';
import { siteConfig } from '../config/site';
import { INITIAL_FEATURED_MARKETS } from '../config/markets';
import { LiveSpotlight } from '../features/ranking/LiveSpotlight';
import { HeroMarketVisual } from '../features/ranking/HeroMarketVisual';
import { VisibilityDisclosure } from '../components/ui/VisibilityDisclosure';
import { Badge } from '../components/ui/Badge';
import { formatINR } from '../lib/utils/format';
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
    totalMovementsLast24h: 14,
    competitiveScore: 92,
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-10)' }}>
      {/* Hero Section — 2-Column Responsive Layout with 2.5D/3D Interactive Market Demonstration */}
      <section
        className="bg-ambient-market"
        style={{
          padding: 'var(--space-10) 0 var(--space-8) 0',
          borderBottom: '1px solid var(--border-subtle)',
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
          {/* Left Column: Brand Metaphor & Core Action */}
          <div>
            <div style={{ display: 'inline-flex', marginBottom: 'var(--space-3)' }}>
              <Badge variant="position-top">
                Competitive Visibility Platform
              </Badge>
            </div>

            <h1
              style={{
                fontSize: 'clamp(36px, 5.5vw, 60px)',
                fontWeight: 900,
                color: 'var(--brand-deep-navy)',
                lineHeight: 1.1,
                letterSpacing: '-0.03em',
                marginBottom: 'var(--space-4)',
              }}
            >
              Get Seen. <span style={{ color: 'var(--brand-emerald)' }}>Get Ahead.</span>
            </h1>

            <p
              style={{
                fontSize: 'clamp(16px, 2.2vw, 19px)',
                color: 'var(--text-secondary)',
                lineHeight: 1.55,
                marginBottom: 'var(--space-6)',
                maxWidth: '560px',
              }}
            >
              Businesses compete for transparent paid visibility positions in defined local markets. A market is exactly one <strong>Location + Category</strong> pair (e.g. <em>Jaipur + Interior Designers</em>).
            </p>

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
                  fontWeight: 700,
                  fontSize: '15px',
                  textDecoration: 'none',
                  minHeight: '44px',
                  display: 'inline-flex',
                  alignItems: 'center',
                  boxShadow: 'var(--elevation-2)',
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
                  fontWeight: 600,
                  fontSize: '15px',
                  textDecoration: 'none',
                  minHeight: '44px',
                  display: 'inline-flex',
                  alignItems: 'center',
                }}
              >
                Claim Your Business
              </a>
            </div>

            <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: 0 }}>
              * Visibility positions reflect verified paid competitive bidding and do not certify objective business quality.
            </p>
          </div>

          {/* Right Column: Interactive 2.5D/3D Market Visualization */}
          <div>
            <HeroMarketVisual />
          </div>
        </div>
      </section>

      {/* Live Spotlight Section */}
      <section className="container">
        <LiveSpotlight spotlight={defaultSpotlight} />
      </section>

      {/* How AageOnline Works Section */}
      <section className="container" style={{ padding: 'var(--space-6) var(--space-4)' }}>
        <div style={{ textAlign: 'center', maxWidth: '680px', margin: '0 auto var(--space-8) auto' }}>
          <h2 style={{ fontSize: '28px', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '8px' }}>
            How AageOnline Works
          </h2>
          <p style={{ fontSize: '15px', color: 'var(--text-secondary)' }}>
            Transparent, verifiable, and rule-based competitive positioning.
          </p>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: 'var(--space-6)',
          }}
        >
          <div
            style={{
              padding: 'var(--space-6)',
              backgroundColor: 'var(--surface-card)',
              borderRadius: 'var(--radius-lg)',
              border: '1px solid var(--border-subtle)',
              boxShadow: 'var(--elevation-1)',
            }}
          >
            <div style={{ fontSize: '32px', marginBottom: 'var(--space-3)' }}>📍</div>
            <h3 style={{ fontSize: '18px', fontWeight: 700, marginBottom: 'var(--space-2)' }}>
              1. Choose a Market
            </h3>
            <p style={{ fontSize: '14px', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
              Markets are strictly scoped by Location + Category (e.g. Jaipur + Interior Designers). Businesses compete only within their designated category and city.
            </p>
          </div>

          <div
            style={{
              padding: 'var(--space-6)',
              backgroundColor: 'var(--surface-card)',
              borderRadius: 'var(--radius-lg)',
              border: '1px solid var(--border-subtle)',
              boxShadow: 'var(--elevation-1)',
            }}
          >
            <div style={{ fontSize: '32px', marginBottom: 'var(--space-3)' }}>🏆</div>
            <h3 style={{ fontSize: '18px', fontWeight: 700, marginBottom: 'var(--space-2)' }}>
              2. Compete for Position
            </h3>
            <p style={{ fontSize: '14px', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
              Eligible businesses purchase target ranking positions (#1, #2, #3). A qualifying purchase must be strictly greater than the current qualifying amount.
            </p>
          </div>

          <div
            style={{
              padding: 'var(--space-6)',
              backgroundColor: 'var(--surface-card)',
              borderRadius: 'var(--radius-lg)',
              border: '1px solid var(--border-subtle)',
              boxShadow: 'var(--elevation-1)',
            }}
          >
            <div style={{ fontSize: '32px', marginBottom: 'var(--space-3)' }}>📜</div>
            <h3 style={{ fontSize: '18px', fontWeight: 700, marginBottom: 'var(--space-2)' }}>
              3. Transparent History
            </h3>
            <p style={{ fontSize: '14px', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
              Ranking updates are atomic and recorded in append-only position history. Paid positioning is always clearly disclosed to consumers.
            </p>
          </div>
        </div>
      </section>

      {/* Featured Markets Grid */}
      <section className="container">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 'var(--space-6)' }}>
          <div>
            <h2 style={{ fontSize: '24px', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
              Featured Local Markets
            </h2>
            <p style={{ fontSize: '14px', color: 'var(--text-secondary)', margin: '4px 0 0 0' }}>
              Active business discovery and positioning ladders.
            </p>
          </div>
          <a href="/explore" style={{ fontSize: '14px', fontWeight: 600, color: 'var(--brand-emerald)', textDecoration: 'none' }}>
            View All →
          </a>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
            gap: 'var(--space-4)',
          }}
        >
          {INITIAL_FEATURED_MARKETS.map((m) => (
            <a
              key={m.id}
              href={`/${m.slug}`}
              style={{
                textDecoration: 'none',
                backgroundColor: 'var(--surface-card)',
                borderRadius: 'var(--radius-md)',
                padding: 'var(--space-4)',
                border: '1px solid var(--border-subtle)',
                boxShadow: 'var(--elevation-1)',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
                transition: 'box-shadow var(--motion-fast)',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--brand-teal)' }}>
                  {m.location.name}, {m.location.state}
                </span>
                <Badge variant="neutral">{m.totalBusinesses} listings</Badge>
              </div>
              <h3 style={{ fontSize: '17px', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
                {m.category.name}
              </h3>
              <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                Top position qualifying: <strong>{formatINR(m.topQualifyingAmountMinor)}</strong>
              </div>
            </a>
          ))}
        </div>
      </section>

      {/* Mandatory Paid Visibility Transparency Banner */}
      <section className="container">
        <VisibilityDisclosure />
      </section>
    </div>
  );
}
