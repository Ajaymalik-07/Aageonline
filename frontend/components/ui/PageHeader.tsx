import React from 'react';

export interface PageHeaderProps {
  eyebrow?: string;
  eyebrowBadge?: React.ReactNode;
  title: string | React.ReactNode;
  description?: string | React.ReactNode;
  actions?: React.ReactNode;
  align?: 'left' | 'center';
  maxWidth?: string;
  className?: string;
  style?: React.CSSProperties;
}

export const PageHeader: React.FC<PageHeaderProps> = ({
  eyebrow,
  eyebrowBadge,
  title,
  description,
  actions,
  align = 'left',
  maxWidth = '780px',
  className = '',
  style,
}) => {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: align === 'center' ? 'center' : 'flex-start',
        textAlign: align,
        maxWidth: align === 'center' ? maxWidth : undefined,
        margin: align === 'center' ? '0 auto var(--space-8) auto' : '0 0 var(--space-8) 0',
        ...style,
      }}
      className={`aage-page-header ${className}`.trim()}
    >
      {(eyebrow || eyebrowBadge) && (
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 'var(--space-2)',
            marginBottom: 'var(--space-3)',
          }}
        >
          {eyebrow && (
            <span
              style={{
                fontSize: 'var(--font-size-xs)',
                fontWeight: 800,
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                color: 'var(--action-primary)',
              }}
            >
              {eyebrow}
            </span>
          )}
          {eyebrowBadge}
        </div>
      )}

      <h1
        style={{
          fontSize: 'var(--font-size-section)',
          fontWeight: 900,
          color: 'var(--text-primary)',
          letterSpacing: '-0.025em',
          lineHeight: 'var(--line-height-tight)',
          margin: '0 0 var(--space-3) 0',
        }}
      >
        {title}
      </h1>

      {description && (
        <p
          style={{
            fontSize: 'var(--font-size-body)',
            color: 'var(--text-secondary)',
            lineHeight: 'var(--line-height-relaxed)',
            maxWidth,
            margin: '0 0 (actions ? var(--space-6) : 0) 0',
          }}
        >
          {description}
        </p>
      )}

      {actions && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--space-3)',
            flexWrap: 'wrap',
            marginTop: 'var(--space-4)',
          }}
        >
          {actions}
        </div>
      )}
    </div>
  );
};
