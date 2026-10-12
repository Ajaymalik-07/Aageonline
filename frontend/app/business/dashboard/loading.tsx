import React from 'react';

export default function WorkspaceLoading() {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 'var(--space-6)',
        padding: 'var(--space-8) 0',
      }}
    >
      <div
        style={{
          height: '80px',
          backgroundColor: '#0B1F33',
          borderRadius: 'var(--radius-xl)',
          opacity: 0.6,
        }}
      />
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: 'var(--space-4)',
        }}
      >
        <div style={{ height: '110px', backgroundColor: '#0B1F33', borderRadius: 'var(--radius-lg)', opacity: 0.5 }} />
        <div style={{ height: '110px', backgroundColor: '#0B1F33', borderRadius: 'var(--radius-lg)', opacity: 0.5 }} />
        <div style={{ height: '110px', backgroundColor: '#0B1F33', borderRadius: 'var(--radius-lg)', opacity: 0.5 }} />
        <div style={{ height: '110px', backgroundColor: '#0B1F33', borderRadius: 'var(--radius-lg)', opacity: 0.5 }} />
      </div>
      <div
        style={{
          height: '180px',
          backgroundColor: '#0B1F33',
          borderRadius: 'var(--radius-xl)',
          opacity: 0.4,
        }}
      />
    </div>
  );
}
