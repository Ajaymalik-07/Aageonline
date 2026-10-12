'use client';

import React from 'react';

interface ErrorPageProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function MarketsError({ error, reset }: ErrorPageProps) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '60vh',
        padding: 'var(--space-12) var(--container-gutter)',
        textAlign: 'center',
        backgroundColor: 'var(--bg-page)',
      }}
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
          fontSize: 'var(--font-size-section)',
          fontWeight: 800,
          color: 'var(--text-primary)',
          letterSpacing: '-0.02em',
          marginBottom: 'var(--space-2)',
        }}
      >
        We couldn't load markets right now
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
        {error.message || 'The market directory service encountered a temporary problem. Please try again.'}
      </p>

      <button
        type="button"
        onClick={() => reset()}
        style={{
          padding: '12px 28px',
          backgroundColor: 'var(--brand-deep-emerald)',
          color: '#FFFFFF',
          borderRadius: 'var(--radius-pill)',
          fontWeight: 700,
          fontSize: '14px',
          border: 'none',
          cursor: 'pointer',
          boxShadow: 'var(--elevation-1)',
          transition: 'transform var(--motion-fast)',
        }}
      >
        Try Again
      </button>
    </div>
  );
}
