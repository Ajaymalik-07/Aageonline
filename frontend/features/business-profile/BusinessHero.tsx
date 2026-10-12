import React from 'react';
import type { BusinessProfile } from '../../data-access/types.ts';

interface BusinessHeroProps {
  business: BusinessProfile;
}

export function BusinessHero({ business }: BusinessHeroProps) {
  const isVerified = business.verificationStatus === 'VERIFIED';
  const marketCount = business.marketParticipations?.length ?? 0;

  const initials = business.name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join('');

  return (
    <section
      aria-labelledby="business-hero-heading"
      style={{
        position: 'relative',
        backgroundColor: '#071526',
        borderRadius: 'var(--radius-xl)',
        padding: 'var(--space-8) var(--space-8)',
        marginBottom: 'var(--space-8)',
        border: '1px solid rgba(255, 255, 255, 0.12)',
        overflow: 'hidden',
        boxShadow: 'var(--elevation-2)',
      }}
    >
      {/* Background glow effects */}
      <div
        style={{
          position: 'absolute',
          top: '-30%',
          right: '-10%',
          width: '450px',
          height: '450px',
          background: 'radial-gradient(circle, rgba(234, 88, 12, 0.12) 0%, rgba(7, 21, 38, 0) 70%)',
          borderRadius: '50%',
          pointerEvents: 'none',
        }}
        aria-hidden="true"
      />
      <div
        style={{
          position: 'absolute',
          bottom: '-30%',
          left: '-10%',
          width: '350px',
          height: '350px',
          background: 'radial-gradient(circle, rgba(16, 185, 129, 0.08) 0%, rgba(7, 21, 38, 0) 70%)',
          borderRadius: '50%',
          pointerEvents: 'none',
        }}
        aria-hidden="true"
      />

      <div
        style={{
          position: 'relative',
          zIndex: 1,
          display: 'flex',
          flexDirection: 'column',
          gap: 'var(--space-6)',
        }}
      >
        {/* Top bar: Sector badge + Verification */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 'var(--space-3)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
            {business.primaryCategory && (
              <a
                href={`/categories/${business.primaryCategory.slug}`}
                style={{
                  fontSize: '11px',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em',
                  color: '#FB923C',
                  backgroundColor: 'rgba(234, 88, 12, 0.15)',
                  padding: '4px 10px',
                  borderRadius: 'var(--radius-pill)',
                  textDecoration: 'none',
                  border: '1px solid rgba(234, 88, 12, 0.3)',
                }}
              >
                {business.primaryCategory.name}
              </a>
            )}

            {business.primaryLocation && (
              <a
                href={`/${business.primaryLocation.slug}`}
                style={{
                  fontSize: '11px',
                  fontWeight: 600,
                  color: 'rgba(255, 255, 255, 0.7)',
                  backgroundColor: 'rgba(255, 255, 255, 0.08)',
                  padding: '4px 10px',
                  borderRadius: 'var(--radius-pill)',
                  textDecoration: 'none',
                }}
              >
                {business.primaryLocation.name}
                {business.primaryLocation.stateName ? `, ${business.primaryLocation.stateName}` : ''}
              </a>
            )}
          </div>

          {isVerified && (
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                fontSize: '12px',
                fontWeight: 700,
                color: '#10B981',
                backgroundColor: 'rgba(16, 185, 129, 0.15)',
                padding: '4px 12px',
                borderRadius: 'var(--radius-pill)',
                border: '1px solid rgba(16, 185, 129, 0.3)',
              }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                <polyline points="20 6 9 17 4 12" />
              </svg>
              Verified Business Profile
            </span>
          )}
        </div>

        {/* Identity block */}
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 'var(--space-6)', flexWrap: 'wrap' }}>
          <div
            style={{
              width: '72px',
              height: '72px',
              borderRadius: 'var(--radius-lg)',
              background: 'linear-gradient(135deg, #0B1F33, #071526)',
              border: '2px solid rgba(251, 146, 60, 0.4)',
              color: '#FB923C',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 800,
              fontSize: '24px',
              letterSpacing: '0.05em',
              flexShrink: 0,
              boxShadow: '0 8px 16px rgba(0, 0, 0, 0.3)',
            }}
            aria-hidden="true"
          >
            {initials || 'AO'}
          </div>

          <div style={{ flex: 1, minWidth: '280px' }}>
            <h1
              id="business-hero-heading"
              style={{
                fontSize: 'clamp(1.75rem, 3.5vw, 2.5rem)',
                fontWeight: 800,
                color: '#FFFFFF',
                margin: '0 0 var(--space-2) 0',
                lineHeight: 1.15,
                letterSpacing: '-0.02em',
              }}
            >
              {business.name}
            </h1>

            {business.legalName && (
              <div
                style={{
                  fontSize: 'var(--font-size-xs)',
                  color: 'rgba(255, 255, 255, 0.5)',
                  marginBottom: 'var(--space-2)',
                }}
              >
                Legal Entity: {business.legalName}
              </div>
            )}

            {business.tagline && (
              <p
                style={{
                  fontSize: 'var(--font-size-base)',
                  color: 'rgba(255, 255, 255, 0.85)',
                  lineHeight: 1.5,
                  margin: '0 0 var(--space-4) 0',
                  maxWidth: '720px',
                }}
              >
                {business.tagline}
              </p>
            )}
          </div>
        </div>

        {/* Action row */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: 'var(--space-3)',
            paddingTop: 'var(--space-4)',
            borderTop: '1px solid rgba(255, 255, 255, 0.1)',
          }}
        >
          {business.website && (
            <a
              href={business.website}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                backgroundColor: 'rgba(255, 255, 255, 0.12)',
                color: '#FFFFFF',
                padding: '10px 18px',
                borderRadius: 'var(--radius-pill)',
                fontSize: 'var(--font-size-sm)',
                fontWeight: 600,
                textDecoration: 'none',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                transition: 'background-color 0.15s ease',
              }}
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <line x1="2" y1="12" x2="22" y2="12" />
                <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
              </svg>
              Visit Official Website
            </a>
          )}

          <a
            href="#market-participations"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              backgroundColor: '#EA580C',
              color: '#FFFFFF',
              padding: '10px 20px',
              borderRadius: 'var(--radius-pill)',
              fontSize: 'var(--font-size-sm)',
              fontWeight: 700,
              textDecoration: 'none',
              transition: 'background-color 0.15s ease',
            }}
          >
            {marketCount > 0
              ? `Explore Active Markets (${marketCount}) ↓`
              : 'Market Participation Details ↓'}
          </a>
        </div>
      </div>
    </section>
  );
}
