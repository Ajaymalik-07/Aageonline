import React from 'react';

interface BusinessBreadcrumbsProps {
  businessName: string;
}

export function BusinessBreadcrumbs({ businessName }: BusinessBreadcrumbsProps) {
  return (
    <nav
      aria-label="Breadcrumb"
      style={{
        padding: 'var(--space-4) 0',
        marginBottom: 'var(--space-4)',
      }}
    >
      <ol
        style={{
          display: 'flex',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 'var(--space-2)',
          listStyle: 'none',
          padding: 0,
          margin: 0,
          fontSize: 'var(--font-size-xs)',
          color: 'var(--text-tertiary)',
        }}
      >
        <li>
          <a
            href="/"
            style={{
              color: 'var(--text-secondary)',
              textDecoration: 'none',
              transition: 'color 0.15s ease',
            }}
          >
            Home
          </a>
        </li>
        <li aria-hidden="true" style={{ userSelect: 'none' }}>
          /
        </li>
        <li>
          <a
            href="/businesses"
            style={{
              color: 'var(--text-secondary)',
              textDecoration: 'none',
              transition: 'color 0.15s ease',
            }}
          >
            Businesses
          </a>
        </li>
        <li aria-hidden="true" style={{ userSelect: 'none' }}>
          /
        </li>
        <li aria-current="page" style={{ color: 'var(--text-primary)', fontWeight: 600 }}>
          {businessName}
        </li>
      </ol>
    </nav>
  );
}
