import React from 'react';

export interface AlertProps {
  variant?: 'info' | 'warning' | 'danger' | 'success';
  title?: string;
  children: React.ReactNode;
  icon?: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}

export const Alert: React.FC<AlertProps> = ({
  variant = 'info',
  title,
  children,
  icon,
  className = '',
  style,
}) => {
  const getVariantStyles = (): { bg: string; border: string; text: string; defaultIcon: string } => {
    switch (variant) {
      case 'warning':
        return {
          bg: '#FFFBEB',
          border: 'rgba(245, 158, 11, 0.35)',
          text: '#92400E',
          defaultIcon: '⚠️',
        };
      case 'danger':
        return {
          bg: '#FEF2F2',
          border: 'rgba(239, 68, 68, 0.35)',
          text: '#991B1B',
          defaultIcon: '🚫',
        };
      case 'success':
        return {
          bg: '#F0FDF4',
          border: 'rgba(22, 163, 74, 0.35)',
          text: '#166534',
          defaultIcon: '✓',
        };
      case 'info':
      default:
        return {
          bg: 'var(--surface-soft)',
          border: 'rgba(234, 88, 12, 0.25)',
          text: 'var(--text-primary)',
          defaultIcon: 'ℹ️',
        };
    }
  };

  const v = getVariantStyles();

  return (
    <div
      role={variant === 'danger' ? 'alert' : 'region'}
      aria-live={variant === 'danger' ? 'assertive' : 'polite'}
      style={{
        backgroundColor: v.bg,
        border: `1px solid ${v.border}`,
        borderRadius: 'var(--radius-md)',
        padding: 'var(--space-4) var(--space-5)',
        display: 'flex',
        alignItems: 'flex-start',
        gap: 'var(--space-3)',
        fontSize: 'var(--font-size-sm)',
        lineHeight: 'var(--line-height-normal)',
        color: v.text,
        ...style,
      }}
      className={`aage-alert ${className}`.trim()}
    >
      <span aria-hidden="true" style={{ fontSize: '18px', flexShrink: 0 }}>
        {icon || v.defaultIcon}
      </span>
      <div style={{ flex: 1 }}>
        {title && (
          <strong style={{ display: 'block', fontWeight: 700, marginBottom: '4px' }}>
            {title}
          </strong>
        )}
        <div>{children}</div>
      </div>
    </div>
  );
};
