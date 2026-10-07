import React from 'react';
import type { PositionHistoryRecord } from '../../types/business';
import { PositionBadge } from './PositionBadge';
import { formatINR, formatRelativeTime } from '../../lib/utils/format';

export interface PositionHistoryProps {
  history: PositionHistoryRecord[];
  className?: string;
}

export const PositionHistory: React.FC<PositionHistoryProps> = ({
  history,
  className = '',
}) => {
  if (!history || history.length === 0) {
    return (
      <div style={{ padding: 'var(--space-6)', textAlign: 'center', color: 'var(--text-muted)' }}>
        No prior position changes recorded yet.
      </div>
    );
  }

  return (
    <div
      className={`aage-position-history ${className}`.trim()}
      style={{
        backgroundColor: 'var(--surface-card)',
        borderRadius: 'var(--radius-xl)',
        padding: 'var(--space-6)',
        border: '1px solid var(--border-subtle)',
        boxShadow: 'var(--elevation-1)',
      }}
    >
      <div style={{ marginBottom: 'var(--space-5)' }}>
        <h3 style={{ fontSize: '16px', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
          Auditable Position History
        </h3>
        <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: '2px 0 0 0' }}>
          Append-only record of verified visibility ladder transitions.
        </p>
      </div>

      {/* Visual Timeline Stepper */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 'var(--space-3)',
          overflowX: 'auto',
          paddingBottom: 'var(--space-4)',
        }}
      >
        {history.map((record, idx) => {
          const isLatest = idx === history.length - 1;
          const movedUp = record.previousPosition && record.newPosition < record.previousPosition;

          return (
            <React.Fragment key={record.id}>
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  minWidth: '100px',
                  textAlign: 'center',
                }}
              >
                <PositionBadge position={record.newPosition} size={isLatest ? 'md' : 'sm'} />

                <span
                  style={{
                    fontSize: '11px',
                    fontWeight: 700,
                    color: movedUp ? 'var(--brand-emerald)' : 'var(--text-secondary)',
                    marginTop: '4px',
                  }}
                >
                  {movedUp ? `↑ Gained ${record.previousPosition! - record.newPosition}` : record.cause}
                </span>

                {record.amountMinor !== undefined && (
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>
                    {formatINR(record.amountMinor)}
                  </span>
                )}

                <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
                  {formatRelativeTime(record.timestamp)}
                </span>
              </div>

              {idx < history.length - 1 && (
                <div
                  style={{
                    flex: '1',
                    minWidth: '24px',
                    height: '2px',
                    backgroundColor: 'var(--border-subtle)',
                    marginBottom: '28px',
                  }}
                  aria-hidden="true"
                />
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
};
