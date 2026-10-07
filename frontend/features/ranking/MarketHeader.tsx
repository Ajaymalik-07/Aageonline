import React from 'react';
import type { Market } from '../../types/market';

export interface MarketHeaderProps {
  market: Market;
  totalBusinesses?: number;
  activityLevel?: 'HIGH' | 'MODERATE' | 'INITIAL';
  lastUpdated?: string;
  className?: string;
}

export const MarketHeader: React.FC<MarketHeaderProps> = ({
  market,
  totalBusinesses = market.totalBusinesses,
  activityLevel = 'HIGH',
  lastUpdated = 'Live',
  className = '',
}) => {
  return (
    <header
      className={`aage-market-header ${className}`.trim()}
      style={{
        backgroundColor: 'var(--surface-card)',
        borderRadius: 'var(--radius-xl)',
        padding: 'var(--space-6) var(--space-8)',
        border: '1px solid var(--border-subtle)',
        boxShadow: 'var(--elevation-2)',
        display: 'flex',
        flexDirection: 'column',
        gap: 'var(--space-4)',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 'var(--space-2)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span
            style={{
              fontSize: '13px',
              fontWeight: 800,
              letterSpacing: '0.06em',
              color: 'var(--brand-emerald)',
              textTransform: 'uppercase',
            }}
          >
            {market.location.name}, {market.location.state}
          </span>
          <span style={{ color: 'var(--border-strong)' }}>•</span>
          <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
            Status: {market.status}
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span
            className="live-indicator-dot"
            style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: 'var(--brand-teal)' }}
            aria-hidden="true"
          />
          <span
            style={{
              fontSize: '12px',
              fontWeight: 700,
              color: 'var(--brand-emerald)',
              backgroundColor: 'rgba(16, 185, 129, 0.1)',
              padding: '3px 10px',
              borderRadius: 'var(--radius-pill)',
              letterSpacing: '0.04em',
            }}
          >
            {activityLevel} COMPETITIVE ACTIVITY
          </span>
        </div>
      </div>

      <div>
        <h1
          style={{
            fontSize: 'clamp(28px, 4vw, 40px)',
            fontWeight: 900,
            color: 'var(--brand-deep-navy)',
            lineHeight: 1.15,
            letterSpacing: '-0.02em',
            margin: '0 0 6px 0',
          }}
        >
          {market.category.name} in {market.location.name}
        </h1>
        <p style={{ fontSize: '15px', color: 'var(--text-secondary)', margin: 0 }}>
          {totalBusinesses} businesses competing for transparent paid visibility positions.
        </p>
      </div>

      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderTop: '1px solid var(--border-subtle)',
          paddingTop: 'var(--space-3)',
          fontSize: '12px',
          color: 'var(--text-muted)',
        }}
      >
        <span>Market ID: <code>{market.slug}</code></span>
        <span>Ranking state: {lastUpdated}</span>
      </div>
    </header>
  );
};
