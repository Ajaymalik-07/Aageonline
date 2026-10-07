'use client';

import React, { useState, useEffect } from 'react';

interface JourneyStep {
  number: string;
  title: string;
  subtitle: string;
  description: string;
  icon: string;
  stageName: string;
}

const SIX_STEPS: JourneyStep[] = [
  {
    number: '01',
    title: 'Find Your Market',
    subtitle: 'Location + Category',
    description:
      'Every market is defined strictly as exactly one city and one business category (e.g., Jaipur + Interior Designers). You compete solely with direct local peers.',
    icon: '📍',
    stageName: 'Defined Market',
  },
  {
    number: '02',
    title: 'Claim Your Business',
    subtitle: 'Identity & Record Verification',
    description:
      'Authenticate your business profile with verified documentation. Unverified or anonymous entities cannot occupy paid visibility slots.',
    icon: '🛡️',
    stageName: 'Verified Entity',
  },
  {
    number: '03',
    title: 'Choose a Position',
    subtitle: 'Target Rank Selection',
    description:
      'Inspect the active ranking ladder (#1 to #24). View the exact qualifying payment amount needed to supersede the current incumbent position.',
    icon: '🎯',
    stageName: 'Target Ladder',
  },
  {
    number: '04',
    title: 'Make a Qualifying Payment',
    subtitle: 'Strictly Greater & Whole Rupee',
    description:
      'Complete a verified payment strictly greater than the incumbent amount. The server independently recalculates pricing and verifies the payment gateway signature.',
    icon: '💳',
    stageName: 'Verified Payment',
  },
  {
    number: '05',
    title: 'Position Updates',
    subtitle: 'Atomic Transaction Mutation',
    description:
      'The database recalculates rankings atomically inside a strict transaction with row-level locks, creating an immutable, append-only position history record.',
    icon: '⚡',
    stageName: 'Atomic Mutation',
  },
  {
    number: '06',
    title: 'Get Seen',
    subtitle: 'Transparent Paid Visibility',
    description:
      'Your business immediately occupies the prominent ranking position on public market discovery, clearly labeled with statutory paid visibility disclosures.',
    icon: '🌟',
    stageName: 'Market Visibility',
  },
];

