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
      aria-label="How AageOnline Works - 6-Step Infographic Journey"
      style={{
        backgroundColor: '#064e3b',
        backgroundImage: `
          radial-gradient(circle at 80% 20%, rgba(16, 185, 129, 0.2) 0%, transparent 50%),
          radial-gradient(circle at 20% 80%, rgba(199, 240, 0, 0.12) 0%, transparent 50%),
          linear-gradient(180deg, #053e30 0%, #064e3b 50%, #083327 100%)
        `,
        color: '#ffffff',
        borderTop: '1px solid rgba(255, 255, 255, 0.1)',
        borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
        padding: 'clamp(var(--space-10), 6vw, var(--space-12)) 0',
        position: 'relative',
        overflow: 'hidden',
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
              letterSpacing: '0.12em',
              color: 'var(--brand-lime)',
              display: 'inline-block',
              padding: '3px 12px',
              borderRadius: 'var(--radius-pill)',
              backgroundColor: 'rgba(199, 240, 0, 0.15)',
              border: '1px solid rgba(199, 240, 0, 0.3)',
              marginBottom: '10px',
            }}
          >
            Deterministic Process Flow
          </span>

          <h2
            style={{
              fontSize: 'clamp(28px, 4vw, 42px)',
              fontWeight: 900,
              color: '#ffffff',
              letterSpacing: '-0.025em',
              margin: '0 0 var(--space-3) 0',
            }}
          >
            How AageOnline <span style={{ color: 'var(--brand-lime)' }}>Works</span>
          </h2>

          <p style={{ fontSize: '15px', color: 'rgba(255, 255, 255, 0.82)', margin: 0, lineHeight: 1.6 }}>
            A transparent 6-step journey from market identification to public visibility. Built on atomic transactions, immutable history, and honest commercial labeling.
          </p>
        </div>

        {/* Desktop / Tablet Infographic Journey Rail (6 Nodes with Progress Track) */}
        <div style={{ position: 'relative', marginBottom: 'var(--space-8)' }}>
          {/* Connecting Track Line */}
          <div
            aria-hidden="true"
            style={{
              position: 'absolute',
              top: '35px',
              left: '8%',
              right: '8%',
              height: '4px',
              backgroundColor: 'rgba(255, 255, 255, 0.15)',
              zIndex: 1,
            }}
          >
            <div
              style={{
                height: '100%',
                width: `${(activeStepIndex / (SIX_STEPS.length - 1)) * 100}%`,
                background: 'linear-gradient(90deg, var(--brand-teal), var(--brand-lime))',
                transition: 'width var(--motion-normal)',
                borderRadius: '2px',
                boxShadow: '0 0 10px rgba(199, 240, 0, 0.6)',
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
                  {/* Circular Node Icon (Solid opaque #064e3b halo preventing line bleed) */}
                  <div
                    style={{
                      width: '54px',
                      height: '54px',
                      borderRadius: '50%',
                      backgroundColor: isCurrent ? 'var(--brand-lime)' : '#064e3b',
                      color: isCurrent ? '#0b1f3b' : isPast ? 'var(--brand-teal)' : 'rgba(255, 255, 255, 0.6)',
                      border: `2.5px solid ${
                        isCurrent
                          ? 'var(--brand-lime)'
                          : isPast
                          ? 'var(--brand-teal)'
                          : 'rgba(255, 255, 255, 0.3)'
                      }`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '22px',
                      marginBottom: '8px',
                      position: 'relative',
                      zIndex: 3,
                      boxShadow: isCurrent
                        ? '0 0 0 6px #064e3b, 0 0 20px rgba(199, 240, 0, 0.6)'
                        : '0 0 0 6px #064e3b',
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
                      color: isCurrent ? 'var(--brand-lime)' : 'rgba(255, 255, 255, 0.6)',
                      letterSpacing: '0.04em',
                    }}
                  >
                    STEP {step.number}
                  </span>

                  <strong
                    style={{
                      fontSize: '13px',
                      fontWeight: 800,
                      color: isCurrent ? '#ffffff' : 'rgba(255, 255, 255, 0.85)',
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
            backgroundColor: 'rgba(255, 255, 255, 0.07)',
            backdropFilter: 'blur(16px)',
            WebkitBackdropFilter: 'blur(16px)',
            borderRadius: 'var(--radius-xl)',
            padding: 'clamp(var(--space-6), 4vw, var(--space-8))',
            border: '1px solid rgba(255, 255, 255, 0.16)',
            boxShadow: '0 20px 40px rgba(0, 0, 0, 0.35)',
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
                  backgroundColor: 'rgba(199, 240, 0, 0.18)',
                  color: 'var(--brand-lime)',
                  border: '1px solid rgba(199, 240, 0, 0.35)',
                }}
              >
                PHASE {active.number} OF 06
              </span>
              <span style={{ fontSize: '13px', color: 'rgba(255, 255, 255, 0.7)' }}>
                {active.subtitle}
              </span>
            </div>

            <h3
              style={{
                fontSize: 'clamp(22px, 3vw, 28px)',
                fontWeight: 900,
                color: '#ffffff',
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
                color: 'rgba(255, 255, 255, 0.82)',
                margin: '0 0 var(--space-6) 0',
              }}
            >
              {active.description}
            </p>

            <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
              <button
                type="button"
                onClick={() => setActiveStepIndex((prev) => (prev > 0 ? prev - 1 : SIX_STEPS.length - 1))}
                style={{
                  padding: '8px 16px',
                  borderRadius: 'var(--radius-pill)',
                  backgroundColor: 'rgba(255, 255, 255, 0.1)',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  color: '#ffffff',
                  fontWeight: 700,
                  fontSize: '13px',
                  cursor: 'pointer',
                  transition: 'background var(--motion-fast)',
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
                  backgroundColor: 'var(--brand-lime)',
                  border: 'none',
                  color: '#0b1f3b',
                  fontWeight: 800,
                  fontSize: '13px',
                  cursor: 'pointer',
                  boxShadow: '0 4px 14px rgba(199, 240, 0, 0.35)',
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
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  color: 'rgba(255, 255, 255, 0.65)',
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
              backgroundColor: 'rgba(0, 0, 0, 0.28)',
              borderRadius: 'var(--radius-lg)',
              padding: 'var(--space-6)',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '11px', fontWeight: 800, color: 'var(--brand-teal)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                System Architecture Node
              </span>
              <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--brand-lime)' }}>
                {active.stageName}
              </span>
            </div>

            <div
              style={{
                backgroundColor: 'rgba(255, 255, 255, 0.06)',
                padding: '14px',
                borderRadius: 'var(--radius-md)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
              }}
            >
              <span style={{ fontSize: '28px' }}>{active.icon}</span>
              <div>
                <strong style={{ fontSize: '14px', color: '#ffffff', display: 'block' }}>
                  {active.title}
                </strong>
                <span style={{ fontSize: '12px', color: 'rgba(255, 255, 255, 0.7)' }}>
                  {active.subtitle}
                </span>
              </div>
            </div>

            <div
              style={{
                fontSize: '12px',
                color: 'rgba(255, 255, 255, 0.75)',
                lineHeight: 1.5,
                backgroundColor: 'rgba(16, 185, 129, 0.1)',
                padding: '10px 12px',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid rgba(16, 185, 129, 0.25)',
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
