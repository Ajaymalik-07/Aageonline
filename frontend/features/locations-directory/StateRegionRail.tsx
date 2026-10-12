import React from 'react';
import type { StateSummary } from '../../data-access/types.ts';

interface StateRegionRailProps {
  states: StateSummary[];
  selectedState?: string;
}

export function StateRegionRail({ states, selectedState }: StateRegionRailProps) {
  if (states.length === 0) return null;

  return (
    <section
      aria-labelledby="explore-states-heading"
      style={{
        padding: 'var(--space-8) 0',
        borderTop: '1px solid var(--border-subtle)',
      }}
    >
      <div className="container">
        <div style={{ marginBottom: 'var(--space-4)' }}>
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
            Regional Jurisdictions
          </span>
          <h2
            id="explore-states-heading"
            style={{
              fontSize: '22px',
              fontWeight: 800,
              color: 'var(--text-primary)',
              letterSpacing: '-0.02em',
              margin: 0,
            }}
          >
            Explore by State / Region
          </h2>
        </div>

        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: 'var(--space-3)',
          }}
        >
          <a
            href="/locations"
            style={{
              padding: '8px 16px',
              backgroundColor: !selectedState ? 'var(--brand-deep-emerald)' : 'var(--surface-card)',
              color: !selectedState ? '#FFFFFF' : 'var(--text-primary)',
              border: '1px solid',
              borderColor: !selectedState ? 'var(--brand-deep-emerald)' : 'var(--border-subtle)',
              borderRadius: 'var(--radius-pill)',
              textDecoration: 'none',
              fontSize: '13px',
              fontWeight: 600,
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              transition: 'all 0.15s ease',
            }}
          >
            All States
          </a>

          {states.map((st) => {
            const isSelected = selectedState?.toLowerCase() === st.slug.toLowerCase();
            return (
              <a
                key={st.slug}
                href={`/locations?state=${st.slug}`}
                style={{
                  padding: '8px 16px',
                  backgroundColor: isSelected ? 'var(--brand-deep-emerald)' : 'var(--surface-card)',
                  color: isSelected ? '#FFFFFF' : 'var(--text-primary)',
                  border: '1px solid',
                  borderColor: isSelected ? 'var(--brand-deep-emerald)' : 'var(--border-subtle)',
                  borderRadius: 'var(--radius-pill)',
                  textDecoration: 'none',
                  fontSize: '13px',
                  fontWeight: 600,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  transition: 'all 0.15s ease',
                }}
              >
                <span>{st.name}</span>
                <span
                  style={{
                    fontSize: '11px',
                    opacity: 0.8,
                    padding: '2px 6px',
                    borderRadius: 'var(--radius-pill)',
                    backgroundColor: isSelected ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.05)',
                  }}
                >
                  {st.locationCount} {st.locationCount === 1 ? 'city' : 'cities'}
                </span>
              </a>
            );
          })}
        </div>
      </div>
    </section>
  );
}
