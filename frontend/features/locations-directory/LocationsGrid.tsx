import React from 'react';
import type { LocationSummary } from '../../data-access/types.ts';
import { LocationCard } from './LocationCard';

interface LocationsGridProps {
  locations: LocationSummary[];
  emptyMessage?: string;
}

export function LocationsGrid({
  locations,
  emptyMessage = 'No published commercial locations currently available.',
}: LocationsGridProps) {
  if (locations.length === 0) {
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
            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
            <circle cx="12" cy="10" r="3" />
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
          No Locations Found
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
          href="/locations"
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
          Reset Location Filters
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
      {locations.map((loc) => (
        <LocationCard key={loc.id} location={loc} />
      ))}
    </div>
  );
}
