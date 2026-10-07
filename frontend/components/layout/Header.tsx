'use client';

import React, { useState, useEffect } from 'react';
import { siteConfig } from '../../config/site';
import { ThemeToggle } from './ThemeToggle';
import { MobileNav } from './MobileNav';

export function Header() {
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <header
      role="banner"
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 100,
        transition: 'all var(--motion-normal)',
        backgroundColor: isScrolled
          ? 'var(--surface-card)'
          : 'transparent',
        borderBottom: isScrolled
          ? '1px solid var(--border-subtle)'
          : '1px solid transparent',
        boxShadow: isScrolled ? 'var(--elevation-1)' : 'none',
        backdropFilter: isScrolled ? 'blur(12px)' : 'none',
        WebkitBackdropFilter: isScrolled ? 'blur(12px)' : 'none',
      }}
    >
      <div
        className="container"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          height: isScrolled ? '64px' : '72px',
          transition: 'height var(--motion-normal)',
        }}
      >
        {/* Left: Brand Identity */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
          <a
            href="/"
            aria-label="AageOnline Homepage"
            style={{
              textDecoration: 'none',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            <span
              style={{
                fontSize: '22px',
                fontWeight: 900,
                letterSpacing: '-0.025em',
                color: 'var(--text-primary)',
                display: 'inline-flex',
                alignItems: 'center',
              }}
            >
              Aage<span style={{ color: 'var(--brand-teal)' }}>Online</span>
            </span>

            <span
              style={{
                fontSize: '10px',
                fontWeight: 700,
                letterSpacing: '0.06em',
                textTransform: 'uppercase',
                padding: '2px 8px',
                borderRadius: 'var(--radius-pill)',
                backgroundColor: 'rgba(5, 150, 105, 0.12)',
                color: 'var(--brand-emerald)',
                border: '1px solid rgba(5, 150, 105, 0.25)',
              }}
              className="desktop-nav"
            >
              Market Platform
            </span>
          </a>
        </div>

        {/* Center: Primary Editorial Navigation (Freehand style) */}
        <nav
          aria-label="Primary Navigation"
          className="desktop-nav"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--space-1)',
            padding: '4px 6px',
            borderRadius: 'var(--radius-pill)',
            backgroundColor: isScrolled
              ? 'rgba(11, 31, 59, 0.04)'
              : 'rgba(255, 255, 255, 0.65)',
            border: '1px solid var(--border-subtle)',
          }}
        >
          <a
            href="/explore"
            style={{
              padding: '8px 16px',
              borderRadius: 'var(--radius-pill)',
              fontSize: '14px',
              fontWeight: 600,
              color: 'var(--text-primary)',
              textDecoration: 'none',
              transition: 'all var(--motion-fast)',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--surface-card)';
              e.currentTarget.style.color = 'var(--brand-emerald)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
              e.currentTarget.style.color = 'var(--text-primary)';
            }}
          >
            Explore Markets
          </a>

          <a
            href="/#how-it-works"
            style={{
              padding: '8px 16px',
              borderRadius: 'var(--radius-pill)',
              fontSize: '14px',
              fontWeight: 600,
              color: 'var(--text-primary)',
              textDecoration: 'none',
              transition: 'all var(--motion-fast)',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--surface-card)';
              e.currentTarget.style.color = 'var(--brand-emerald)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
              e.currentTarget.style.color = 'var(--text-primary)';
            }}
          >
            How It Works
          </a>

          <a
            href="/trust"
            style={{
              padding: '8px 16px',
              borderRadius: 'var(--radius-pill)',
              fontSize: '14px',
              fontWeight: 600,
              color: 'var(--text-primary)',
              textDecoration: 'none',
              transition: 'all var(--motion-fast)',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--surface-card)';
              e.currentTarget.style.color = 'var(--brand-emerald)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
              e.currentTarget.style.color = 'var(--text-primary)';
            }}
          >
            Trust &amp; Governance
          </a>
        </nav>

        {/* Right: Actions & Theme Toggle */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
          <ThemeToggle />

          <a
            href="/workspace"
            className="desktop-nav"
            style={{
              fontSize: '13px',
              fontWeight: 600,
              color: 'var(--text-secondary)',
              textDecoration: 'none',
              padding: '8px 12px',
            }}
          >
            For Businesses
          </a>

          <a
            href="/claim"
            className="header-cta"
            style={{
              padding: '9px 18px',
              borderRadius: 'var(--radius-pill)',
              backgroundColor: 'var(--action-primary)',
              color: '#ffffff',
              fontSize: '13px',
              fontWeight: 700,
              textDecoration: 'none',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              minHeight: '40px',
              boxShadow: 'var(--elevation-1)',
              transition: 'all var(--motion-fast)',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--action-hover)';
              e.currentTarget.style.transform = 'translateY(-1px)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--action-primary)';
              e.currentTarget.style.transform = 'none';
            }}
          >
            Claim Business →
          </a>

          {/* Mobile Navigation Drawer Trigger */}
          <MobileNav />
        </div>
      </div>
    </header>
  );
}
