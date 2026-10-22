import React from 'react';
import type { Metadata } from 'next';
import './globals.css';
import AdminShell from '../components/AdminShell.tsx';

export const metadata: Metadata = {
  title: 'Control Center — AageOnline Admin',
  description: 'AageOnline centralized operations, financial reconciliation, and platform governance.',
  robots: {
    index: false,
    follow: false,
  },
};

export default function AdminRootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap"
          rel="stylesheet"
        />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              function handleChunkError(err) {
                var msg = (err && (err.message || (err.reason && err.reason.message))) || '';
                var name = (err && (err.name || (err.reason && err.reason.name))) || '';
                if (name === 'ChunkLoadError' || msg.indexOf('ChunkLoadError') !== -1 || msg.indexOf('Loading chunk') !== -1 || msg.indexOf('Failed to fetch dynamically imported module') !== -1) {
                  var last = sessionStorage.getItem('chunk_recovery_ts');
                  if (!last || Date.now() - parseInt(last, 10) > 8000) {
                    sessionStorage.setItem('chunk_recovery_ts', Date.now().toString());
                    window.location.reload();
                  }
                }
              }
              window.addEventListener('error', function(e) { handleChunkError(e.error || e); });
              window.addEventListener('unhandledrejection', function(e) { handleChunkError(e.reason || e); });
            `,
          }}
        />
      </head>
      <body>
        <AdminShell>{children}</AdminShell>
      </body>
    </html>
  );
}
