import React from 'react';

export default function MarketsLoading() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      {/* Hero Skeleton */}
      <section
        style={{
          backgroundColor: '#071526',
          color: '#FFFFFF',
          padding: 'clamp(var(--space-10), 6vw, var(--space-14)) 0',
          textAlign: 'center',
        }}
      >
        <div className="container">
          <div
            style={{
              width: '200px',
              height: '28px',
              backgroundColor: 'rgba(255, 255, 255, 0.08)',
              borderRadius: 'var(--radius-pill)',
              margin: '0 auto var(--space-4) auto',
            }}
          />
          <div
            style={{
              width: '60%',
              height: '48px',
              backgroundColor: 'rgba(255, 255, 255, 0.1)',
              borderRadius: 'var(--radius-md)',
              margin: '0 auto var(--space-4) auto',
            }}
          />
          <div
            style={{
              width: '40%',
              height: '20px',
              backgroundColor: 'rgba(255, 255, 255, 0.06)',
              borderRadius: 'var(--radius-sm)',
              margin: '0 auto var(--space-8) auto',
            }}
          />
          <div
            style={{
              maxWidth: '640px',
              height: '56px',
              backgroundColor: 'rgba(255, 255, 255, 0.08)',
              borderRadius: 'var(--radius-pill)',
              margin: '0 auto',
            }}
          />
        </div>
      </section>

      {/* Directory Grid Skeleton */}
      <section style={{ padding: 'var(--space-10) 0', backgroundColor: 'var(--bg-page)' }}>
        <div className="container">
          <div
            style={{
              width: '240px',
              height: '32px',
              backgroundColor: 'var(--border-subtle)',
              borderRadius: 'var(--radius-md)',
              marginBottom: 'var(--space-6)',
            }}
          />

          {/* Cards Skeleton Grid */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
              gap: 'var(--space-6)',
            }}
          >
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div
                key={i}
                style={{
                  height: '220px',
                  backgroundColor: 'var(--surface-card)',
                  borderRadius: 'var(--radius-lg)',
                  border: '1px solid var(--border-subtle)',
                  padding: 'var(--space-7)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 'var(--space-4)',
                }}
              >
                <div
                  style={{
                    width: '80px',
                    height: '14px',
                    backgroundColor: 'var(--border-subtle)',
                    borderRadius: 'var(--radius-sm)',
                  }}
                />
                <div
                  style={{
                    width: '160px',
                    height: '24px',
                    backgroundColor: 'var(--border-subtle)',
                    borderRadius: 'var(--radius-sm)',
                  }}
                />
                <div
                  style={{
                    marginTop: 'auto',
                    width: '100px',
                    height: '20px',
                    backgroundColor: 'var(--border-subtle)',
                    borderRadius: 'var(--radius-sm)',
                  }}
                />
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
