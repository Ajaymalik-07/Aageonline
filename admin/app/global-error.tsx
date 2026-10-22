'use client';

import React, { useEffect } from 'react';

export default function GlobalError({
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
      const retryKey = 'admin_global_chunk_retry';
      const lastRetry = sessionStorage.getItem(retryKey);
      if (!lastRetry || Date.now() - parseInt(lastRetry, 10) > 10000) {
        sessionStorage.setItem(retryKey, Date.now().toString());
        window.location.reload();
      }
    }
  }, [error]);

  return (
    <html lang="en">
      <body style={{ backgroundColor: '#071526', color: '#FFFFFF', margin: 0, fontFamily: 'sans-serif' }}>
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '100vh',
            textAlign: 'center',
            padding: '20px',
          }}
        >
          <div
            style={{
              backgroundColor: '#0B1F33',
              border: '1px solid #1E293B',
              borderRadius: '12px',
              padding: '36px',
              maxWidth: '480px',
            }}
          >
            <h2 style={{ fontSize: '18px', fontWeight: 800, margin: '0 0 12px 0' }}>Updating Control Center...</h2>
            <p style={{ color: '#94A3B8', fontSize: '13px', lineHeight: 1.6, margin: '0 0 20px 0' }}>
              The application components have been refreshed. Click below to load the latest dashboard.
            </p>
            <button
              onClick={() => window.location.reload()}
              style={{
                padding: '10px 24px',
                backgroundColor: '#0052CC',
                color: '#FFFFFF',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontWeight: 700,
                fontSize: '13px',
              }}
            >
              Reload Page
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}
