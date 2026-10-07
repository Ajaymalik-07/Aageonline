'use client';

import React from 'react';

export const WhatIsAageOnline: React.FC = () => {
  return (
    <section className="container" aria-label="What is AageOnline">
      <div
        style={{
          borderRadius: 'var(--radius-xl)',
          backgroundColor: 'var(--surface-card)',
          border: '1px solid var(--border-subtle)',
          boxShadow: 'var(--elevation-2)',
          padding: 'clamp(var(--space-8), 5vw, var(--space-12)) clamp(var(--space-6), 4vw, var(--space-10))',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: 'var(--space-10)',
          alignItems: 'center',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Subtle Ambient Glow */}
        <div
          aria-hidden="true"
          style={{
            position: 'absolute',
            bottom: '-20%',
            left: '-10%',
            width: '400px',
            height: '400px',
            background: 'radial-gradient(circle, rgba(5, 150, 105, 0.08) 0%, transparent 70%)',
            pointerEvents: 'none',
          }}
        />

        {/* Left: Editorial Manifesto */}
        <div>
          <span
            style={{
              fontSize: '11px',
              fontWeight: 800,
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              color: 'var(--brand-emerald)',
              display: 'block',
              marginBottom: '6px',
            }}
          >
            Platform Paradigm
          </span>

          <h2
            style={{
              fontSize: 'clamp(28px, 4vw, 42px)',
              fontWeight: 900,
              color: 'var(--text-primary)',
              lineHeight: 1.15,
              letterSpacing: '-0.025em',
              marginBottom: 'var(--space-4)',
            }}
          >
            Paid visibility, <span style={{ color: 'var(--brand-emerald)' }}>made transparent.</span>
          </h2>

          <p
            style={{
              fontSize: '16px',
              lineHeight: 1.6,
              color: 'var(--text-secondary)',
              marginBottom: 'var(--space-6)',
            }}
          >
            AageOnline allows local businesses to compete for paid visibility positions inside well-defined <strong>Location + Category</strong> markets. No opaque black-box algorithms, no artificial pay-per-click bidding wars, and no hidden sponsored biases.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
            <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
              <span style={{ fontSize: '20px', lineHeight: 1 }}>📍</span>
              <div>
                <strong style={{ fontSize: '15px', color: 'var(--text-primary)', display: 'block' }}>
                  Strict Local &amp; Category Scoping
                </strong>
                <span style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                  A market is exactly one city and one business category. Jaipur Interior Designers compete only with Jaipur Interior Designers.
                </span>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
              <span style={{ fontSize: '20px', lineHeight: 1 }}>🛡️</span>
              <div>
                <strong style={{ fontSize: '15px', color: 'var(--text-primary)', display: 'block' }}>
                  Deterministic Qualifying Ladder
                </strong>
                <span style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                  Positions (#1, #2, #3...) are determined by verified qualifying transactions. A higher amount supercedes the incumbent in an atomic transaction.
                </span>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
              <span style={{ fontSize: '20px', lineHeight: 1 }}>📜</span>
              <div>
                <strong style={{ fontSize: '15px', color: 'var(--text-primary)', display: 'block' }}>
                  Mandatory Consumer Disclosure
                </strong>
                <span style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                  Consumers always see that positions reflect paid commercial visibility, not objective certification of business quality.
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Right: Connected Node Architecture Diagram */}
        <div
          style={{
            backgroundColor: 'var(--surface-raised)',
            borderRadius: 'var(--radius-xl)',
            padding: 'var(--space-6)',
            border: '1px solid var(--border-subtle)',
            boxShadow: 'var(--elevation-2)',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
          }}
        >
          <div style={{ textAlign: 'center', marginBottom: '4px' }}>
            <span style={{ fontSize: '11px', fontWeight: 800, color: 'var(--brand-teal)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              Core Market Formation
            </span>
          </div>

          {/* Node 1: Location + Category */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '12px',
              backgroundColor: 'var(--surface-card)',
              padding: '12px 16px',
              borderRadius: 'var(--radius-md)',
              border: '1.5px solid var(--border-strong)',
            }}
          >
            <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--brand-deep-emerald)' }}>
              📍 Location (City)
            </span>
            <span style={{ fontWeight: 900, color: 'var(--brand-emerald)' }}>+</span>
            <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--brand-deep-emerald)' }}>
              🏷️ Category (Vertical)
            </span>
          </div>

          {/* Connector arrow */}
          <div style={{ textAlign: 'center', color: 'var(--brand-emerald)', fontSize: '18px', fontWeight: 900 }}>
            ↓
          </div>

          {/* Node 2: Distinct Market Entity */}
          <div
            style={{
              backgroundColor: 'rgba(5, 150, 105, 0.08)',
              padding: '14px',
              borderRadius: 'var(--radius-md)',
              border: '1.5px solid var(--brand-emerald)',
              textAlign: 'center',
            }}
          >
            <span style={{ fontSize: '11px', fontWeight: 800, color: 'var(--brand-emerald)', textTransform: 'uppercase', display: 'block' }}>
              SINGLE DISCRETE MARKET
            </span>
            <strong style={{ fontSize: '16px', color: 'var(--text-primary)' }}>
              Jaipur + Interior Designers
            </strong>
          </div>

          {/* Connector arrow */}
          <div style={{ textAlign: 'center', color: 'var(--brand-emerald)', fontSize: '18px', fontWeight: 900 }}>
            ↓
          </div>

          {/* Node 3: Competing Businesses & Qualifying Ladder */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: '8px',
            }}
          >
            <div
              style={{
                backgroundColor: 'rgba(199, 240, 0, 0.15)',
                padding: '10px 6px',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid rgba(199, 240, 0, 0.4)',
                textAlign: 'center',
              }}
            >
              <span style={{ fontSize: '11px', fontWeight: 800, color: 'var(--brand-deep-navy)' }}>
                #1 Position
              </span>
              <strong style={{ fontSize: '13px', color: 'var(--brand-deep-navy)', display: 'block' }}>
                ₹26,000
              </strong>
            </div>

            <div
              style={{
                backgroundColor: 'var(--surface-card)',
                padding: '10px 6px',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--border-subtle)',
                textAlign: 'center',
              }}
            >
              <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-secondary)' }}>
                #2 Position
              </span>
              <strong style={{ fontSize: '13px', color: 'var(--text-primary)', display: 'block' }}>
                ₹24,500
              </strong>
            </div>

            <div
              style={{
                backgroundColor: 'var(--surface-card)',
                padding: '10px 6px',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--border-subtle)',
                textAlign: 'center',
              }}
            >
              <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-secondary)' }}>
                #3 Position
              </span>
              <strong style={{ fontSize: '13px', color: 'var(--text-primary)', display: 'block' }}>
                ₹22,000
              </strong>
            </div>
          </div>

          {/* Footer note */}
          <div style={{ textAlign: 'center', marginTop: '6px' }}>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
              Non-refundable payments · Atomic ranking transitions · Server authoritative
            </span>
          </div>
        </div>
      </div>
    </section>
  );
};
