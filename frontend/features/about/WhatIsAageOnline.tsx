'use client';

import React, { useState, useEffect } from 'react';

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
    detail: 'Every market is defined by one location and one business category.',
    example: 'Jaipur × Interior Designers',
    icon: '📍',
  },
  {
    step: '02',
    title: 'Defined Market',
    badge: 'Local Market',
    subtitle: 'Direct Local Peers',
    detail: 'Businesses compete within a clearly defined local market.',
    example: 'Single Local Market',
    icon: '🏛️',
  },
  {
    step: '03',
    title: 'Eligible Business',
    badge: 'Verified Identity',
    subtitle: 'Authenticated Records',
    detail: 'Verified businesses can participate in the market.',
    example: 'Verified Business Record',
    icon: '🛡️',
  },
  {
    step: '04',
    title: 'Qualifying Payment',
    badge: 'Verified Payment',
    subtitle: 'Whole Rupee Value',
    detail: 'A verified whole-rupee payment qualifies for a position update.',
    example: 'Qualifying Transaction',
    icon: '💳',
  },
  {
    step: '05',
    title: 'Paid Visibility Position',
    badge: 'Transparent Rank',
    subtitle: 'Prominent Visibility',
    detail: 'The verified qualifying amount determines the resulting paid visibility position.',
    example: 'Active Position on Ladder',
    icon: '🌟',
  },
];

