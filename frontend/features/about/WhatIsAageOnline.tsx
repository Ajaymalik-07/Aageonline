'use client';

import React, { useState } from 'react';

interface ArchitectureNode {
  step: string;
  title: string;
  badge: string;
  subtitle: string;
  detail: string;
  example: string;
  icon: string;
}

const ARCHITECTURE_NODES: ArchitectureNode[] = [
  {
    step: '01',
    title: 'Location + Category',
    badge: 'Defined Scope',
    subtitle: 'City × Vertical Pair',
    detail: 'Every market is bounded by exactly one geographical city and one industry vertical.',
    example: 'Jaipur × Interior Designers',
    icon: '📍',
  },
  {
    step: '02',
    title: 'Discrete Market',
    badge: 'Closed Competition',
    subtitle: 'Direct Local Peers',
    detail: 'No cross-city leakage. Businesses compete exclusively against direct regional competitors.',
    example: 'Single Discrete Market Unit',
    icon: '🏛️',
  },
  {
    step: '03',
    title: 'Eligible Businesses',
    badge: 'Verified Identity',
    subtitle: 'Authenticated Records',
    detail: 'Only verified businesses with documented ownership can participate in visibility rankings.',
    example: 'Govt ID / GSTIN Verified',
    icon: '🛡️',
  },
  {
    step: '04',
    title: 'Qualifying Payment',
    badge: 'Server Verified',
    subtitle: 'Strictly Greater (> Incumbent)',
    detail: 'Whole-Rupee transaction verified server-side via payment signatures before ranking updates.',
    example: '₹27,000 > Incumbent ₹26,000',
    icon: '💳',
  },
  {
    step: '05',
    title: 'Paid Position',
    badge: 'Transparent Rank',
    subtitle: 'Prominent Visibility',
    detail: 'Instant promotion to #1, #2, #3 with immutable append-only history and public disclosure.',
    example: 'Rank #1 Activated + Disclosed',
    icon: '🌟',
  },
];

