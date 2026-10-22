import React from 'react';
import type { Metadata } from 'next';
import { WorkspaceNav } from './WorkspaceNav.tsx';

export const metadata: Metadata = {
  title: 'Business Workspace — AageOnline',
  description: 'Authenticated operations and market visibility workspace for registered business owners.',
  robots: {
    index: false,
    follow: false,
  },
};

export default function BusinessDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div
      style={{
        minHeight: '100vh',
        backgroundColor: '#F8FAFC',
        backgroundImage: `
          radial-gradient(circle at 90% 10%, rgba(234, 88, 12, 0.05) 0%, transparent 45%),
          radial-gradient(circle at 10% 90%, rgba(251, 146, 60, 0.03) 0%, transparent 45%),
          linear-gradient(180deg, #FFFFFF 0%, #F8FAFC 100%)
        `,
        color: '#0F172A',
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
      }}
    >
      {/* Decorative Subtle Grid Background */}
      <div
        aria-hidden="true"
        style={{
          position: 'fixed',
          inset: 0,
          backgroundImage: `
            linear-gradient(to right, rgba(15, 23, 42, 0.03) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(15, 23, 42, 0.03) 1px, transparent 1px)
          `,
          backgroundSize: '40px 40px',
          pointerEvents: 'none',
          opacity: 0.8,
          zIndex: 0,
        }}
      />

      <WorkspaceNav />

      <main
        className="container"
        style={{
          flex: 1,
          paddingTop: 'clamp(var(--space-6), 3vw, var(--space-8))',
          paddingBottom: 'clamp(var(--space-10), 5vw, var(--space-16))',
          position: 'relative',
          zIndex: 1,
        }}
      >
        {children}
      </main>
    </div>
  );
}
