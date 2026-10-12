import React from 'react';
import type { MarketSummary } from '../../data-access/types.ts';

interface MarketCardProps {
  market:
    | MarketSummary
    | {
        id?: string;
        marketId?: string;
        slug: string;
        href?: string;
        publicUrl?: string;
        cityName: string;
        stateName?: string;
        categoryName: string;
        relevantPublicMetrics?: {
          totalBusinesses?: number;
          activePositions?: number;
          topQualifyingAmountMinor?: number;
        };
        totalBusinesses?: number;
        activePositions?: number;
        topQualifyingAmountMinor?: number;
      };
  featured?: boolean;
}

function formatAmountINR(minor: number): string {
  const inRupees = minor / 100;
  if (inRupees >= 100000) {
    return `₹${(inRupees / 100000).toFixed(1)}L`;
  }
  if (inRupees >= 1000) {
    return `₹${(inRupees / 1000).toFixed(0)}K`;
  }
  return `₹${inRupees.toLocaleString('en-IN')}`;
}

export function MarketCard({ market, featured = false }: MarketCardProps) {
  const href =
    'publicUrl' in market && market.publicUrl
      ? market.publicUrl
      : (market as any).href || `/${market.slug}`;

  const totalBusinesses =
    market.relevantPublicMetrics?.totalBusinesses ?? (market as any).totalBusinesses;
  const topQualifyingAmountMinor =
    market.relevantPublicMetrics?.topQualifyingAmountMinor ??
    (market as any).topQualifyingAmountMinor;

  return (
    <a
      href={href}
      aria-label={`Explore ${market.cityName} ${market.categoryName} market`}
      className="card-lift"
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 'var(--space-5)',
        padding: featured ? 'var(--space-8)' : 'var(--space-7)',
        backgroundColor: 'var(--surface-card)',
        border: '1px solid var(--border-subtle)',
        borderRadius: 'var(--radius-lg)',
        textDecoration: 'none',
        boxShadow: featured ? 'var(--elevation-2)' : 'var(--elevation-1)',
        position: 'relative',
        overflow: 'hidden',
        minHeight: featured ? '240px' : '200px',
      }}
    >
      {/* Subtle top accent bar */}
      <span
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '2px',
          background: 'linear-gradient(90deg, var(--brand-deep-emerald), var(--brand-teal))',
          opacity: 0.7,
        }}
        aria-hidden="true"
      />

      {/* City eyebrow */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span
          style={{
            fontSize: 'var(--font-size-eyebrow)',
            fontWeight: 700,
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            color: 'var(--brand-deep-emerald)',
          }}
        >
          {market.cityName}
        </span>
        {market.stateName && (
          <span
            style={{
              fontSize: '11px',
              fontWeight: 600,
              color: 'var(--text-muted)',
              letterSpacing: '0.04em',
            }}
          >
            {market.stateName}
          </span>
        )}
      </div>

      {/* Category name */}
      <div>
        <h3
          style={{
            fontSize: featured ? 'var(--font-size-card)' : '17px',
            fontWeight: 700,
            color: 'var(--text-primary)',
            lineHeight: 1.2,
            margin: 0,
          }}
        >
          {market.categoryName}
        </h3>
      </div>

      {/* Metrics */}
      <div style={{ display: 'flex', gap: 'var(--space-5)', flexWrap: 'wrap' }}>
        {totalBusinesses !== undefined && totalBusinesses > 0 && (
          <div>
            <div
              style={{
                fontSize: featured ? '22px' : '18px',
                fontWeight: 800,
                color: 'var(--text-primary)',
                lineHeight: 1,
              }}
            >
              {totalBusinesses}
            </div>
            <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '2px' }}>
              Businesses
            </div>
          </div>
        )}

        {topQualifyingAmountMinor !== undefined && topQualifyingAmountMinor > 0 && (
          <div>
            <div
              style={{
                fontSize: featured ? '22px' : '18px',
                fontWeight: 800,
                color: 'var(--brand-deep-emerald)',
                lineHeight: 1,
              }}
            >
              {formatAmountINR(topQualifyingAmountMinor)}
            </div>
            <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '2px' }}>
              Top qualifying amount
            </div>
          </div>
        )}
      </div>

      {/* Link action indicator */}
      <div
        style={{
          marginTop: 'auto',
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          fontSize: '13px',
          fontWeight: 700,
          color: 'var(--brand-deep-emerald)',
        }}
      >
        <span>Explore Market</span>
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          aria-hidden="true"
        >
          <path d="M5 12h14M12 5l7 7-7 7" />
        </svg>
      </div>
    </a>
  );
}
