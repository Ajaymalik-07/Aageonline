'use client';

import React from 'react';
import Link from 'next/link';
import type { RelatedMarketLink, RelatedCategoryLink } from '../../data/markets/jaipur-interior-designers';
import { formatINR } from '../../lib/utils/format';

interface RelatedMarketsSectionProps {
  relatedMarkets: RelatedMarketLink[];
  relatedCategories: RelatedCategoryLink[];
  locationName: string;
}

export const RelatedMarketsSection: React.FC<RelatedMarketsSectionProps> = ({
  relatedMarkets,
  relatedCategories,
  locationName,
}) => {
  return (
    <section
      id="related-markets"
      style={{
        backgroundColor: '#ffffff',
        borderBottom: '1px solid var(--border-subtle)',
        padding: 'clamp(48px, 6vw, 72px) 0',
      }}
    >
      <div className="container">
        {/* Subsection 1: Related Jaipur Markets */}
        <div style={{ marginBottom: '48px' }}>
          <div style={{ marginBottom: '24px' }}>
            <span
              style={{
                fontSize: '11px',
                fontWeight: 800,
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                color: '#EA580C',
                display: 'block',
                marginBottom: '4px',
              }}
            >
              CROSS-CATEGORY DISCOVERY
            </span>
            <h2
              style={{
                fontSize: 'clamp(24px, 3.2vw, 32px)',
                fontWeight: 900,
                color: 'var(--text-primary)',
                letterSpacing: '-0.02em',
                margin: 0,
              }}
            >
              Related Markets in {locationName}
            </h2>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
              gap: '16px',
            }}
          >
            {relatedMarkets.map((mkt, idx) => (
              <Link
                key={idx}
                href={`/${mkt.slug}`}
                style={{
                  textDecoration: 'none',
                  backgroundColor: 'var(--surface-raised)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-md)',
                  padding: '18px',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  transition: 'all var(--motion-fast)',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = '#EA580C';
                  e.currentTarget.style.transform = 'translateY(-2px)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = 'var(--border-subtle)';
                  e.currentTarget.style.transform = 'none';
                }}
              >
                <div>
                  <span style={{ fontSize: '11px', fontWeight: 800, color: '#EA580C', textTransform: 'uppercase' }}>
                    {mkt.category}
                  </span>
                  <h3 style={{ fontSize: '15px', fontWeight: 800, color: 'var(--text-primary)', margin: '4px 0 10px 0' }}>
                    {mkt.title}
                  </h3>
                </div>

                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    paddingTop: '10px',
                    borderTop: '1px solid #F1F5F9',
                    fontSize: '12px',
                  }}
                >
                  <span style={{ color: 'var(--text-muted)' }}>Top Floor:</span>
                  <strong style={{ color: 'var(--text-primary)', fontWeight: 800 }}>
                    {formatINR(mkt.qualifyingAmountRupees * 100)}
                  </strong>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Subsection 2: Related Industry Categories */}
        <div>
          <div style={{ marginBottom: '20px' }}>
            <h3
              style={{
                fontSize: '20px',
                fontWeight: 900,
                color: 'var(--text-primary)',
                letterSpacing: '-0.015em',
                margin: 0,
              }}
            >
              Explore Related Architecture & Construction Categories
            </h3>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
              gap: '14px',
            }}
          >
            {relatedCategories.map((cat, idx) => (
              <div
                key={idx}
                style={{
                  backgroundColor: '#ffffff',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-md)',
                  padding: '16px',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                }}
              >
                <h4 style={{ fontSize: '14px', fontWeight: 800, color: 'var(--text-primary)', margin: '0 0 6px 0' }}>
                  {cat.title}
                </h4>
                <p style={{ fontSize: '12px', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.5 }}>
                  {cat.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};
