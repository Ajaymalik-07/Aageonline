'use client';

import React from 'react';

export default function WorkspaceError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div
      style={{
        maxWidth: '560px',
        margin: 'var(--space-12) auto',
        backgroundColor: '#0B1F33',
        borderRadius: 'var(--radius-xl)',
        padding: 'var(--space-8)',
        border: '1px solid rgba(239, 68, 68, 0.3)',
        textAlign: 'center',
        color: '#FFFFFF',
      }}
    >
      <h2 style={{ fontSize: 'var(--font-size-xl)', color: '#F87171', margin: '0 0 var(--space-3) 0' }}>
        Workspace Encountered an Error
      </h2>
      <p style={{ fontSize: 'var(--font-size-sm)', color: 'rgba(255, 255, 255, 0.7)', margin: '0 0 var(--space-6) 0', lineHeight: 1.5 }}>
        {error.message || 'We encountered an issue loading your business workspace data. Please verify your membership permissions or try again.'}
      </p>

      <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
        <button
          onClick={() => reset()}
          style={{
            backgroundColor: '#EA580C',
            color: '#FFFFFF',
            border: 'none',
            padding: '10px 20px',
            borderRadius: 'var(--radius-pill)',
            fontWeight: 700,
            fontSize: 'var(--font-size-sm)',
            cursor: 'pointer',
          }}
        >
          Try Again
        </button>
        <a
          href="/"
          style={{
            backgroundColor: 'rgba(255, 255, 255, 0.1)',
            color: '#FFFFFF',
            padding: '10px 20px',
            borderRadius: 'var(--radius-pill)',
            fontWeight: 700,
            fontSize: 'var(--font-size-sm)',
            textDecoration: 'none',
          }}
        >
          Return Home
        </a>
      </div>
    </div>
  );
}
