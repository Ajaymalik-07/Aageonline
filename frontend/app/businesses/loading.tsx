import React from 'react';

export default function BusinessesLoading() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      {/* Skeleton Hero */}
      <section
        style={{
          backgroundColor: '#071526',
          padding: 'clamp(var(--space-10), 6vw, var(--space-14)) 0',
          textAlign: 'center',
        }}
      >
        <div style={{ maxWidth: 'var(--container-max)', margin: '0 auto', padding: '0 var(--container-gutter)' }}>
          <div
            style={{
              width: '180px',
              height: '24px',
              backgroundColor: 'rgba(255, 255, 255, 0.1)',
              borderRadius: 'var(--radius-pill)',
              margin: '0 auto var(--space-4) auto',
            }}
          />
          <div
            style={{
              width: '60%',
              maxWidth: '560px',
              height: '48px',
              backgroundColor: 'rgba(255, 255, 255, 0.15)',
              borderRadius: 'var(--radius-md)',
              margin: '0 auto var(--space-4) auto',
            }}
          />
          <div
            style={{
              width: '80%',
              maxWidth: '480px',
              height: '20px',
              backgroundColor: 'rgba(255, 255, 255, 0.08)',
              borderRadius: 'var(--radius-sm)',
              margin: '0 auto var(--space-8) auto',
            }}
          />
          <div
            style={{
              width: '100%',
              maxWidth: '640px',
              height: '52px',
              backgroundColor: 'rgba(255, 255, 255, 0.1)',
              borderRadius: 'var(--radius-pill)',
              margin: '0 auto',
            }}
          />
        </div>
      </section>

      {/* Skeleton Grid */}
      <section style={{ padding: 'var(--space-10) 0', backgroundColor: 'var(--bg-page)' }}>
        <div style={{ maxWidth: 'var(--container-max)', margin: '0 auto', padding: '0 var(--container-gutter)' }}>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
              gap: 'var(--space-6)',
            }}
          >
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                style={{
                  height: '220px',
                  backgroundColor: 'var(--surface-card)',
                  borderRadius: 'var(--radius-lg)',
                  border: '1px solid var(--border-subtle)',
                  padding: 'var(--space-6)',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                }}
              >
                <div>
                  <div
                    style={{
                      width: '40%',
                      height: '16px',
                      backgroundColor: 'var(--surface-sunken)',
                      borderRadius: 'var(--radius-sm)',
                      marginBottom: 'var(--space-4)',
                    }}
                  />
                  <div
                    style={{
                      width: '75%',
                      height: '24px',
                      backgroundColor: 'var(--surface-sunken)',
                      borderRadius: 'var(--radius-sm)',
                      marginBottom: 'var(--space-3)',
                    }}
                  />
                  <div
                    style={{
                      width: '100%',
                      height: '36px',
                      backgroundColor: 'var(--surface-sunken)',
                      borderRadius: 'var(--radius-sm)',
                    }}
                  />
                </div>
                <div
                  style={{
                    width: '50%',
                    height: '16px',
                    backgroundColor: 'var(--surface-sunken)',
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
