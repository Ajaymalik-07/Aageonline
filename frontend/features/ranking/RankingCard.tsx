'use client';

import React from 'react';
import type { RankingEntry } from '../../types/market';
import { PositionBadge } from './PositionBadge';
import { PositionMovement } from './PositionMovement';
import { CompetitiveGap } from './CompetitiveGap';
import { Badge } from '../../components/ui/Badge';
import { formatINR } from '../../lib/utils/format';

export interface RankingCardProps {
  entry: RankingEntry;
  onMoveUp?: (position: number) => void;
  isOwner?: boolean;
  gapMinor?: number;
  className?: string;
}

export const RankingCard: React.FC<RankingCardProps> = ({
  entry,
  onMoveUp,
  isOwner = false,
  gapMinor,
  className = '',
}) => {
  const isFirst = entry.position === 1;

  return (
    <article
      className={`aage-ranking-card ${className}`.trim()}
      style={{
        backgroundColor: 'var(--surface-card)',
        borderRadius: 'var(--radius-lg)',
        border: isFirst ? '1px solid rgba(199, 240, 0, 0.5)' : '1px solid var(--border-subtle)',
        padding: 'var(--space-4) var(--space-5)',
        display: 'flex',
        flexDirection: 'column',
        gap: 'var(--space-3)',
        boxShadow: isFirst ? 'var(--elevation-2), 0 4px 14px rgba(199, 240, 0, 0.12)' : 'var(--elevation-1)',
        position: 'relative',
        transition: 'transform var(--motion-fast), box-shadow var(--motion-fast)',
      }}
    >
      {/* Top Header: Badge, Name, Verification */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <PositionBadge position={entry.position} size="md" />
          <div>
            <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
              {entry.businessName}
            </h3>
            <PositionMovement
              isLeading={isFirst}
              direction={isFirst ? 'same' : 'up'}
              positions={isFirst ? 0 : 1}
            />
          </div>
        </div>

        {entry.isVerified && <Badge variant="verified">Verified</Badge>}
      </div>

      {/* Visibility Amount and Action */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingTop: 'var(--space-3)',
          borderTop: '1px solid var(--border-subtle)',
          flexWrap: 'wrap',
          gap: 'var(--space-2)',
        }}
      >
        <div>
          <span style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block' }}>
            Current Visibility
          </span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontSize: '16px', fontWeight: 800, color: isFirst ? 'var(--brand-emerald)' : 'var(--brand-deep-navy)' }}>
              {formatINR(entry.visibilityAmountMinor)}
            </span>
            {gapMinor !== undefined && gapMinor > 0 && (
              <CompetitiveGap differenceMinor={gapMinor} targetPosition={entry.position - 1} />
            )}
          </div>
        </div>

        {onMoveUp && (
          <button
            type="button"
            onClick={() => onMoveUp(entry.position)}
            style={{
              padding: '8px 18px',
              borderRadius: 'var(--radius-pill)',
              backgroundColor: isOwner ? 'var(--brand-deep-navy)' : 'var(--action-primary)',
              color: '#ffffff',
              border: 'none',
              fontSize: '13px',
              fontWeight: 700,
              cursor: 'pointer',
              minHeight: '44px',
              minWidth: '96px',
              boxShadow: 'var(--elevation-1)',
              transition: 'background-color var(--motion-fast)',
            }}
          >
            Move Up
          </button>
        )}
      </div>
    </article>
  );
};
