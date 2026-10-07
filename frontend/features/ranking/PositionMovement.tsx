import React from 'react';

export interface PositionMovementProps {
  direction?: 'up' | 'down' | 'same' | 'new';
  positions?: number;
  isLeading?: boolean;
  className?: string;
}

export const PositionMovement: React.FC<PositionMovementProps> = ({
  direction = 'same',
  positions = 0,
  isLeading = false,
  className = '',
}) => {
  if (isLeading) {
    return (
      <span
        className={`position-movement leading ${className}`.trim()}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '4px',
          fontSize: '12px',
          fontWeight: 700,
          color: 'var(--brand-emerald)',
          letterSpacing: '0.02em',
        }}
        aria-label="Leading qualifying position"
      >
        <span aria-hidden="true" style={{ color: 'var(--brand-lime)', fontSize: '14px' }}>●</span>
        Leading qualifying position
      </span>
    );
  }

  if (direction === 'up' && positions > 0) {
    return (
      <span
        className={`position-movement up ${className}`.trim()}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '3px',
          fontSize: '12px',
          fontWeight: 700,
          color: 'var(--brand-emerald)',
          backgroundColor: 'rgba(16, 185, 129, 0.1)',
          padding: '2px 8px',
          borderRadius: 'var(--radius-pill)',
        }}
        aria-label={`Moved up ${positions} position${positions > 1 ? 's' : ''}`}
      >
        <span aria-hidden="true">↑</span>
        <span>{positions} {positions === 1 ? 'position' : 'positions'}</span>
      </span>
    );
  }

  if (direction === 'down' && positions > 0) {
    return (
      <span
        className={`position-movement down ${className}`.trim()}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '3px',
          fontSize: '12px',
          fontWeight: 600,
          color: 'var(--text-secondary)',
          backgroundColor: 'var(--border-subtle)',
          padding: '2px 8px',
          borderRadius: 'var(--radius-pill)',
        }}
        aria-label={`Moved down ${positions} position${positions > 1 ? 's' : ''}`}
      >
        <span aria-hidden="true">↓</span>
        <span>{positions} {positions === 1 ? 'position' : 'positions'}</span>
      </span>
    );
  }

  if (direction === 'new') {
    return (
      <span
        className={`position-movement new ${className}`.trim()}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '3px',
          fontSize: '12px',
          fontWeight: 700,
          color: 'var(--brand-teal)',
          backgroundColor: 'rgba(16, 185, 129, 0.1)',
          padding: '2px 8px',
          borderRadius: 'var(--radius-pill)',
        }}
        aria-label="Newly entered ranking"
      >
        <span aria-hidden="true">★</span>
        <span>Entered ranking</span>
      </span>
    );
  }

  return (
    <span
      className={`position-movement steady ${className}`.trim()}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '4px',
        fontSize: '12px',
        color: 'var(--text-muted)',
      }}
      aria-label="Position steady"
    >
      <span aria-hidden="true">-</span>
      <span>Steady</span>
    </span>
  );
};
