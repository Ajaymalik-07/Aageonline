import React from 'react';
import { siteConfig } from '../../config/site';
import { ThemeToggle } from './ThemeToggle';
import { MobileNav } from './MobileNav';

export function Header() {
  return (
    <header
      style={{
        backgroundColor: 'var(--surface-card)',
        borderBottom: '1px solid var(--border-subtle)',
        position: 'sticky',
        top: 0,
        zIndex: 100,
        boxShadow: 'var(--elevation-1)',
      }}
    >
      <div
        className="container"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          height: '70px',
        }}
      >
        {/* Brand Logo & Tagline */}
        <a
          href="/"
          style={{
            textDecoration: 'none',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          <span
            style={{
              fontSize: '22px',
              fontWeight: 900,
              letterSpacing: '-0.02em',
              color: 'var(--brand-deep-emerald)',
            }}
          >
            Aage<span style={{ color: 'var(--brand-teal)' }}>Online</span>
          </span>
          <span
            style={{
              fontSize: '11px',
              fontWeight: 600,
              color: 'var(--text-secondary)',
              letterSpacing: '0.04em',
            }}
          >
            {siteConfig.tagline}
          </span>
        </a>

        {/* Desktop Navigation */}
        <nav
          aria-label="Main Navigation"
          className="desktop-nav"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--space-6)',
          }}
        >
          {siteConfig.nav.public.map((item) => (
            <a
              key={item.href}
              href={item.href}
              style={{
                fontSize: '14px',
                fontWeight: 600,
                color: 'var(--text-primary)',
                textDecoration: 'none',
                minHeight: '44px',
                display: 'inline-flex',
                alignItems: 'center',
              }}
            >
              {item.label}
            </a>
          ))}
        </nav>

        {/* Actions Cluster: Theme Toggle + For Business + MobileNav */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
          <ThemeToggle />

          <a
            href="/claim"
            className="header-cta"
            style={{
              padding: '8px 18px',
              borderRadius: 'var(--radius-pill)',
              backgroundColor: 'var(--brand-deep-navy)',
              color: '#ffffff',
              fontSize: '13px',
              fontWeight: 700,
              textDecoration: 'none',
              minHeight: '44px',
              display: 'inline-flex',
              alignItems: 'center',
            }}
          >
            For Business
          </a>

          <MobileNav />
        </div>
      </div>
    </header>
  );
}
