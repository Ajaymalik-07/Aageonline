import React from 'react';

interface BusinessOverviewProps {
  description: string;
}

export function BusinessOverview({ description }: BusinessOverviewProps) {
  return (
    <section
      aria-labelledby="business-overview-heading"
      style={{
        backgroundColor: 'var(--surface-card)',
        border: '1px solid var(--border-subtle)',
        borderRadius: 'var(--radius-lg)',
        padding: 'var(--space-6)',
        marginBottom: 'var(--space-8)',
        boxShadow: 'var(--elevation-1)',
      }}
    >
      <h2
        id="business-overview-heading"
        style={{
          fontSize: 'var(--font-size-base)',
          fontWeight: 700,
          color: 'var(--text-primary)',
          margin: '0 0 var(--space-3) 0',
          textTransform: 'uppercase',
          letterSpacing: '0.06em',
        }}
      >
        Business Overview
      </h2>

      <p
        style={{
          fontSize: 'var(--font-size-base)',
          color: 'var(--text-secondary)',
          lineHeight: 1.65,
          margin: 0,
        }}
      >
        {description}
      </p>
    </section>
  );
}
