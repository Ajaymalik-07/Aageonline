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
      'View the current market ladder and the qualifying amount required for your selected position.',
    icon: '🎯',
    stageName: 'Target Ladder',
  },
  {
    number: '04',
    title: 'Make a Qualifying Payment',
    subtitle: 'Strictly Greater & Whole Rupee',
    description:
      'Complete the required whole-rupee payment. The platform verifies the transaction before updating the ranking.',
    icon: '💳',
    stageName: 'Verified Payment',
  },
  {
    number: '05',
    title: 'Position Updates',
    subtitle: 'Server-Verified Transition',
    description:
      "Once the payment is verified, the market ranking updates according to the platform's ranking rules.",
    icon: '⚡',
    stageName: 'Verified Update',
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

  // Highlight step 1 to 6 sequentially, then loop back to 1
  useEffect(() => {
    if (isHovered || prefersReducedMotion) return;

    const timer = setInterval(() => {
      setActiveStepIndex((prev) => (prev + 1) % SIX_STEPS.length);
    }, 2800);

    return () => clearInterval(timer);
  }, [isHovered, prefersReducedMotion]);

  const active = SIX_STEPS[activeStepIndex];

  return (
    <section
      id="how-it-works"
      aria-label="How AageOnline Works - Step-by-Step Overview"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        backgroundColor: '#0B1F33',
        backgroundImage: `
          radial-gradient(circle at 80% 20%, rgba(234, 88, 12, 0.15) 0%, transparent 50%),
          radial-gradient(circle at 20% 80%, rgba(251, 146, 60, 0.1) 0%, transparent 50%),
          linear-gradient(180deg, #071018 0%, #0B1F33 50%, #0a1b2e 100%)
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
              color: '#FB923C',
              display: 'inline-block',
              padding: '3px 12px',
              borderRadius: 'var(--radius-pill)',
              backgroundColor: 'rgba(234, 88, 12, 0.15)',
              border: '1px solid rgba(234, 88, 12, 0.35)',
              marginBottom: '10px',
            }}
          >
            Simple 6-Step Process
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
            How AageOnline <span style={{ color: '#FB923C' }}>Works</span>
          </h2>

          <p style={{ fontSize: '15px', color: 'rgba(255, 255, 255, 0.82)', margin: 0, lineHeight: 1.6 }}>
            A transparent 6-step journey from market identification to public visibility. Built on verified payments, auditable position history, and clear commercial labeling.
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
                background: 'linear-gradient(90deg, #FB923C, #EA580C)',
                transition: 'width var(--motion-normal)',
                borderRadius: '2px',
                boxShadow: '0 0 10px rgba(234, 88, 12, 0.5)',
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
                  {/* Circular Node Icon (Solid opaque #0B1F33 halo preventing line bleed) */}
                  <div
                    style={{
                      width: '54px',
                      height: '54px',
                      borderRadius: '50%',
                      backgroundColor: isCurrent ? '#EA580C' : '#0B1F33',
                      color: isCurrent ? '#ffffff' : isPast ? '#FB923C' : 'rgba(255, 255, 255, 0.6)',
                      border: `2.5px solid ${
                        isCurrent
                          ? '#EA580C'
                          : isPast
                          ? '#FB923C'
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
                        ? '0 0 0 6px #0B1F33, 0 0 20px rgba(234, 88, 12, 0.6)'
                        : '0 0 0 6px #0B1F33',
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
                      color: isCurrent ? '#FB923C' : 'rgba(255, 255, 255, 0.6)',
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
                  backgroundColor: 'rgba(234, 88, 12, 0.18)',
                  color: '#FB923C',
                  border: '1px solid rgba(234, 88, 12, 0.35)',
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
                  backgroundColor: '#EA580C',
                  border: 'none',
                  color: '#ffffff',
                  fontWeight: 800,
                  fontSize: '13px',
                  cursor: 'pointer',
                  boxShadow: '0 4px 14px rgba(234, 88, 12, 0.35)',
                }}
              >
                Next Step →
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
              <span style={{ fontSize: '11px', fontWeight: 800, color: '#FB923C', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                System Workflow
              </span>
              <span style={{ fontSize: '11px', fontWeight: 700, color: '#FB923C' }}>
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
                backgroundColor: 'rgba(234, 88, 12, 0.1)',
                padding: '10px 12px',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid rgba(234, 88, 12, 0.25)',
              }}
            >
              🛡️ <strong>Platform Guarantee:</strong> Every ranking update occurs through a server-verified transaction. Position changes take effect only after complete payment verification.
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
