'use client';

import React, { useEffect } from 'react';

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    const isChunkError =
      error?.name === 'ChunkLoadError' ||
      (error?.message && (
        error.message.includes('Loading chunk') ||
        error.message.includes('Failed to fetch dynamically imported module') ||
        error.message.includes('ChunkLoadError')
      ));

    if (isChunkError) {
      const retryKey = 'admin_chunk_error_retry';
      const lastRetry = sessionStorage.getItem(retryKey);
      if (!lastRetry || Date.now() - parseInt(lastRetry, 10) > 10000) {
        sessionStorage.setItem(retryKey, Date.now().toString());
        window.location.reload();
      }
    }
  }, [error]);

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '60vh',
        textAlign: 'center',
        padding: '40px 20px',
        color: '#FFFFFF',
      }}
    >
      <div
        style={{
          backgroundColor: '#0B1F33',
          border: '1px solid #1E293B',
          borderRadius: '12px',
          padding: '36px',
          maxWidth: '480px',
          boxShadow: '0 10px 25px rgba(0,0,0,0.5)',
        }}
      >
        <div style={{ fontSize: '32px', marginBottom: '16px' }}>⚡</div>
        <h2 style={{ fontSize: '18px', fontWeight: 800, margin: '0 0 10px 0' }}>Dashboard View Outdated</h2>
        <p style={{ fontSize: '13px', color: '#94A3B8', margin: '0 0 24px 0', lineHeight: 1.6 }}>
          A newer version of the Control Center is available. Refresh to load the latest dashboard components.
        </p>
        <button
          onClick={() => window.location.reload()}
          style={{
            padding: '10px 24px',
            backgroundColor: '#0052CC',
            color: '#FFFFFF',
            border: 'none',
            borderRadius: '6px',
            fontWeight: 700,
            fontSize: '13px',
            cursor: 'pointer',
          }}
        >
          Reload Dashboard
        </button>
      </div>
    </div>
  );
}
