import React from 'react';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'position-1' | 'position-top' | 'position-default' | 'verified' | 'sponsored' | 'neutral';
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'neutral',
  className = '',
  style,
  ...props
}) => {
  const baseStyles: React.CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '4px',
    padding: '4px 10px',
    borderRadius: 'var(--radius-pill)',
    fontSize: '12px',
    fontWeight: 600,
    lineHeight: '16px',
    whiteSpace: 'nowrap',
    letterSpacing: '0.02em',
  };

  const variantStyles: Record<string, React.CSSProperties> = {
    'position-1': {
      backgroundColor: 'var(--brand-lime)',
      color: 'var(--brand-deep-navy)',
      fontWeight: 800,
      border: '1px solid #a3c400',
    },
    'position-top': {
      backgroundColor: 'rgba(16, 185, 129, 0.15)',
      color: 'var(--brand-teal)',
      border: '1px solid rgba(16, 185, 129, 0.3)',
    },
    'position-default': {
      backgroundColor: 'rgba(100, 116, 139, 0.1)',
      color: 'var(--text-secondary)',
      border: '1px solid var(--border-subtle)',
    },
    verified: {
      backgroundColor: 'rgba(5, 150, 105, 0.12)',
      color: 'var(--brand-emerald)',
      border: '1px solid rgba(5, 150, 105, 0.25)',
    },
    sponsored: {
      backgroundColor: 'rgba(11, 31, 59, 0.08)',
      color: 'var(--text-secondary)',
      border: '1px solid var(--border-subtle)',
      fontSize: '11px',
      textTransform: 'uppercase',
    },
    neutral: {
      backgroundColor: 'var(--border-subtle)',
      color: 'var(--text-secondary)',
    },
  };

  return (
    <span
      style={{
        ...baseStyles,
        ...variantStyles[variant],
        ...style,
      }}
      className={`aage-badge ${className}`}
      {...props}
    >
      {variant === 'verified' && <span aria-hidden="true">✓</span>}
      {children}
    </span>
  );
};
