'use client';

import React from 'react';

export const BusinessCtaBanner: React.FC = () => {
  return (
    <section className="container" aria-label="Business Call to Action">
      <div
        style={{
          borderRadius: 'var(--radius-xl)',
          backgroundColor: 'var(--brand-deep-navy)',
          color: '#ffffff',
          padding: 'clamp(var(--space-8), 6vw, var(--space-12)) clamp(var(--space-6), 4vw, var(--space-10))',
          textAlign: 'center',
          position: 'relative',
          overflow: 'hidden',
          boxShadow: 'var(--elevation-4)',
          border: '1px solid rgba(255, 255, 255, 0.15)',
        }}
      >
        {/* Ambient Radial Lights */}
        <div
          aria-hidden="true"
          style={{
            position: 'absolute',
            top: '-50%',
            left: '50%',
            transform: 'translateX(-50%)',
            width: '800px',
            height: '500px',
            background: 'radial-gradient(circle, rgba(16, 185, 129, 0.25) 0%, transparent 70%)',
            pointerEvents: 'none',
          }}
        />

        <div
          aria-hidden="true"
          style={{
            position: 'absolute',
            bottom: '-40%',
            right: '-10%',
            width: '500px',
            height: '400px',
            background: 'radial-gradient(circle, rgba(199, 240, 0, 0.15) 0%, transparent 70%)',
            pointerEvents: 'none',
          }}
        />

        <div style={{ position: 'relative', zIndex: 2, maxWidth: '720px', margin: '0 auto' }}>
          <span
            style={{
              fontSize: '12px',
              fontWeight: 800,
              textTransform: 'uppercase',
              letterSpacing: '0.1em',
              color: 'var(--brand-lime)',
              display: 'inline-block',
              marginBottom: 'var(--space-2)',
            }}
          >
            Take Your Competitive Position
          </span>

          <h2
            style={{
              fontSize: 'clamp(32px, 5vw, 54px)',
              fontWeight: 900,
              color: '#ffffff',
              lineHeight: 1.1,
              letterSpacing: '-0.03em',
              marginBottom: 'var(--space-4)',
            }}
          >
            Ready to get seen? <br />
            <span style={{ color: 'var(--brand-lime)' }}>Get ahead in your market.</span>
          </h2>

          <p
            style={{
              fontSize: 'clamp(15px, 2vw, 18px)',
              lineHeight: 1.6,
              color: 'rgba(255, 255, 255, 0.8)',
              marginBottom: 'var(--space-8)',
              maxWidth: '580px',
              margin: '0 auto var(--space-8) auto',
            }}
          >
            Find your Location + Category market, claim your verified business profile, and compete for transparent, paid visibility positions.
          </p>

          <div
            style={{
              display: 'flex',
              justifyContent: 'center',
              gap: 'var(--space-4)',
              flexWrap: 'wrap',
              marginBottom: 'var(--space-6)',
            }}
          >
            <a
              href="/explore"
              style={{
                padding: '16px 36px',
                borderRadius: 'var(--radius-pill)',
                backgroundColor: 'var(--brand-lime)',
                color: 'var(--brand-deep-navy)',
                fontWeight: 900,
                fontSize: '15px',
                textDecoration: 'none',
                minHeight: '48px',
                display: 'inline-flex',
                alignItems: 'center',
                boxShadow: '0 6px 20px rgba(199, 240, 0, 0.35)',
                transition: 'transform var(--motion-fast)',
              }}
            >
              Explore Your Market →
            </a>

            <a
              href="/claim"
              style={{
                padding: '16px 32px',
                borderRadius: 'var(--radius-pill)',
                backgroundColor: 'transparent',
                border: '2px solid rgba(255, 255, 255, 0.5)',
                color: '#ffffff',
                fontWeight: 700,
                fontSize: '15px',
                textDecoration: 'none',
                minHeight: '48px',
                display: 'inline-flex',
                alignItems: 'center',
                transition: 'all var(--motion-fast)',
              }}
            >
              Claim Your Business
            </a>
          </div>

          <div style={{ fontSize: '12px', color: 'rgba(255, 255, 255, 0.6)' }}>
            ✓ Atomic Database Recalculation · ✓ Append-Only History · ✓ 100% Disclosure
          </div>
        </div>
      </div>
    </section>
  );
};
