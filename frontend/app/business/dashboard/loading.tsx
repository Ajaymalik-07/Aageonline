import React from 'react';

export default function WorkspaceLoading() {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 'var(--space-6)',
      }}
    >
      {/* Banner Skeleton */}
      <div
        style={{
          height: '140px',
          backgroundColor: 'rgba(11, 31, 51, 0.6)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          borderRadius: 'var(--radius-xl)',
          animation: 'pulse 1.8s ease-in-out infinite',
        }}
      />

      {/* Metrics Grid Skeleton */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: 'var(--space-4)',
        }}
      >
        <div style={{ height: '120px', backgroundColor: 'rgba(11, 31, 51, 0.6)', border: '1px solid rgba(255, 255, 255, 0.06)', borderRadius: 'var(--radius-lg)' }} />
        <div style={{ height: '120px', backgroundColor: 'rgba(11, 31, 51, 0.6)', border: '1px solid rgba(255, 255, 255, 0.06)', borderRadius: 'var(--radius-lg)' }} />
        <div style={{ height: '120px', backgroundColor: 'rgba(11, 31, 51, 0.6)', border: '1px solid rgba(255, 255, 255, 0.06)', borderRadius: 'var(--radius-lg)' }} />
        <div style={{ height: '120px', backgroundColor: 'rgba(11, 31, 51, 0.6)', border: '1px solid rgba(255, 255, 255, 0.06)', borderRadius: 'var(--radius-lg)' }} />
      </div>

      {/* Main Section Skeleton */}
      <div
        style={{
          height: '240px',
          backgroundColor: 'rgba(11, 31, 51, 0.6)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          borderRadius: 'var(--radius-xl)',
        }}
      />
    </div>
  );
}
