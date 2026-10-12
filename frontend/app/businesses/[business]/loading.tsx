import React from 'react';

export default function BusinessProfileLoading() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <div
        style={{
          flex: 1,
          maxWidth: 'var(--container-max)',
          width: '100%',
          margin: '0 auto',
          padding: 'var(--space-4) var(--container-gutter) var(--space-16) var(--container-gutter)',
        }}
      >
        {/* Breadcrumb Skeleton */}
        <div
          style={{
            width: '200px',
            height: '14px',
            backgroundColor: 'var(--surface-sunken)',
            borderRadius: 'var(--radius-sm)',
            margin: 'var(--space-4) 0',
          }}
        />

        {/* Hero Skeleton */}
        <div
          style={{
            height: '240px',
            backgroundColor: '#071526',
            borderRadius: 'var(--radius-xl)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            marginBottom: 'var(--space-8)',
            padding: 'var(--space-8)',
          }}
        >
          <div
            style={{
              width: '140px',
              height: '20px',
              backgroundColor: 'rgba(255, 255, 255, 0.1)',
              borderRadius: 'var(--radius-pill)',
              marginBottom: 'var(--space-4)',
            }}
          />
          <div
            style={{
              width: '50%',
              height: '36px',
              backgroundColor: 'rgba(255, 255, 255, 0.15)',
              borderRadius: 'var(--radius-md)',
              marginBottom: 'var(--space-3)',
            }}
          />
          <div
            style={{
              width: '70%',
              height: '18px',
              backgroundColor: 'rgba(255, 255, 255, 0.08)',
              borderRadius: 'var(--radius-sm)',
            }}
          />
        </div>

        {/* Overview Skeleton */}
        <div
          style={{
            height: '120px',
            backgroundColor: 'var(--surface-card)',
            borderRadius: 'var(--radius-lg)',
            border: '1px solid var(--border-subtle)',
            marginBottom: 'var(--space-8)',
            padding: 'var(--space-6)',
          }}
        />

        {/* Market Participations Skeleton */}
        <div
          style={{
            height: '200px',
            backgroundColor: 'var(--surface-card)',
            borderRadius: 'var(--radius-xl)',
            border: '1px solid var(--border-subtle)',
            marginBottom: 'var(--space-8)',
            padding: 'var(--space-8)',
          }}
        />
      </div>
    </div>
  );
}
