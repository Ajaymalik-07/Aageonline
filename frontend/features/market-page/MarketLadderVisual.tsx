'use client';

import React, { useState } from 'react';
import type { MarketBusinessItem } from '../../data/markets/jaipur-interior-designers';
import { formatINR } from '../../lib/utils/format';

interface MarketLadderVisualProps {
  rankings: MarketBusinessItem[];
  locationName: string;
  categoryName: string;
}

export const MarketLadderVisual: React.FC<MarketLadderVisualProps> = ({
  rankings,
  locationName,
  categoryName,
}) => {
  // Illustrative Interactive Simulation state
  const topFive = rankings.slice(0, 5);
  const [ladder, setLadder] = useState<MarketBusinessItem[]>(topFive);
  const [simulationStep, setSimulationStep] = useState<number>(0);
  const [isSimulating, setIsSimulating] = useState<boolean>(false);

  const runSimulation = () => {
    if (isSimulating) return;
    setIsSimulating(true);

    if (simulationStep === 0) {
      // Step 1: #2 qualifies higher than #1 (strictly greater than current #1)
      const challengerAmount = (topFive[0]?.qualifyingAmountRupees || 25000) + 2000;
      const challenger = { ...ladder[1], qualifyingAmountRupees: challengerAmount };
      const currentOne = { ...ladder[0], rank: 2 };
      const newOne = { ...challenger, rank: 1 };
      const updated = [newOne, currentOne, ...ladder.slice(2)];
      setLadder(updated);
      setSimulationStep(1);
    } else {
      // Reset back to baseline
      setLadder(topFive);
      setSimulationStep(0);
    }

    setTimeout(() => {
      setIsSimulating(false);
    }, 600);
  };

  return (
    <section
      id="market-ladder"
      style={{
        backgroundColor: '#ffffff',
        borderBottom: '1px solid var(--border-subtle)',
        padding: 'clamp(40px, 6vw, 64px) 0',
      }}
    >
      <div className="container">
        {/* Section Header */}
        <div style={{ marginBottom: '28px' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
            <span
              style={{
                fontSize: '11px',
                fontWeight: 800,
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                color: '#EA580C',
              }}
            >
              VISUAL LADDER DYNAMICS
            </span>
            <span
              style={{
                fontSize: '10px',
                fontWeight: 800,
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                padding: '1px 8px',
                borderRadius: 'var(--radius-pill)',
                backgroundColor: 'rgba(234, 88, 12, 0.1)',
                color: '#EA580C',
                border: '1px solid rgba(234, 88, 12, 0.25)',
              }}
            >
              Interactive Example
            </span>
          </div>

          <h2
            style={{
              fontSize: 'clamp(26px, 3.5vw, 36px)',
              fontWeight: 900,
              color: 'var(--text-primary)',
              letterSpacing: '-0.02em',
              margin: '0 0 8px 0',
            }}
          >
            How the {locationName} Market Ladder Works
          </h2>

          <p style={{ fontSize: '15px', color: 'var(--text-secondary)', margin: 0, maxWidth: '680px' }}>
            Each position represents a discrete paid visibility tier. When an eligible business submits a verified qualifying payment strictly higher than the current floor, it claims that rank and existing holders slide down.
          </p>
        </div>

        {/* Visual Stepped Ladder Display */}
        <div
          style={{
            backgroundColor: 'var(--surface-raised)',
            borderRadius: 'var(--radius-lg)',
            border: '1px solid var(--border-subtle)',
            padding: 'clamp(20px, 3vw, 32px)',
            boxShadow: '0 4px 20px rgba(11, 31, 51, 0.04)',
          }}
        >
          {/* Simulation Trigger Bar */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '12px',
              paddingBottom: '20px',
              marginBottom: '20px',
              borderBottom: '1px solid var(--border-subtle)',
            }}
          >
            <div>
              <strong style={{ fontSize: '14px', color: 'var(--text-primary)', display: 'block' }}>
                Illustrative Ladder Progression (Top 5 Tiers)
              </strong>
              <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                Demonstrating server-recalculated position displacement with zero refunds.
              </span>
            </div>

            <button
              type="button"
              onClick={runSimulation}
              disabled={isSimulating}
              style={{
                padding: '8px 18px',
                borderRadius: 'var(--radius-pill)',
                backgroundColor: simulationStep === 0 ? 'rgba(234, 88, 12, 0.12)' : '#0B1F33',
                color: simulationStep === 0 ? '#EA580C' : '#ffffff',
                border: '1px solid rgba(234, 88, 12, 0.3)',
                fontWeight: 800,
                fontSize: '12px',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                transition: 'all var(--motion-fast)',
              }}
            >
              ⚡ {simulationStep === 0 ? 'Demonstrate Qualifying Payment (#2 → #1)' : 'Reset Ladder to Baseline'}
            </button>
          </div>

          {/* Stepped Visual Bars */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {ladder.map((item, idx) => {
              const rankNum = idx + 1;
              const isRank1 = rankNum === 1;
              const isRank2 = rankNum === 2;
              const isRank3 = rankNum === 3;

              const barWidth = `${100 - idx * 6}%`;

              return (
                <div
                  key={item.id}
                  style={{
                    width: barWidth,
                    minWidth: '280px',
                    backgroundColor: isRank1
                      ? 'rgba(234, 88, 12, 0.12)'
                      : isRank2
                      ? 'rgba(71, 85, 105, 0.08)'
                      : isRank3
                      ? 'rgba(217, 119, 6, 0.08)'
                      : '#ffffff',
                    border: isRank1
                      ? '2px solid #EA580C'
                      : isRank2
                      ? '1.5px solid #64748B'
                      : isRank3
                      ? '1.5px solid #D97706'
                      : '1px solid var(--border-subtle)',
                    borderRadius: 'var(--radius-md)',
                    padding: '12px 18px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    transition: 'all 450ms cubic-bezier(0.16, 1, 0.3, 1)',
                    boxShadow: isRank1 ? '0 4px 14px rgba(234, 88, 12, 0.15)' : 'none',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <span
                      style={{
                        fontSize: '12px',
                        fontWeight: 900,
                        padding: '4px 10px',
                        borderRadius: 'var(--radius-pill)',
                        backgroundColor: isRank1 ? '#EA580C' : isRank2 ? '#334155' : isRank3 ? '#B45309' : '#F1F5F9',
                        color: isRank1 || isRank2 || isRank3 ? '#ffffff' : '#64748B',
                      }}
                    >
                      #{rankNum}
                    </span>
                    <div>
                      <strong style={{ fontSize: '14px', color: 'var(--text-primary)', display: 'block' }}>
                        {item.name}
                      </strong>
                      <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                        📍 {item.area} · {categoryName}
                      </span>
                    </div>
                  </div>

                  <div style={{ textAlign: 'right' }}>
                    <span
                      style={{
                        fontSize: '15px',
                        fontWeight: 900,
                        color: isRank1 ? '#EA580C' : 'var(--text-primary)',
                      }}
                    >
                      {formatINR(item.qualifyingAmountRupees * 100)}
                    </span>
                    <span style={{ fontSize: '11px', color: '#16a34a', display: 'block', fontWeight: 700 }}>
                      ✓ Verified
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Core Rule Callout */}
          <div
            style={{
              marginTop: '20px',
              backgroundColor: '#ffffff',
              borderRadius: 'var(--radius-md)',
              padding: '14px 18px',
              border: '1px solid var(--border-subtle)',
              fontSize: '13px',
              color: 'var(--text-secondary)',
              lineHeight: 1.5,
            }}
          >
            <strong style={{ color: 'var(--text-primary)' }}>The Strict Superset Rule:</strong> A new qualifying amount must be strictly greater than the current qualifying floor it is intended to supersede. An equal or lower amount cannot displace an existing position holder.
          </div>
        </div>
      </div>
    </section>
  );
};
