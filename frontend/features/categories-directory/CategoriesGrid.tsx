import React from 'react';
import type { CategorySummary } from '../../data-access/types.ts';
import { CategoryCard } from './CategoryCard';

interface CategoriesGridProps {
  categories: CategorySummary[];
  emptyMessage?: string;
}

export function CategoriesGrid({
  categories,
  emptyMessage = 'No published commercial categories currently available.',
}: CategoriesGridProps) {
  if (categories.length === 0) {
    return (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          textAlign: 'center',
          padding: 'var(--space-12) var(--space-6)',
          backgroundColor: 'var(--surface-card)',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid var(--border-subtle)',
          margin: 'var(--space-6) 0',
        }}
      >
        <div
          style={{
            width: '48px',
            height: '48px',
            borderRadius: '50%',
            backgroundColor: 'rgba(234, 88, 12, 0.1)',
            color: 'var(--brand-deep-emerald)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: 'var(--space-4)',
          }}
          aria-hidden="true"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
            <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
          </svg>
        </div>
        <h3
          style={{
            fontSize: '18px',
            fontWeight: 700,
            color: 'var(--text-primary)',
            marginBottom: 'var(--space-2)',
          }}
        >
          No Categories Found
        </h3>
        <p
          style={{
            fontSize: '14px',
            color: 'var(--text-secondary)',
            maxWidth: '440px',
            lineHeight: 1.5,
            margin: '0 0 var(--space-6) 0',
          }}
        >
          {emptyMessage}
        </p>
        <a
          href="/categories"
          style={{
            padding: '10px 20px',
            backgroundColor: 'var(--brand-deep-emerald)',
            color: '#FFFFFF',
            borderRadius: 'var(--radius-pill)',
            fontSize: '13px',
            fontWeight: 600,
            textDecoration: 'none',
          }}
        >
          View All Categories
        </a>
      </div>
    );
  }

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
        gap: 'var(--space-5)',
      }}
    >
      {categories.map((cat) => (
        <CategoryCard key={cat.id} category={cat} />
      ))}
    </div>
  );
}
