import React from 'react';
import type { BusinessProfile } from '../../data-access/types.ts';

interface BusinessHeroProps {
  business: BusinessProfile;
}

export function BusinessHero({ business }: BusinessHeroProps) {
  const isVerified = business.verificationStatus === 'VERIFIED';
  const marketCount = business.marketParticipations?.length ?? 0;

  // Find top ranked position if any
  const topRankedParticipation = business.marketParticipations?.find(
    (p) => typeof p.currentPosition === 'number' && p.currentPosition > 0
  );

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
        backgroundColor: '#FFFFFF',
        borderRadius: 'var(--radius-xl)',
        padding: 'var(--space-8)',
        marginBottom: 'var(--space-8)',
        border: '1px solid #E2E8F0',
        overflow: 'hidden',
        boxShadow: '0 4px 20px -2px rgba(15, 23, 42, 0.05)',
      }}
    >
      {/* Top Brand Accent Line */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '4px',
          background: 'linear-gradient(90deg, #EA580C 0%, #F97316 50%, #0B1F33 100%)',
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
        {/* Top bar: Sector badge + Location + Rank Spotlight + Verification */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 'var(--space-3)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 'var(--space-2)' }}>
            {business.primaryCategory && (
              <a
                href={`/categories/${business.primaryCategory.slug}`}
                style={{
                  fontSize: '11px',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.06em',
                  color: '#EA580C',
                  backgroundColor: '#FFF7ED',
                  padding: '5px 12px',
                  borderRadius: 'var(--radius-pill)',
                  textDecoration: 'none',
                  border: '1px solid #FFEDD5',
                  transition: 'all 0.15s ease',
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
                  color: '#334155',
                  backgroundColor: '#F8FAFC',
                  padding: '5px 12px',
                  borderRadius: 'var(--radius-pill)',
                  textDecoration: 'none',
                  border: '1px solid #E2E8F0',
                  transition: 'all 0.15s ease',
                }}
              >
                📍 {business.primaryLocation.name}
                {business.primaryLocation.stateName ? `, ${business.primaryLocation.stateName}` : ''}
              </a>
            )}

            {topRankedParticipation && (
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  fontSize: '11px',
                  fontWeight: 800,
                  color: '#EA580C',
                  backgroundColor: '#FFF7ED',
                  padding: '5px 12px',
                  borderRadius: 'var(--radius-pill)',
                  border: '1px solid #FED7AA',
                }}
              >
                <span aria-hidden="true">🏆</span>
                Position #{topRankedParticipation.currentPosition} in {topRankedParticipation.cityName}
              </span>
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
                color: '#059669',
                backgroundColor: '#ECFDF5',
                padding: '5px 12px',
                borderRadius: 'var(--radius-pill)',
                border: '1px solid #A7F3D0',
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
              width: '76px',
              height: '76px',
              borderRadius: 'var(--radius-xl)',
              background: 'linear-gradient(135deg, #0B1F33, #071526)',
              border: '2px solid #E2E8F0',
              color: '#FB923C',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 800,
              fontSize: '26px',
              letterSpacing: '0.05em',
              flexShrink: 0,
              boxShadow: '0 4px 12px rgba(11, 31, 51, 0.15)',
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
                color: '#0F172A',
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
                  color: '#64748B',
                  marginBottom: 'var(--space-2)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                <span style={{ fontWeight: 600, color: '#475569' }}>Legal Entity:</span>
                <span>{business.legalName}</span>
              </div>
            )}

            {business.tagline && (
              <p
                style={{
                  fontSize: 'var(--font-size-base)',
                  color: '#334155',
                  lineHeight: 1.5,
                  margin: '0 0 var(--space-4) 0',
                  maxWidth: '740px',
                  fontWeight: 500,
                }}
              >
                &ldquo;{business.tagline}&rdquo;
              </p>
            )}
          </div>
        </div>

        {/* Action row (Quick Contact & Jump to Ladder) */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: 'var(--space-3)',
            paddingTop: 'var(--space-4)',
            borderTop: '1px solid #E2E8F0',
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
                backgroundColor: '#FFFFFF',
                color: '#0F172A',
                padding: '9px 18px',
                borderRadius: 'var(--radius-pill)',
                fontSize: 'var(--font-size-sm)',
                fontWeight: 600,
                textDecoration: 'none',
                border: '1px solid #CBD5E1',
                boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                transition: 'all 0.15s ease',
              }}
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <line x1="2" y1="12" x2="22" y2="12" />
                <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
              </svg>
              Visit Website ↗
            </a>
          )}

          {business.socialLinks?.whatsapp && (
            <a
              href={business.socialLinks.whatsapp.startsWith('http') ? business.socialLinks.whatsapp : `https://wa.me/${business.socialLinks.whatsapp.replace(/[^0-9]/g, '')}`}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                backgroundColor: '#ECFDF5',
                color: '#059669',
                padding: '9px 18px',
                borderRadius: 'var(--radius-pill)',
                fontSize: 'var(--font-size-sm)',
                fontWeight: 700,
                textDecoration: 'none',
                border: '1px solid #A7F3D0',
                transition: 'all 0.15s ease',
              }}
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12.04 2c-5.46 0-9.91 4.45-9.91 9.91 0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38c1.45.79 3.08 1.21 4.74 1.21 5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.816 9.816 0 0 0 12.04 2zm0 18.09c-1.52 0-3-.4-4.31-1.16l-.31-.18-3.2.84.85-3.12-.2-.32a8.04 8.04 0 0 1-1.23-4.24c0-4.47 3.64-8.11 8.11-8.11 2.16 0 4.19.84 5.72 2.37 1.53 1.53 2.37 3.56 2.37 5.72 0 4.47-3.64 8.09-8.11 8.09zm4.44-6.07c-.24-.12-1.44-.71-1.66-.79-.22-.09-.39-.12-.55.12-.17.24-.63.79-.78.95-.14.16-.29.18-.53.06-.24-.12-1.02-.38-1.95-1.2-.72-.64-1.21-1.43-1.35-1.67-.14-.24-.02-.37.1-.49.11-.11.24-.29.36-.43.12-.14.16-.24.24-.4.08-.16.04-.31-.02-.43s-.55-1.33-.76-1.82c-.2-.48-.41-.41-.56-.42h-.48c-.16 0-.43.06-.66.31-.22.24-.87.85-.87 2.08 0 1.22.89 2.41 1.01 2.58.12.16 1.76 2.68 4.25 3.76.59.26 1.06.41 1.42.52.6.19 1.15.16 1.58.1.48-.07 1.44-.59 1.64-1.16.2-.57.2-1.06.14-1.16-.06-.1-.22-.16-.46-.28z"/>
              </svg>
              WhatsApp Direct
            </a>
          )}

          {business.phone && (
            <a
              href={`tel:${business.phone}`}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                backgroundColor: '#F8FAFC',
                color: '#334155',
                padding: '9px 18px',
                borderRadius: 'var(--radius-pill)',
                fontSize: 'var(--font-size-sm)',
                fontWeight: 600,
                textDecoration: 'none',
                border: '1px solid #E2E8F0',
                transition: 'all 0.15s ease',
              }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
              </svg>
              Call {business.phone}
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
              padding: '9px 20px',
              borderRadius: 'var(--radius-pill)',
              fontSize: 'var(--font-size-sm)',
              fontWeight: 700,
              textDecoration: 'none',
              boxShadow: '0 2px 8px rgba(234, 88, 12, 0.25)',
              transition: 'background-color 0.15s ease',
            }}
          >
            {marketCount > 0
              ? `Explore Ranked Positions (${marketCount}) ↓`
              : 'Market Positions ↓'}
          </a>
        </div>
      </div>
    </section>
  );
}
