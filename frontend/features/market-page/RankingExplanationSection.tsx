'use client';

import React from 'react';

interface RankingExplanationSectionProps {
  locationName?: string;
  categoryName?: string;
}

export const RankingExplanationSection: React.FC<RankingExplanationSectionProps> = ({
  locationName = 'Jaipur',
  categoryName = 'Interior Designers',
}) => {
  const steps = [
    {
      step: '01',
      title: 'Defined Market Boundary',
      desc: `Exactly one Location paired with one Category (e.g. ${locationName} + ${categoryName}) defines a distinct local market. Businesses compete only with direct peers.`,
      icon: '📍',
    },
    {
      step: '02',
      title: 'Verified Commercial Entity',
      desc: 'Only authentic, eligible businesses with verified local credentials can hold positions. Spam entities and duplicate listings are barred.',
      icon: '🛡️',
    },
    {
      step: '03',
      title: 'Strict Qualifying Payment',
      desc: 'To claim a ranking position, a business must submit a qualifying payment strictly greater than the current position floor. Equal or lower amounts cannot displace.',
      icon: '💳',
    },
    {
      step: '04',
      title: 'Immediate Public Ranking',
      desc: 'Upon independent payment verification by our payment gateway, the rank changes immediately and existing holders slide down. All movements are recorded in public history.',
      icon: '📈',
    },
  ];

  return (
    <section
      id="how-rankings-work"
      style={{
        backgroundColor: 'var(--surface-soft)',
        borderTop: '1px solid var(--border-subtle)',
        borderBottom: '1px solid var(--border-subtle)',
        padding: 'clamp(48px, 6vw, 72px) 0',
      }}
    >
      <div className="container">
        {/* Section Header */}
        <div style={{ maxWidth: '680px', marginBottom: '36px' }}>
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
            PLATFORM PRINCIPLES
          </span>
          <h2
            style={{
              fontSize: 'clamp(26px, 3.5vw, 36px)',
              fontWeight: 900,
              color: 'var(--text-primary)',
              letterSpacing: '-0.02em',
              margin: '0 0 10px 0',
            }}
          >
            How AageOnline Rankings Work
          </h2>
          <p style={{ fontSize: '15px', color: 'var(--text-secondary)', lineHeight: 1.6, margin: 0 }}>
            AageOnline replaces opaque algorithms with a transparent, published ranking mechanism. Discover how qualifying amounts translate into public visibility positions.
          </p>
        </div>

        {/* 4-Step Diagram Grid */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
            gap: '20px',
            marginBottom: '36px',
          }}
        >
          {steps.map((st, i) => (
            <div
              key={i}
              style={{
                backgroundColor: '#ffffff',
                borderRadius: 'var(--radius-lg)',
                border: '1px solid var(--border-subtle)',
                padding: '24px',
                boxShadow: '0 4px 16px rgba(11, 31, 51, 0.04)',
                position: 'relative',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <span
                  style={{
                    fontSize: '12px',
                    fontWeight: 900,
                    color: '#EA580C',
                    backgroundColor: 'rgba(234, 88, 12, 0.1)',
                    padding: '2px 8px',
                    borderRadius: 'var(--radius-pill)',
                  }}
                >
                  STEP {st.step}
                </span>
                <span style={{ fontSize: '20px' }}>{st.icon}</span>
              </div>

              <h3 style={{ fontSize: '17px', fontWeight: 800, color: 'var(--text-primary)', margin: '0 0 8px 0' }}>
                {st.title}
              </h3>

              <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.6, margin: 0 }}>
                {st.desc}
              </p>
            </div>
          ))}
        </div>

        {/* Key Operational Commitments Box */}
        <div
          style={{
            backgroundColor: '#ffffff',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border-subtle)',
            padding: '24px',
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: '20px',
          }}
        >
          <div>
            <strong style={{ fontSize: '14px', color: 'var(--text-primary)', display: 'block', marginBottom: '4px' }}>
              No Algorithmic Favoritism
            </strong>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.5 }}>
              Positions are calculated strictly from verified payments. There are no black-box scores, engagement penalties, or hidden boosts.
            </p>
          </div>

          <div>
            <strong style={{ fontSize: '14px', color: 'var(--text-primary)', display: 'block', marginBottom: '4px' }}>
              Finality Without Refunds
            </strong>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.5 }}>
              Payments purchase visibility for as long as a business holds that position floor. When overtaken, rank adjusts downward without cash refunds.
            </p>
          </div>

          <div>
            <strong style={{ fontSize: '14px', color: 'var(--text-primary)', display: 'block', marginBottom: '4px' }}>
              Public Audit Ledger
            </strong>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.5 }}>
              Every qualifying transaction and rank displacement is recorded with exact timestamps, ensuring transparent commercial accountability.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};
