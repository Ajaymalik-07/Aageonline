'use client';

import React, { useEffect } from 'react';
import { Button } from '../components/ui/Button';

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Unhandled frontend application error:', error);
  }, [error]);

  return (
    <div className="container" style={{ padding: 'var(--space-12) 0', textAlign: 'center' }}>
      <div
        style={{
          maxWidth: '520px',
          margin: '0 auto',
          padding: 'var(--space-8)',
          backgroundColor: 'var(--surface-card)',
          borderRadius: 'var(--radius-lg)',
          boxShadow: 'var(--elevation-2)',
          border: '1px solid var(--border-subtle)',
        }}
      >
        <div style={{ fontSize: '44px', marginBottom: 'var(--space-3)' }}>⚠️</div>
        <h2 style={{ fontSize: '22px', fontWeight: 800, color: 'var(--text-primary)', marginBottom: 'var(--space-2)' }}>
          Something went wrong
        </h2>
        <p style={{ fontSize: '15px', color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: 'var(--space-6)' }}>
          We could not load this view. The navigation bar and other sections remain fully functional.
        </p>
        <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
          <Button variant="outline" onClick={() => (window.location.href = '/')}>
            Go Home
          </Button>
          <Button variant="primary" onClick={() => reset()}>
            Try Again
          </Button>
        </div>
      </div>
    </div>
  );
}
