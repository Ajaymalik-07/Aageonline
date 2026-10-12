import React from 'react';

export default function CategoryLoading() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      {/* Skeleton Breadcrumbs */}
      <div
        style={{
          height: '42px',
          backgroundColor: 'var(--surface-subtle)',
          borderBottom: '1px solid var(--border-subtle)',
        }}
      />

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
              width: '200px',
              height: '24px',
              backgroundColor: 'rgba(255, 255, 255, 0.1)',
              borderRadius: 'var(--radius-pill)',
              margin: '0 auto var(--space-4) auto',
            }}
          />
          <div
            style={{
              width: '60%',
              maxWidth: '520px',
              height: '44px',
              backgroundColor: 'rgba(255, 255, 255, 0.15)',
              borderRadius: 'var(--radius-md)',
              margin: '0 auto var(--space-4) auto',
            }}
          />
          <div
            style={{
              width: '80%',
              maxWidth: '580px',
              height: '20px',
              backgroundColor: 'rgba(255, 255, 255, 0.08)',
              borderRadius: 'var(--radius-sm)',
              margin: '0 auto var(--space-8) auto',
            }}
          />
          <div
            style={{
              width: '180px',
              height: '44px',
              backgroundColor: 'rgba(234, 88, 12, 0.3)',
              borderRadius: 'var(--radius-pill)',
              margin: '0 auto',
            }}
          />
        </div>
      </section>

      {/* Skeleton Snapshot */}
      <div
        style={{
          padding: 'var(--space-6) 0',
          backgroundColor: 'var(--surface-subtle)',
          borderBottom: '1px solid var(--border-subtle)',
        }}
      >
        <div
          style={{
            maxWidth: 'var(--container-max)',
            margin: '0 auto',
            padding: '0 var(--container-gutter)',
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: 'var(--space-4)',
          }}
        >
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              style={{
                height: '76px',
                backgroundColor: 'var(--surface-card)',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border-subtle)',
              }}
            />
          ))}
        </div>
      </div>

      {/* Skeleton Markets Grid */}
      <section style={{ padding: 'var(--space-10) 0', backgroundColor: 'var(--bg-page)' }}>
        <div style={{ maxWidth: 'var(--container-max)', margin: '0 auto', padding: '0 var(--container-gutter)' }}>
          <div
            style={{
              width: '220px',
              height: '28px',
              backgroundColor: 'var(--border-subtle)',
              borderRadius: 'var(--radius-sm)',
              marginBottom: 'var(--space-6)',
            }}
          />
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
              gap: 'var(--space-5)',
            }}
          >
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                style={{
                  height: '220px',
                  backgroundColor: 'var(--surface-card)',
                  borderRadius: 'var(--radius-lg)',
                  border: '1px solid var(--border-subtle)',
                }}
              />
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
