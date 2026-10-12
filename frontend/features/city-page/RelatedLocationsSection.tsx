import React from 'react';
import type { LocationSummary } from '../../data-access/types.ts';

interface RelatedLocationsSectionProps {
  currentLocation: LocationSummary;
  relatedLocations: LocationSummary[];
}

export function RelatedLocationsSection({
  currentLocation,
  relatedLocations,
}: RelatedLocationsSectionProps) {
  if (relatedLocations.length === 0) return null;

  return (
    <section
      aria-labelledby="related-locations-heading"
      style={{
        padding: 'var(--space-10) 0',
        borderTop: '1px solid var(--border-subtle)',
        backgroundColor: 'var(--bg-page)',
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
              marginBottom: 'var(--space-1)',
            }}
          >
            Regional Commercial Centers
          </span>
          <h2
            id="related-locations-heading"
            style={{
              fontSize: 'var(--font-size-section)',
              fontWeight: 800,
              color: 'var(--text-primary)',
              letterSpacing: '-0.02em',
              margin: 0,
            }}
          >
            Explore Other Commercial Locations
          </h2>
          <p
            style={{
              fontSize: '15px',
              color: 'var(--text-secondary)',
              marginTop: 'var(--space-2)',
              maxWidth: '600px',
            }}
          >
            Discover active commercial markets and competitive visibility ladders across other published Indian cities.
          </p>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
            gap: 'var(--space-4)',
          }}
        >
          {relatedLocations.map((loc) => {
            const count = loc.activeMarketCount ?? loc.marketCount ?? 0;
            return (
              <a
                key={loc.id}
                href={`/${loc.slug}`}
                className="card-lift"
                aria-label={`Explore commercial markets in ${loc.name}, ${loc.stateName}`}
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
                    {loc.name}
                  </h3>
                  <span
                    style={{
                      fontSize: '12px',
                      color: 'var(--text-muted)',
                      marginTop: '2px',
                      display: 'block',
                    }}
                  >
                    {loc.stateName}, India
                  </span>
                </div>

                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    fontSize: '12px',
                    fontWeight: 700,
                    padding: '3px 8px',
                    backgroundColor: 'rgba(234, 88, 12, 0.1)',
                    color: 'var(--brand-deep-emerald)',
                    borderRadius: 'var(--radius-pill)',
                  }}
                >
                  {count} {count === 1 ? 'market' : 'markets'}
                </div>
              </a>
            );
          })}
        </div>
      </div>
    </section>
  );
}
