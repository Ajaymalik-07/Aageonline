import React from 'react';
import type { LocationSummary } from '../../data-access/types.ts';

interface LocationCardProps {
  location: LocationSummary;
  featured?: boolean;
}

export function LocationCard({ location, featured = false }: LocationCardProps) {
  const href = location.publicUrl || `/${location.slug}`;
  const marketCount = location.activeMarketCount ?? location.marketCount ?? 0;

  return (
    <a
      href={href}
      aria-label={`Explore commercial markets in ${location.name}, ${location.stateName}`}
      className="card-lift"
      style={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        padding: featured ? 'var(--space-8)' : 'var(--space-6)',
        backgroundColor: 'var(--surface-card)',
        border: '1px solid var(--border-subtle)',
        borderRadius: 'var(--radius-lg)',
        textDecoration: 'none',
        boxShadow: featured ? 'var(--elevation-2)' : 'var(--elevation-1)',
        position: 'relative',
        overflow: 'hidden',
        minHeight: '190px',
        transition: 'transform 0.2s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
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

      {/* Header with region and market pill */}
      <div>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 'var(--space-2)',
            marginBottom: 'var(--space-2)',
          }}
        >
          <span
            style={{
              fontSize: '11px',
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              color: 'var(--brand-deep-emerald)',
            }}
          >
            {location.stateName || 'Region'} • India
          </span>

          <span
            style={{
              fontSize: '11px',
              fontWeight: 700,
              padding: '3px 8px',
              backgroundColor: 'rgba(234, 88, 12, 0.1)',
              color: 'var(--brand-deep-emerald)',
              borderRadius: 'var(--radius-pill)',
              whiteSpace: 'nowrap',
            }}
          >
            {marketCount} {marketCount === 1 ? 'market' : 'markets'}
          </span>
        </div>

        {/* City Name */}
        <h3
          style={{
            fontSize: featured ? '24px' : '20px',
            fontWeight: 800,
            color: 'var(--text-primary)',
            letterSpacing: '-0.02em',
            margin: '0 0 var(--space-2) 0',
            lineHeight: 1.2,
          }}
        >
          {location.name}
        </h3>

        <p
          style={{
            fontSize: '13px',
            color: 'var(--text-secondary)',
            lineHeight: 1.5,
            margin: 0,
          }}
        >
          {marketCount > 0
            ? `Verified competitive visibility rankings across ${marketCount} commercial ${marketCount === 1 ? 'sector' : 'sectors'}.`
            : 'Emerging regional market center.'}
        </p>
      </div>

      {/* Action Footer */}
      <div
        style={{
          marginTop: 'var(--space-5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderTop: '1px solid var(--border-subtle)',
          paddingTop: 'var(--space-3)',
        }}
      >
        <span
          style={{
            fontSize: '13px',
            fontWeight: 700,
            color: 'var(--brand-deep-emerald)',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
          }}
        >
          Explore {location.name}
          <svg
            width="15"
            height="15"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            aria-hidden="true"
          >
            <path d="M5 12h14M12 5l7 7-7 7" />
          </svg>
        </span>
      </div>
    </a>
  );
}
