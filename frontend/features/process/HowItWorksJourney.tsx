'use client';

import React, { useState, useEffect } from 'react';

interface JourneyStep {
  number: string;
  title: string;
  subtitle: string;
  description: string;
  icon: string;
  visualDetail: {
    heading: string;
    metrics: string;
    diagramType: 'market-pair' | 'verified-record' | 'target-selector' | 'qualifying-tx' | 'visibility-beacon';
  };
}

const STEPS: JourneyStep[] = [
  {
    number: '01',
    title: 'Find Your Market',
    subtitle: 'Location + Category Scoping',
    description:
      'Every market is defined strictly as exactly one city and one business category (e.g., Jaipur + Interior Designers). Businesses compete exclusively with direct local peers.',
    icon: '📍',
    visualDetail: {
      heading: 'Defined Market Unit',
      metrics: 'Jaipur · Interior Designers',
      diagramType: 'market-pair',
    },
  },
  {
    number: '02',
    title: 'Claim Your Business',
    subtitle: 'Ownership & Eligibility Verification',
    description:
      'Claim or register your eligible business profile with verifiable ownership documents. Only authenticated and verified businesses can enter paid visibility positions.',
    icon: '🛡️',
    visualDetail: {
      heading: 'Verified Business Record',
      metrics: 'Govt ID / GSTIN / Domain Verified',
      diagramType: 'verified-record',
    },
  },
  {
    number: '03',
    title: 'Choose Target Position',
    subtitle: 'Inspect Qualifying Requirements',
    description:
      'Inspect the active ranking ladder (#1 to #24). The system calculates the exact minimum qualifying amount needed to supersede the incumbent position.',
    icon: '🎯',
    visualDetail: {
      heading: 'Target Position Calculator',
      metrics: 'Target #3 · Incumbent ₹22,000 → Min Req ₹22,001',
      diagramType: 'target-selector',
    },
  },
  {
    number: '04',
    title: 'Qualifying Payment',
    subtitle: 'Strictly Greater & Atomic Mutation',
    description:
      'Complete a verified transaction. Amounts must be whole Indian Rupees and strictly exceed the incumbent amount. In atomic database transactions, your position moves up immediately.',
    icon: '⚡',
    visualDetail: {
      heading: 'Atomic Transaction Mutation',
      metrics: '₹24,500 Confirmed → Rank #2 Activated',
      diagramType: 'qualifying-tx',
    },
  },
  {
    number: '05',
    title: 'Get Seen & Disclosed',
    subtitle: 'Transparent Paid Visibility',
    description:
      'Your business immediately occupies the paid ranking slot on public discovery. Every position change is logged in an append-only audit trail with mandatory consumer disclosure.',
    icon: '🌟',
    visualDetail: {
      heading: 'Public Visibility Beacon',
      metrics: 'Immutable Position History #2 Recorded',
      diagramType: 'visibility-beacon',
    },
  },
];

