'use client';

import React from 'react';

export const TrustGovernance: React.FC = () => {
  const pillars = [
    {
      icon: '🔍',
      title: 'Transparent',
      subtitle: 'Clear Paid Visibility Labeling',
      description:
        'Every ranking position is explicitly disclosed as a paid commercial placement. Consumers are never deceived by disguised organic search rankings.',
    },
    {
      icon: '🛡️',
      title: 'Verified',
      subtitle: 'Cryptographic & Server Authority',
      description:
        'No client assertion can modify a ranking. Every transaction signature, qualification amount, and business ownership record is verified independently server-side.',
    },
    {
      icon: '📜',
      title: 'Auditable',
      subtitle: 'Immutable Append-Only Records',
      description:
        'Every position change, outbid event, and upward promotion is permanently recorded in an append-only ledger that cannot be retroactively edited or deleted.',
    },
    {
      icon: '🔒',
      title: 'Secure',
      subtitle: 'Atomic Transaction Mutation',
      description:
        'Rankings mutate inside strict ACID database transactions with row-level locks, eliminating race conditions, double displacements, or corrupt positions.',
    },
  ];

  return (
    <section className="container" aria-label="Trust and Governance">
      <div
        style={{
          borderRadius: 'var(--radius-xl)',
          backgroundColor: 'var(--surface-card)',
          border: '1px solid var(--border-subtle)',
          boxShadow: 'var(--elevation-2)',
          padding: 'clamp(var(--space-8), 5vw, var(--space-12)) clamp(var(--space-6), 4vw, var(--space-10))',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Section Header */}
        <div style={{ textAlign: 'center', maxWidth: '680px', margin: '0 auto var(--space-8) auto' }}>
          <span
            style={{
              fontSize: '11px',
              fontWeight: 800,
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              color: 'var(--brand-emerald)',
              display: 'block',
              marginBottom: '6px',
            }}
          >
            Integrity Foundation
          </span>

          <h2
            style={{
              fontSize: 'clamp(26px, 4vw, 38px)',
              fontWeight: 900,
              color: 'var(--text-primary)',
              letterSpacing: '-0.025em',
              margin: '0 0 var(--space-2) 0',
            }}
          >
            Trust &amp; <span style={{ color: 'var(--brand-emerald)' }}>Governance</span>
          </h2>

          <p style={{ fontSize: '15px', color: 'var(--text-secondary)', margin: 0 }}>
            Built on non-negotiable architectural invariants. Transparent rules for businesses and consumers.
          </p>
        </div>

        {/* 4 Pillars Grid */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
            gap: 'var(--space-6)',
            marginBottom: 'var(--space-8)',
          }}
        >
          {pillars.map((pillar) => (
            <div
              key={pillar.title}
              style={{
                backgroundColor: 'var(--surface-raised)',
                borderRadius: 'var(--radius-lg)',
                padding: 'var(--space-5)',
                border: '1px solid var(--border-subtle)',
              }}
            >
              <div style={{ fontSize: '28px', marginBottom: 'var(--space-2)' }}>{pillar.icon}</div>
              <h3 style={{ fontSize: '18px', fontWeight: 800, color: 'var(--text-primary)', margin: '0 0 2px 0' }}>
                {pillar.title}
              </h3>
              <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--brand-teal)', display: 'block', marginBottom: '8px' }}>
                {pillar.subtitle}
              </span>
              <p style={{ fontSize: '13px', lineHeight: 1.55, color: 'var(--text-secondary)', margin: 0 }}>
                {pillar.description}
              </p>
            </div>
          ))}
        </div>

        {/* Prominent Statutory Disclosure Banner */}
        <div
          style={{
            backgroundColor: 'rgba(6, 78, 59, 0.05)',
            borderRadius: 'var(--radius-md)',
            padding: 'var(--space-4) var(--space-6)',
            border: '1px solid rgba(5, 150, 105, 0.2)',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
          }}
        >
          <span style={{ fontSize: '20px' }}>⚖️</span>
          <p style={{ fontSize: '13px', lineHeight: 1.5, color: 'var(--text-primary)', margin: 0 }}>
            <strong>Statutory Consumer Disclosure:</strong> A paid visibility position on AageOnline reflects an eligible, verified business that has completed a qualifying commercial transaction. It does not certify that a business is objectively the best business, nor does it replace independent consumer evaluation.
          </p>
        </div>
      </div>
    </section>
  );
};
