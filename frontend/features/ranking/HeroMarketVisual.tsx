'use client';

import React, { useState } from 'react';
import { PositionBadge } from './PositionBadge';
import { PositionMovement } from './PositionMovement';
import { formatINR } from '../../lib/utils/format';

interface SimulatedEntry {
  id: string;
  name: string;
  position: number;
  amountMinor: number;
  movement?: 'up' | 'down' | 'same';
  movementCount?: number;
}

const INITIAL_SIMULATION: SimulatedEntry[] = [
  { id: '1', name: 'ABC Interiors', position: 1, amountMinor: 2600000, movement: 'same' },
  { id: '2', name: 'Studio XYZ', position: 2, amountMinor: 2450000, movement: 'same' },
  { id: '3', name: 'Design House', position: 3, amountMinor: 2200000, movement: 'same' },
  { id: '4', name: 'Urban Interiors', position: 4, amountMinor: 2050000, movement: 'same' },
  { id: '5', name: 'SpaceCraft Studio', position: 5, amountMinor: 1900000, movement: 'same' },
];

export const HeroMarketVisual: React.FC = () => {
  const [entries, setEntries] = useState<SimulatedEntry[]>(INITIAL_SIMULATION);
  const [animatingId, setAnimatingId] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string>(
    'Interactive Demonstration — Click any business to simulate rank movement'
  );

  // Simulates a legitimate competitive upward qualification (+₹1,000 / strictly greater)
  const handleSimulateMoveUp = (targetIndex: number) => {
    if (targetIndex === 0) return; // Already #1

    const candidate = entries[targetIndex];
    const incumbent = entries[targetIndex - 1];

    setAnimatingId(candidate.id);
    const newQualifyingAmount = incumbent.amountMinor + 100000; // +₹1,000 strictly greater

    setStatusMessage(`${candidate.name} qualifies with ${formatINR(newQualifyingAmount)} to move to #${incumbent.position}`);

    setTimeout(() => {
      const updated = [...entries];
      // Swap with updated attributes
      updated[targetIndex] = {
        ...incumbent,
        position: candidate.position,
        movement: 'down',
        movementCount: 1,
      };
      updated[targetIndex - 1] = {
        ...candidate,
        position: incumbent.position,
        amountMinor: newQualifyingAmount,
        movement: 'up',
        movementCount: 1,
      };

      setEntries(updated);
      setAnimatingId(null);
    }, 400);
  };

  const handleReset = () => {
    setEntries(INITIAL_SIMULATION);
    setStatusMessage('Interactive Demonstration — Click any business to simulate rank movement');
  };

  return (
    <div className="perspective-stage" style={{ width: '100%', maxWidth: '520px', margin: '0 auto' }}>
      <div
        className="perspective-tilt bg-ambient-market"
        style={{
          backgroundColor: 'var(--surface-card)',
          borderRadius: 'var(--radius-xl)',
          padding: 'var(--space-6)',
          border: '1px solid var(--border-subtle)',
          boxShadow: 'var(--elevation-4), 0 20px 40px -15px rgba(6, 78, 59, 0.2)',
          position: 'relative',
        }}
      >
        {/* Market Context Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingBottom: 'var(--space-4)',
            marginBottom: 'var(--space-4)',
            borderBottom: '1px solid var(--border-subtle)',
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span className="live-indicator-dot" style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: 'var(--brand-teal)' }} />
              <span style={{ fontSize: '11px', fontWeight: 800, letterSpacing: '0.06em', color: 'var(--brand-emerald)', textTransform: 'uppercase' }}>
                LIVE MARKET LADDER
              </span>
            </div>
            <h3 style={{ fontSize: '18px', fontWeight: 900, color: 'var(--text-primary)', margin: '2px 0 0 0' }}>
              Jaipur · Interior Designers
            </h3>
          </div>

          <button
            type="button"
            onClick={handleReset}
            style={{
              fontSize: '11px',
              fontWeight: 600,
              color: 'var(--text-secondary)',
              backgroundColor: 'var(--bg-page)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-pill)',
              padding: '4px 10px',
              cursor: 'pointer',
            }}
          >
            Reset Demo
          </button>
        </div>

        {/* Competitive Ranking Stack */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
          {entries.map((entry, idx) => {
            const isTargeted = animatingId === entry.id;
            const isLeading = entry.position === 1;

            return (
              <div
                key={entry.id}
                onClick={() => handleSimulateMoveUp(idx)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') handleSimulateMoveUp(idx);
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '10px 14px',
                  backgroundColor: isTargeted
                    ? 'rgba(16, 185, 129, 0.15)'
                    : isLeading
                    ? 'rgba(199, 240, 0, 0.08)'
                    : 'var(--surface-card)',
                  borderRadius: 'var(--radius-md)',
                  border: isTargeted
                    ? '1px solid var(--brand-teal)'
                    : isLeading
                    ? '1px solid rgba(199, 240, 0, 0.5)'
                    : '1px solid var(--border-subtle)',
                  boxShadow: isLeading ? '0 4px 12px rgba(11, 31, 59, 0.08)' : 'none',
                  cursor: idx > 0 ? 'pointer' : 'default',
                  transition: 'all 280ms cubic-bezier(0.16, 1, 0.3, 1)',
                  transform: isTargeted ? 'scale(1.02)' : 'none',
                }}
                title={idx > 0 ? `Click to simulate ${entry.name} moving up` : 'Currently leading'}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <PositionBadge position={entry.position} size="sm" />
                  <div>
                    <span style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)', display: 'block' }}>
                      {entry.name}
                    </span>
                    <PositionMovement
                      direction={entry.movement}
                      positions={entry.movementCount}
                      isLeading={isLeading}
                    />
                  </div>
                </div>

                <div style={{ textAlign: 'right' }}>
                  <span style={{ fontSize: '14px', fontWeight: 800, color: 'var(--brand-deep-navy)' }}>
                    {formatINR(entry.amountMinor)}
                  </span>
                  <span style={{ display: 'block', fontSize: '10px', color: 'var(--text-muted)' }}>
                    Qualifying amount
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Interactive Guidance Bar */}
        <div
          style={{
            marginTop: 'var(--space-4)',
            paddingTop: 'var(--space-3)',
            borderTop: '1px solid var(--border-subtle)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            fontSize: '11px',
            color: 'var(--text-secondary)',
          }}
        >
          <span style={{ fontStyle: 'italic' }}>{statusMessage}</span>
          <span style={{ fontWeight: 600, color: 'var(--brand-teal)' }}>New bid &gt; Current</span>
        </div>
      </div>
    </div>
  );
};
