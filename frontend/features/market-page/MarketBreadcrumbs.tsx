'use client';

import React from 'react';
import Link from 'next/link';

export interface BreadcrumbItem {
  label: string;
  href: string;
}

interface MarketBreadcrumbsProps {
  locationName: string;
  categoryName: string;
  locationSlug: string;
  categorySlug: string;
}

export const MarketBreadcrumbs: React.FC<MarketBreadcrumbsProps> = ({
  locationName,
  categoryName,
  locationSlug,
}) => {
  return (
    <nav aria-label="Breadcrumb" style={{ padding: '16px 0', backgroundColor: 'var(--surface-soft)' }}>
      <div className="container">
        <ol
          style={{
            display: 'flex',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '8px',
            listStyle: 'none',
            margin: 0,
            padding: 0,
            fontSize: '13px',
            color: 'var(--text-secondary)',
          }}
        >
          <li>
            <Link
              href="/"
              style={{
                color: 'var(--text-secondary)',
                textDecoration: 'none',
                fontWeight: 600,
                transition: 'color var(--motion-fast)',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.color = '#EA580C')}
              onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-secondary)')}
            >
              Home
            </Link>
          </li>
          <li aria-hidden="true" style={{ color: 'var(--border-strong)', userSelect: 'none' }}>
            /
          </li>
          <li>
            <Link
              href={`/${locationSlug}`}
              style={{
                color: 'var(--text-secondary)',
                textDecoration: 'none',
                fontWeight: 600,
                transition: 'color var(--motion-fast)',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.color = '#EA580C')}
              onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-secondary)')}
            >
              {locationName}
            </Link>
          </li>
          <li aria-hidden="true" style={{ color: 'var(--border-strong)', userSelect: 'none' }}>
            /
          </li>
          <li style={{ color: 'var(--text-primary)', fontWeight: 800 }} aria-current="page">
            {categoryName}
          </li>
        </ol>
      </div>
    </nav>
  );
};
