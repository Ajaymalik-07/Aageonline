import React from 'react';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  elevation?: 1 | 2 | 3 | 4;
  isInteractive?: boolean;
}

export const Card: React.FC<CardProps> = ({
  children,
  elevation = 2,
  isInteractive = false,
  className = '',
  style,
  ...props
}) => {
  const baseStyles: React.CSSProperties = {
    backgroundColor: 'var(--surface-card)',
    borderRadius: 'var(--radius-lg)',
    border: '1px solid var(--border-subtle)',
    boxShadow: `var(--elevation-${elevation})`,
    padding: 'var(--space-5)',
    transition: 'all var(--motion-normal)',
    cursor: isInteractive ? 'pointer' : 'default',
  };

  return (
    <div
      style={{
        ...baseStyles,
        ...style,
      }}
      className={`aage-card ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};
