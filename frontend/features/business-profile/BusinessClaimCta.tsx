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
        backgroundColor: '#FFFFFF',
        borderRadius: 'var(--radius-xl)',
        padding: 'var(--space-6)',
        border: '1px solid #E2E8F0',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        textAlign: 'center',
        gap: 'var(--space-3)',
        boxShadow: '0 2px 10px rgba(15, 23, 42, 0.04)',
      }}
    >
      <div
        style={{
          width: '44px',
          height: '44px',
          borderRadius: '50%',
          backgroundColor: '#FFF7ED',
          border: '1px solid #FED7AA',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#EA580C',
        }}
        aria-hidden="true"
      >
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
        </svg>
      </div>

      <div>
        <h3
          style={{
            fontSize: 'var(--font-size-base)',
            fontWeight: 800,
            color: '#0F172A',
            margin: '0 0 var(--space-1) 0',
          }}
        >
          Do you represent {businessName}?
        </h3>
        <p
          style={{
            fontSize: 'var(--font-size-xs)',
            color: '#475569',
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
          padding: '10px 20px',
          borderRadius: 'var(--radius-pill)',
          fontWeight: 700,
          fontSize: 'var(--font-size-xs)',
          textDecoration: 'none',
          boxShadow: '0 2px 8px rgba(234, 88, 12, 0.25)',
          transition: 'transform 0.15s ease',
          marginTop: 'var(--space-1)',
        }}
      >
        <span>Claim This Business Profile</span>
        <span aria-hidden="true">→</span>
      </a>
    </section>
  );
}