export const HowItWorksJourney: React.FC = () => {
  const [activeStepIndex, setActiveStepIndex] = useState<number>(0);
  const [isAutoAdvancing, setIsAutoAdvancing] = useState<boolean>(true);

  useEffect(() => {
    if (!isAutoAdvancing) return;

    const timer = setInterval(() => {
      setActiveStepIndex((prev) => (prev + 1) % STEPS.length);
    }, 5000);

    return () => clearInterval(timer);
  }, [isAutoAdvancing]);

  const activeStep = STEPS[activeStepIndex];

  return (
    <div
      id="how-it-works"
      style={{
        borderRadius: 'var(--radius-xl)',
        backgroundColor: 'var(--surface-card)',
        border: '1px solid var(--border-subtle)',
        boxShadow: 'var(--elevation-2)',
        padding: 'clamp(var(--space-6), 4vw, var(--space-10))',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Section Header */}
      <div style={{ textAlign: 'center', maxWidth: '720px', margin: '0 auto var(--space-8) auto' }}>
        <div style={{ display: 'inline-flex', marginBottom: '8px' }}>
          <span
            style={{
              fontSize: '11px',
              fontWeight: 800,
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              padding: '3px 12px',
              borderRadius: 'var(--radius-pill)',
              backgroundColor: 'rgba(5, 150, 105, 0.1)',
              color: 'var(--brand-emerald)',
              border: '1px solid rgba(5, 150, 105, 0.25)',
            }}
          >
            How AageOnline Works
          </span>
        </div>

        <h2
          style={{
            fontSize: 'clamp(26px, 4vw, 38px)',
            fontWeight: 900,
            color: 'var(--text-primary)',
            letterSpacing: '-0.03em',
            lineHeight: 1.15,
            marginBottom: 'var(--space-2)',
          }}
        >
          From Market Entry to <span style={{ color: 'var(--brand-emerald)' }}>Position #1</span>
        </h2>

        <p style={{ fontSize: '15px', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
          An interactive, verifiable 5-step competitive mechanism with zero opaque algorithms.
        </p>
      </div>

      {/* Stepped Navigation Rail (Horizontal on Desktop) */}
      <div
        role="tablist"
        aria-label="How It Works Steps"
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(5, 1fr)',
          gap: 'var(--space-2)',
          marginBottom: 'var(--space-8)',
          position: 'relative',
        }}
      >
        {STEPS.map((step, index) => {
          const isActive = index === activeStepIndex;

          return (
            <button
              key={step.number}
              role="tab"
              aria-selected={isActive}
              type="button"
              onClick={() => {
                setActiveStepIndex(index);
                setIsAutoAdvancing(false);
              }}
              style={{
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                textAlign: 'left',
                padding: 'var(--space-3) var(--space-2)',
                borderRadius: 'var(--radius-md)',
                backgroundColor: isActive ? 'rgba(5, 150, 105, 0.08)' : 'transparent',
                borderBottom: isActive ? '3px solid var(--brand-emerald)' : '3px solid var(--border-subtle)',
                transition: 'all var(--motion-fast)',
                outline: 'none',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                <span
                  style={{
                    fontSize: '11px',
                    fontWeight: 900,
                    color: isActive ? 'var(--brand-emerald)' : 'var(--text-muted)',
                  }}
                >
                  {step.number}
                </span>
                <span style={{ fontSize: '14px' }}>{step.icon}</span>
              </div>
              <span
                style={{
                  display: 'block',
                  fontSize: '13px',
                  fontWeight: 700,
                  color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
              >
                {step.title}
              </span>
            </button>
          );
        })}
      </div>

      {/* Interactive Step Visualizer (Split Story Card) */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
          gap: 'var(--space-8)',
          alignItems: 'center',
          backgroundColor: 'var(--surface-raised)',
          borderRadius: 'var(--radius-lg)',
          padding: 'clamp(var(--space-6), 4vw, var(--space-8))',
          border: '1px solid var(--border-subtle)',
        }}
      >
        {/* Left: Step Explanatory Details */}
        <div>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', marginBottom: 'var(--space-2)' }}>
            <span
              style={{
                fontSize: '12px',
                fontWeight: 800,
                color: 'var(--brand-emerald)',
                backgroundColor: 'rgba(5, 150, 105, 0.1)',
                padding: '2px 10px',
                borderRadius: 'var(--radius-pill)',
              }}
            >
              STEP {activeStep.number} OF 05
            </span>
            <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-muted)' }}>
              {activeStep.subtitle}
            </span>
          </div>

          <h3
            style={{
              fontSize: '24px',
              fontWeight: 800,
              color: 'var(--text-primary)',
              letterSpacing: '-0.02em',
              marginBottom: 'var(--space-3)',
            }}
          >
            {activeStep.icon} {activeStep.title}
          </h3>

          <p
            style={{
              fontSize: '15px',
              lineHeight: 1.6,
              color: 'var(--text-secondary)',
              marginBottom: 'var(--space-6)',
            }}
          >
            {activeStep.description}
          </p>

          {/* Quick Next / Prev navigation buttons */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button
              type="button"
              disabled={activeStepIndex === 0}
              onClick={() => {
                setActiveStepIndex((i) => Math.max(0, i - 1));
                setIsAutoAdvancing(false);
              }}
              style={{
                padding: '8px 16px',
                borderRadius: 'var(--radius-pill)',
                backgroundColor: 'transparent',
                border: '1px solid var(--border-strong)',
                color: 'var(--text-primary)',
                fontWeight: 600,
                fontSize: '13px',
                cursor: activeStepIndex === 0 ? 'not-allowed' : 'pointer',
                opacity: activeStepIndex === 0 ? 0.4 : 1,
              }}
            >
              ← Previous
            </button>

            <button
              type="button"
              disabled={activeStepIndex === STEPS.length - 1}
              onClick={() => {
                setActiveStepIndex((i) => Math.min(STEPS.length - 1, i + 1));
                setIsAutoAdvancing(false);
              }}
              style={{
                padding: '8px 18px',
                borderRadius: 'var(--radius-pill)',
                backgroundColor: 'var(--action-primary)',
                border: 'none',
                color: '#ffffff',
                fontWeight: 700,
                fontSize: '13px',
                cursor: activeStepIndex === STEPS.length - 1 ? 'not-allowed' : 'pointer',
                opacity: activeStepIndex === STEPS.length - 1 ? 0.4 : 1,
              }}
            >
              Next Step →
            </button>

            <button
              type="button"
              onClick={() => setIsAutoAdvancing(!isAutoAdvancing)}
              style={{
                marginLeft: 'auto',
                fontSize: '12px',
                color: 'var(--text-muted)',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
              }}
            >
              {isAutoAdvancing ? '⏸ Pause Tour' : '▶ Play Tour'}
            </button>
          </div>
        </div>

        {/* Right: Infographic Step Visualization Canvas */}
        <div
          style={{
            backgroundColor: 'var(--brand-deep-navy)',
            borderRadius: 'var(--radius-md)',
            padding: 'var(--space-6)',
            color: '#ffffff',
            boxShadow: 'var(--elevation-3)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            minHeight: '260px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          {/* Subtle Ambient Radial Lighting */}
          <div
            aria-hidden="true"
            style={{
              position: 'absolute',
              top: 0,
              right: 0,
              width: '200px',
              height: '200px',
              background: 'radial-gradient(circle, rgba(199, 240, 0, 0.15) 0%, transparent 70%)',
              pointerEvents: 'none',
            }}
          />

          <div>
            <span
              style={{
                fontSize: '11px',
                fontWeight: 800,
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                color: 'var(--brand-lime)',
                display: 'block',
                marginBottom: '4px',
              }}
            >
              {activeStep.visualDetail.heading}
            </span>
            <span style={{ fontSize: '13px', color: 'rgba(255, 255, 255, 0.7)' }}>
              {activeStep.visualDetail.metrics}
            </span>
          </div>

          {/* Infographic Diagrams by Step */}
          <div style={{ margin: 'var(--space-5) 0' }}>
            {activeStep.visualDetail.diagramType === 'market-pair' && (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '16px' }}>
                <div
                  style={{
                    backgroundColor: 'rgba(255, 255, 255, 0.1)',
                    padding: '12px 18px',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    textAlign: 'center',
                  }}
                >
                  <span style={{ fontSize: '11px', color: 'var(--brand-teal)', display: 'block', fontWeight: 700 }}>
                    LOCATION
                  </span>
                  <span style={{ fontSize: '16px', fontWeight: 800 }}>Jaipur</span>
                </div>

                <span style={{ fontSize: '20px', fontWeight: 900, color: 'var(--brand-lime)' }}>+</span>

                <div
                  style={{
                    backgroundColor: 'rgba(255, 255, 255, 0.1)',
                    padding: '12px 18px',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    textAlign: 'center',
                  }}
                >
                  <span style={{ fontSize: '11px', color: 'var(--brand-teal)', display: 'block', fontWeight: 700 }}>
                    CATEGORY
                  </span>
                  <span style={{ fontSize: '16px', fontWeight: 800 }}>Interior Designers</span>
                </div>
              </div>
            )}

            {activeStep.visualDetail.diagramType === 'verified-record' && (
              <div
                style={{
                  backgroundColor: 'rgba(255, 255, 255, 0.08)',
                  borderRadius: 'var(--radius-md)',
                  padding: '14px',
                  border: '1px solid rgba(16, 185, 129, 0.4)',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <span style={{ fontSize: '14px', fontWeight: 800 }}>ABC Interiors &amp; Architecture</span>
                  <span
                    style={{
                      fontSize: '11px',
                      backgroundColor: 'var(--brand-emerald)',
                      color: '#ffffff',
                      padding: '2px 8px',
                      borderRadius: 'var(--radius-pill)',
                      fontWeight: 700,
                    }}
                  >
                    ✓ Verified
                  </span>
                </div>
                <div style={{ fontSize: '12px', color: 'rgba(255, 255, 255, 0.7)' }}>
                  Record ID: biz-abc-interiors · Registered in Jaipur, RJ
                </div>
              </div>
            )}

            {activeStep.visualDetail.diagramType === 'target-selector' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                  <span>Current Position #4 Incumbent:</span>
                  <strong style={{ color: '#ffffff' }}>₹20,500</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                  <span>Minimum to Supercede (+100 paise):</span>
                  <strong style={{ color: 'var(--brand-lime)' }}>₹20,501</strong>
                </div>
                <div
                  style={{
                    height: '6px',
                    borderRadius: 'var(--radius-pill)',
                    backgroundColor: 'rgba(255, 255, 255, 0.1)',
                    overflow: 'hidden',
                  }}
                >
                  <div style={{ width: '85%', height: '100%', backgroundColor: 'var(--brand-lime)' }} />
                </div>
              </div>
            )}

            {activeStep.visualDetail.diagramType === 'qualifying-tx' && (
              <div
                style={{
                  backgroundColor: 'rgba(16, 185, 129, 0.15)',
                  borderRadius: 'var(--radius-md)',
                  padding: '14px',
                  border: '1.5px solid var(--brand-teal)',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <span style={{ fontSize: '11px', color: 'var(--brand-teal)', fontWeight: 800, display: 'block' }}>
                      TRANSACTION MUTATION
                    </span>
                    <span style={{ fontSize: '18px', fontWeight: 900 }}>₹24,500 INR</span>
                  </div>
                  <span style={{ fontSize: '12px', color: 'var(--brand-lime)', fontWeight: 700 }}>
                    ↑ Assigned Rank #2
                  </span>
                </div>
              </div>
            )}

            {activeStep.visualDetail.diagramType === 'visibility-beacon' && (
              <div
                style={{
                  textAlign: 'center',
                  padding: '12px',
                  borderRadius: 'var(--radius-md)',
                  backgroundColor: 'rgba(255, 255, 255, 0.08)',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                }}
              >
                <span style={{ fontSize: '24px', display: 'block', marginBottom: '4px' }}>📡</span>
                <span style={{ fontSize: '14px', fontWeight: 800, color: 'var(--brand-lime)' }}>
                  Active On Public Discovery
                </span>
                <span style={{ fontSize: '11px', color: 'rgba(255, 255, 255, 0.6)', display: 'block' }}>
                  Disclosed as Paid Visibility #2 in Jaipur Interior Designers
                </span>
              </div>
            )}
          </div>

          {/* Footer invariant check */}
          <div style={{ fontSize: '11px', color: 'rgba(255, 255, 255, 0.5)', borderTop: '1px solid rgba(255, 255, 255, 0.1)', paddingTop: '8px' }}>
            Authoritative Server State · Append-Only History · Zero Refunds on displacement
          </div>
        </div>
      </div>
    </div>
  );
};
