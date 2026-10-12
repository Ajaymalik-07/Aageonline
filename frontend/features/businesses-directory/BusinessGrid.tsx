import React from 'react';
import type { BusinessSummary } from '../../data-access/types.ts';
import { BusinessCard } from './BusinessCard.tsx';

interface BusinessGridProps {
  businesses: BusinessSummary[];
}

export function BusinessGrid({ businesses }: BusinessGridProps) {
  if (businesses.length === 0) {
    return (
      <div
        style={{
          textAlign: 'center',
          padding: 'var(--space-16) var(--space-6)',
          backgroundColor: 'var(--surface-card)',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid var(--border-subtle)',
          maxWidth: '600px',
          margin: '0 auto',
        }}
      >
        <div
          style={{
            width: '48px',
            height: '48px',
            margin: '0 auto var(--space-4)',
            borderRadius: '50%',
            backgroundColor: 'rgba(234, 88, 12, 0.1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#EA580C',
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
            fontSize: 'var(--font-size-lg)',
            fontWeight: 700,
            color: 'var(--text-primary)',
            margin: '0 0 var(--space-2) 0',
          }}
        >
          No Published Businesses Available Yet
        </h3>
        <p
          style={{
            fontSize: 'var(--font-size-sm)',
            color: 'var(--text-secondary)',
            margin: '0 0 var(--space-6) 0',
            lineHeight: 1.5,
          }}
        >
          New businesses are onboarded through our transparent verification and market participation process.
        </p>
        <a
          href="/markets"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 'var(--space-2)',
            padding: '10px 20px',
            backgroundColor: '#EA580C',
            color: '#FFFFFF',
            borderRadius: 'var(--radius-pill)',
            fontWeight: 700,
            fontSize: 'var(--font-size-sm)',
            textDecoration: 'none',
          }}
        >
          Explore Active Markets →
        </a>
      </div>
    );
  }

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
        gap: 'var(--space-6)',
      }}
    >
      {businesses.map((biz) => (
        <BusinessCard key={biz.id} business={biz} />
      ))}
    </div>
  );
}
