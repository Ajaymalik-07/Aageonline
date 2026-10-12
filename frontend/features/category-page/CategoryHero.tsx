import React from 'react';
import type { CategorySummary } from '../../data-access/types.ts';

interface CategoryHeroProps {
  category: CategorySummary;
  marketCount: number;
}

export function CategoryHero({ category, marketCount }: CategoryHeroProps) {
  return (
    <section
      style={{
        backgroundColor: '#071526',
        backgroundImage:
          'radial-gradient(circle at 50% 20%, rgba(234, 88, 12, 0.12) 0%, rgba(7, 21, 38, 0) 70%)',
        color: '#FFFFFF',
        padding: 'clamp(var(--space-10), 6vw, var(--space-14)) 0 clamp(var(--space-8), 4vw, var(--space-10)) 0',
        borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
      }}
    >
      <div className="container" style={{ textAlign: 'center' }}>
        {/* Eyebrow */}
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 'var(--space-2)',
            padding: '6px 14px',
            backgroundColor: 'rgba(234, 88, 12, 0.15)',
            border: '1px solid rgba(234, 88, 12, 0.3)',
            borderRadius: 'var(--radius-pill)',
            marginBottom: 'var(--space-4)',
          }}
        >
          <span
            style={{
              width: '6px',
              height: '6px',
              borderRadius: '50%',
              backgroundColor: 'var(--brand-deep-emerald)',
            }}
            aria-hidden="true"
          />
          <span
            style={{
              fontSize: '12px',
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              color: '#FB923C',
            }}
          >
            Category Discovery • {marketCount} Active City {marketCount === 1 ? 'Market' : 'Markets'}
          </span>
        </div>

        {/* Heading 1 */}
        <h1
          style={{
            fontSize: 'clamp(32px, 5vw, 52px)',
            fontWeight: 800,
            letterSpacing: '-0.03em',
            lineHeight: 1.15,
            color: '#FFFFFF',
            margin: '0 auto var(--space-4) auto',
            maxWidth: '820px',
          }}
        >
          {category.name} Markets on AageOnline
        </h1>

        {/* Subtitle / Direct Answer for AEO */}
        <p
          style={{
            fontSize: 'clamp(16px, 2vw, 18px)',
            color: 'rgba(255, 255, 255, 0.8)',
            lineHeight: 1.6,
            maxWidth: '680px',
            margin: '0 auto var(--space-8) auto',
          }}
        >
          AageOnline organizes business markets by location and category. On this category page, you can explore the cities where {category.name} markets are currently published and inspect transparent competitive ranking ladders.
        </p>

        {/* Action Buttons */}
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 'var(--space-3)',
          }}
        >
          <a
            href="#category-markets"
            style={{
              padding: '12px 28px',
              backgroundColor: '#EA580C',
              color: '#FFFFFF',
              borderRadius: 'var(--radius-pill)',
              fontSize: '14px',
              fontWeight: 700,
              textDecoration: 'none',
              boxShadow: '0 4px 14px rgba(234, 88, 12, 0.4)',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            <span>Explore {category.name} Markets</span>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M19 9l-7 7-7-7" />
            </svg>
          </a>

          <a
            href="/categories"
            style={{
              padding: '12px 24px',
              backgroundColor: 'rgba(255, 255, 255, 0.08)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              color: '#FFFFFF',
              borderRadius: 'var(--radius-pill)',
              fontSize: '14px',
              fontWeight: 600,
              textDecoration: 'none',
            }}
          >
            All Business Categories
          </a>
        </div>
      </div>
    </section>
  );
}
