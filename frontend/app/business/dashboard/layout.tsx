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
        backgroundColor: '#071526',
        color: '#FFFFFF',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <WorkspaceNav />
      <div
        className="container"
        style={{
          flex: 1,
          paddingTop: 'var(--space-6)',
          paddingBottom: 'var(--space-16)',
        }}
      >
        {children}
      </div>
    </div>
  );
}
