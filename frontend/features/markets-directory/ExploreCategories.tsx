import React from 'react';
import type { CategorySummary } from '../../data-access/types.ts';

interface ExploreCategoriesProps {
  categories:
    | CategorySummary[]
    | Array<{
        categorySlug?: string;
        slug?: string;
        categoryName?: string;
        name?: string;
        marketCount: number;
      }>;
}

export function ExploreCategories({ categories }: ExploreCategoriesProps) {
  if (categories.length === 0) return null;

  return (
    <section
      aria-labelledby="explore-categories-heading"
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
            Industry Verticals
          </span>
          <h2
            id="explore-categories-heading"
            style={{
              fontSize: 'var(--font-size-section)',
              fontWeight: 800,
              color: 'var(--text-primary)',
              letterSpacing: '-0.02em',
              margin: 0,
            }}
          >
            Explore Markets by Category
          </h2>
          <p
            style={{
              fontSize: '15px',
              color: 'var(--text-secondary)',
              marginTop: 'var(--space-2)',
              maxWidth: '600px',
            }}
          >
            Browse competitive positioning by industry vertical across active commercial locations.
          </p>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
            gap: 'var(--space-5)',
          }}
        >
          {categories.map((cat) => {
            const slug = cat.slug || (cat as any).categorySlug;
            const name = cat.name || (cat as any).categoryName;

            return (
              <a
                key={slug}
                href={`/categories/${slug}`}
                className="card-lift"
                aria-label={`View markets in category ${name} (${cat.marketCount} active)`}
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
                    {cat.marketCount} {cat.marketCount === 1 ? 'city' : 'cities'}
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