export const WhatIsAageOnline: React.FC = () => {
  const [activeStep, setActiveStep] = useState<number>(0);

  return (
    <section
      className="section-editorial-clean"
      aria-label="What is AageOnline - Platform Paradigm"
      style={{
        padding: 'clamp(var(--space-10), 6vw, var(--space-12)) 0',
        borderTop: '1px solid var(--border-subtle)',
        borderBottom: '1px solid var(--border-subtle)',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Subtle Ambient Radial Lighting */}
      <div
        aria-hidden="true"
        style={{
          position: 'absolute',
          top: '-10%',
          right: '5%',
          width: '500px',
          height: '500px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(16, 185, 129, 0.07) 0%, transparent 70%)',
          pointerEvents: 'none',
        }}
      />

      <div className="container">
        {/* Editorial Section Header */}
        <div style={{ textAlign: 'center', maxWidth: '780px', margin: '0 auto var(--space-8) auto' }}>
          <div style={{ display: 'inline-flex', marginBottom: 'var(--space-2)' }}>
            <span
              style={{
                fontSize: '11px',
                fontWeight: 800,
                textTransform: 'uppercase',
                letterSpacing: '0.1em',
                padding: '4px 14px',
                borderRadius: 'var(--radius-pill)',
                backgroundColor: 'rgba(5, 150, 105, 0.12)',
                color: 'var(--brand-emerald)',
                border: '1px solid rgba(5, 150, 105, 0.25)',
              }}
            >
              Platform Paradigm &amp; Core Mechanics
            </span>
          </div>

          <h2
            style={{
              fontSize: 'clamp(32px, 4.5vw, 48px)',
              fontWeight: 900,
              color: 'var(--text-primary)',
              lineHeight: 1.1,
              letterSpacing: '-0.03em',
              margin: '0 0 var(--space-3) 0',
            }}
          >
            Paid visibility, <span style={{ color: 'var(--brand-emerald)' }}>made transparent.</span>
          </h2>

          <p
            style={{
              fontSize: 'clamp(15px, 1.8vw, 17px)',
              lineHeight: 1.6,
              color: 'var(--text-secondary)',
              margin: 0,
            }}
          >
            AageOnline allows verified local businesses to compete for paid visibility positions inside well-defined <strong>Location + Category</strong> markets. No opaque black-box ad algorithms, no unpredictable pay-per-click bidding wars, and no disguised sponsored search biases.
          </p>
        </div>

        {/* Visual Architecture Flow: LOCATION + CATEGORY → MARKET → BUSINESSES → PAYMENT → POSITION */}
        <div
          style={{
            backgroundColor: 'var(--surface-card)',
            borderRadius: 'var(--radius-xl)',
            padding: 'clamp(var(--space-6), 4vw, var(--space-8))',
            border: '1.5px solid var(--border-subtle)',
            boxShadow: 'var(--elevation-2)',
            marginBottom: 'var(--space-8)',
          }}
        >
          {/* Architecture Pipeline Track */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: 'var(--space-4)',
              borderBottom: '1px solid var(--border-subtle)',
              paddingBottom: 'var(--space-3)',
            }}
          >
            <div>
              <span
                style={{
                  fontSize: '11px',
                  fontWeight: 800,
                  color: 'var(--brand-teal)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em',
                }}
              >
                Market Formation Pipeline
              </span>
              <h3 style={{ fontSize: '18px', fontWeight: 900, color: 'var(--text-primary)', margin: '2px 0 0 0' }}>
                How A Single Competitive Market Forms
              </h3>
            </div>

            <span
              style={{
                fontSize: '12px',
                fontWeight: 700,
                color: 'var(--brand-emerald)',
                backgroundColor: 'rgba(5, 150, 105, 0.08)',
                padding: '3px 10px',
                borderRadius: 'var(--radius-pill)',
              }}
            >
              5 Architectural Stages
            </span>
          </div>

          {/* Connected 5-Stage Interactive Pipeline */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '12px',
              position: 'relative',
            }}
          >
            {ARCHITECTURE_NODES.map((node, idx) => {
              const isSelected = idx === activeStep;

              return (
                <div
                  key={node.step}
                  onClick={() => setActiveStep(idx)}
                  className="card-lift"
                  style={{
                    backgroundColor: isSelected ? 'rgba(5, 150, 105, 0.06)' : 'var(--surface-raised)',
                    borderRadius: 'var(--radius-lg)',
                    padding: 'var(--space-4)',
                    border: `1.5px solid ${isSelected ? 'var(--brand-emerald)' : 'var(--border-subtle)'}`,
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    minHeight: '190px',
                    position: 'relative',
                    transition: 'all var(--motion-fast)',
                  }}
                >
                  <div>
                    {/* Step Badge & Icon */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                      <span
                        style={{
                          fontSize: '10px',
                          fontWeight: 900,
                          padding: '2px 8px',
                          borderRadius: 'var(--radius-pill)',
                          backgroundColor: isSelected ? 'var(--brand-emerald)' : 'rgba(11, 31, 59, 0.08)',
                          color: isSelected ? '#ffffff' : 'var(--text-muted)',
                        }}
                      >
                        STEP {node.step}
                      </span>
                      <span style={{ fontSize: '20px' }}>{node.icon}</span>
                    </div>

                    <strong
                      style={{
                        fontSize: '15px',
                        fontWeight: 900,
                        color: 'var(--text-primary)',
                        display: 'block',
                        lineHeight: 1.25,
                        marginBottom: '4px',
                      }}
                    >
                      {node.title}
                    </strong>

                    <span
                      style={{
                        fontSize: '11px',
                        fontWeight: 700,
                        color: 'var(--brand-teal)',
                        display: 'block',
                        marginBottom: '8px',
                      }}
                    >
                      {node.badge}
                    </span>

                    <p style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: 1.45, margin: 0 }}>
                      {node.detail}
                    </p>
                  </div>

                  {/* Concrete Example Pill */}
                  <div
                    style={{
                      fontSize: '11px',
                      fontWeight: 700,
                      color: isSelected ? 'var(--brand-emerald)' : 'var(--text-muted)',
                      backgroundColor: isSelected ? 'rgba(5, 150, 105, 0.12)' : 'var(--surface-card)',
                      padding: '4px 8px',
                      borderRadius: 'var(--radius-sm)',
                      border: '1px solid var(--border-subtle)',
                      marginTop: '10px',
                    }}
                  >
                    {node.example}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* 3 Core Editorial Differentiator Pillars */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: 'var(--space-6)',
            marginBottom: 'var(--space-6)',
          }}
        >
          {/* Card 1: Strict Scoping */}
          <div
            className="card-lift"
            style={{
              backgroundColor: 'var(--surface-card)',
              borderRadius: 'var(--radius-lg)',
              padding: 'var(--space-6)',
              border: '1px solid var(--border-subtle)',
              boxShadow: 'var(--elevation-1)',
            }}
          >
            <div
              style={{
                width: '44px',
                height: '44px',
                borderRadius: 'var(--radius-md)',
                backgroundColor: 'rgba(5, 150, 105, 0.1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '22px',
                marginBottom: 'var(--space-3)',
              }}
            >
              📍
            </div>

            <h3 style={{ fontSize: '18px', fontWeight: 900, color: 'var(--text-primary)', margin: '0 0 6px 0' }}>
              Strict Local &amp; Category Scoping
            </h3>

            <p style={{ fontSize: '14px', lineHeight: 1.6, color: 'var(--text-secondary)', margin: 0 }}>
              A market is strictly defined as exactly one city and one business category. <em>Jaipur Interior Designers</em> compete only with Jaipur Interior Designers. No dilution from national aggregators or out-of-market spending power.
            </p>
          </div>

          {/* Card 2: Deterministic Qualifying Ladder */}
          <div
            className="card-lift"
            style={{
              backgroundColor: 'var(--surface-card)',
              borderRadius: 'var(--radius-lg)',
              padding: 'var(--space-6)',
              border: '1px solid var(--border-subtle)',
              boxShadow: 'var(--elevation-1)',
            }}
          >
            <div
              style={{
                width: '44px',
                height: '44px',
                borderRadius: 'var(--radius-md)',
                backgroundColor: 'rgba(16, 185, 129, 0.1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '22px',
                marginBottom: 'var(--space-3)',
              }}
            >
              ⚡
            </div>

            <h3 style={{ fontSize: '18px', fontWeight: 900, color: 'var(--text-primary)', margin: '0 0 6px 0' }}>
              Deterministic Qualifying Ladder
            </h3>

            <p style={{ fontSize: '14px', lineHeight: 1.6, color: 'var(--text-secondary)', margin: 0 }}>
              Positions (#1, #2, #3...) are determined by verified qualifying transactions. A higher whole-rupee amount supersedes the incumbent atomically inside a database transaction with row-level market locking.
            </p>
          </div>

          {/* Card 3: Mandatory Consumer Disclosure */}
          <div
            className="card-lift"
            style={{
              backgroundColor: 'var(--surface-card)',
              borderRadius: 'var(--radius-lg)',
              padding: 'var(--space-6)',
              border: '1px solid var(--border-subtle)',
              boxShadow: 'var(--elevation-1)',
            }}
          >
            <div
              style={{
                width: '44px',
                height: '44px',
                borderRadius: 'var(--radius-md)',
                backgroundColor: 'rgba(199, 240, 0, 0.18)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '22px',
                marginBottom: 'var(--space-3)',
              }}
            >
              ⚖️
            </div>

            <h3 style={{ fontSize: '18px', fontWeight: 900, color: 'var(--text-primary)', margin: '0 0 6px 0' }}>
              Mandatory Consumer Disclosure
            </h3>

            <p style={{ fontSize: '14px', lineHeight: 1.6, color: 'var(--text-secondary)', margin: 0 }}>
              Every consumer sees prominent labeling confirming that rankings reflect paid commercial visibility. We never disguise sponsored placements as organic merit or algorithmic endorsements.
            </p>
          </div>
        </div>

        {/* Section 14 Mandatory Statutory Disclosure Callout Banner */}
        <div
          style={{
            backgroundColor: 'rgba(6, 78, 59, 0.05)',
            borderRadius: 'var(--radius-lg)',
            padding: 'var(--space-4) var(--space-6)',
            border: '1.5px solid rgba(5, 150, 105, 0.25)',
            display: 'flex',
            alignItems: 'center',
            gap: '14px',
          }}
        >
          <span style={{ fontSize: '24px' }}>🛡️</span>
          <p style={{ fontSize: '13px', lineHeight: 1.55, color: 'var(--text-primary)', margin: 0 }}>
            <strong>Statutory Platform Governance:</strong> A higher paid visibility position on AageOnline does not certify that a business is objectively the best business. All positions represent transparent commercial visibility acquired through verified qualifying transactions.
          </p>
        </div>
      </div>
    </section>
  );
};
