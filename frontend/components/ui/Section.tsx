import React from 'react';

export interface SectionProps extends React.HTMLAttributes<HTMLElement> {
  variant?: 'default' | 'soft' | 'dark' | 'neutral' | 'card';
  compact?: boolean;
  hasContainer?: boolean;
  containerClassName?: string;
  containerStyle?: React.CSSProperties;
}

export const Section: React.FC<SectionProps> = ({
  children,
  variant = 'default',
  compact = false,
  hasContainer = true,
  containerClassName = '',
  containerStyle,
  style,
  className = '',
  ...props
}) => {
  const getVariantStyles = (): React.CSSProperties => {
    switch (variant) {
      case 'soft':
        return {
          backgroundColor: 'var(--surface-soft)',
          borderTop: '1px solid var(--border-subtle)',
          borderBottom: '1px solid var(--border-subtle)',
        };
      case 'dark':
        return {
          backgroundColor: 'var(--brand-navy-deep)',
          color: '#ffffff',
          borderTop: '1px solid rgba(255, 255, 255, 0.08)',
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
        };
      case 'neutral':
        return {
          backgroundColor: '#F8FAFC',
          borderTop: '1px solid var(--border-subtle)',
          borderBottom: '1px solid var(--border-subtle)',
        };
      case 'card':
        return {
          backgroundColor: 'var(--surface-card)',
          borderTop: '1px solid var(--border-subtle)',
          borderBottom: '1px solid var(--border-subtle)',
        };
      case 'default':
      default:
        return {
          backgroundColor: 'var(--bg-page)',
        };
    }
  };

  const paddingY = compact ? 'var(--section-padding-y-compact)' : 'var(--section-padding-y)';

  return (
    <section
      style={{
        padding: `${paddingY} 0`,
        position: 'relative',
        ...getVariantStyles(),
        ...style,
      }}
      className={`aage-section ${className}`.trim()}
      {...props}
    >
      {hasContainer ? (
        <div className={`container ${containerClassName}`.trim()} style={containerStyle}>
          {children}
        </div>
      ) : (
        children
      )}
    </section>
  );
};
