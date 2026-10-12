import React from 'react';
import type { LocationSummary, MarketSummary } from '../../data-access/types.ts';

interface CityCategoriesRailProps {
  location: LocationSummary;
  markets: MarketSummary[];
}

export function CityCategoriesRail({ location, markets }: CityCategoriesRailProps) {
  // Derive categories strictly from published markets in this city (no global bleed)
  const categoryMap = new Map<string, { id: string; name: string; slug: string; marketUrl: string }>();

  for (const m of markets) {
    if (!categoryMap.has(m.categoryId)) {
      categoryMap.set(m.categoryId, {
        id: m.categoryId,
        name: m.categoryName,
        slug: m.categorySlug,
        marketUrl: m.publicUrl || `/${location.slug}/${m.categorySlug}`,
      });
    }
  }

  const cityCategories = Array.from(categoryMap.values()).sort((a, b) =>
    a.name.localeCompare(b.name)
  );

  if (cityCategories.length === 0) return null;

  return (
    <section
      aria-labelledby="city-categories-heading"
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
            Commercial Sectors
          </span>
          <h2
            id="city-categories-heading"
            style={{
              fontSize: 'var(--font-size-section)',
              fontWeight: 800,
              color: 'var(--text-primary)',
              letterSpacing: '-0.02em',
              margin: 0,
            }}
          >
            Categories Available in {location.name}
          </h2>
          <p
            style={{
              fontSize: '15px',
              color: 'var(--text-secondary)',
              marginTop: 'var(--space-2)',
              maxWidth: '620px',
            }}
          >
            Explore verified paid-visibility ranking ladders across distinct industry categories published in {location.name}.
          </p>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
            gap: 'var(--space-4)',
          }}
        >
          {cityCategories.map((cat) => (
            <a
              key={cat.id}
              href={cat.marketUrl}
              className="card-lift"
              aria-label={`View ${location.name} ${cat.name} Market`}
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
                  {cat.name}
                </h3>
                <span
                  style={{
                    fontSize: '12px',
                    color: 'var(--text-muted)',
                    marginTop: '2px',
                    display: 'block',
                  }}
                >
                  {location.name} Market
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
                <span>View</span>
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
