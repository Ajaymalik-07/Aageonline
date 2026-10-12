import React from 'react';

export function MarketModelExplanation() {
  return (
    <section
      aria-labelledby="market-model-heading"
      style={{
        padding: 'var(--space-12) 0',
        backgroundColor: 'var(--bg-page-soft, rgba(11, 31, 59, 0.02))',
        borderTop: '1px solid var(--border-subtle)',
        borderBottom: '1px solid var(--border-subtle)',
      }}
    >
      <div className="container">
        <div style={{ textAlign: 'center', maxWidth: '720px', margin: '0 auto var(--space-10) auto' }}>
          <span
            style={{
              fontSize: 'var(--font-size-eyebrow)',
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              color: 'var(--brand-deep-emerald)',
              display: 'block',
              marginBottom: 'var(--space-2)',
            }}
          >
            How AageOnline Works
          </span>
          <h2
            id="market-model-heading"
            style={{
              fontSize: 'var(--font-size-section)',
              fontWeight: 800,
              color: 'var(--text-primary)',
              letterSpacing: '-0.02em',
              lineHeight: 1.2,
              margin: '0 0 var(--space-4) 0',
            }}
          >
            Location + Category = Transparent Market
          </h2>
          <p
            style={{
              fontSize: '16px',
              color: 'var(--text-secondary)',
              lineHeight: 1.6,
              margin: 0,
            }}
          >
            Every market on AageOnline represents an independent, localized commercial ecosystem. Businesses compete exclusively within their verified category and city boundary.
          </p>
        </div>

        {/* 3 Step Diagram / Grid */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: 'var(--space-6)',
          }}
        >
          {/* Card 1: Precise Market Boundaries */}
          <div
            style={{
              padding: 'var(--space-7)',
              backgroundColor: 'var(--surface-card)',
              borderRadius: 'var(--radius-lg)',
              border: '1px solid var(--border-subtle)',
              boxShadow: 'var(--elevation-1)',
            }}
          >
            <div
              style={{
                width: '40px',
                height: '40px',
                borderRadius: 'var(--radius-md)',
                backgroundColor: 'rgba(234, 88, 12, 0.1)',
                color: 'var(--brand-deep-emerald)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 800,
                fontSize: '16px',
                marginBottom: 'var(--space-4)',
              }}
            >
              1
            </div>
            <h3
              style={{
                fontSize: '18px',
                fontWeight: 700,
                color: 'var(--text-primary)',
                marginBottom: 'var(--space-2)',
              }}
            >
              Strict Market Boundaries
            </h3>
            <p
              style={{
                fontSize: '14px',
                color: 'var(--text-secondary)',
                lineHeight: 1.6,
                margin: 0,
              }}
            >
              A restaurant in Jaipur never competes with an interior designer in Jaipur, nor with a restaurant in Delhi. Every market ladder is strictly segregated by Location and Category.
            </p>
          </div>

          {/* Card 2: Atomic Transparent Ladder */}
          <div
            style={{
              padding: 'var(--space-7)',
              backgroundColor: 'var(--surface-card)',
              borderRadius: 'var(--radius-lg)',
              border: '1px solid var(--border-subtle)',
              boxShadow: 'var(--elevation-1)',
            }}
          >
            <div
              style={{
                width: '40px',
                height: '40px',
                borderRadius: 'var(--radius-md)',
                backgroundColor: 'rgba(234, 88, 12, 0.1)',
                color: 'var(--brand-deep-emerald)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 800,
                fontSize: '16px',
                marginBottom: 'var(--space-4)',
              }}
            >
              2
            </div>
            <h3
              style={{
                fontSize: '18px',
                fontWeight: 700,
                color: 'var(--text-primary)',
                marginBottom: 'var(--space-2)',
              }}
            >
              Transparent Ranking Ladder
            </h3>
            <p
              style={{
                fontSize: '14px',
                color: 'var(--text-secondary)',
                lineHeight: 1.6,
                margin: 0,
              }}
            >
              Positions #1, #2, #3, through #8 are published in real time. Every qualifying amount is visible to all participants, removing backroom deals and opaque advertising pricing.
            </p>
          </div>

          {/* Card 3: Verified Financial Finality */}
          <div
            style={{
              padding: 'var(--space-7)',
              backgroundColor: 'var(--surface-card)',
              borderRadius: 'var(--radius-lg)',
              border: '1px solid var(--border-subtle)',
              boxShadow: 'var(--elevation-1)',
            }}
          >
            <div
              style={{
                width: '40px',
                height: '40px',
                borderRadius: 'var(--radius-md)',
                backgroundColor: 'rgba(234, 88, 12, 0.1)',
                color: 'var(--brand-deep-emerald)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 800,
                fontSize: '16px',
                marginBottom: 'var(--space-4)',
              }}
            >
              3
            </div>
            <h3
              style={{
                fontSize: '18px',
                fontWeight: 700,
                color: 'var(--text-primary)',
                marginBottom: 'var(--space-2)',
              }}
            >
              Audit-Logged Invariance
            </h3>
            <p
              style={{
                fontSize: '14px',
                color: 'var(--text-secondary)',
                lineHeight: 1.6,
                margin: 0,
              }}
            >
              Position movements execute inside strict database transactions with complete position history logging. Rankings reflect verified paid visibility positions without arbitrary modification.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
