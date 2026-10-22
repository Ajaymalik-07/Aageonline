import React from 'react';
import type { BusinessProfile } from '../../data-access/types.ts';

interface BusinessInfoCardProps {
  business: BusinessProfile;
}

export function BusinessInfoCard({ business }: BusinessInfoCardProps) {
  const isVerified = business.verificationStatus === 'VERIFIED';
  const social = business.socialLinks || {};
  const hasSocials = Boolean(
    social.instagram || social.linkedin || social.facebook || social.twitter || social.youtube || social.whatsapp
  );

  return (
    <section
      aria-labelledby="business-details-heading"
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
          id="business-details-heading"
          style={{
            fontSize: 'var(--font-size-sm)',
            fontWeight: 800,
            color: '#0F172A',
            margin: 0,
            textTransform: 'uppercase',
            letterSpacing: '0.06em',
          }}
        >
          Verified Business Directory
        </h2>
        {isVerified && (
          <span
            style={{
              fontSize: '11px',
              fontWeight: 700,
              color: '#059669',
              backgroundColor: '#ECFDF5',
              padding: '2px 8px',
              borderRadius: 'var(--radius-pill)',
              border: '1px solid #A7F3D0',
            }}
          >
            ✓ Registry Verified
          </span>
        )}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
        {/* Address */}
        {business.address && (
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
            <span style={{ fontSize: '16px', lineHeight: 1, marginTop: '2px' }} aria-hidden="true">📍</span>
            <div>
              <div style={{ fontSize: '11px', fontWeight: 700, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Registered Office Address
              </div>
              <div style={{ fontSize: 'var(--font-size-sm)', color: '#1E293B', fontWeight: 500, marginTop: '2px', lineHeight: 1.45 }}>
                {business.address}
              </div>
            </div>
          </div>
        )}

        {/* Website */}
        {business.website && (
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
            <span style={{ fontSize: '16px', lineHeight: 1, marginTop: '2px' }} aria-hidden="true">🌐</span>
            <div style={{ minWidth: 0, flex: 1 }}>
              <div style={{ fontSize: '11px', fontWeight: 700, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Official Web Portal
              </div>
              <a
                href={business.website}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  fontSize: 'var(--font-size-sm)',
                  fontWeight: 600,
                  color: '#EA580C',
                  marginTop: '2px',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                  textDecoration: 'none',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  maxWidth: '100%',
                }}
              >
                <span>{business.website.replace(/^https?:\/\//, '')}</span>
                <span aria-hidden="true">↗</span>
              </a>
            </div>
          </div>
        )}

        {/* Phone */}
        {business.phone && (
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
            <span style={{ fontSize: '16px', lineHeight: 1, marginTop: '2px' }} aria-hidden="true">📞</span>
            <div>
              <div style={{ fontSize: '11px', fontWeight: 700, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Official Phone / Inquiries
              </div>
              <a
                href={`tel:${business.phone}`}
                style={{
                  fontSize: 'var(--font-size-sm)',
                  fontWeight: 600,
                  color: '#0F172A',
                  marginTop: '2px',
                  display: 'block',
                  textDecoration: 'none',
                }}
              >
                {business.phone}
              </a>
            </div>
          </div>
        )}

        {/* Email */}
        {business.email && (
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
            <span style={{ fontSize: '16px', lineHeight: 1, marginTop: '2px' }} aria-hidden="true">✉️</span>
            <div style={{ minWidth: 0, flex: 1 }}>
              <div style={{ fontSize: '11px', fontWeight: 700, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Corporate Email
              </div>
              <a
                href={`mailto:${business.email}`}
                style={{
                  fontSize: 'var(--font-size-sm)',
                  fontWeight: 600,
                  color: '#EA580C',
                  marginTop: '2px',
                  display: 'block',
                  textDecoration: 'none',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {business.email}
              </a>
            </div>
          </div>
        )}

        {/* Legal Entity Name */}
        {business.legalName && (
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
            <span style={{ fontSize: '16px', lineHeight: 1, marginTop: '2px' }} aria-hidden="true">🏛️</span>
            <div>
              <div style={{ fontSize: '11px', fontWeight: 700, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Corporate Registered Name
              </div>
              <div style={{ fontSize: 'var(--font-size-sm)', color: '#334155', fontWeight: 600, marginTop: '2px' }}>
                {business.legalName}
              </div>
            </div>
          </div>
        )}

        {/* Verification Status */}
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
          <span style={{ fontSize: '16px', lineHeight: 1, marginTop: '2px' }} aria-hidden="true">🛡️</span>
          <div>
            <div style={{ fontSize: '11px', fontWeight: 700, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Verification Standing
            </div>
            <div
              style={{
                fontSize: 'var(--font-size-sm)',
                fontWeight: 700,
                color: isVerified ? '#059669' : '#64748B',
                marginTop: '2px',
              }}
            >
              {isVerified ? 'Identity & Tax Records Verified' : 'Standard Directory Listing'}
            </div>
          </div>
        </div>
      </div>

      {/* Official Social Media & Marketing Showcase */}
      {hasSocials && (
        <div
          style={{
            marginTop: 'var(--space-6)',
            paddingTop: 'var(--space-5)',
            borderTop: '1px solid #F1F5F9',
          }}
        >
          <div style={{ marginBottom: 'var(--space-3)' }}>
            <div
              style={{
                fontSize: '11px',
                fontWeight: 800,
                color: '#0F172A',
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
              }}
            >
              Official Social & Portfolio Feeds
            </div>
            <div style={{ fontSize: '12px', color: '#64748B', marginTop: '2px' }}>
              Connect with verified public portfolio channels
            </div>
          </div>

          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: '8px',
              marginTop: 'var(--space-2)',
            }}
          >
            {social.instagram && (
              <a
                href={social.instagram}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`${business.name} on Instagram`}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '7px 12px',
                  borderRadius: 'var(--radius-pill)',
                  backgroundColor: '#FDF2F8',
                  border: '1px solid #FBCFE8',
                  color: '#DB2777',
                  fontSize: '12px',
                  fontWeight: 700,
                  textDecoration: 'none',
                  transition: 'all 0.15s ease',
                }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
                  <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
                  <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
                </svg>
                Instagram
              </a>
            )}

            {social.linkedin && (
              <a
                href={social.linkedin}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`${business.name} on LinkedIn`}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '7px 12px',
                  borderRadius: 'var(--radius-pill)',
                  backgroundColor: '#EFF6FF',
                  border: '1px solid #BFDBFE',
                  color: '#1D4ED8',
                  fontSize: '12px',
                  fontWeight: 700,
                  textDecoration: 'none',
                  transition: 'all 0.15s ease',
                }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"></path>
                  <rect x="2" y="9" width="4" height="12"></rect>
                  <circle cx="4" cy="4" r="2"></circle>
                </svg>
                LinkedIn
              </a>
            )}

            {social.facebook && (
              <a
                href={social.facebook}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`${business.name} on Facebook`}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '7px 12px',
                  borderRadius: 'var(--radius-pill)',
                  backgroundColor: '#EFF6FF',
                  border: '1px solid #BFDBFE',
                  color: '#2563EB',
                  fontSize: '12px',
                  fontWeight: 700,
                  textDecoration: 'none',
                  transition: 'all 0.15s ease',
                }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"></path>
                </svg>
                Facebook
              </a>
            )}

            {social.twitter && (
              <a
                href={social.twitter}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`${business.name} on X`}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '7px 12px',
                  borderRadius: 'var(--radius-pill)',
                  backgroundColor: '#F8FAFC',
                  border: '1px solid #CBD5E1',
                  color: '#0F172A',
                  fontSize: '12px',
                  fontWeight: 700,
                  textDecoration: 'none',
                  transition: 'all 0.15s ease',
                }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                </svg>
                X (Twitter)
              </a>
            )}

            {social.youtube && (
              <a
                href={social.youtube}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`${business.name} on YouTube`}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '7px 12px',
                  borderRadius: 'var(--radius-pill)',
                  backgroundColor: '#FEF2F2',
                  border: '1px solid #FECACA',
                  color: '#DC2626',
                  fontSize: '12px',
                  fontWeight: 700,
                  textDecoration: 'none',
                  transition: 'all 0.15s ease',
                }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                </svg>
                YouTube
              </a>
            )}

            {social.whatsapp && (
              <a
                href={social.whatsapp.startsWith('http') ? social.whatsapp : `https://wa.me/${social.whatsapp.replace(/[^0-9]/g, '')}`}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`Chat with ${business.name} on WhatsApp`}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '7px 12px',
                  borderRadius: 'var(--radius-pill)',
                  backgroundColor: '#ECFDF5',
                  border: '1px solid #A7F3D0',
                  color: '#059669',
                  fontSize: '12px',
                  fontWeight: 700,
                  textDecoration: 'none',
                  transition: 'all 0.15s ease',
                }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12.04 2c-5.46 0-9.91 4.45-9.91 9.91 0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38c1.45.79 3.08 1.21 4.74 1.21 5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.816 9.816 0 0 0 12.04 2zm0 18.09c-1.52 0-3-.4-4.31-1.16l-.31-.18-3.2.84.85-3.12-.2-.32a8.04 8.04 0 0 1-1.23-4.24c0-4.47 3.64-8.11 8.11-8.11 2.16 0 4.19.84 5.72 2.37 1.53 1.53 2.37 3.56 2.37 5.72 0 4.47-3.64 8.09-8.11 8.09zm4.44-6.07c-.24-.12-1.44-.71-1.66-.79-.22-.09-.39-.12-.55.12-.17.24-.63.79-.78.95-.14.16-.29.18-.53.06-.24-.12-1.02-.38-1.95-1.2-.72-.64-1.21-1.43-1.35-1.67-.14-.24-.02-.37.1-.49.11-.11.24-.29.36-.43.12-.14.16-.24.24-.4.08-.16.04-.31-.02-.43s-.55-1.33-.76-1.82c-.2-.48-.41-.41-.56-.42h-.48c-.16 0-.43.06-.66.31-.22.24-.87.85-.87 2.08 0 1.22.89 2.41 1.01 2.58.12.16 1.76 2.68 4.25 3.76.59.26 1.06.41 1.42.52.6.19 1.15.16 1.58.1.48-.07 1.44-.59 1.64-1.16.2-.57.2-1.06.14-1.16-.06-.1-.22-.16-.46-.28z"/>
                </svg>
                WhatsApp Direct
              </a>
            )}
          </div>
        </div>
      )}
    </section>
  );
}
