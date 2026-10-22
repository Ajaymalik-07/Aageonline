'use client';

import React from 'react';
import Link from 'next/link';

interface MarketCTAProps {
  locationName: string;
  categoryName: string;
}

export const MarketCTA: React.FC<MarketCTAProps> = ({ locationName, categoryName }) => {
  return (
    <section
      style={{
        backgroundColor: '#071324',
        borderTop: '1px solid rgba(255, 255, 255, 0.08)',
        padding: 'clamp(56px, 7vw, 84px) 0',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Subtle Ambient Radial Glow */}
      <div
        aria-hidden="true"
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: '600px',
          height: '300px',
          background: 'radial-gradient(ellipse at center, rgba(234, 88, 12, 0.15) 0%, transparent 70%)',
          pointerEvents: 'none',
        }}
      />

      <div className="container" style={{ position: 'relative', zIndex: 1 }}>
        <div style={{ maxWidth: '820px', margin: '0 auto', textAlign: 'center' }}>
        <span
          style={{
            fontSize: '11px',
            fontWeight: 800,
            textTransform: 'uppercase',
            letterSpacing: '0.1em',
            padding: '4px 14px',
            borderRadius: 'var(--radius-pill)',
            backgroundColor: 'rgba(234, 88, 12, 0.15)',
            color: '#FB923C',
            border: '1px solid rgba(234, 88, 12, 0.35)',
            display: 'inline-block',
            marginBottom: '16px',
          }}
        >
          FOR ELIGIBLE BUSINESSES
        </span>

        <h2
          style={{
            fontSize: 'clamp(28px, 4.5vw, 44px)',
            fontWeight: 900,
            color: '#ffffff',
            lineHeight: 1.15,
            letterSpacing: '-0.025em',
            margin: '0 0 16px 0',
          }}
        >
          {categoryName.toLowerCase().includes('restaurant')
            ? `Operate a Restaurant in ${locationName}?`
            : `Own an Interior Design Studio in ${locationName}?`}
        </h2>

        <p
          style={{
            fontSize: 'clamp(15px, 2vw, 18px)',
            color: 'rgba(255, 255, 255, 0.8)',
            lineHeight: 1.6,
            margin: '0 auto 28px auto',
            maxWidth: '640px',
          }}
        >
          Achieve transparent, predictable paid visibility inside the {locationName} {categoryName} market. No bidding bots, no fake review manipulation, and no opaque pay-per-click charges.
        </p>

        <div style={{ display: 'flex', justifyContent: 'center', gap: '14px', flexWrap: 'wrap' }}>
          <Link
            href="/business/claim"
            style={{
              padding: '14px 32px',
              borderRadius: 'var(--radius-pill)',
              backgroundColor: '#EA580C',
              color: '#ffffff',
              fontWeight: 800,
              fontSize: '15px',
              textDecoration: 'none',
              boxShadow: '0 4px 20px rgba(234, 88, 12, 0.45)',
              transition: 'transform var(--motion-fast)',
            }}
          >
            Claim Your Business →
          </Link>

          <a
            href="#how-rankings-work"
            style={{
              padding: '14px 28px',
              borderRadius: 'var(--radius-pill)',
              backgroundColor: 'rgba(255, 255, 255, 0.08)',
              border: '1.5px solid rgba(255, 255, 255, 0.25)',
              color: '#ffffff',
              fontWeight: 700,
              fontSize: '15px',
              textDecoration: 'none',
              transition: 'background-color var(--motion-fast)',
            }}
          >
            How Rankings Work
          </a>
        </div>
        </div>
      </div>
    </section>
  );
};
