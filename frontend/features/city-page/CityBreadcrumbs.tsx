import React from 'react';
import type { LocationSummary } from '../../data-access/types.ts';

interface CityBreadcrumbsProps {
  location: LocationSummary;
}

export function CityBreadcrumbs({ location }: CityBreadcrumbsProps) {
  return (
    <nav
      aria-label="Breadcrumb navigation"
      style={{
        padding: 'var(--space-3) 0',
        borderBottom: '1px solid var(--border-subtle)',
        backgroundColor: 'var(--surface-subtle)',
        fontSize: '13px',
      }}
    >
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
            color: 'var(--text-muted)',
          }}
        >
          <li>
            <a
              href="/"
              style={{
                color: 'var(--text-secondary)',
                textDecoration: 'none',
                fontWeight: 500,
              }}
            >
              Home
            </a>
          </li>
          <li aria-hidden="true" style={{ opacity: 0.5 }}>/</li>
          <li>
            <a
              href="/locations"
              style={{
                color: 'var(--text-secondary)',
                textDecoration: 'none',
                fontWeight: 500,
              }}
            >
              Locations
            </a>
          </li>
          <li aria-hidden="true" style={{ opacity: 0.5 }}>/</li>
          <li>
            <span
              style={{
                color: 'var(--text-primary)',
                fontWeight: 600,
              }}
              aria-current="page"
            >
              {location.name}
            </span>
          </li>
        </ol>
      </div>
    </nav>
  );
}