export const WhatIsAageOnline: React.FC = () => {
  const [activeStep, setActiveStep] = useState<number>(0);
  const [isHovered, setIsHovered] = useState<boolean>(false);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState<boolean>(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mediaQuery.matches);
    const handler = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches);
    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, []);

  // Cycle through step 1 to 5 sequentially, then loop back to 1
  useEffect(() => {
    if (isHovered || prefersReducedMotion) return;

    const timer = setInterval(() => {
      setActiveStep((prev) => (prev + 1) % ARCHITECTURE_NODES.length);
    }, 2500);

    return () => clearInterval(timer);
  }, [isHovered, prefersReducedMotion]);

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
          background: 'radial-gradient(circle, rgba(234, 88, 12, 0.08) 0%, transparent 70%)',
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
                backgroundColor: 'rgba(234, 88, 12, 0.12)',
                color: '#EA580C',
                border: '1px solid rgba(234, 88, 12, 0.25)',
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
            Paid visibility, <span style={{ color: '#EA580C' }}>made transparent.</span>
          </h2>

          <p
            style={{
              fontSize: 'clamp(15px, 1.8vw, 17px)',
              lineHeight: 1.6,
              color: 'var(--text-secondary)',
              margin: 0,
            }}
          >
            AageOnline allows verified local businesses to compete for paid visibility positions inside clearly defined <strong>Location + Category</strong> markets.
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
              flexWrap: 'wrap',
              gap: 'var(--space-3)',
              marginBottom: 'var(--space-6)',
              borderBottom: '1px solid var(--border-subtle)',
              paddingBottom: 'var(--space-4)',
            }}
          >
            <div>
              <div style={{ display: 'inline-flex', marginBottom: '4px' }}>
                <span
                  style={{
                    fontSize: '11px',
                    fontWeight: 800,
                    color: '#EA580C',
                    textTransform: 'uppercase',
                    letterSpacing: '0.08em',
                  }}
                >
                  Market Formation Pipeline
                </span>
              </div>
              <h3 style={{ fontSize: 'clamp(20px, 2.5vw, 24px)', fontWeight: 900, color: 'var(--text-primary)', margin: 0, letterSpacing: '-0.02em' }}>
                How A Single Competitive Market Forms
              </h3>
            </div>

            <span
              style={{
                fontSize: '11px',
                fontWeight: 800,
                color: '#EA580C',
                backgroundColor: 'rgba(234, 88, 12, 0.08)',
                padding: '4px 12px',
                borderRadius: 'var(--radius-pill)',
                border: '1px solid rgba(234, 88, 12, 0.2)',
                textTransform: 'uppercase',
                letterSpacing: '0.04em',
              }}
            >
              5 Market Stages
            </span>
          </div>

          {/* Connected 5-Stage Interactive Pipeline */}
          <div
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(185px, 1fr))',
              gap: '14px',
              alignItems: 'stretch',
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
                    backgroundColor: isSelected ? 'rgba(234, 88, 12, 0.05)' : '#ffffff',
                    borderRadius: 'var(--radius-lg)',
                    padding: 'var(--space-4)',
                    border: `1.5px solid ${isSelected ? '#EA580C' : 'var(--border-subtle)'}`,
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    minHeight: '220px',
                    position: 'relative',
                    boxShadow: isSelected ? '0 8px 24px rgba(234, 88, 12, 0.16)' : '0 2px 8px rgba(11, 31, 59, 0.04)',
                    transform: isSelected && !prefersReducedMotion ? 'translateY(-3px)' : 'none',
                    transition: 'all 350ms cubic-bezier(0.16, 1, 0.3, 1)',
                  }}
                >
                  {/* Step Badge & Icon */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                    <span
                      style={{
                        fontSize: '10px',
                        fontWeight: 900,
                        padding: '2px 8px',
                        borderRadius: 'var(--radius-pill)',
                        backgroundColor: isSelected ? '#EA580C' : 'rgba(234, 88, 12, 0.1)',
                        color: isSelected ? '#ffffff' : '#EA580C',
                        letterSpacing: '0.04em',
                      }}
                    >
                      STEP {node.step}
                    </span>
                    <span
                      style={{
                        width: '32px',
                        height: '32px',
                        borderRadius: '50%',
                        backgroundColor: isSelected ? 'rgba(234, 88, 12, 0.12)' : 'var(--surface-raised)',
                        border: '1px solid var(--border-subtle)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '16px',
                      }}
                    >
                      {node.icon}
                    </span>
                  </div>

                  <strong
                    style={{
                      fontSize: '15px',
                      fontWeight: 900,
                      color: 'var(--text-primary)',
                      display: 'block',
                      lineHeight: 1.25,
                      marginBottom: '2px',
                    }}
                  >
                    {node.title}
                  </strong>

                  <span
                    style={{
                      fontSize: '11px',
                      fontWeight: 800,
                      textTransform: 'uppercase',
                      letterSpacing: '0.04em',
                      color: '#EA580C',
                      display: 'block',
                      marginBottom: '8px',
                    }}
                  >
                    {node.badge}
                  </span>

                  <p style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: 1.5, margin: '0 0 var(--space-3) 0' }}>
                    {node.detail}
                  </p>

                  {/* Concrete Example Pill (Uniform Height & Baseline) */}
                  <div
                    style={{
                      fontSize: '11px',
                      fontWeight: 700,
                      color: isSelected ? '#EA580C' : 'var(--text-secondary)',
                      backgroundColor: isSelected ? 'rgba(234, 88, 12, 0.1)' : 'var(--surface-raised)',
                      padding: '0 8px',
                      height: '30px',
                      borderRadius: 'var(--radius-pill)',
                      border: `1px solid ${isSelected ? 'rgba(234, 88, 12, 0.35)' : 'var(--border-subtle)'}`,
                      marginTop: 'auto',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      textAlign: 'center',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}
                    title={node.example}
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
                backgroundColor: 'rgba(234, 88, 12, 0.1)',
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
                backgroundColor: 'rgba(249, 115, 22, 0.1)',
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
              Positions (#1, #2, #3...) are determined by verified qualifying transactions. A higher qualifying amount securely updates the ranking order so verified businesses receive their earned visibility.
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
                backgroundColor: 'rgba(251, 146, 60, 0.15)',
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

        {/* Section 16 Mandatory Statutory Disclosure Callout Banner */}
        <div
          style={{
            backgroundColor: 'rgba(234, 88, 12, 0.05)',
            borderRadius: 'var(--radius-lg)',
            padding: 'var(--space-4) var(--space-6)',
            border: '1.5px solid rgba(234, 88, 12, 0.25)',
            display: 'flex',
            alignItems: 'center',
            gap: '14px',
          }}
        >
          <span style={{ fontSize: '24px' }}>🛡️</span>
          <p style={{ fontSize: '13px', lineHeight: 1.55, color: 'var(--text-primary)', margin: 0 }}>
            <strong>Paid visibility disclosure:</strong> A higher position represents paid commercial visibility. It does not certify that a business is objectively the best business or replace independent consumer evaluation.
          </p>
        </div>
      </div>
    </section>
  );
};
