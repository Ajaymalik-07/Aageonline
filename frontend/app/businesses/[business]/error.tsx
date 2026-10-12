'use client';

import React, { useEffect } from 'react';

export default function BusinessProfileError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Unhandled Business Profile error:', error);
  }, [error]);

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '60vh',
        padding: 'var(--space-8) var(--space-4)',
        textAlign: 'center',
      }}
    >
      <div
        style={{
          width: '56px',
          height: '56px',
          borderRadius: '50%',
          backgroundColor: 'rgba(239, 68, 68, 0.1)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: 'var(--space-4)',
          color: '#EF4444',
        }}
        aria-hidden="true"
      >
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="8" x2="12" y2="12" />
          <line x1="12" y1="16" x2="12.01" y2="16" />
        </svg>
      </div>

      <h1
        style={{
          fontSize: 'var(--font-size-2xl)',
          fontWeight: 800,
          color: 'var(--text-primary)',
          margin: '0 0 var(--space-2) 0',
        }}
      >
        Unable to Load Business Profile
      </h1>

      <p
        style={{
          fontSize: 'var(--font-size-base)',
          color: 'var(--text-secondary)',
          maxWidth: '520px',
          lineHeight: 1.5,
          margin: '0 0 var(--space-6) 0',
        }}
      >
        We encountered a communication failure while querying the business domain service. Please retry your request.
      </p>

      <div style={{ display: 'flex', gap: 'var(--space-3)' }}>
        <button
          type="button"
          onClick={() => reset()}
          style={{
            padding: '10px 24px',
            backgroundColor: '#EA580C',
            color: '#FFFFFF',
            border: 'none',
            borderRadius: 'var(--radius-pill)',
            fontWeight: 700,
            fontSize: 'var(--font-size-sm)',
            cursor: 'pointer',
          }}
        >
          Try Again
        </button>

        <a
          href="/businesses"
          style={{
            padding: '10px 24px',
            backgroundColor: 'var(--surface-sunken)',
            color: 'var(--text-primary)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-pill)',
            fontWeight: 600,
            fontSize: 'var(--font-size-sm)',
            textDecoration: 'none',
            display: 'inline-flex',
            alignItems: 'center',
          }}
        >
          Explore All Businesses
        </a>
      </div>
    </div>
  );
}
