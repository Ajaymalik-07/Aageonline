import React from 'react';

export interface PositionBadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  position: number;
  size?: 'sm' | 'md' | 'lg';
}

export const PositionBadge: React.FC<PositionBadgeProps> = ({
  position,
  size = 'md',
  style,
  className = '',
  ...props
}) => {
  const isFirst = position === 1;
  const isSecond = position === 2;
  const isThird = position === 3;
  const isTopTen = position <= 10;

  const sizeStyles: Record<string, React.CSSProperties> = {
    sm: { fontSize: '11px', padding: '2px 8px', height: '22px' },
    md: { fontSize: '13px', padding: '4px 12px', height: '28px' },
    lg: { fontSize: '16px', padding: '6px 16px', height: '36px', fontWeight: 900 },
  };

  const getVariantStyles = (): React.CSSProperties => {
    if (isFirst) {
      return {
        background: 'linear-gradient(135deg, var(--brand-lime) 0%, #b3dc00 100%)',
        color: 'var(--brand-deep-navy)',
        fontWeight: 900,
        boxShadow: '0 2px 8px rgba(199, 240, 0, 0.45)',
        border: '1px solid #d4ff1a',
      };
    }
    if (isSecond) {
      return {
        background: 'linear-gradient(135deg, #e2e8f0 0%, #cbd5e1 100%)',
        color: '#0f172a',
        fontWeight: 800,
        boxShadow: '0 2px 6px rgba(15, 23, 42, 0.1)',
        border: '1px solid #94a3b8',
      };
    }
    if (isThird) {
      return {
        background: 'linear-gradient(135deg, #fed7aa 0%, #fdba74 100%)',
        color: '#7c2d12',
        fontWeight: 800,
        boxShadow: '0 2px 6px rgba(194, 65, 12, 0.15)',
        border: '1px solid #fb923c',
      };
    }
    if (isTopTen) {
      return {
        backgroundColor: 'rgba(16, 185, 129, 0.12)',
        color: 'var(--brand-emerald)',
        fontWeight: 700,
        border: '1px solid rgba(16, 185, 129, 0.3)',
      };
    }
    return {
      backgroundColor: 'var(--border-subtle)',
      color: 'var(--text-secondary)',
      fontWeight: 600,
      border: '1px solid var(--border-subtle)',
    };
  };

  return (
    <span
      className={`position-badge ${className}`.trim()}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 'var(--radius-pill)',
        letterSpacing: '-0.02em',
        userSelect: 'none',
        ...sizeStyles[size],
        ...getVariantStyles(),
        ...style,
      }}
      aria-label={`Position rank number ${position}`}
      {...props}
    >
      #{position}
    </span>
  );
};
