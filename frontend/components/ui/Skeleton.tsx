import React from 'react';

export interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  width?: string | number;
  height?: string | number;
  borderRadius?: string;
}

export const Skeleton: React.FC<SkeletonProps> = ({
  width = '100%',
  height = '20px',
  borderRadius = 'var(--radius-sm)',
  className = '',
  style,
  ...props
}) => {
  return (
    <div
      style={{
        width,
        height,
        borderRadius,
        backgroundColor: 'var(--border-subtle)',
        opacity: 0.7,
        animation: 'skeleton-pulse 1.5s ease-in-out infinite',
        ...style,
      }}
      className={`aage-skeleton ${className}`}
      aria-hidden="true"
      {...props}
    />
  );
};
