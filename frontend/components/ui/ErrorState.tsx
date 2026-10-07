'use client';

import React from 'react';

export interface ErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
}

export const ErrorState: React.FC<ErrorStateProps> = ({
  title = 'Information Temporarily Unavailable',
  message = 'We could not refresh this section right now. Your existing content remains viewable.',
  onRetry,
}) => {
  return (
    <div
      role="alert"
      style={{
        padding: 'var(--space-6)',
        borderRadius: 'var(--radius-md)',
        backgroundColor: 'rgba(239, 68, 68, 0.06)',
        border: '1px solid rgba(239, 68, 68, 0.25)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-start',
        gap: 'var(--space-3)',
        margin: 'var(--space-4) 0',
      }}
      className="aage-error-state"
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <span style={{ color: 'var(--color-danger)', fontWeight: 800, fontSize: '18px' }} aria-hidden="true">
          ⚠
        </span>
        <h4 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)' }}>
          {title}
        </h4>
      </div>
      <p style={{ fontSize: '14px', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
        {message}
      </p>
      {onRetry && (
        <button
          onClick={onRetry}
          style={{
            marginTop: 'var(--space-2)',
            padding: '8px 16px',
            borderRadius: 'var(--radius-pill)',
            backgroundColor: 'transparent',
            border: '1px solid var(--border-strong)',
            color: 'var(--text-primary)',
            fontSize: '13px',
            fontWeight: 600,
            cursor: 'pointer',
            minHeight: '44px',
          }}
        >
          ↻ Try Again
        </button>
      )}
    </div>
  );
};
