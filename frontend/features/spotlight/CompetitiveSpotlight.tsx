'use client';

import React, { useState, useEffect } from 'react';
import { PositionBadge } from '../ranking/PositionBadge';
import { formatINR } from '../../lib/utils/format';

interface SpotlightEntry {
  id: string;
  name: string;
  position: number;
  amountMinor: number;
  isLeader?: boolean;
}

const DEFAULT_SPOTLIGHT_ENTRIES: SpotlightEntry[] = [
  { id: '1', name: 'ABC Interiors', position: 1, amountMinor: 2600000, isLeader: true },
  { id: '2', name: 'Studio XYZ', position: 2, amountMinor: 2450000 },
  { id: '3', name: 'Design House', position: 3, amountMinor: 2200000 },
  { id: '4', name: 'Urban Interiors', position: 4, amountMinor: 2050000 },
];

export const CompetitiveSpotlight: React.FC = () => {
  const [entries, setEntries] = useState<SpotlightEntry[]>(DEFAULT_SPOTLIGHT_ENTRIES);
  const [stepIndex, setStepIndex] = useState<number>(0);

  const microSteps = [
    { title: 'Qualifying Payment', icon: '💳', desc: 'Positive whole-rupee transaction initiated' },
    { title: 'Payment Verified', icon: '🛡️', desc: 'Server verifies signature & amount' },
    { title: 'Position Recalculated', icon: '⚡', desc: 'Atomic market re-indexing in DB transaction' },
    { title: 'Ranking Changes', icon: '↑', desc: 'Candidate business moves upward' },
    { title: 'Visibility Updates', icon: '📡', desc: 'Instant public discovery disclosure' },
  ];

  // Auto-advance micro sequence
  useEffect(() => {
    const timer = setInterval(() => {
      setStepIndex((prev) => (prev + 1) % microSteps.length);
    }, 3200);

    return () => clearInterval(timer);
  }, [microSteps.length]);

  return (
    <section className="container" aria-label="Live Competitive Spotlight">
      <div
        style={{
          borderRadius: 'var(--radius-xl)',
          backgroundColor: 'var(--brand-deep-navy)',
          color: '#ffffff',
          padding: 'clamp(var(--space-8), 5vw, var(--space-12)) clamp(var(--space-6), 4vw, var(--space-10))',
          position: 'relative',
          overflow: 'hidden',
          boxShadow: 'var(--elevation-4)',
          border: '1px solid rgba(255, 255, 255, 0.12)',
        }}
      >
        {/* Subtle Radial Lighting Atmosphere */}
        <div
          aria-hidden="true"
          style={{
            position: 'absolute',
            top: '-30%',
            right: '-10%',
            width: '600px',
            height: '600px',
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(16, 185, 129, 0.18) 0%, transparent 70%)',
            pointerEvents: 'none',
          }}
        />

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
                  padding: '3px 12px',
                  borderRadius: 'var(--radius-pill)',
                  backgroundColor: 'rgba(199, 240, 0, 0.15)',
                  color: 'var(--brand-lime)',
                  border: '1px solid rgba(199, 240, 0, 0.3)',
                }}
              >
                Competitive Spotlight
              </span>
            </div>

            <h2
              style={{
                fontSize: 'clamp(30px, 4.5vw, 48px)',
                fontWeight: 900,
                color: '#ffffff',
                lineHeight: 1.12,
                letterSpacing: '-0.025em',
                marginBottom: 'var(--space-4)',
              }}
            >
              Every position is competitive.{' '}
              <span style={{ color: 'var(--brand-lime)' }}>A verified payment changes the market.</span>
            </h2>

            <p
              style={{
                fontSize: '16px',
                lineHeight: 1.6,
                color: 'rgba(255, 255, 255, 0.75)',
                marginBottom: 'var(--space-6)',
              }}
            >
              No auctions. No fake urgency. Businesses qualify by making verified transactions strictly higher than the incumbent amount. In atomic database transactions, ranking updates instantly.
            </p>

            {/* Section 20: Payment -> Position Visual Infographic Sequence */}
            <div
              style={{
                backgroundColor: 'rgba(255, 255, 255, 0.05)',
                borderRadius: 'var(--radius-lg)',
                padding: 'var(--space-4)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                marginBottom: 'var(--space-6)',
              }}
            >
              <span
                style={{
                  fontSize: '11px',
                  fontWeight: 800,
                  color: 'var(--brand-teal)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.06em',
                  display: 'block',
                  marginBottom: '10px',
                }}
              >
                Transaction → Ranking Mechanism
              </span>

              {/* Progress Indicator Steps */}
              <div style={{ display: 'flex', gap: '6px', marginBottom: '12px' }}>
                {microSteps.map((s, idx) => (
                  <div
                    key={s.title}
                    style={{
                      flex: 1,
                      height: '4px',
                      borderRadius: '2px',
                      backgroundColor: idx === stepIndex ? 'var(--brand-lime)' : 'rgba(255, 255, 255, 0.15)',
                      transition: 'all var(--motion-normal)',
                    }}
                  />
                ))}
              </div>

              {/* Active Step Display */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span style={{ fontSize: '24px' }}>{microSteps[stepIndex].icon}</span>
                <div>
                  <h4 style={{ fontSize: '15px', fontWeight: 800, color: '#ffffff', margin: 0 }}>
                    {stepIndex + 1}. {microSteps[stepIndex].title}
                  </h4>
                  <p style={{ fontSize: '13px', color: 'rgba(255, 255, 255, 0.7)', margin: 0 }}>
                    {microSteps[stepIndex].desc}
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
                Explore a Market Ladder →
              </a>
              <a
                href="/#how-it-works"
                style={{
                  padding: '12px 24px',
                  borderRadius: 'var(--radius-pill)',
                  backgroundColor: 'transparent',
                  border: '1.5px solid rgba(255, 255, 255, 0.3)',
                  color: '#ffffff',
                  fontWeight: 600,
                  fontSize: '14px',
                  textDecoration: 'none',
                }}
              >
                Learn How Ranking Works
              </a>
            </div>
          </div>

          {/* Right Column: 3D Stage / Market Podium Visualizer */}
          <div
            className="perspective-tilt"
            style={{
              backgroundColor: 'rgba(255, 255, 255, 0.05)',
              borderRadius: 'var(--radius-xl)',
              padding: 'var(--space-6)',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              boxShadow: 'var(--elevation-3)',
            }}
          >
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
                <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--brand-teal)' }}>
                  MARKET STAGE
                </span>
                <h3 style={{ fontSize: '18px', fontWeight: 800, color: '#ffffff', margin: 0 }}>
                  Jaipur · Interior Designers
                </h3>
              </div>
              <span
                style={{
                  fontSize: '11px',
                  padding: '3px 8px',
                  borderRadius: 'var(--radius-pill)',
                  backgroundColor: 'rgba(199, 240, 0, 0.15)',
                  color: 'var(--brand-lime)',
                  fontWeight: 700,
                }}
              >
                High Activity
              </span>
            </div>

            {/* Ranking Cards Ladder */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {entries.map((item) => (
                <div
                  key={item.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: item.isLeader ? '14px 16px' : '10px 14px',
                    borderRadius: 'var(--radius-md)',
                    backgroundColor: item.isLeader
                      ? 'rgba(199, 240, 0, 0.1)'
                      : 'rgba(255, 255, 255, 0.04)',
                    border: item.isLeader
                      ? '1.5px solid var(--brand-lime)'
                      : '1px solid rgba(255, 255, 255, 0.08)',
                    boxShadow: item.isLeader ? '0 0 20px rgba(199, 240, 0, 0.2)' : 'none',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <PositionBadge position={item.position} size={item.isLeader ? 'md' : 'sm'} />
                    <div>
                      <span style={{ fontSize: '14px', fontWeight: 700, color: '#ffffff', display: 'block' }}>
                        {item.name}
                      </span>
                      <span style={{ fontSize: '11px', color: 'rgba(255, 255, 255, 0.6)' }}>
                        {item.isLeader ? 'Leading position' : `Position #${item.position}`}
                      </span>
                    </div>
                  </div>

                  <div style={{ textAlign: 'right' }}>
                    <span
                      style={{
                        fontSize: item.isLeader ? '16px' : '14px',
                        fontWeight: 900,
                        color: item.isLeader ? 'var(--brand-lime)' : '#ffffff',
                        display: 'block',
                      }}
                    >
                      {formatINR(item.amountMinor)}
                    </span>
                    <span style={{ fontSize: '10px', color: 'rgba(255, 255, 255, 0.5)' }}>
                      Qualifying
                    </span>
                  </div>
                </div>
              ))}
            </div>

            <p style={{ fontSize: '11px', color: 'rgba(255, 255, 255, 0.5)', marginTop: 'var(--space-4)', margin: 'var(--space-4) 0 0 0' }}>
              * Visibility reflects paid competitive position and does not certify business quality.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};
