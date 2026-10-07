import React from 'react';
import { formatINR } from '../../lib/utils/format';

export interface CompetitiveGapProps {
  differenceMinor: number;
  targetPosition?: number;
  className?: string;
}

export const CompetitiveGap: React.FC<CompetitiveGapProps> = ({
  differenceMinor,
  targetPosition,
  className = '',
}) => {
  if (differenceMinor <= 0) return null;

  return (
    <span
      className={`competitive-gap ${className}`.trim()}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '4px',
        fontSize: '11px',
        fontWeight: 600,
        color: 'var(--text-secondary)',
        backgroundColor: 'var(--bg-page)',
        padding: '2px 8px',
        borderRadius: 'var(--radius-sm)',
        border: '1px solid var(--border-subtle)',
      }}
      title={`Competitive gap of ${formatINR(differenceMinor)}`}
    >
      <span style={{ color: 'var(--brand-emerald)', fontWeight: 700 }}>+</span>
      <span>{formatINR(differenceMinor)}</span>
      {targetPosition ? <span>to #{targetPosition}</span> : <span>gap</span>}
    </span>
  );
};
