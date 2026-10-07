'use client';

import React from 'react';
import { formatINR } from '../../lib/utils/format';

export interface OutbidAlertProps {
  businessName: string;
  previousPosition: number;
  newPosition: number;
  displacingBusinessName: string;
  minimumRequiredAmountMinor: number;
  onTargetPosition?: (position: number) => void;
  className?: string;
}

export const OutbidAlert: React.FC<OutbidAlertProps> = ({
  previousPosition,
  newPosition,
  displacingBusinessName,
  minimumRequiredAmountMinor,
  onTargetPosition,
  className = '',
}) => {
  return (
    <div
      role="alert"
      className={`aage-outbid-alert ${className}`.trim()}
      style={{
        backgroundColor: 'var(--surface-card)',
        borderRadius: 'var(--radius-lg)',
        border: '1px solid var(--border-subtle)',
        borderLeft: '4px solid var(--brand-teal)',
        padding: 'var(--space-4) var(--space-6)',
        boxShadow: 'var(--elevation-2)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: 'var(--space-4)',
      }}
    >
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '2px' }}>
          <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--brand-emerald)', textTransform: 'uppercase' }}>
            Position Notice
          </span>
          <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>•</span>
          <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>
            Moved from #{previousPosition} to #{newPosition}
          </span>
        </div>
        <p style={{ fontSize: '14px', color: 'var(--text-secondary)', margin: 0 }}>
          <strong>{displacingBusinessName}</strong> qualified into position #{previousPosition}. Minimum to target #{previousPosition} is{' '}
          <strong>{formatINR(minimumRequiredAmountMinor)}</strong>.
        </p>
      </div>

      {onTargetPosition && (
        <button
          type="button"
          onClick={() => onTargetPosition(previousPosition)}
          style={{
            padding: '8px 18px',
            borderRadius: 'var(--radius-pill)',
            backgroundColor: 'var(--brand-deep-navy)',
            color: '#ffffff',
            fontSize: '13px',
            fontWeight: 700,
            border: 'none',
            cursor: 'pointer',
            minHeight: '44px',
            boxShadow: 'var(--elevation-1)',
          }}
        >
          Target #{previousPosition}
        </button>
      )}
    </div>
  );
};
