'use client';

import React, { useState, useEffect } from 'react';
import { PositionBadge } from '../ranking/PositionBadge';
import { formatINR } from '../../lib/utils/format';

interface SpotlightCard {
  id: string;
  name: string;
  position: number;
  amountMinor: number;
  isLeader?: boolean;
  isMoving?: boolean;
  movedNote?: string;
}

const INITIAL_STATE: SpotlightCard[] = [
  { id: 'biz-1', name: 'ABC Interiors', position: 1, amountMinor: 2600000, isLeader: true },
  { id: 'biz-2', name: 'Studio XYZ', position: 2, amountMinor: 2450000 },
  { id: 'biz-3', name: 'Design House', position: 3, amountMinor: 2200000 },
  { id: 'biz-4', name: 'Urban Interiors', position: 4, amountMinor: 2050000 },
];

export const CompetitiveSpotlight: React.FC = () => {
  const [cards, setCards] = useState<SpotlightCard[]>(INITIAL_STATE);
  const [phase, setPhase] = useState<'initial' | 'qualifying' | 'verified' | 'animating' | 'settled'>('initial');
  const [isAutoPlaying, setIsAutoPlaying] = useState<boolean>(true);

  const microSteps = [
    { title: 'Qualifying Payment', icon: '💳', desc: 'Studio XYZ submits ₹27,000 (> incumbent ₹26,000)' },
    { title: 'Payment Verified', icon: '🛡️', desc: 'Server verifies signature & exact whole Rupee amount' },
    { title: 'Atomic Recalculation', icon: '⚡', desc: 'Row-level DB lock swaps positions #2 ↔ #1' },
    { title: 'Ranking Changes', icon: '↑', desc: 'Studio XYZ takes #1 position instantly' },
    { title: 'Public Disclosure', icon: '📡', desc: 'Paid visibility disclosed transparently to consumers' },
  ];

  const runSequence = () => {
    if (phase !== 'initial' && phase !== 'settled') return;

    // Step 1: Qualifying payment entered
    setPhase('qualifying');
    setCards((prev) =>
      prev.map((c) =>
        c.id === 'biz-2'
          ? { ...c, amountMinor: 2700000, isMoving: true, movedNote: 'Qualifying with ₹27,000' }
          : { ...c, isMoving: false, movedNote: undefined }
      )
    );

    // Step 2: Payment verified
    setTimeout(() => {
      setPhase('verified');
      setCards((prev) =>
        prev.map((c) =>
          c.id === 'biz-2'
            ? { ...c, movedNote: 'Payment Verified ✓' }
            : c
        )
      );
    }, 1200);

    // Step 3: Physical swap animation
    setTimeout(() => {
      setPhase('animating');
      const xyz = { id: 'biz-2', name: 'Studio XYZ', position: 1, amountMinor: 2700000, isLeader: true, isMoving: true, movedNote: '↑ Moved up 1 position' };
      const abc = { id: 'biz-1', name: 'ABC Interiors', position: 2, amountMinor: 2600000, isLeader: false, isMoving: false, movedNote: 'Displaced to #2' };
      const house = { id: 'biz-3', name: 'Design House', position: 3, amountMinor: 2200000 };
      const urban = { id: 'biz-4', name: 'Urban Interiors', position: 4, amountMinor: 2050000 };

      setCards([xyz, abc, house, urban]);
    }, 2400);

    // Step 4: Settled
    setTimeout(() => {
      setPhase('settled');
      setCards((prev) =>
        prev.map((c) => (c.id === 'biz-2' ? { ...c, isMoving: false } : c))
      );
    }, 3600);
  };

  const handleReset = () => {
    setCards(INITIAL_STATE);
    setPhase('initial');
  };

  useEffect(() => {
    if (!isAutoPlaying) return;

    const interval = setInterval(() => {
      if (phase === 'initial') {
        runSequence();
      } else if (phase === 'settled') {
        handleReset();
      }
    }, 5500);

    return () => clearInterval(interval);
  }, [isAutoPlaying, phase]);

  const activeStepIdx =
    phase === 'initial' ? 0 : phase === 'qualifying' ? 1 : phase === 'verified' ? 2 : phase === 'animating' ? 3 : 4;

  return (
    <section
      className="section-dark-immersive"
      aria-label="Signature Competitive Ladder Visual"
      style={{
        padding: 'clamp(var(--space-10), 6vw, var(--space-12)) 0',
        borderTop: '1px solid rgba(255, 255, 255, 0.1)',
        borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
        position: 'relative',
      }}
    >
      {/* Decorative Radial Backdrop Accent */}
      <div
        aria-hidden="true"
        style={{
          position: 'absolute',
          top: '-20%',
          right: '-5%',
          width: '600px',
          height: '600px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(199, 240, 0, 0.12) 0%, rgba(16, 185, 129, 0.08) 50%, transparent 70%)',
          pointerEvents: 'none',
        }}
      />

      <div className="container">
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
            gap: 'var(--space-10)',
            alignItems: 'center',
            position: 'relative',
            zIndex: 2,
          }}
        >
          {/* Left Column: Visual Storytelling & Payment Micro-sequence */}
          <div>
            <div style={{ display: 'inline-flex', marginBottom: 'var(--space-3)' }}>
              <span
                style={{
                  fontSize: '11px',
                  fontWeight: 800,
                  textTransform: 'uppercase',
                  letterSpacing: '0.1em',
                  padding: '4px 14px',
                  borderRadius: 'var(--radius-pill)',
                  backgroundColor: 'rgba(199, 240, 0, 0.15)',
                  color: 'var(--brand-lime)',
                  border: '1px solid rgba(199, 240, 0, 0.35)',
                }}
              >
                Signature Platform Mechanism
              </span>
            </div>

            <h2
              style={{
                fontSize: 'clamp(32px, 5vw, 52px)',
                fontWeight: 900,
                color: '#ffffff',
                lineHeight: 1.1,
                letterSpacing: '-0.03em',
                marginBottom: 'var(--space-4)',
              }}
            >
              Every Position Is Competitive.{' '}
              <span
                style={{
                  background: 'linear-gradient(135deg, var(--brand-lime) 0%, var(--brand-teal) 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                }}
              >
                A qualifying payment moves you up.
              </span>
            </h2>

            <p
              style={{
                fontSize: '16px',
                lineHeight: 1.6,
                color: 'rgba(255, 255, 255, 0.8)',
                marginBottom: 'var(--space-6)',
              }}
            >
              A business can move upward by making a qualifying payment strictly greater than the current qualifying amount. Ranking updates atomically inside a database transaction—never relying on unverified client claims.
            </p>

            {/* Interactive Step Timeline Indicator */}
            <div
              style={{
                backgroundColor: 'rgba(255, 255, 255, 0.05)',
                borderRadius: 'var(--radius-lg)',
                padding: 'var(--space-4)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                marginBottom: 'var(--space-6)',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                <span
                  style={{
                    fontSize: '11px',
                    fontWeight: 800,
                    color: 'var(--brand-teal)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.06em',
                  }}
                >
                  Step {activeStepIdx + 1} of 5 · Transaction Flow
                </span>
                <span
                  style={{
                    fontSize: '11px',
                    fontWeight: 700,
                    color: phase === 'verified' ? 'var(--brand-lime)' : 'rgba(255, 255, 255, 0.6)',
                  }}
                >
                  {phase === 'verified' ? 'Payment Verified ✓' : phase === 'animating' ? 'Re-indexing Rank...' : 'Deterministic Demo'}
                </span>
              </div>

              {/* Step Progress Line */}
              <div style={{ display: 'flex', gap: '6px', marginBottom: '12px' }}>
                {microSteps.map((s, idx) => (
                  <div
                    key={s.title}
                    style={{
                      flex: 1,
                      height: '4px',
                      borderRadius: '2px',
                      backgroundColor: idx <= activeStepIdx ? 'var(--brand-lime)' : 'rgba(255, 255, 255, 0.15)',
                      transition: 'all var(--motion-normal)',
                    }}
                  />
                ))}
              </div>

              {/* Active Step Content */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span style={{ fontSize: '24px' }}>{microSteps[activeStepIdx].icon}</span>
                <div>
                  <h4 style={{ fontSize: '15px', fontWeight: 800, color: '#ffffff', margin: 0 }}>
                    {microSteps[activeStepIdx].title}
                  </h4>
                  <p style={{ fontSize: '13px', color: 'rgba(255, 255, 255, 0.7)', margin: 0 }}>
                    {microSteps[activeStepIdx].desc}
                  </p>
                </div>
              </div>
            </div>

            {/* CTAs */}
            <div style={{ display: 'flex', gap: 'var(--space-3)', flexWrap: 'wrap' }}>
              <a
                href="/explore"
                style={{
                  padding: '12px 24px',
                  borderRadius: 'var(--radius-pill)',
                  backgroundColor: 'var(--brand-lime)',
                  color: 'var(--brand-deep-navy)',
                  fontWeight: 800,
                  fontSize: '14px',
                  textDecoration: 'none',
                  boxShadow: '0 4px 14px rgba(199, 240, 0, 0.3)',
                }}
              >
                Explore Market Ladders →
              </a>
              <a
                href="/claim"
                style={{
                  padding: '12px 24px',
                  borderRadius: 'var(--radius-pill)',
                  backgroundColor: 'rgba(255, 255, 255, 0.08)',
                  border: '1.5px solid rgba(255, 255, 255, 0.25)',
                  color: '#ffffff',
                  fontWeight: 600,
                  fontSize: '14px',
                  textDecoration: 'none',
                }}
              >
                Claim Your Business
              </a>
            </div>
          </div>

          {/* Right Column: Physical 2.5D Stage Visualizer (Exact Section 12 Specification) */}
          <div
            className="perspective-tilt"
            style={{
              backgroundColor: 'rgba(7, 19, 36, 0.9)',
              backdropFilter: 'blur(16px)',
              WebkitBackdropFilter: 'blur(16px)',
              borderRadius: 'var(--radius-xl)',
              padding: 'var(--space-6)',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.65)',
              position: 'relative',
              overflow: 'hidden',
            }}
          >
            {/* Top Identity Header */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: 'var(--space-5)',
                borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
                paddingBottom: 'var(--space-3)',
              }}
            >
              <div>
                <span style={{ fontSize: '11px', fontWeight: 800, color: 'var(--brand-teal)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                  MARKET STAGE DEMONSTRATION
                </span>
                <h3 style={{ fontSize: '18px', fontWeight: 900, color: '#ffffff', margin: '2px 0 0 0' }}>
                  Jaipur · Interior Designers
                </h3>
              </div>
              <span
                style={{
                  fontSize: '11px',
                  padding: '3px 10px',
                  borderRadius: 'var(--radius-pill)',
                  backgroundColor: phase === 'verified' ? 'rgba(199, 240, 0, 0.2)' : 'rgba(16, 185, 129, 0.15)',
                  color: phase === 'verified' ? 'var(--brand-lime)' : 'var(--brand-teal)',
                  fontWeight: 700,
                  border: `1px solid ${phase === 'verified' ? 'rgba(199, 240, 0, 0.4)' : 'rgba(16, 185, 129, 0.3)'}`,
                }}
              >
                {phase === 'initial' ? 'Baseline' : phase === 'qualifying' ? 'Payment Submitted' : phase === 'verified' ? 'Verified' : 'Promoted'}
              </span>
            </div>

            {/* Ranking Cards Ladder (Physical DOM Animation) */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {cards.map((card) => {
                const isLeader = card.position === 1;

                return (
                  <div
                    key={card.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: isLeader ? '14px 16px' : '10px 14px',
                      borderRadius: 'var(--radius-md)',
                      backgroundColor: isLeader
                        ? 'rgba(199, 240, 0, 0.12)'
                        : card.isMoving
                        ? 'rgba(16, 185, 129, 0.15)'
                        : 'rgba(255, 255, 255, 0.04)',
                      border: isLeader
                        ? '1.5px solid var(--brand-lime)'
                        : card.isMoving
                        ? '1.5px solid var(--brand-teal)'
                        : '1px solid rgba(255, 255, 255, 0.08)',
                      boxShadow: isLeader ? '0 0 20px rgba(199, 240, 0, 0.2)' : 'none',
                      transition: 'all var(--motion-slow)',
                      transform: card.isMoving ? 'scale(1.02)' : 'scale(1)',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <PositionBadge position={card.position} size={isLeader ? 'md' : 'sm'} />
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span style={{ fontSize: '14px', fontWeight: 700, color: '#ffffff' }}>
                            {card.name}
                          </span>
                          {isLeader && (
                            <span
                              style={{
                                fontSize: '10px',
                                fontWeight: 800,
                                padding: '1px 6px',
                                borderRadius: 'var(--radius-pill)',
                                backgroundColor: 'var(--brand-lime)',
                                color: 'var(--brand-deep-navy)',
                              }}
                            >
                              LEADER
                            </span>
                          )}
                        </div>
                        {card.movedNote && (
                          <span
                            style={{
                              fontSize: '11px',
                              fontWeight: 700,
                              color: card.position === 1 ? 'var(--brand-lime)' : 'var(--brand-teal)',
                              display: 'block',
                            }}
                          >
                            {card.movedNote}
                          </span>
                        )}
                      </div>
                    </div>

                    <div style={{ textAlign: 'right' }}>
                      <span
                        style={{
                          fontSize: isLeader ? '16px' : '14px',
                          fontWeight: 900,
                          color: isLeader ? 'var(--brand-lime)' : '#ffffff',
                          display: 'block',
                        }}
                      >
                        {formatINR(card.amountMinor)}
                      </span>
                      <span style={{ fontSize: '10px', color: 'rgba(255, 255, 255, 0.5)', textTransform: 'uppercase' }}>
                        Qualifying
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Interactive Demo Controls & Statutory Disclosure (Section 12 & 13) */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '8px',
                marginTop: 'var(--space-5)',
                paddingTop: 'var(--space-3)',
                borderTop: '1px solid rgba(255, 255, 255, 0.1)',
              }}
            >
              <div style={{ display: 'flex', gap: '6px' }}>
                <button
                  type="button"
                  onClick={runSequence}
                  disabled={phase !== 'initial' && phase !== 'settled'}
                  style={{
                    padding: '6px 14px',
                    borderRadius: 'var(--radius-pill)',
                    backgroundColor: 'var(--brand-emerald)',
                    color: '#ffffff',
                    border: 'none',
                    fontSize: '12px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    opacity: phase !== 'initial' && phase !== 'settled' ? 0.6 : 1,
                  }}
                >
                  ⚡ Trigger Qualification
                </button>

                <button
                  type="button"
                  onClick={() => setIsAutoPlaying(!isAutoPlaying)}
                  style={{
                    padding: '6px 12px',
                    borderRadius: 'var(--radius-pill)',
                    backgroundColor: 'rgba(255, 255, 255, 0.08)',
                    color: 'rgba(255, 255, 255, 0.8)',
                    border: '1px solid rgba(255, 255, 255, 0.15)',
                    fontSize: '12px',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  {isAutoPlaying ? '⏸ Pause' : '▶ Play Auto'}
                </button>

                <button
                  type="button"
                  onClick={handleReset}
                  style={{
                    padding: '6px 12px',
                    borderRadius: 'var(--radius-pill)',
                    backgroundColor: 'rgba(255, 255, 255, 0.08)',
                    color: 'rgba(255, 255, 255, 0.8)',
                    border: '1px solid rgba(255, 255, 255, 0.15)',
                    fontSize: '12px',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  Reset
                </button>
              </div>

              <span style={{ fontSize: '11px', color: 'rgba(255, 255, 255, 0.5)', fontStyle: 'italic' }}>
                * Interactive example · Not real activity
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
