import React from 'react';

export interface LoadingIndicatorProps {
  size?: 'sm' | 'md' | 'lg';
  label?: string;
  className?: string;
  style?: React.CSSProperties;
}

export const LoadingIndicator: React.FC<LoadingIndicatorProps> = ({
  size = 'md',
  label = 'Loading...',
  className = '',
  style,
}) => {
  const pixelSizes = {
    sm: 18,
    md: 28,
    lg: 44,
  };

  const px = pixelSizes[size];

  return (
    <div
      role="status"
      aria-label={label}
      style={{
        display: 'inline-flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 'var(--space-2)',
        ...style,
      }}
      className={`aage-loading ${className}`.trim()}
    >
      <div
        style={{
          width: `${px}px`,
          height: `${px}px`,
          borderRadius: '50%',
          border: '3px solid rgba(234, 88, 12, 0.2)',
          borderTopColor: 'var(--action-primary)',
          animation: 'spin 0.8s linear infinite',
        }}
      />
      {label && (
        <span
          style={{
            fontSize: 'var(--font-size-xs)',
            color: 'var(--text-secondary)',
            fontWeight: 500,
          }}
        >
          {label}
        </span>
      )}
    </div>
  );
};
