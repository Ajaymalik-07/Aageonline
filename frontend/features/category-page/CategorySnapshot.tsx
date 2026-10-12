import React from 'react';
import type { CategorySummary, MarketSummary } from '../../data-access/types.ts';

interface CategorySnapshotProps {
  category: CategorySummary;
  markets: MarketSummary[];
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

export function CategorySnapshot({ category, markets }: CategorySnapshotProps) {
  const marketCount = markets.length;
  const uniqueCityCount = new Set(markets.map((m) => m.cityId)).size;

  const totalBusinesses = markets.reduce(
    (acc, m) => acc + (m.relevantPublicMetrics?.totalBusinesses ?? 0),
    0
  );

  const topQualifyingMinor = markets.reduce((max, m) => {
    const amt = m.relevantPublicMetrics?.topQualifyingAmountMinor ?? 0;
    return amt > max ? amt : max;
  }, 0);

  return (
    <section
      aria-label={`${category.name} commercial metrics snapshot`}
      style={{
        padding: 'var(--space-6) 0',
        backgroundColor: 'var(--surface-subtle)',
        borderBottom: '1px solid var(--border-subtle)',
      }}
    >
      <div className="container">
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: 'var(--space-4)',
          }}
        >
          {/* 1. Active Markets */}
          <div
            style={{
              padding: 'var(--space-4) var(--space-5)',
              backgroundColor: 'var(--surface-card)',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-subtle)',
            }}
          >
            <div
              style={{
                fontSize: '11px',
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
                color: 'var(--text-muted)',
                marginBottom: '4px',
              }}
            >
              Active Markets
            </div>
            <div
              style={{
                fontSize: '24px',
                fontWeight: 800,
                color: 'var(--text-primary)',
              }}
            >
              {marketCount}
            </div>
            <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '2px' }}>
              Published city ladders
            </div>
          </div>

          {/* 2. Locations Available */}
          <div
            style={{
              padding: 'var(--space-4) var(--space-5)',
              backgroundColor: 'var(--surface-card)',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-subtle)',
            }}
          >
            <div
              style={{
                fontSize: '11px',
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
                color: 'var(--text-muted)',
                marginBottom: '4px',
              }}
            >
              Available Locations
            </div>
            <div
              style={{
                fontSize: '24px',
                fontWeight: 800,
                color: 'var(--text-primary)',
              }}
            >
              {uniqueCityCount}
            </div>
            <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '2px' }}>
              Distinct municipal centers
            </div>
          </div>

          {/* 3. Participating Businesses */}
          {totalBusinesses > 0 && (
            <div
              style={{
                padding: 'var(--space-4) var(--space-5)',
                backgroundColor: 'var(--surface-card)',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border-subtle)',
              }}
            >
              <div
                style={{
                  fontSize: '11px',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.06em',
                  color: 'var(--text-muted)',
                  marginBottom: '4px',
                }}
              >
                Ranked Businesses
              </div>
              <div
                style={{
                  fontSize: '24px',
                  fontWeight: 800,
                  color: 'var(--text-primary)',
                }}
              >
                {totalBusinesses}
              </div>
              <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                Audited ladder participants
              </div>
            </div>
          )}

          {/* 4. Top Qualification Floor */}
          {topQualifyingMinor > 0 && (
            <div
              style={{
                padding: 'var(--space-4) var(--space-5)',
                backgroundColor: 'var(--surface-card)',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border-subtle)',
              }}
            >
              <div
                style={{
                  fontSize: '11px',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.06em',
                  color: 'var(--brand-deep-emerald)',
                  marginBottom: '4px',
                }}
              >
                Peak Position Floor
              </div>
              <div
                style={{
                  fontSize: '24px',
                  fontWeight: 800,
                  color: 'var(--brand-deep-emerald)',
                }}
              >
                {formatAmountINR(topQualifyingMinor)}
              </div>
              <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                Highest #1 qualifying tier
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