export const HowItWorksJourney: React.FC = () => {
  const [activeStepIndex, setActiveStepIndex] = useState<number>(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState<boolean>(true);

  useEffect(() => {
    if (!isAutoPlaying) return;

    const timer = setInterval(() => {
      setActiveStepIndex((prev) => (prev + 1) % SIX_STEPS.length);
    }, 4500);

    return () => clearInterval(timer);
  }, [isAutoPlaying]);

  const active = SIX_STEPS[activeStepIndex];

  return (
    <section
      className="section-infographic-bg"
      aria-label="How AageOnline Works - 6-Step Infographic Journey"
      style={{
        padding: 'clamp(var(--space-10), 6vw, var(--space-12)) 0',
      }}
    >
      <div className="container">
        {/* Section Header */}
        <div style={{ textAlign: 'center', maxWidth: '720px', margin: '0 auto var(--space-8) auto' }}>
          <span
            style={{
              fontSize: '11px',
              fontWeight: 800,
              textTransform: 'uppercase',
              letterSpacing: '0.1em',
              color: 'var(--brand-emerald)',
              display: 'block',
              marginBottom: '6px',
            }}
          >
            Deterministic Process Flow
          </span>

          <h2
            style={{
              fontSize: 'clamp(28px, 4vw, 42px)',
              fontWeight: 900,
              color: 'var(--text-primary)',
              letterSpacing: '-0.025em',
              margin: '0 0 var(--space-2) 0',
            }}
          >
            How AageOnline <span style={{ color: 'var(--brand-emerald)' }}>Works</span>
          </h2>

          <p style={{ fontSize: '15px', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.6 }}>
            A transparent 6-step journey from market identification to public visibility. Built on atomic transactions, immutable history, and honest commercial labeling.
          </p>
        </div>

        {/* Desktop / Tablet Infographic Journey Rail (6 Nodes with SVG Connecting Ribbon) */}
        <div style={{ position: 'relative', marginBottom: 'var(--space-8)' }}>
          {/* SVG Connecting Track Line */}
          <div
            aria-hidden="true"
            style={{
              position: 'absolute',
              top: '32px',
              left: '5%',
              right: '5%',
              height: '4px',
              backgroundColor: 'var(--border-subtle)',
              zIndex: 1,
            }}
          >
            <div
              style={{
                height: '100%',
                width: `${(activeStepIndex / (SIX_STEPS.length - 1)) * 100}%`,
                background: 'linear-gradient(90deg, var(--brand-emerald), var(--brand-teal), var(--brand-lime))',
                transition: 'width var(--motion-normal)',
                borderRadius: '2px',
              }}
            />
          </div>

          {/* 6 Interactive Step Nodes */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
              gap: '12px',
              position: 'relative',
              zIndex: 2,
            }}
          >
            {SIX_STEPS.map((step, idx) => {
              const isCurrent = idx === activeStepIndex;
              const isPast = idx < activeStepIndex;

              return (
                <button
                  key={step.number}
                  type="button"
                  onClick={() => {
                    setActiveStepIndex(idx);
                    setIsAutoPlaying(false);
                  }}
                  style={{
                    background: 'none',
                    border: 'none',
                    padding: '8px 4px',
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    textAlign: 'center',
                    outline: 'none',
                  }}
                >
                  {/* Circular Node Icon */}
                  <div
                    style={{
                      width: '54px',
                      height: '54px',
                      borderRadius: '50%',
                      backgroundColor: isCurrent
                        ? 'var(--brand-emerald)'
                        : isPast
                        ? 'rgba(5, 150, 105, 0.15)'
                        : 'var(--surface-card)',
                      color: isCurrent ? '#ffffff' : isPast ? 'var(--brand-emerald)' : 'var(--text-muted)',
                      border: `2px solid ${
                        isCurrent
                          ? 'var(--brand-emerald)'
                          : isPast
                          ? 'var(--brand-teal)'
                          : 'var(--border-strong)'
                      }`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '22px',
                      marginBottom: '8px',
                      boxShadow: isCurrent ? '0 0 16px rgba(5, 150, 105, 0.4)' : 'var(--elevation-1)',
                      transition: 'all var(--motion-fast)',
                      transform: isCurrent ? 'scale(1.12)' : 'scale(1)',
                    }}
                  >
                    {step.icon}
                  </div>

                  <span
                    style={{
                      fontSize: '11px',
                      fontWeight: 800,
                      color: isCurrent ? 'var(--brand-emerald)' : 'var(--text-muted)',
                      letterSpacing: '0.04em',
                    }}
                  >
                    STEP {step.number}
                  </span>

                  <strong
                    style={{
                      fontSize: '13px',
                      fontWeight: 800,
                      color: isCurrent ? 'var(--text-primary)' : 'var(--text-secondary)',
                      lineHeight: 1.25,
                      marginTop: '2px',
                    }}
                  >
                    {step.title}
                  </strong>
                </button>
              );
            })}
          </div>
        </div>

        {/* Active Step Deep-Dive Showcase Card */}
        <div
          style={{
            backgroundColor: 'var(--surface-card)',
            borderRadius: 'var(--radius-xl)',
            padding: 'clamp(var(--space-6), 4vw, var(--space-8))',
            border: '1.5px solid var(--border-subtle)',
            boxShadow: 'var(--elevation-3)',
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: 'var(--space-8)',
            alignItems: 'center',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          {/* Left: Step Editorial Description */}
          <div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', marginBottom: 'var(--space-3)' }}>
              <span
                style={{
                  fontSize: '12px',
                  fontWeight: 900,
                  padding: '4px 12px',
                  borderRadius: 'var(--radius-pill)',
                  backgroundColor: 'rgba(5, 150, 105, 0.12)',
                  color: 'var(--brand-emerald)',
                }}
              >
                PHASE {active.number} OF 06
              </span>
              <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
                {active.subtitle}
              </span>
            </div>

            <h3
              style={{
                fontSize: 'clamp(22px, 3vw, 28px)',
                fontWeight: 900,
                color: 'var(--text-primary)',
                letterSpacing: '-0.02em',
                margin: '0 0 var(--space-3) 0',
              }}
            >
              {active.title}
            </h3>

            <p
              style={{
                fontSize: '15px',
                lineHeight: 1.65,
                color: 'var(--text-secondary)',
                margin: '0 0 var(--space-6) 0',
              }}
            >
              {active.description}
            </p>

            <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
              <button
                type="button"
                onClick={() => setActiveStepIndex((prev) => (prev > 0 ? prev - 1 : SIX_STEPS.length - 1))}
                style={{
                  padding: '8px 16px',
                  borderRadius: 'var(--radius-pill)',
                  backgroundColor: 'var(--surface-raised)',
                  border: '1px solid var(--border-strong)',
                  color: 'var(--text-primary)',
                  fontWeight: 700,
                  fontSize: '13px',
                  cursor: 'pointer',
                }}
              >
                ← Prev Step
              </button>

              <button
                type="button"
                onClick={() => setActiveStepIndex((prev) => (prev + 1) % SIX_STEPS.length)}
                style={{
                  padding: '8px 18px',
                  borderRadius: 'var(--radius-pill)',
                  backgroundColor: 'var(--brand-emerald)',
                  border: 'none',
                  color: '#ffffff',
                  fontWeight: 700,
                  fontSize: '13px',
                  cursor: 'pointer',
                  boxShadow: 'var(--elevation-1)',
                }}
              >
                Next Step →
              </button>

              <button
                type="button"
                onClick={() => setIsAutoPlaying(!isAutoPlaying)}
                style={{
                  padding: '8px 14px',
                  borderRadius: 'var(--radius-pill)',
                  backgroundColor: 'transparent',
                  border: '1px solid var(--border-subtle)',
                  color: 'var(--text-muted)',
                  fontSize: '12px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  marginLeft: 'auto',
                }}
              >
                {isAutoPlaying ? '⏸ Pause Flow' : '▶ Auto Advance'}
              </button>
            </div>
          </div>

          {/* Right: Technical Invariant Visual Diagram */}
          <div
            style={{
              backgroundColor: 'var(--surface-raised)',
              borderRadius: 'var(--radius-lg)',
              padding: 'var(--space-6)',
              border: '1px solid var(--border-subtle)',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '11px', fontWeight: 800, color: 'var(--brand-teal)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                System Architecture Node
              </span>
              <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--brand-emerald)' }}>
                {active.stageName}
              </span>
            </div>

            <div
              style={{
                backgroundColor: 'var(--surface-card)',
                padding: '14px',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border-subtle)',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
              }}
            >
              <span style={{ fontSize: '28px' }}>{active.icon}</span>
              <div>
                <strong style={{ fontSize: '14px', color: 'var(--text-primary)', display: 'block' }}>
                  {active.title}
                </strong>
                <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                  {active.subtitle}
                </span>
              </div>
            </div>

            <div
              style={{
                fontSize: '12px',
                color: 'var(--text-muted)',
                lineHeight: 1.5,
                backgroundColor: 'rgba(5, 150, 105, 0.04)',
                padding: '10px 12px',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid rgba(5, 150, 105, 0.1)',
              }}
            >
              🛡️ <strong>Architectural Guarantee:</strong> Every position mutation occurs within a server-verified transaction with strict concurrency locks. Bids never displace incumbents without full payment confirmation.
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
