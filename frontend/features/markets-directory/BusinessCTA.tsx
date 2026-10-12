import React from 'react';

export function BusinessCTA() {
  return (
    <section
      aria-labelledby="business-cta-heading"
      style={{
        padding: 'var(--space-12) 0',
        backgroundColor: 'var(--surface-dark, #0B1F33)',
        color: '#FFFFFF',
      }}
    >
      <div className="container" style={{ textAlign: 'center' }}>
        <span
          style={{
            fontSize: 'var(--font-size-eyebrow)',
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
            color: 'var(--brand-deep-emerald)',
            display: 'block',
            marginBottom: 'var(--space-2)',
          }}
        >
          For Business Owners
        </span>
        <h2
          id="business-cta-heading"
          style={{
            fontSize: 'var(--font-size-section)',
            fontWeight: 800,
            letterSpacing: '-0.02em',
            lineHeight: 1.2,
            margin: '0 0 var(--space-4) 0',
            color: '#FFFFFF',
          }}
        >
          Compete for Verified Prominence in Your Market
        </h2>
        <p
          style={{
            fontSize: '16px',
            color: 'rgba(255, 255, 255, 0.75)',
            lineHeight: 1.6,
            maxWidth: '640px',
            margin: '0 auto var(--space-8) auto',
          }}
        >
          Claim your verified business profile, select your regional market, and secure transparent, audited visibility on the live ranking ladder.
        </p>

        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            justifyContent: 'center',
            gap: 'var(--space-4)',
            marginBottom: 'var(--space-8)',
          }}
        >
          <a
            href="/claim"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '12px 28px',
              backgroundColor: 'var(--brand-deep-emerald)',
              color: '#FFFFFF',
              fontWeight: 700,
              fontSize: '15px',
              borderRadius: 'var(--radius-pill)',
              textDecoration: 'none',
              boxShadow: '0 4px 14px rgba(234, 88, 12, 0.4)',
              transition: 'transform var(--motion-fast)',
            }}
          >
            Claim Your Business
          </a>
          <a
            href="/how-it-works"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '12px 28px',
              backgroundColor: 'rgba(255, 255, 255, 0.1)',
              color: '#FFFFFF',
              fontWeight: 600,
              fontSize: '15px',
              borderRadius: 'var(--radius-pill)',
              textDecoration: 'none',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              transition: 'background var(--motion-fast)',
            }}
          >
            How Visibility Works
          </a>
        </div>

        {/* Regulatory Disclosure */}
        <p
          style={{
            fontSize: '12px',
            color: 'rgba(255, 255, 255, 0.5)',
            maxWidth: '600px',
            margin: '0 auto',
            lineHeight: 1.5,
          }}
        >
          Notice: Visibility rankings on AageOnline represent paid competitive visibility positions and do not constitute an independent assessment of business quality, customer satisfaction, or objective ranking.
        </p>
      </div>
    </section>
  );
}
