'use client';

import React from 'react';

export const TrustGovernance: React.FC = () => {
  const pillars = [
    {
      icon: '🔍',
      title: 'Transparent',
      subtitle: 'Clear Visibility Labeling',
      description:
        'Paid visibility positions are clearly disclosed so users understand what they represent.',
    },
    {
      icon: '🛡️',
      title: 'Verified',
      subtitle: 'Independent Verification',
      description:
        'Payments and business eligibility are independently verified before ranking changes occur.',
    },
    {
      icon: '📜',
      title: 'Auditable',
      subtitle: 'Traceable Activity Records',
      description:
        'Position changes are recorded so ranking activity can be reviewed and traced.',
    },
    {
      icon: '🔒',
      title: 'Secure',
      subtitle: 'Protected Transactions',
      description:
        'Ranking changes are protected by server-side authorization, payment verification and transaction controls.',
    },
  ];

  return (
    <section id="trust" className="container" aria-label="Trust and Governance">
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
              color: '#EA580C',
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
            Trust &amp; <span style={{ color: '#EA580C' }}>Governance</span>
          </h2>

          <p style={{ fontSize: '15px', color: 'var(--text-secondary)', margin: 0 }}>
            Built on transparent rules and verified transactions for businesses and consumers.
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
              <span style={{ fontSize: '12px', fontWeight: 700, color: '#EA580C', display: 'block', marginBottom: '8px' }}>
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
            backgroundColor: 'rgba(234, 88, 12, 0.05)',
            borderRadius: 'var(--radius-md)',
            padding: 'var(--space-4) var(--space-6)',
            border: '1px solid rgba(234, 88, 12, 0.2)',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
          }}
        >
          <span style={{ fontSize: '20px' }}>⚖️</span>
          <p style={{ fontSize: '13px', lineHeight: 1.5, color: 'var(--text-primary)', margin: 0 }}>
            <strong>Paid visibility disclosure:</strong> A higher position represents paid commercial visibility. It does not certify that a business is objectively the best business or replace independent consumer evaluation.
          </p>
        </div>
      </div>
    </section>
  );
};
