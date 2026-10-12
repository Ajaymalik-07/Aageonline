import React from 'react';
import type { BusinessSummary } from '../../data-access/types.ts';

interface BusinessCardProps {
  business: BusinessSummary;
}

export function BusinessCard({ business }: BusinessCardProps) {
  const href = business.publicUrl || `/businesses/${business.slug}`;
  const isVerified = business.verificationStatus === 'VERIFIED';
  const marketCount = business.activeMarketCount ?? 0;

  // Extract initials for avatar placeholder
  const initials = business.name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join('');

  return (
    <a
      href={href}
      aria-label={`View public profile for ${business.name}${isVerified ? ' (Verified Business)' : ''}`}
      className="card-lift"
      style={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        padding: 'var(--space-6)',
        backgroundColor: 'var(--surface-card)',
        border: '1px solid var(--border-subtle)',
        borderRadius: 'var(--radius-lg)',
        textDecoration: 'none',
        boxShadow: 'var(--elevation-1)',
        position: 'relative',
        overflow: 'hidden',
        minHeight: '220px',
        transition:
          'transform 0.2s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
      }}
    >
      {/* Top accent bar */}
      <span
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '2px',
          background: isVerified
            ? 'linear-gradient(90deg, #10B981, #059669)'
            : 'linear-gradient(90deg, #EA580C, #FB923C)',
          opacity: 0.85,
        }}
        aria-hidden="true"
      />

      <div>
        {/* Eyebrow: Category & Verification */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 'var(--space-2)',
            marginBottom: 'var(--space-4)',
          }}
        >
          {business.primaryCategory ? (
            <span
              style={{
                fontSize: '11px',
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                color: 'var(--brand-deep-emerald)',
              }}
            >
              {business.primaryCategory.name}
            </span>
          ) : (
            <span
              style={{
                fontSize: '11px',
                fontWeight: 600,
                color: 'var(--text-tertiary)',
              }}
            >
              Business Listing
            </span>
          )}

          {isVerified && (
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                fontSize: '11px',
                fontWeight: 700,
                color: '#059669',
                backgroundColor: 'rgba(16, 185, 129, 0.1)',
                padding: '2px 8px',
                borderRadius: '9999px',
                border: '1px solid rgba(16, 185, 129, 0.25)',
              }}
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                <polyline points="20 6 9 17 4 12" />
              </svg>
              Verified
            </span>
          )}
        </div>

        {/* Identity row: Avatar & Business Name */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', marginBottom: 'var(--space-3)' }}>
          <div
            style={{
              width: '42px',
              height: '42px',
              borderRadius: 'var(--radius-md)',
              background: 'linear-gradient(135deg, #071526, #0B1F33)',
              border: '1px solid var(--border-subtle)',
              color: '#FB923C',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 800,
              fontSize: '14px',
              letterSpacing: '0.05em',
              flexShrink: 0,
            }}
            aria-hidden="true"
          >
            {initials || 'AO'}
          </div>

          <div>
            <h3
              style={{
                fontSize: 'var(--font-size-lg)',
                fontWeight: 700,
                color: 'var(--text-primary)',
                margin: 0,
                lineHeight: 1.25,
              }}
            >
              {business.name}
            </h3>
            {business.primaryLocation && (
              <span
                style={{
                  fontSize: 'var(--font-size-xs)',
                  color: 'var(--text-tertiary)',
                  display: 'block',
                  marginTop: '2px',
                }}
              >
                {business.primaryLocation.name}
                {business.primaryLocation.stateName ? `, ${business.primaryLocation.stateName}` : ''}
              </span>
            )}
          </div>
        </div>

        {/* Description snippet */}
        <p
          style={{
            fontSize: 'var(--font-size-sm)',
            color: 'var(--text-secondary)',
            lineHeight: 1.5,
            margin: '0 0 var(--space-4) 0',
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
          }}
        >
          {business.description}
        </p>
      </div>

      {/* Footer: Market participation badge and link indicator */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingTop: 'var(--space-3)',
          borderTop: '1px solid var(--border-subtle)',
          fontSize: 'var(--font-size-xs)',
        }}
      >
        <span
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            color: marketCount > 0 ? 'var(--text-primary)' : 'var(--text-tertiary)',
            fontWeight: 600,
          }}
        >
          <span
            style={{
              width: '6px',
              height: '6px',
              borderRadius: '50%',
              backgroundColor: marketCount > 0 ? '#EA580C' : 'var(--text-tertiary)',
            }}
            aria-hidden="true"
          />
          {marketCount > 0
            ? `${marketCount} active ${marketCount === 1 ? 'market' : 'markets'}`
            : 'Profile listed'}
        </span>

        <span
          style={{
            color: 'var(--brand-deep-emerald)',
            fontWeight: 700,
            display: 'inline-flex',
            alignItems: 'center',
            gap: '4px',
          }}
        >
          View Profile
          <span aria-hidden="true" style={{ transition: 'transform 0.15s ease' }}>
            →
          </span>
        </span>
      </div>
    </a>
  );
}
