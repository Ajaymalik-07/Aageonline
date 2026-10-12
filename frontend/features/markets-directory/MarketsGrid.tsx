import React from 'react';
import type { MarketSummary } from '../../data-access/types.ts';
import { MarketCard } from './MarketCard.tsx';

interface MarketsGridProps {
  markets: MarketSummary[] | any[];
  emptyMessage?: string;
}

export function MarketsGrid({
  markets,
  emptyMessage = 'No active markets match your current filter.',
}: MarketsGridProps) {
  if (markets.length === 0) {
    return (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          textAlign: 'center',
          padding: 'var(--space-10) var(--space-6)',
          backgroundColor: 'var(--surface-card)',
          borderRadius: 'var(--radius-lg)',
          border: '1px dashed var(--border-subtle)',
          margin: 'var(--space-6) 0',
        }}
      >
        <div
          style={{
            width: '48px',
            height: '48px',
            borderRadius: '50%',
            backgroundColor: 'rgba(234, 88, 12, 0.1)',
            color: 'var(--brand-deep-emerald)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: 'var(--space-4)',
          }}
          aria-hidden="true"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
        </div>
        <h3
          style={{
            fontSize: '18px',
            fontWeight: 700,
            color: 'var(--text-primary)',
            marginBottom: 'var(--space-2)',
          }}
        >
          {emptyMessage}
        </h3>
        <p
          style={{
            fontSize: '14px',
            color: 'var(--text-secondary)',
            maxWidth: '460px',
            lineHeight: 1.5,
            marginBottom: 'var(--space-6)',
          }}
        >
          New markets are launched based on verified business demand. Use the search bar above to request discovery for your location and category.
        </p>
        <a
          href="/markets"
          style={{
            padding: '10px 20px',
            backgroundColor: 'var(--brand-deep-emerald)',
            color: '#FFFFFF',
            borderRadius: 'var(--radius-pill)',
            fontSize: '14px',
            fontWeight: 600,
            textDecoration: 'none',
            boxShadow: 'var(--elevation-1)',
          }}
        >
          View All Active Markets
        </a>
      </div>
    );
  }

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
        gap: 'var(--space-6)',
      }}
      role="list"
      aria-label="Active published markets"
    >
      {markets.map((market, index) => {
        const key = market.id || market.marketId || market.slug;
        return (
          <div key={key} role="listitem">
            <MarketCard market={market} featured={index < 2 && markets.length > 3} />
          </div>
        );
      })}
    </div>
  );
}
