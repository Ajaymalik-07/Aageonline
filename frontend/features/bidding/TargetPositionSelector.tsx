'use client';

import React from 'react';
import type { RankingEntry } from '../../types/market';
import { PositionBadge } from '../ranking/PositionBadge';
import { formatINR } from '../../lib/utils/format';
import { calculateMinimumTargetAmount } from '../../lib/bidding/rules';

export interface TargetPositionSelectorProps {
  currentRankings: RankingEntry[];
  currentPosition?: number;
  selectedTarget: number | null;
  onSelectTarget: (position: number) => void;
  className?: string;
}

export const TargetPositionSelector: React.FC<TargetPositionSelectorProps> = ({
  currentRankings,
  currentPosition,
  selectedTarget,
  onSelectTarget,
  className = '',
}) => {
  const targetSlots = [1, 2, 3, 4, 5];

  return (
    <div
      className={`aage-target-position-selector ${className}`.trim()}
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 'var(--space-3)',
        width: '100%',
      }}
    >
      <div style={{ marginBottom: 'var(--space-1)' }}>
        <h3 style={{ fontSize: '16px', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
          Select Target Visibility Position
        </h3>
        <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: '2px 0 0 0' }}>
          Qualifying bid must strictly exceed the incumbent's qualifying amount.
        </p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {targetSlots.map((pos) => {
          const occupyingEntry = currentRankings.find((r) => r.position === pos);
          const currentOccupantAmount = occupyingEntry ? occupyingEntry.visibilityAmountMinor : 0;
          const minimumRequiredMinor = calculateMinimumTargetAmount(currentOccupantAmount);
          const isSelected = selectedTarget === pos;
          const isCurrent = currentPosition === pos;

          return (
            <button
              key={pos}
              type="button"
              disabled={isCurrent}
              onClick={() => onSelectTarget(pos)}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: 'var(--space-3) var(--space-4)',
                borderRadius: 'var(--radius-lg)',
                backgroundColor: isSelected
                  ? 'rgba(16, 185, 129, 0.08)'
                  : 'var(--surface-card)',
                border: `2px solid ${
                  isSelected
                    ? 'var(--brand-teal)'
                    : isCurrent
                    ? 'var(--border-subtle)'
                    : 'var(--border-strong)'
                }`,
                cursor: isCurrent ? 'not-allowed' : 'pointer',
                opacity: isCurrent ? 0.6 : 1,
                transition: 'all var(--motion-fast)',
                minHeight: '44px',
                textAlign: 'left',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <PositionBadge position={pos} size="sm" />

                <div>
                  <span style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)', display: 'block' }}>
                    {isCurrent
                      ? 'Your Current Position'
                      : occupyingEntry
                      ? `Occupied by ${occupyingEntry.businessName}`
                      : 'Position Open'}
                  </span>
                  {!isCurrent && (
                    <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                      Current qualifying: {formatINR(currentOccupantAmount)}
                    </span>
                  )}
                </div>
              </div>

              <div style={{ textAlign: 'right' }}>
                <span style={{ fontSize: '10px', color: 'var(--text-muted)', display: 'block', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Min to qualify
                </span>
                <span style={{ fontSize: '15px', fontWeight: 800, color: 'var(--brand-deep-navy)' }}>
                  {formatINR(minimumRequiredMinor)}
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
