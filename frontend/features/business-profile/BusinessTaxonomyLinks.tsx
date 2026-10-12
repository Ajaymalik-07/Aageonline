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
          backgroundColor: 'var(--surface-card)',
          border: '1px solid var(--border-subtle)',
          borderRadius: 'var(--radius-lg)',
          padding: 'var(--space-6)',
          boxShadow: 'var(--elevation-1)',
        }}
      >
        <h2
          id="categories-served-heading"
          style={{
            fontSize: 'var(--font-size-sm)',
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '0.06em',
            color: 'var(--text-primary)',
            margin: '0 0 var(--space-4) 0',
          }}
        >
          Specializations & Categories
        </h2>

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
                  backgroundColor: 'var(--surface-sunken)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-pill)',
                  padding: '6px 14px',
                  fontSize: 'var(--font-size-xs)',
                  fontWeight: 600,
                  color: 'var(--text-primary)',
                  textDecoration: 'none',
                  transition: 'border-color 0.15s ease',
                }}
              >
                <span>{c.name}</span>
                <span aria-hidden="true" style={{ color: '#EA580C' }}>
                  →
                </span>
              </a>
            ))}
          </div>
        ) : (
          <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-tertiary)' }}>
            No secondary categories listed.
          </div>
        )}
      </section>

      {/* Locations Served block */}
      <section
        aria-labelledby="locations-served-heading"
        style={{
          backgroundColor: 'var(--surface-card)',
          border: '1px solid var(--border-subtle)',
          borderRadius: 'var(--radius-lg)',
          padding: 'var(--space-6)',
          boxShadow: 'var(--elevation-1)',
        }}
      >
        <h2
          id="locations-served-heading"
          style={{
            fontSize: 'var(--font-size-sm)',
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '0.06em',
            color: 'var(--text-primary)',
            margin: '0 0 var(--space-4) 0',
          }}
        >
          Municipal Locations Served
        </h2>

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
                  backgroundColor: 'var(--surface-sunken)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-pill)',
                  padding: '6px 14px',
                  fontSize: 'var(--font-size-xs)',
                  fontWeight: 600,
                  color: 'var(--text-primary)',
                  textDecoration: 'none',
                  transition: 'border-color 0.15s ease',
                }}
              >
                <span>
                  {loc.name}
                  {loc.stateName ? `, ${loc.stateName}` : ''}
                </span>
                <span aria-hidden="true" style={{ color: '#EA580C' }}>
                  →
                </span>
              </a>
            ))}
          </div>
        ) : (
          <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-tertiary)' }}>
            Location information unavailable.
          </div>
        )}
      </section>
    </div>
  );
}
