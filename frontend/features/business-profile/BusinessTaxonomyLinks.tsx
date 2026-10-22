import React from 'react';

interface BusinessTaxonomyLinksProps {
  categories: {
    id: string;
    name: string;
    slug: string;
    publicUrl: string;
  }[];
  locationsServed: {
    id: string;
    name: string;
    slug: string;
    stateName?: string;
    publicUrl: string;
  }[];
}

export function BusinessTaxonomyLinks({
  categories,
  locationsServed,
}: BusinessTaxonomyLinksProps) {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
        gap: 'var(--space-6)',
        marginBottom: 'var(--space-8)',
      }}
    >
      {/* Categories block */}
      <section
        aria-labelledby="categories-served-heading"
        style={{
          backgroundColor: '#FFFFFF',
          border: '1px solid #E2E8F0',
          borderRadius: 'var(--radius-xl)',
          padding: 'var(--space-6)',
          boxShadow: '0 2px 10px rgba(15, 23, 42, 0.04)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--space-4)' }}>
          <h2
            id="categories-served-heading"
            style={{
              fontSize: 'var(--font-size-sm)',
              fontWeight: 800,
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
              color: '#0F172A',
              margin: 0,
            }}
          >
            Specializations & Sectors
          </h2>
          <span style={{ fontSize: '11px', fontWeight: 700, color: '#EA580C' }}>
            {categories?.length ?? 0} Listed
          </span>
        </div>

        {categories && categories.length > 0 ? (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-2)' }}>
            {categories.map((c) => (
              <a
                key={c.id}
                href={c.publicUrl}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  backgroundColor: '#F8FAFC',
                  border: '1px solid #E2E8F0',
                  borderRadius: 'var(--radius-pill)',
                  padding: '7px 14px',
                  fontSize: 'var(--font-size-xs)',
                  fontWeight: 600,
                  color: '#334155',
                  textDecoration: 'none',
                  transition: 'all 0.15s ease',
                }}
              >
                <span>{c.name}</span>
                <span aria-hidden="true" style={{ color: '#EA580C', fontWeight: 700 }}>
                  →
                </span>
              </a>
            ))}
          </div>
        ) : (
          <div style={{ fontSize: 'var(--font-size-xs)', color: '#94A3B8' }}>
            No secondary categories listed.
          </div>
        )}
      </section>

      {/* Locations Served block */}
      <section
        aria-labelledby="locations-served-heading"
        style={{
          backgroundColor: '#FFFFFF',
          border: '1px solid #E2E8F0',
          borderRadius: 'var(--radius-xl)',
          padding: 'var(--space-6)',
          boxShadow: '0 2px 10px rgba(15, 23, 42, 0.04)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--space-4)' }}>
          <h2
            id="locations-served-heading"
            style={{
              fontSize: 'var(--font-size-sm)',
              fontWeight: 800,
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
              color: '#0F172A',
              margin: 0,
            }}
          >
            Municipal Service Coverage
          </h2>
          <span style={{ fontSize: '11px', fontWeight: 700, color: '#334155' }}>
            {locationsServed?.length ?? 0} Areas
          </span>
        </div>

        {locationsServed && locationsServed.length > 0 ? (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-2)' }}>
            {locationsServed.map((loc) => (
              <a
                key={loc.id}
                href={loc.publicUrl}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  backgroundColor: '#F8FAFC',
                  border: '1px solid #E2E8F0',
                  borderRadius: 'var(--radius-pill)',
                  padding: '7px 14px',
                  fontSize: 'var(--font-size-xs)',
                  fontWeight: 600,
                  color: '#334155',
                  textDecoration: 'none',
                  transition: 'all 0.15s ease',
                }}
              >
                <span>
                  📍 {loc.name}
                  {loc.stateName ? `, ${loc.stateName}` : ''}
                </span>
                <span aria-hidden="true" style={{ color: '#EA580C', fontWeight: 700 }}>
                  →
                </span>
              </a>
            ))}
          </div>
        ) : (
          <div style={{ fontSize: 'var(--font-size-xs)', color: '#94A3B8' }}>
            Location coverage not specified.
          </div>
        )}
      </section>
    </div>
  );
}
