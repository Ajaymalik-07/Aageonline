import React from 'react';
import Link from 'next/link';

export interface BreadcrumbItem {
  label: string;
  href?: string;
  isCurrent?: boolean;
}

export interface BreadcrumbsProps {
  items: BreadcrumbItem[];
  className?: string;
  style?: React.CSSProperties;
}

export const Breadcrumbs: React.FC<BreadcrumbsProps> = ({
  items,
  className = '',
  style,
}) => {
  return (
    <nav
      aria-label="Breadcrumb"
      style={{
        padding: 'var(--space-4) 0',
        ...style,
      }}
      className={`aage-breadcrumbs ${className}`.trim()}
    >
      <div className="container">
        <ol
          style={{
            display: 'flex',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: 'var(--space-2)',
            listStyle: 'none',
            margin: 0,
            padding: 0,
            fontSize: 'var(--font-size-meta)',
            color: 'var(--text-secondary)',
          }}
        >
          {items.map((item, index) => {
            const isLast = index === items.length - 1 || item.isCurrent;

            return (
              <React.Fragment key={index}>
                {index > 0 && (
                  <li
                    aria-hidden="true"
                    style={{
                      color: 'var(--border-strong)',
                      userSelect: 'none',
                      padding: '0 2px',
                    }}
                  >
                    /
                  </li>
                )}
                <li>
                  {isLast || !item.href ? (
                    <span
                      style={{
                        color: 'var(--text-primary)',
                        fontWeight: 700,
                      }}
                      aria-current="page"
                    >
                      {item.label}
                    </span>
                  ) : (
                    <Link
                      href={item.href}
                      style={{
                        color: 'var(--text-secondary)',
                        textDecoration: 'none',
                        fontWeight: 500,
                        transition: 'color var(--motion-fast)',
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--action-primary)')}
                      onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-secondary)')}
                    >
                      {item.label}
                    </Link>
                  )}
                </li>
              </React.Fragment>
            );
          })}
        </ol>
      </div>
    </nav>
  );
};
