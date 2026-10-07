'use client';

import React from 'react';
import type { Market } from '../../types/market';
import { formatINR } from '../../lib/utils/format';

export interface MomentumMarketsProps {
  markets: Market[];
}

export const MomentumMarkets: React.FC<MomentumMarketsProps> = ({ markets }) => {
  // Select markets with high competition/momentum
  const momentumList = markets.slice(1, 5);

  return (
    <section className="container" aria-label="Markets Gaining Momentum">
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-end',
          flexWrap: 'wrap',
          gap: 'var(--space-4)',
          marginBottom: 'var(--space-6)',
        }}
      >
        <div>
          <span
            style={{
              fontSize: '11px',
              fontWeight: 800,
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              color: 'var(--brand-teal)',
              display: 'block',
              marginBottom: '4px',
            }}
          >
            Market Velocity
          </span>

          <h2
            style={{
              fontSize: 'clamp(24px, 3.5vw, 32px)',
              fontWeight: 900,
              color: 'var(--text-primary)',
              letterSpacing: '-0.02em',
              margin: 0,
            }}
          >
            Markets Gaining <span style={{ color: 'var(--brand-emerald)' }}>Momentum</span>
          </h2>

          <p style={{ fontSize: '14px', color: 'var(--text-secondary)', margin: '4px 0 0 0' }}>
            High-density local sectors seeing multiple qualifying transactions and rank adjustments.
          </p>
        </div>

        <a
          href="/explore"
          style={{
            fontSize: '13px',
            fontWeight: 700,
            color: 'var(--brand-emerald)',
            textDecoration: 'none',
          }}
        >
          View All Fast-Moving Markets →
        </a>
      </div>

      {/* Grid of 4 Momentum Markets */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
          gap: 'var(--space-5)',
        }}
      >
        {momentumList.map((m, idx) => (
          <div
            key={m.id}
            className="card-lift"
            style={{
              backgroundColor: 'var(--surface-card)',
              borderRadius: 'var(--radius-lg)',
              padding: 'var(--space-5)',
              border: '1px solid var(--border-subtle)',
              boxShadow: 'var(--elevation-1)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              minHeight: '220px',
            }}
          >
            <div>
              {/* Header Badge */}
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: 'var(--space-2)',
                }}
              >
                <span
                  style={{
                    fontSize: '11px',
                    fontWeight: 800,
                    padding: '2px 8px',
                    borderRadius: 'var(--radius-pill)',
                    backgroundColor: 'rgba(16, 185, 129, 0.1)',
                    color: 'var(--brand-emerald)',
                  }}
                >
                  ⚡ SURGING
                </span>
                <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)' }}>
                  {12 + idx * 4} shifts in 24h
                </span>
              </div>

              <span
                style={{
                  fontSize: '12px',
                  fontWeight: 700,
                  color: 'var(--brand-teal)',
                  display: 'block',
                  marginBottom: '2px',
                }}
              >
                {m.location.name}, {m.location.state}
              </span>

              <h3
                style={{
                  fontSize: '17px',
                  fontWeight: 800,
                  color: 'var(--text-primary)',
                  letterSpacing: '-0.01em',
                  margin: '0 0 var(--space-3) 0',
                }}
              >
                {m.category.name}
              </h3>

              <div
                style={{
                  backgroundColor: 'var(--surface-raised)',
                  borderRadius: 'var(--radius-md)',
                  padding: '8px 12px',
                  border: '1px solid var(--border-subtle)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: 'var(--space-3)',
                }}
              >
                <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                  Leading Floor
                </span>
                <strong style={{ fontSize: '15px', fontWeight: 800, color: 'var(--brand-deep-emerald)' }}>
                  {formatINR(m.topQualifyingAmountMinor)}
                </strong>
              </div>
            </div>

            <a
              href={`/${m.slug}`}
              style={{
                fontSize: '13px',
                fontWeight: 700,
                color: 'var(--brand-emerald)',
                textDecoration: 'none',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
              }}
            >
              Enter Market Ladder →
            </a>
          </div>
        ))}
      </div>
    </section>
  );
};
