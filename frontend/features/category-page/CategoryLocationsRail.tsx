import React from 'react';
import type { CategorySummary, MarketSummary } from '../../data-access/types.ts';

interface CategoryLocationsRailProps {
  category: CategorySummary;
  markets: MarketSummary[];
}

export function CategoryLocationsRail({ category, markets }: CategoryLocationsRailProps) {
  // Derive unique cities strictly from the published markets in this category
  const cityMap = new Map<string, { cityId: string; cityName: string; citySlug: string; marketUrl: string }>();

  for (const m of markets) {
    if (!cityMap.has(m.cityId)) {
      cityMap.set(m.cityId, {
        cityId: m.cityId,
        cityName: m.cityName,
        citySlug: m.citySlug,
        marketUrl: m.publicUrl || `/${m.citySlug}/${category.slug}`,
      });
    }
  }

  const cities = Array.from(cityMap.values()).sort((a, b) =>
    a.cityName.localeCompare(b.cityName)
  );

  if (cities.length === 0) return null;

  return (
    <section
      aria-labelledby="category-locations-heading"
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
            Regional Availability
          </span>
          <h2
            id="category-locations-heading"
            style={{
              fontSize: 'var(--font-size-section)',
              fontWeight: 800,
              color: 'var(--text-primary)',
              letterSpacing: '-0.02em',
              margin: 0,
            }}
          >
            Explore {category.name} by Location
          </h2>
          <p
            style={{
              fontSize: '15px',
              color: 'var(--text-secondary)',
              marginTop: 'var(--space-2)',
              maxWidth: '620px',
            }}
          >
            Select any municipal center to view the active {category.name} competitive ladder and qualifying position tiers.
          </p>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
            gap: 'var(--space-4)',
          }}
        >
          {cities.map((c) => (
            <a
              key={c.cityId}
              href={c.marketUrl}
              className="card-lift"
              aria-label={`View ${c.cityName} ${category.name} Market`}
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
                  {c.cityName}
                </h3>
                <span
                  style={{
                    fontSize: '12px',
                    color: 'var(--text-muted)',
                    marginTop: '2px',
                    display: 'block',
                  }}
                >
                  {category.name} Market
                </span>
              </div>

              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  color: 'var(--brand-deep-emerald)',
                  fontSize: '13px',
                  fontWeight: 600,
                }}
              >
                <span>View Market</span>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M5 12h14M12 5l7 7-7 7" />
                </svg>
              </div>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}
