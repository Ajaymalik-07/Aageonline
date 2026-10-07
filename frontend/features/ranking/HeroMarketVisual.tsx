'use client';

import React, { useState, useEffect, useRef } from 'react';
import { PositionBadge } from './PositionBadge';
import { PositionMovement } from './PositionMovement';
import { formatINR } from '../../lib/utils/format';

interface LadderCard {
  id: string;
  name: string;
  position: number;
  amountMinor: number;
  movement: 'up' | 'down' | 'same';
  movementCount?: number;
  isLeading?: boolean;
  highlighted?: boolean;
}

const INITIAL_LADDER: LadderCard[] = [
  { id: 'biz-1', name: 'ABC Interiors', position: 1, amountMinor: 2600000, movement: 'same', isLeading: true },
  { id: 'biz-2', name: 'Studio XYZ', position: 2, amountMinor: 2450000, movement: 'same' },
  { id: 'biz-3', name: 'Design House', position: 3, amountMinor: 2200000, movement: 'same' },
  { id: 'biz-4', name: 'Urban Interiors', position: 4, amountMinor: 2050000, movement: 'same' },
  { id: 'biz-5', name: 'SpaceCraft Studio', position: 5, amountMinor: 1900000, movement: 'same' },
];

export const HeroMarketVisual: React.FC = () => {
  const [ladder, setLadder] = useState<LadderCard[]>(INITIAL_LADDER);
  const [step, setStep] = useState<'idle' | 'bidding' | 'verifying' | 'reordering' | 'settled'>('idle');
  const [activeMessage, setActiveMessage] = useState<string>('Live Market Ladder · Real-time qualifying amounts');
  const [isAutoPlaying, setIsAutoPlaying] = useState<boolean>(true);
  const [stepCount, setStepCount] = useState<number>(0);
  const autoPlayTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Run continuous, restrained demo transitions when autoplay is on
  useEffect(() => {
    if (!isAutoPlaying) return;

    const timer = setInterval(() => {
      triggerOutbidSequence();
    }, 7000);

    return () => clearInterval(timer);
  }, [isAutoPlaying, ladder, stepCount]);

  const triggerOutbidSequence = () => {
    if (step !== 'idle' && step !== 'settled') return;

    // Pick candidate: either #2 outbidding #1, or #3 outbidding #2
    const isOutbiddingTop = stepCount % 2 === 0;
    const candidateIdx = isOutbiddingTop ? 1 : 2;
    const incumbentIdx = candidateIdx - 1;

    const candidate = ladder[candidateIdx];
    const incumbent = ladder[incumbentIdx];
    const newAmount = incumbent.amountMinor + 150000; // +₹1,500 strictly greater

    // Phase 1: New qualifying payment enters
    setStep('bidding');
    setActiveMessage(`New Qualifying Payment: ${candidate.name} submits ${formatINR(newAmount)} for Position #${incumbent.position}`);
    setLadder((prev) =>
      prev.map((c, idx) => (idx === candidateIdx ? { ...c, highlighted: true } : { ...c, highlighted: false }))
    );

    // Phase 2: Server-side cryptographic & financial verification
    setTimeout(() => {
      setStep('verifying');
      setActiveMessage(`Payment Confirmed ✓ Server verified ${formatINR(newAmount)}. Recalculating market...`);
    }, 1200);

    // Phase 3: FLIP reordering
    setTimeout(() => {
      setStep('reordering');
      setLadder((prev) => {
        const next = [...prev];
        const updatedCandidate: LadderCard = {
          ...candidate,
          position: incumbent.position,
          amountMinor: newAmount,
          movement: 'up',
          movementCount: 1,
          isLeading: incumbent.position === 1,
          highlighted: true,
        };
        const updatedIncumbent: LadderCard = {
          ...incumbent,
          position: candidate.position,
          movement: 'down',
          movementCount: 1,
          isLeading: false,
          highlighted: false,
        };

        next[incumbentIdx] = updatedCandidate;
        next[candidateIdx] = updatedIncumbent;
        return next;
      });
      setActiveMessage(`Position Updated: ${candidate.name} moved #${candidate.position} → #${incumbent.position}`);
    }, 2400);

    // Phase 4: Settled
    setTimeout(() => {
      setStep('settled');
      setStepCount((c) => c + 1);
      setLadder((prev) => prev.map((c) => ({ ...c, highlighted: false })));
      setActiveMessage(`Market Succeeded: ${candidate.name} holds Position #${incumbent.position}`);
    }, 3800);
  };

  const handleReset = () => {
    setLadder(INITIAL_LADDER);
    setStep('idle');
    setStepCount(0);
    setActiveMessage('Demo Reset to Baseline · Jaipur + Interior Designers');
  };

  return (
    <div
      style={{
        position: 'relative',
        width: '100%',
        maxWidth: '560px',
        margin: '0 auto',
      }}
    >
      {/* Crisp 2.5D Spatial Stage Card */}
      <div
        className="perspective-tilt"
        style={{
          borderRadius: 'var(--radius-xl)',
          backgroundColor: 'rgba(7, 19, 36, 0.88)',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          border: '1px solid rgba(255, 255, 255, 0.14)',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.6)',
          overflow: 'hidden',
          position: 'relative',
          padding: 'var(--space-6)',
          transformStyle: 'preserve-3d',
        }}
      >
        {/* Subtle Ambient Radial Lighting */}
        <div
          aria-hidden="true"
          style={{
            position: 'absolute',
            top: 0,
            right: 0,
            width: '280px',
            height: '280px',
            background: 'radial-gradient(circle, rgba(16, 185, 129, 0.18) 0%, transparent 70%)',
            pointerEvents: 'none',
          }}
        />

        {/* Market Identity Stage Header */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            gap: 'var(--space-3)',
            marginBottom: 'var(--space-5)',
            borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
            paddingBottom: 'var(--space-4)',
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
              <span
                style={{
                  display: 'inline-block',
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  backgroundColor: 'var(--brand-teal)',
                }}
                className="live-indicator-dot"
              />
              <span
                style={{
                  fontSize: '11px',
                  fontWeight: 800,
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                  color: 'var(--brand-teal)',
                }}
              >
                Defined Market
              </span>
            </div>

            <h3
              style={{
                fontSize: '20px',
                fontWeight: 900,
                color: '#ffffff',
                letterSpacing: '-0.02em',
                lineHeight: 1.2,
                margin: 0,
              }}
            >
              Jaipur · <span style={{ color: 'var(--brand-teal)' }}>Interior Designers</span>
            </h3>

            <p style={{ fontSize: '13px', color: 'rgba(255, 255, 255, 0.68)', margin: '4px 0 0 0' }}>
              48 businesses · 24 active paid visibility positions
            </p>
          </div>

          <div style={{ textAlign: 'right' }}>
            <span
              style={{
                fontSize: '10px',
                fontWeight: 700,
                padding: '4px 10px',
                borderRadius: 'var(--radius-pill)',
                backgroundColor: 'rgba(199, 240, 0, 0.18)',
                color: 'var(--brand-lime)',
                border: '1px solid rgba(199, 240, 0, 0.4)',
                display: 'inline-block',
              }}
            >
              High Activity
            </span>
          </div>
        </div>

        {/* Live Transaction State Callout Banner */}
        <div
          style={{
            backgroundColor:
              step === 'bidding'
                ? 'rgba(245, 158, 11, 0.15)'
                : step === 'verifying'
                ? 'rgba(16, 185, 129, 0.18)'
                : step === 'reordering'
                ? 'rgba(199, 240, 0, 0.18)'
                : 'rgba(255, 255, 255, 0.05)',
            borderRadius: 'var(--radius-md)',
            padding: '10px 14px',
            marginBottom: 'var(--space-4)',
            border: `1px solid ${
              step === 'bidding'
                ? 'rgba(245, 158, 11, 0.4)'
                : step === 'verifying'
                ? 'rgba(16, 185, 129, 0.45)'
                : step === 'reordering'
                ? 'rgba(199, 240, 0, 0.5)'
                : 'rgba(255, 255, 255, 0.1)'
            }`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '8px',
            transition: 'all var(--motion-normal)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', overflow: 'hidden' }}>
            <span style={{ fontSize: '14px' }}>
              {step === 'bidding' && '⚡'}
              {step === 'verifying' && '🛡️'}
              {step === 'reordering' && '↑'}
              {(step === 'idle' || step === 'settled') && '●'}
            </span>
            <span
              style={{
                fontSize: '12px',
                fontWeight: 600,
                color: '#ffffff',
                whiteSpace: 'nowrap',
                textOverflow: 'ellipsis',
                overflow: 'hidden',
              }}
            >
              {activeMessage}
            </span>
          </div>

          <span
            style={{
              fontSize: '11px',
              fontWeight: 700,
              color: 'var(--brand-teal)',
              whiteSpace: 'nowrap',
            }}
          >
            {step === 'verifying' ? 'Verifying...' : step === 'reordering' ? 'Shifting...' : 'Active'}
          </span>
        </div>

        {/* High-DPI Crisp Market Ladder List */}
        <div
          role="list"
          aria-label="Interactive Market Ladder Demonstration"
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
            marginBottom: 'var(--space-5)',
          }}
        >
          {ladder.map((entry) => {
            const isTop = entry.position === 1;

            return (
              <div
                key={entry.id}
                role="listitem"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: isTop ? '12px 14px' : '10px 14px',
                  borderRadius: 'var(--radius-md)',
                  backgroundColor: isTop
                    ? 'rgba(199, 240, 0, 0.12)'
                    : entry.highlighted
                    ? 'rgba(16, 185, 129, 0.14)'
                    : 'rgba(255, 255, 255, 0.04)',
                  border: isTop
                    ? '1.5px solid var(--brand-lime)'
                    : entry.highlighted
                    ? '1.5px solid var(--brand-teal)'
                    : '1px solid rgba(255, 255, 255, 0.08)',
                  boxShadow: isTop ? '0 2px 12px rgba(199, 240, 0, 0.2)' : 'none',
                  transition: 'all var(--motion-slow)',
                  transform: entry.highlighted ? 'scale(1.015)' : 'scale(1)',
                }}
              >
                {/* Left: Position Badge & Business Details */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <PositionBadge position={entry.position} size="md" />

                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span
                        style={{
                          fontSize: '14px',
                          fontWeight: 700,
                          color: '#ffffff',
                        }}
                      >
                        {entry.name}
                      </span>
                      {isTop && (
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

                    <PositionMovement
                      direction={entry.movement}
                      positions={entry.movementCount}
                      isLeading={isTop}
                    />
                  </div>
                </div>

                {/* Right: Qualifying Amount */}
                <div style={{ textAlign: 'right' }}>
                  <span
                    style={{
                      fontSize: '15px',
                      fontWeight: 800,
                      color: isTop ? 'var(--brand-lime)' : '#ffffff',
                      display: 'block',
                    }}
                  >
                    {formatINR(entry.amountMinor)}
                  </span>
                  <span
                    style={{
                      fontSize: '10px',
                      color: 'rgba(255, 255, 255, 0.5)',
                      textTransform: 'uppercase',
                      letterSpacing: '0.04em',
                    }}
                  >
                    Qualifying
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Demo Controls Bar */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '8px',
            flexWrap: 'wrap',
            paddingTop: 'var(--space-3)',
            borderTop: '1px solid rgba(255, 255, 255, 0.1)',
          }}
        >
          <div style={{ display: 'flex', gap: '6px' }}>
            <button
              type="button"
              onClick={triggerOutbidSequence}
              disabled={step === 'bidding' || step === 'verifying' || step === 'reordering'}
              style={{
                padding: '6px 14px',
                borderRadius: 'var(--radius-pill)',
                backgroundColor: 'var(--brand-emerald)',
                color: '#ffffff',
                border: 'none',
                fontSize: '12px',
                fontWeight: 700,
                cursor: 'pointer',
                opacity: step !== 'idle' && step !== 'settled' ? 0.6 : 1,
                boxShadow: '0 2px 8px rgba(5, 150, 105, 0.3)',
              }}
            >
              ⚡ Simulate Shift
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
              {isAutoPlaying ? '⏸ Pause Auto' : '▶ Play Auto'}
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

          <span
            style={{
              fontSize: '11px',
              color: 'var(--text-muted)',
              fontStyle: 'italic',
            }}
          >
            * Interactive demonstration
          </span>
        </div>
      </div>
    </div>
  );
};
