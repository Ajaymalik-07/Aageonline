import React from 'react';
import type { LocationSummary } from '../../data-access/types.ts';

interface ExploreLocationsProps {
  locations:
    | LocationSummary[]
    | Array<{
        citySlug?: string;
        slug?: string;
        cityName?: string;
        name?: string;
        stateName?: string;
        marketCount: number;
      }>;
}

export function ExploreLocations({ locations }: ExploreLocationsProps) {
  if (locations.length === 0) return null;

  return (
    <section
      aria-labelledby="explore-locations-heading"
      style={{
        padding: 'var(--space-10) 0',
        borderTop: '1px solid var(--border-subtle)',
      }}
    >
      <div className="container">
        <div style={{ marginBottom: 'var(--space-6)' }}>
          <span
            style={{
              fontSize: 'var(--font-size-eyebrow)',
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              color: 'var(--brand-deep-emerald)',
              display: 'block',
              marginBottom: 'var(--space-2)',
            }}
          >
            Regional Coverage
          </span>
          <h2
            id="explore-locations-heading"
            style={{
              fontSize: 'var(--font-size-section)',
              fontWeight: 800,
              color: 'var(--text-primary)',
              letterSpacing: '-0.02em',
              margin: 0,
            }}
          >
            Explore Markets by Location
          </h2>
          <p
            style={{
              fontSize: '15px',
              color: 'var(--text-secondary)',
              marginTop: 'var(--space-2)',
              maxWidth: '600px',
            }}
          >
            Select a commercial center to view all active industry markets with verified competitive positions.
          </p>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
            gap: 'var(--space-5)',
          }}
        >
          {locations.map((loc) => {
            const slug = loc.slug || (loc as any).citySlug;
            const name = loc.name || (loc as any).cityName;

            return (
              <a
                key={slug}
                href={`/${slug}`}
                className="card-lift"
                aria-label={`View markets in ${name}, ${loc.stateName || 'India'} (${loc.marketCount} active)`}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: 'var(--space-5) var(--space-6)',
                  backgroundColor: 'var(--surface-card)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-lg)',
                  textDecoration: 'none',
                  boxShadow: 'var(--elevation-1)',
                }}
              >
                <div>
                  <h3
                    style={{
                      fontSize: '16px',
                      fontWeight: 700,
                      color: 'var(--text-primary)',
                      margin: 0,
                    }}
                  >
                    {name}
                  </h3>
                  {loc.stateName && (
                    <span
                      style={{
                        fontSize: '12px',
                        color: 'var(--text-muted)',
                        fontWeight: 500,
                      }}
                    >
                      {loc.stateName}
                    </span>
                  )}
                </div>

                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 'var(--space-2)',
                  }}
                >
                  <span
                    style={{
                      fontSize: '12px',
                      fontWeight: 700,
                      padding: '4px 10px',
                      backgroundColor: 'rgba(234, 88, 12, 0.1)',
                      color: 'var(--brand-deep-emerald)',
                      borderRadius: 'var(--radius-pill)',
                    }}
                  >
                    {loc.marketCount} {loc.marketCount === 1 ? 'market' : 'markets'}
                  </span>
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    style={{ color: 'var(--text-muted)' }}
                    aria-hidden="true"
                  >
                    <path d="M9 18l6-6-6-6" />
                  </svg>
                </div>
              </a>
            );
          })}
        </div>
      </div>
    </section>
  );
}
