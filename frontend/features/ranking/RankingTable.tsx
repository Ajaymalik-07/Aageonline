'use client';

import React from 'react';
import type { RankingEntry } from '../../types/market';
import { RankingCard } from './RankingCard';
import { PositionBadge } from './PositionBadge';
import { PositionMovement } from './PositionMovement';
import { CompetitiveGap } from './CompetitiveGap';
import { Badge } from '../../components/ui/Badge';
import { formatINR } from '../../lib/utils/format';

export interface RankingTableProps {
  rankings: RankingEntry[];
  onMoveUp?: (position: number) => void;
  userBusinessId?: string;
}

export const RankingTable: React.FC<RankingTableProps> = ({
  rankings,
  onMoveUp,
  userBusinessId,
}) => {
  return (
    <div className="aage-ranking-container" style={{ width: '100%' }}>
      {/* Mobile-first card list (visible on screens < 768px via CSS) */}
      <div
        className="aage-ranking-cards-mobile"
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 'var(--space-3)',
        }}
      >
        {rankings.map((entry, idx) => {
          const nextEntry = rankings[idx - 1];
          const gapMinor = nextEntry ? nextEntry.visibilityAmountMinor - entry.visibilityAmountMinor : undefined;

          return (
            <RankingCard
              key={entry.businessId}
              entry={entry}
              onMoveUp={onMoveUp}
              isOwner={userBusinessId === entry.businessId}
              gapMinor={gapMinor}
            />
          );
        })}
      </div>

      {/* Desktop Table (hidden on mobile, enhanced layout on 768px+) */}
      <div
        className="aage-ranking-table-desktop"
        style={{
          width: '100%',
          overflowX: 'auto',
          backgroundColor: 'var(--surface-card)',
          borderRadius: 'var(--radius-xl)',
          border: '1px solid var(--border-subtle)',
          boxShadow: 'var(--elevation-2)',
        }}
      >
        <table
          style={{
            width: '100%',
            borderCollapse: 'collapse',
            textAlign: 'left',
          }}
        >
          <thead>
            <tr
              style={{
                borderBottom: '2px solid var(--border-subtle)',
                backgroundColor: 'rgba(11, 31, 59, 0.02)',
              }}
            >
              <th style={{ padding: '16px 20px', fontSize: '12px', fontWeight: 800, color: 'var(--text-secondary)', letterSpacing: '0.04em' }}>
                POSITION
              </th>
              <th style={{ padding: '16px 20px', fontSize: '12px', fontWeight: 800, color: 'var(--text-secondary)', letterSpacing: '0.04em' }}>
                BUSINESS
              </th>
              <th style={{ padding: '16px 20px', fontSize: '12px', fontWeight: 800, color: 'var(--text-secondary)', letterSpacing: '0.04em' }}>
                STATUS
              </th>
              <th style={{ padding: '16px 20px', fontSize: '12px', fontWeight: 800, color: 'var(--text-secondary)', letterSpacing: '0.04em' }}>
                QUALIFYING VISIBILITY
              </th>
              <th style={{ padding: '16px 20px', fontSize: '12px', fontWeight: 800, color: 'var(--text-secondary)', textAlign: 'right', letterSpacing: '0.04em' }}>
                ACTION
              </th>
            </tr>
          </thead>
          <tbody>
            {rankings.map((entry, idx) => {
              const isOwner = userBusinessId === entry.businessId;
              const isFirst = entry.position === 1;
              const nextEntry = rankings[idx - 1];
              const gapMinor = nextEntry ? nextEntry.visibilityAmountMinor - entry.visibilityAmountMinor : undefined;

              return (
                <tr
                  key={entry.businessId}
                  style={{
                    borderBottom: '1px solid var(--border-subtle)',
                    backgroundColor: isFirst ? 'rgba(199, 240, 0, 0.03)' : 'transparent',
                    transition: 'background-color var(--motion-fast)',
                  }}
                >
                  <td style={{ padding: '16px 20px' }}>
                    <PositionBadge position={entry.position} size="md" />
                  </td>

                  <td style={{ padding: '16px 20px' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                      <span style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)' }}>
                        {entry.businessName}
                      </span>
                      <PositionMovement
                        isLeading={isFirst}
                        direction={isFirst ? 'same' : 'up'}
                        positions={isFirst ? 0 : 1}
                      />
                    </div>
                  </td>

                  <td style={{ padding: '16px 20px' }}>
                    {entry.isVerified ? (
                      <Badge variant="verified">Verified</Badge>
                    ) : (
                      <Badge variant="neutral">Registered</Badge>
                    )}
                  </td>

                  <td style={{ padding: '16px 20px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '16px', fontWeight: 800, color: isFirst ? 'var(--brand-emerald)' : 'var(--brand-deep-navy)' }}>
                        {formatINR(entry.visibilityAmountMinor)}
                      </span>
                      {gapMinor !== undefined && gapMinor > 0 && (
                        <CompetitiveGap differenceMinor={gapMinor} targetPosition={entry.position - 1} />
                      )}
                    </div>
                  </td>

                  <td style={{ padding: '16px 20px', textAlign: 'right' }}>
                    {onMoveUp && (
                      <button
                        type="button"
                        onClick={() => onMoveUp(entry.position)}
                        style={{
                          padding: '8px 20px',
                          borderRadius: 'var(--radius-pill)',
                          backgroundColor: isOwner ? 'var(--brand-deep-navy)' : 'var(--action-primary)',
                          color: '#ffffff',
                          border: 'none',
                          fontSize: '13px',
                          fontWeight: 700,
                          cursor: 'pointer',
                          minHeight: '44px',
                          boxShadow: 'var(--elevation-1)',
                          transition: 'background-color var(--motion-fast)',
                        }}
                      >
                        Move Up
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <style>{`
        @media (min-width: 768px) {
          .aage-ranking-cards-mobile {
            display: none !important;
          }
          .aage-ranking-table-desktop {
            display: block !important;
          }
        }
        @media (max-width: 767px) {
          .aage-ranking-cards-mobile {
            display: flex !important;
          }
          .aage-ranking-table-desktop {
            display: none !important;
          }
        }
      `}</style>
    </div>
  );
};
