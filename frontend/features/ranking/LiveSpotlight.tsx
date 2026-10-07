'use client';

import React from 'react';
import type { MarketSpotlight } from '../../types/market';
import { PositionBadge } from './PositionBadge';
import { PositionMovement } from './PositionMovement';
import { formatINR } from '../../lib/utils/format';

export interface LiveSpotlightProps {
  spotlight: MarketSpotlight;
  onExploreMarket?: (slug: string) => void;
}

export const LiveSpotlight: React.FC<LiveSpotlightProps> = ({
  spotlight,
  onExploreMarket,
}) => {
  const { market, topBusiness } = spotlight;

  // Sample runner-up positions for live market depth preview
  const ladderEntries = [
    {
      position: 1,
      name: topBusiness.businessName,
      amountMinor: topBusiness.visibilityAmountMinor,
      movement: 'same' as const,
      isLeading: true,
    },
    {
      position: 2,
      name: 'Studio XYZ',
      amountMinor: 2450000,
      movement: 'up' as const,
      movementCount: 1,
    },
    {
      position: 3,
      name: 'Design House',
      amountMinor: 2200000,
      movement: 'same' as const,
    },
    {
      position: 4,
      name: 'Urban Interiors',
      amountMinor: 2050000,
      movement: 'same' as const,
    },
    {
      position: 5,
      name: 'SpaceCraft Studio',
      amountMinor: 1900000,
      movement: 'same' as const,
    },
  ];

  return (
    <section
      aria-label="Market Live Spotlight"
      className="aage-live-spotlight"
      style={{
        backgroundColor: 'var(--brand-deep-navy)',
        color: '#ffffff',
        borderRadius: 'var(--radius-xl)',
        padding: 'var(--space-8) var(--space-6)',
        position: 'relative',
        overflow: 'hidden',
        boxShadow: 'var(--elevation-4), 0 24px 48px -12px rgba(6, 78, 59, 0.35)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
      }}
    >
      {/* Decorative ambient radial lighting */}
      <div
        style={{
          position: 'absolute',
          top: '-80px',
          right: '-80px',
          width: '320px',
          height: '320px',
          background: 'radial-gradient(circle, rgba(16, 185, 129, 0.28) 0%, transparent 70%)',
          borderRadius: '50%',
          pointerEvents: 'none',
        }}
        aria-hidden="true"
      />
      <div
        style={{
          position: 'absolute',
          bottom: '-60px',
          left: '-60px',
          width: '260px',
          height: '260px',
          background: 'radial-gradient(circle, rgba(199, 240, 0, 0.15) 0%, transparent 70%)',
          borderRadius: '50%',
          pointerEvents: 'none',
        }}
        aria-hidden="true"
      />

      {/* Spotlight Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 'var(--space-6)',
          flexWrap: 'wrap',
          gap: 'var(--space-3)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span
            className="live-indicator-dot"
            style={{
              width: '10px',
              height: '10px',
              borderRadius: '50%',
              backgroundColor: 'var(--brand-lime)',
              boxShadow: '0 0 10px var(--brand-lime)',
            }}
            aria-hidden="true"
          />
          <span
            style={{
              fontSize: '13px',
              fontWeight: 800,
              letterSpacing: '0.08em',
              color: 'var(--brand-lime)',
              textTransform: 'uppercase',
            }}
          >
            LIVE SPOTLIGHT
          </span>
        </div>

        <span
          style={{
            fontSize: '12px',
            fontWeight: 700,
            padding: '4px 12px',
            borderRadius: 'var(--radius-pill)',
            backgroundColor: 'rgba(16, 185, 129, 0.2)',
            color: 'var(--brand-teal)',
            border: '1px solid rgba(16, 185, 129, 0.35)',
            textTransform: 'uppercase',
            letterSpacing: '0.04em',
          }}
        >
          High Competitive Activity
        </span>
      </div>

      {/* Market Title and Competing Businesses Count */}
      <div style={{ marginBottom: 'var(--space-6)' }}>
        <h2 style={{ fontSize: 'clamp(24px, 4vw, 32px)', fontWeight: 900, margin: '0 0 6px 0', color: '#ffffff', letterSpacing: '-0.02em' }}>
          {market.location.name} · {market.category.name}
        </h2>
        <p style={{ fontSize: '15px', color: 'rgba(255, 255, 255, 0.8)', margin: 0 }}>
          {market.totalBusinesses} businesses competing for paid visibility positions.
        </p>
      </div>

      {/* 5-Card Ladder Preview */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)', marginBottom: 'var(--space-6)' }}>
        {ladderEntries.map((entry) => (
          <div
            key={entry.position}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '12px 18px',
              backgroundColor: entry.position === 1 ? 'rgba(255, 255, 255, 0.12)' : 'rgba(255, 255, 255, 0.05)',
              borderRadius: 'var(--radius-md)',
              border: entry.position === 1 ? '1px solid rgba(199, 240, 0, 0.4)' : '1px solid rgba(255, 255, 255, 0.08)',
              transition: 'background-color 0.15s ease',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <PositionBadge position={entry.position} size={entry.position === 1 ? 'md' : 'sm'} />
              <div>
                <span style={{ fontSize: '15px', fontWeight: 700, color: '#ffffff', display: 'block' }}>
                  {entry.name}
                </span>
                <PositionMovement
                  direction={entry.movement}
                  positions={entry.movementCount}
                  isLeading={entry.isLeading}
                />
              </div>
            </div>

            <div style={{ textAlign: 'right' }}>
              <span style={{ fontSize: '15px', fontWeight: 800, color: entry.position === 1 ? 'var(--brand-lime)' : '#ffffff' }}>
                {formatINR(entry.amountMinor)}
              </span>
              <span style={{ display: 'block', fontSize: '10px', color: 'rgba(255, 255, 255, 0.6)' }}>
                {entry.position === 1 ? 'Leading qualifying amount' : 'Current qualifying'}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Spotlight Footer with Statutory Disclosure and Action */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 'var(--space-4)',
          flexWrap: 'wrap',
          paddingTop: 'var(--space-4)',
          borderTop: '1px solid rgba(255, 255, 255, 0.12)',
        }}
      >
        <p style={{ fontSize: '12px', color: 'rgba(255, 255, 255, 0.6)', margin: 0, maxWidth: '480px', lineHeight: 1.4 }}>
          * Rankings reflect verified paid competitive visibility positions and do not constitute an independent assessment of business quality.
        </p>

        <a
          href={`/${market.slug}`}
          onClick={(e) => {
            if (onExploreMarket) {
              e.preventDefault();
              onExploreMarket(market.slug);
            }
          }}
          style={{
            padding: '12px 24px',
            borderRadius: 'var(--radius-pill)',
            backgroundColor: 'var(--brand-lime)',
            color: 'var(--brand-deep-navy)',
            fontWeight: 800,
            fontSize: '14px',
            textDecoration: 'none',
            display: 'inline-flex',
            alignItems: 'center',
            minHeight: '44px',
            boxShadow: '0 4px 14px rgba(199, 240, 0, 0.3)',
          }}
        >
          Explore Full Market Ladder →
        </a>
      </div>
    </section>
  );
};
