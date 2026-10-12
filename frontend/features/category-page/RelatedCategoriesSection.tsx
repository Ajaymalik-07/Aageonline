import React from 'react';
import type { CategorySummary } from '../../data-access/types.ts';

interface RelatedCategoriesSectionProps {
  currentCategory: CategorySummary;
  relatedCategories: CategorySummary[];
}

export function RelatedCategoriesSection({
  currentCategory,
  relatedCategories,
}: RelatedCategoriesSectionProps) {
  if (relatedCategories.length === 0) return null;

  return (
    <section
      aria-labelledby="related-categories-heading"
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
            Industry Verticals
          </span>
          <h2
            id="related-categories-heading"
            style={{
              fontSize: 'var(--font-size-section)',
              fontWeight: 800,
              color: 'var(--text-primary)',
              letterSpacing: '-0.02em',
              margin: 0,
            }}
          >
            Explore Other Commercial Categories
          </h2>
          <p
            style={{
              fontSize: '15px',
              color: 'var(--text-secondary)',
              marginTop: 'var(--space-2)',
              maxWidth: '600px',
            }}
          >
            Browse other published commercial categories with active local market visibility ladders.
          </p>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
            gap: 'var(--space-4)',
          }}
        >
          {relatedCategories.map((cat) => {
            const count = cat.activeMarketCount ?? cat.marketCount ?? 0;
            return (
              <a
                key={cat.id}
                href={cat.publicUrl || `/categories/${cat.slug}`}
                className="card-lift"
                aria-label={`Explore ${cat.name} markets`}
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
                    Commercial Category
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
