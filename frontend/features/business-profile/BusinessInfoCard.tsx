import React from 'react';
import type { BusinessProfile } from '../../data-access/types.ts';

interface BusinessInfoCardProps {
  business: BusinessProfile;
}

export function BusinessInfoCard({ business }: BusinessInfoCardProps) {
  const isVerified = business.verificationStatus === 'VERIFIED';

  return (
    <section
      aria-labelledby="business-details-heading"
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
        id="business-details-heading"
        style={{
          fontSize: 'var(--font-size-base)',
          fontWeight: 700,
          color: 'var(--text-primary)',
          margin: '0 0 var(--space-4) 0',
          textTransform: 'uppercase',
          letterSpacing: '0.06em',
        }}
      >
        Verified Business Details
      </h2>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: 'var(--space-4)',
        }}
      >
        {business.address && (
          <div>
            <div style={{ fontSize: '11px', color: 'var(--text-tertiary)', textTransform: 'uppercase' }}>
              Registered Location
            </div>
            <div style={{ fontSize: 'var(--font-size-sm)', color: 'var(--text-primary)', marginTop: '2px' }}>
              {business.address}
            </div>
          </div>
        )}

        <div>
          <div style={{ fontSize: '11px', color: 'var(--text-tertiary)', textTransform: 'uppercase' }}>
            Verification Status
          </div>
          <div
            style={{
              fontSize: 'var(--font-size-sm)',
              fontWeight: 700,
              color: isVerified ? '#10B981' : 'var(--text-secondary)',
              marginTop: '2px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            {isVerified ? (
              <>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                Identity & Tax Records Verified
              </>
            ) : (
              'Standard Directory Listing'
            )}
          </div>
        </div>

        {business.website && (
          <div>
            <div style={{ fontSize: '11px', color: 'var(--text-tertiary)', textTransform: 'uppercase' }}>
              Official Website
            </div>
            <a
              href={business.website}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                fontSize: 'var(--font-size-sm)',
                color: 'var(--brand-deep-emerald)',
                marginTop: '2px',
                display: 'block',
                textDecoration: 'none',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {business.website.replace(/^https?:\/\//, '')}
            </a>
          </div>
        )}

        {business.phone && (
          <div>
            <div style={{ fontSize: '11px', color: 'var(--text-tertiary)', textTransform: 'uppercase' }}>
              Public Inquiries
            </div>
            <div style={{ fontSize: 'var(--font-size-sm)', color: 'var(--text-primary)', marginTop: '2px' }}>
              {business.phone}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
