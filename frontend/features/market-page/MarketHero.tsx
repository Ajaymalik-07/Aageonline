'use client';

import React from 'react';
import type { Market } from '../../types/market';
import { formatINR } from '../../lib/utils/format';

interface MarketHeroProps {
  market: Market;
}

export const MarketHero: React.FC<MarketHeroProps> = ({ market }) => {
  return (
    <section
      style={{
        backgroundColor: 'var(--surface-soft)',
        borderBottom: '1px solid var(--border-subtle)',
        padding: 'clamp(36px, 5vw, 64px) 0',
        position: 'relative',
      }}
    >
      <div className="container">
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
            gap: 'var(--space-8)',
            alignItems: 'center',
          }}
        >
          {/* Left Column: Market Title & Context */}
          <div>
            {/* Category Pill */}
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
              <span
                style={{
                  fontSize: '11px',
                  fontWeight: 800,
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em',
                  padding: '4px 12px',
                  borderRadius: 'var(--radius-pill)',
                  backgroundColor: 'rgba(234, 88, 12, 0.12)',
                  color: '#EA580C',
                  border: '1px solid rgba(234, 88, 12, 0.25)',
                }}
              >
                {market.category.name.toUpperCase()} · {market.location.name.toUpperCase()}
              </span>
              <span
                style={{
                  fontSize: '10px',
                  fontWeight: 800,
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  padding: '2px 8px',
                  borderRadius: 'var(--radius-pill)',
                  backgroundColor: '#ffffff',
                  color: '#64748B',
                  border: '1px solid var(--border-subtle)',
                }}
              >
                Local Market
              </span>
            </div>

            {/* Exactly One H1 */}
            <h1
              style={{
                fontSize: 'clamp(32px, 4.5vw, 48px)',
                fontWeight: 900,
                color: 'var(--text-primary)',
                lineHeight: 1.15,
                letterSpacing: '-0.025em',
                margin: '0 0 16px 0',
              }}
            >
              {market.category.name} in {market.location.name}
            </h1>

            {/* Narrative Subtitle */}
            <p
              style={{
                fontSize: 'clamp(15px, 1.8vw, 17px)',
                color: 'var(--text-secondary)',
                lineHeight: 1.6,
                margin: '0 0 20px 0',
                maxWidth: '600px',
              }}
            >
              Explore {market.category.slug === 'restaurants' ? 'restaurants' : 'businesses'} competing for paid visibility within the {market.location.name} {market.category.name} market. Verified transactions determine current rank on an immutable public ledger.
            </p>

            {/* Prominent Paid Visibility Disclosure */}
            <div
              style={{
                backgroundColor: '#ffffff',
                borderRadius: 'var(--radius-md)',
                padding: '12px 16px',
                border: '1px solid rgba(234, 88, 12, 0.25)',
                borderLeft: '4px solid #EA580C',
                marginBottom: '24px',
                fontSize: '13px',
                lineHeight: 1.5,
                color: 'var(--text-secondary)',
                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)',
              }}
            >
              <strong style={{ color: 'var(--text-primary)', fontWeight: 800 }}>
                Paid Visibility Disclosure:
              </strong>{' '}
              AageOnline displays commercial visibility positions for eligible businesses within a defined Location + Category market. A higher position reflects a verified qualifying payment and does not certify that a business is objectively superior to competitors.
            </div>

            {/* CTA Buttons */}
            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
              <a
                href="#current-rankings"
                style={{
                  padding: '12px 24px',
                  borderRadius: 'var(--radius-pill)',
                  backgroundColor: '#EA580C',
                  color: '#ffffff',
                  fontWeight: 800,
                  fontSize: '14px',
                  textDecoration: 'none',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  boxShadow: '0 4px 14px rgba(234, 88, 12, 0.35)',
                  transition: 'transform var(--motion-fast)',
                }}
              >
                Explore Market Ranking ↓
              </a>
              <a
                href="/claim"
                style={{
                  padding: '12px 24px',
                  borderRadius: 'var(--radius-pill)',
                  backgroundColor: '#ffffff',
                  color: 'var(--text-primary)',
                  border: '1px solid var(--border-strong)',
                  fontWeight: 700,
                  fontSize: '14px',
                  textDecoration: 'none',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  transition: 'background-color var(--motion-fast)',
                }}
              >
                Claim Your Business →
              </a>
            </div>
          </div>

          {/* Right Column: Compact Market Snapshot Card */}
          <div style={{ display: 'flex', justifyContent: 'center' }}>
            <div
              style={{
                width: '100%',
                maxWidth: '400px',
                backgroundColor: '#ffffff',
                borderRadius: 'var(--radius-lg)',
                border: '1px solid var(--border-subtle)',
                boxShadow: '0 8px 30px rgba(11, 31, 51, 0.08)',
                padding: '24px',
                position: 'relative',
                overflow: 'hidden',
              }}
            >
              {/* Card Header */}
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  paddingBottom: '16px',
                  borderBottom: '1px solid var(--border-subtle)',
                  marginBottom: '16px',
                }}
              >
                <div>
                  <span
                    style={{
                      fontSize: '10px',
                      fontWeight: 800,
                      textTransform: 'uppercase',
                      letterSpacing: '0.08em',
                      color: '#EA580C',
                      display: 'block',
                    }}
                  >
                    MARKET PROFILE
                  </span>
                  <h3
                    style={{
                      fontSize: '18px',
                      fontWeight: 900,
                      color: 'var(--text-primary)',
                      margin: '2px 0 0 0',
                    }}
                  >
                    {market.location.name} · {market.category.name}
                  </h3>
                </div>
                <span
                  style={{
                    fontSize: '11px',
                    fontWeight: 800,
                    color: '#16a34a',
                    backgroundColor: 'rgba(22, 163, 74, 0.1)',
                    padding: '3px 10px',
                    borderRadius: 'var(--radius-pill)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                  }}
                >
                  <span
                    style={{
                      width: '6px',
                      height: '6px',
                      borderRadius: '50%',
                      backgroundColor: '#16a34a',
                      display: 'inline-block',
                    }}
                  />
                  Active Market
                </span>
              </div>

              {/* Metric Rows */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginBottom: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Businesses Competing</span>
                  <strong style={{ fontSize: '16px', fontWeight: 800, color: 'var(--text-primary)' }}>
                    {market.totalBusinesses}
                  </strong>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Paid Visibility Positions</span>
                  <strong style={{ fontSize: '16px', fontWeight: 800, color: 'var(--text-primary)' }}>
                    {market.activePositions}
                  </strong>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Top Qualifying Amount</span>
                  <strong style={{ fontSize: '18px', fontWeight: 900, color: '#EA580C' }}>
                    {formatINR(market.topQualifyingAmountMinor)}
                  </strong>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Market Geographic Scope</span>
                  <strong style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)' }}>
                    {market.location.name}, {market.location.state}
                  </strong>
                </div>
              </div>

              {/* Illustrative Marker */}
              <div
                style={{
                  backgroundColor: 'var(--surface-raised)',
                  borderRadius: 'var(--radius-sm)',
                  padding: '8px 12px',
                  fontSize: '11px',
                  color: 'var(--text-secondary)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                <span>Dataset Status:</span>
                <span style={{ fontWeight: 700, color: '#EA580C' }}>Illustrative Market</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
