import React from 'react';

interface BusinessOverviewProps {
  description: string;
  businessName?: string;
  legalName?: string;
  locationName?: string;
  isVerified?: boolean;
}

export function BusinessOverview({
  description,
  businessName,
  legalName,
  locationName,
  isVerified = false,
}: BusinessOverviewProps) {
  return (
    <section
      aria-labelledby="business-overview-heading"
      style={{
        backgroundColor: '#FFFFFF',
        border: '1px solid #E2E8F0',
        borderRadius: 'var(--radius-xl)',
        padding: 'var(--space-8)',
        marginBottom: 'var(--space-8)',
        boxShadow: '0 2px 10px rgba(15, 23, 42, 0.04)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px', marginBottom: 'var(--space-4)' }}>
        <h2
          id="business-overview-heading"
          style={{
            fontSize: 'var(--font-size-xl)',
            fontWeight: 800,
            color: '#0F172A',
            margin: 0,
            letterSpacing: '-0.01em',
          }}
        >
          {businessName ? `About ${businessName}` : 'Business Overview'}
        </h2>

        <span
          style={{
            fontSize: '11px',
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '0.06em',
            color: '#EA580C',
            backgroundColor: '#FFF7ED',
            padding: '4px 10px',
            borderRadius: 'var(--radius-pill)',
            border: '1px solid #FED7AA',
          }}
        >
          Verified Business Story
        </span>
      </div>

      <p
        style={{
          fontSize: 'var(--font-size-base)',
          color: '#334155',
          lineHeight: 1.7,
          margin: '0 0 var(--space-6) 0',
        }}
      >
        {description}
      </p>

      {/* Enterprise Meta Highlights */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: 'var(--space-4)',
          paddingTop: 'var(--space-6)',
          borderTop: '1px solid #F1F5F9',
        }}
      >
        {legalName && (
          <div>
            <div style={{ fontSize: '11px', fontWeight: 700, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Corporate Entity
            </div>
            <div style={{ fontSize: '13px', fontWeight: 600, color: '#0F172A', marginTop: '2px' }}>
              {legalName}
            </div>
          </div>
        )}

        {locationName && (
          <div>
            <div style={{ fontSize: '11px', fontWeight: 700, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Primary Jurisdiction
            </div>
            <div style={{ fontSize: '13px', fontWeight: 600, color: '#0F172A', marginTop: '2px' }}>
              {locationName}, India
            </div>
          </div>
        )}

        <div>
          <div style={{ fontSize: '11px', fontWeight: 700, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Listing Standing
          </div>
          <div style={{ fontSize: '13px', fontWeight: 600, color: isVerified ? '#059669' : '#64748B', marginTop: '2px', display: 'flex', alignItems: 'center', gap: '4px' }}>
            {isVerified ? '✓ Identity & Registry Verified' : 'Standard Directory Listing'}
          </div>
        </div>
      </div>
    </section>
  );
}
