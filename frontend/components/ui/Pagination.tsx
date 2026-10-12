import React from 'react';

export interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  className?: string;
  style?: React.CSSProperties;
}

export const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  totalPages,
  onPageChange,
  className = '',
  style,
}) => {
  if (totalPages <= 1) return null;

  return (
    <nav
      aria-label="Pagination"
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 'var(--space-2)',
        marginTop: 'var(--space-8)',
        ...style,
      }}
      className={`aage-pagination ${className}`.trim()}
    >
      <button
        type="button"
        disabled={currentPage <= 1}
        onClick={() => onPageChange(currentPage - 1)}
        aria-label="Previous page"
        style={{
          minHeight: '36px',
          padding: '6px 14px',
          borderRadius: 'var(--radius-sm)',
          border: '1px solid var(--border-strong)',
          backgroundColor: 'var(--surface-card)',
          color: currentPage <= 1 ? 'var(--text-muted)' : 'var(--text-primary)',
          cursor: currentPage <= 1 ? 'not-allowed' : 'pointer',
          fontSize: 'var(--font-size-sm)',
          fontWeight: 600,
        }}
      >
        ← Previous
      </button>

      <span
        style={{
          fontSize: 'var(--font-size-sm)',
          color: 'var(--text-secondary)',
          padding: '0 var(--space-2)',
        }}
      >
        Page <strong style={{ color: 'var(--text-primary)' }}>{currentPage}</strong> of{' '}
        <strong style={{ color: 'var(--text-primary)' }}>{totalPages}</strong>
      </span>

      <button
        type="button"
        disabled={currentPage >= totalPages}
        onClick={() => onPageChange(currentPage + 1)}
        aria-label="Next page"
        style={{
          minHeight: '36px',
          padding: '6px 14px',
          borderRadius: 'var(--radius-sm)',
          border: '1px solid var(--border-strong)',
          backgroundColor: 'var(--surface-card)',
          color: currentPage >= totalPages ? 'var(--text-muted)' : 'var(--text-primary)',
          cursor: currentPage >= totalPages ? 'not-allowed' : 'pointer',
          fontSize: 'var(--font-size-sm)',
          fontWeight: 600,
        }}
      >
        Next →
      </button>
    </nav>
  );
};
