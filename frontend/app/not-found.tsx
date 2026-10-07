import React from 'react';

export default function NotFound() {
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
        <span style={{ fontSize: '48px', fontWeight: 900, color: 'var(--brand-emerald)', display: 'block' }}>
          404
        </span>
        <h2 style={{ fontSize: '22px', fontWeight: 800, color: 'var(--text-primary)', margin: 'var(--space-2) 0' }}>
          Market or Page Not Found
        </h2>
        <p style={{ fontSize: '15px', color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: 'var(--space-6)' }}>
          The requested market or business directory page does not exist or has been relocated.
        </p>
        <a
          href="/explore"
          style={{
            padding: '12px 24px',
            borderRadius: 'var(--radius-pill)',
            backgroundColor: 'var(--action-primary)',
            color: '#ffffff',
            fontWeight: 600,
            fontSize: '15px',
            textDecoration: 'none',
            display: 'inline-flex',
            alignItems: 'center',
            minHeight: '44px',
          }}
        >
          Explore Active Markets →
        </a>
      </div>
    </div>
  );
}
