'use client';

import React, { useEffect } from 'react';

export default function CategoriesError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Categories directory error boundary caught:', error);
  }, [error]);

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '60vh',
        padding: 'var(--space-12) var(--space-6)',
        backgroundColor: 'var(--bg-page)',
        textAlign: 'center',
      }}
      role="alert"
    >
      <div
        style={{
          width: '56px',
          height: '56px',
          borderRadius: '50%',
          backgroundColor: 'rgba(239, 68, 68, 0.1)',
          color: '#DC2626',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: 'var(--space-4)',
        }}
        aria-hidden="true"
      >
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="8" x2="12" y2="12" />
          <line x1="12" y1="16" x2="12.01" y2="16" />
        </svg>
      </div>

      <h1
        style={{
          fontSize: '24px',
          fontWeight: 800,
          color: 'var(--text-primary)',
          marginBottom: 'var(--space-2)',
        }}
      >
        Unable to load categories directory
      </h1>

      <p
        style={{
          fontSize: '15px',
          color: 'var(--text-secondary)',
          maxWidth: '480px',
          lineHeight: 1.6,
          marginBottom: 'var(--space-6)',
        }}
      >
        We encountered an error while communicating with the category service. Please try reloading the directory.
      </p>

      <div style={{ display: 'flex', gap: 'var(--space-3)' }}>
        <button
          type="button"
          onClick={() => reset()}
          style={{
            padding: '10px 24px',
            backgroundColor: 'var(--brand-deep-emerald)',
            color: '#FFFFFF',
            borderRadius: 'var(--radius-pill)',
            fontSize: '14px',
            fontWeight: 600,
            border: 'none',
            cursor: 'pointer',
            boxShadow: 'var(--elevation-1)',
          }}
        >
          Try Again
        </button>

        <a
          href="/"
          style={{
            padding: '10px 24px',
            backgroundColor: 'var(--surface-card)',
            color: 'var(--text-primary)',
            borderRadius: 'var(--radius-pill)',
            fontSize: '14px',
            fontWeight: 600,
            border: '1px solid var(--border-subtle)',
            textDecoration: 'none',
          }}
        >
          Return Home
        </a>
      </div>
    </div>
  );
}
