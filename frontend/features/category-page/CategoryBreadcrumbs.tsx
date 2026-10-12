import React from 'react';
import type { CategorySummary } from '../../data-access/types.ts';

interface CategoryBreadcrumbsProps {
  category: CategorySummary;
}

export function CategoryBreadcrumbs({ category }: CategoryBreadcrumbsProps) {
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
              href="/categories"
              style={{
                color: 'var(--text-secondary)',
                textDecoration: 'none',
                fontWeight: 500,
              }}
            >
              Categories
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
              {category.name}
            </span>
          </li>
        </ol>
      </div>
    </nav>
  );
}
