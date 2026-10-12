import React from 'react';

interface BusinessClaimCtaProps {
  businessName: string;
  businessSlug?: string;
}

export function BusinessClaimCta({ businessName, businessSlug }: BusinessClaimCtaProps) {
  const claimUrl = businessSlug ? `/business/claim?business=${encodeURIComponent(businessSlug)}` : '/business/claim';

  return (
    <section
      aria-label="Claim Business Profile"
      style={{
        backgroundColor: '#071526',
        borderRadius: 'var(--radius-xl)',
        padding: 'var(--space-8)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        textAlign: 'center',
        gap: 'var(--space-4)',
        boxShadow: 'var(--elevation-2)',
      }}
    >
      <div
        style={{
          width: '44px',
          height: '44px',
          borderRadius: '50%',
          backgroundColor: 'rgba(234, 88, 12, 0.12)',
          border: '1px solid rgba(234, 88, 12, 0.3)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#EA580C',
        }}
        aria-hidden="true"
      >
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
        </svg>
      </div>

      <div style={{ maxWidth: '580px' }}>
        <h3
          style={{
            fontSize: 'var(--font-size-xl)',
            fontWeight: 800,
            color: '#FFFFFF',
            margin: '0 0 var(--space-2) 0',
          }}
        >
          Do you represent {businessName}?
        </h3>
        <p
          style={{
            fontSize: 'var(--font-size-sm)',
            color: 'rgba(255, 255, 255, 0.7)',
            margin: 0,
            lineHeight: 1.5,
          }}
        >
          Claim this business profile to manage official contact details, complete entity verification,
          and participate in AageOnline local visibility markets.
        </p>
      </div>

      <a
        href={claimUrl}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '8px',
          backgroundColor: '#EA580C',
          color: '#FFFFFF',
          padding: '12px 24px',
          borderRadius: 'var(--radius-pill)',
          fontWeight: 700,
          fontSize: 'var(--font-size-sm)',
          textDecoration: 'none',
          boxShadow: '0 4px 14px rgba(234, 88, 12, 0.35)',
          transition: 'transform 0.15s ease',
        }}
      >
        Claim This Business Profile
        <span aria-hidden="true">→</span>
      </a>
    </section>
  );
}
