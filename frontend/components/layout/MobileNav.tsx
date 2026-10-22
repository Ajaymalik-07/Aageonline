'use client';

import React, { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { siteConfig } from '../../config/site';
import { lockScroll, unlockScroll } from '../../lib/performance/scroll';

export interface MobileNavProps {
  currentUser?: { id: string; phone?: string; displayName?: string } | null;
  onSignOut?: (e: React.MouseEvent) => void;
}

export function MobileNav({ currentUser, onSignOut }: MobileNavProps = {}) {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (isOpen) {
      lockScroll();
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape') setIsOpen(false);
      };
      window.addEventListener('keydown', handleKeyDown);
      return () => {
        unlockScroll();
        window.removeEventListener('keydown', handleKeyDown);
      };
    }
  }, [isOpen]);

  return (
    <>
      {/* Mobile Hamburger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        aria-label="Open Navigation Menu"
        aria-expanded={isOpen}
        aria-controls="mobile-navigation-drawer"
        className="mobile-nav-toggle"
        style={{
          display: 'none',
          alignItems: 'center',
          justifyContent: 'center',
          minWidth: '40px',
          minHeight: '40px',
          padding: '8px',
          borderRadius: 'var(--radius-pill)',
          border: '1px solid var(--border-subtle, #E5E7EB)',
          backgroundColor: 'rgba(241, 245, 249, 0.85)',
          color: 'var(--text-primary, #111827)',
          cursor: 'pointer',
          transition: 'all 0.15s ease',
        }}
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <line x1="3" y1="12" x2="21" y2="12" />
          <line x1="3" y1="6" x2="21" y2="6" />
          <line x1="3" y1="18" x2="21" y2="18" />
        </svg>
      </button>

      {/* Backdrop */}
      {isOpen && (
        <div
          onClick={() => setIsOpen(false)}
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(11, 31, 59, 0.65)',
            backdropFilter: 'blur(2px)',
            zIndex: 9998,
            transition: 'opacity 0.2s ease',
          }}
          aria-hidden="true"
        />
      )}

      {/* Drawer */}
      <div
        id="mobile-navigation-drawer"
        role="dialog"
        aria-modal="true"
        aria-label="Navigation Menu"
        style={{
          position: 'fixed',
          top: 0,
          right: 0,
          bottom: 0,
          width: '85%',
          maxWidth: '340px',
          backgroundColor: 'var(--surface-card)',
          boxShadow: 'var(--elevation-3)',
          zIndex: 9999,
          transform: isOpen ? 'translateX(0)' : 'translateX(100%)',
          transition: 'transform 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
          display: 'flex',
          flexDirection: 'column',
          padding: 'var(--space-6)',
          overflowY: 'auto',
        }}
      >
        {/* Drawer Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: 'var(--space-6)',
            paddingBottom: 'var(--space-4)',
            borderBottom: '1px solid var(--border-subtle)',
          }}
        >
          <div>
            <span style={{ fontSize: '18px', fontWeight: 900, color: 'var(--text-primary)' }}>
              Aage<span style={{ color: '#EA580C' }}>Online</span>
            </span>
            <span style={{ display: 'block', fontSize: '11px', color: 'var(--text-secondary)' }}>
              {siteConfig.tagline}
            </span>
          </div>

          <button
            type="button"
            onClick={() => setIsOpen(false)}
            aria-label="Close Navigation Menu"
            style={{
              minWidth: '44px',
              minHeight: '44px',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: 'transparent',
              border: 'none',
              color: 'var(--text-primary)',
              cursor: 'pointer',
              borderRadius: 'var(--radius-sm)',
            }}
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Navigation Links */}
        <nav aria-label="Mobile Navigation Links" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
          {siteConfig.nav.public
            .filter((item) => item.href !== '/business/claim')
            .map((item) => {
              const isHome = pathname === '/' || pathname === '';
              const resolvedHref = isHome && item.href.startsWith('/#') ? item.href.replace('/', '') : item.href;
              const isActive =
                item.href === pathname ||
                ((item.href as string) !== '/' && !item.href.includes('#') && (pathname?.startsWith(item.href) ?? false));

              return (
                <a
                  key={item.href}
                  href={resolvedHref}
                  onClick={(e) => {
                    setIsOpen(false);
                    if (isHome && resolvedHref.startsWith('#')) {
                      e.preventDefault();
                      const targetEl = document.querySelector(resolvedHref);
                      if (targetEl) {
                        targetEl.scrollIntoView({ behavior: 'smooth' });
                        window.history.pushState(null, '', resolvedHref);
                      }
                    }
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    minHeight: '48px',
                    padding: '0 var(--space-4)',
                    borderRadius: 'var(--radius-md)',
                    color: isActive ? '#EA580C' : 'var(--text-primary)',
                    backgroundColor: isActive ? 'rgba(234, 88, 12, 0.1)' : 'transparent',
                    fontSize: '15px',
                    fontWeight: isActive ? 700 : 600,
                    textDecoration: 'none',
                    transition: 'all var(--motion-fast)',
                  }}
                >
                  {item.label === 'Live Rankings' && (
                    <span
                      style={{
                        width: '6px',
                        height: '6px',
                        borderRadius: '50%',
                        backgroundColor: '#22C55E',
                        boxShadow: '0 0 6px rgba(34, 197, 94, 0.8)',
                        display: 'inline-block',
                      }}
                      aria-hidden="true"
                    />
                  )}
                  {item.label}
                </a>
              );
            })}
        </nav>

        {/* Business Workspace CTA */}
        <div style={{ marginTop: 'auto', paddingTop: 'var(--space-6)', borderTop: '1px solid var(--border-subtle)' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <a
              href="/business/claim"
              onClick={() => setIsOpen(false)}
              className="aage-button"
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                minHeight: '48px',
                borderRadius: 'var(--radius-pill)',
                backgroundColor: '#EA580C',
                color: '#ffffff',
                fontSize: '14px',
                fontWeight: 700,
                textDecoration: 'none',
                boxShadow: '0 2px 8px rgba(234, 88, 12, 0.25)',
              }}
            >
              Claim Business →
            </a>
            {currentUser && (
              <button
                type="button"
                onClick={(e) => {
                  setIsOpen(false);
                  onSignOut?.(e);
                }}
                style={{
                  minHeight: '40px',
                  borderRadius: 'var(--radius-pill)',
                  backgroundColor: 'rgba(15, 23, 42, 0.05)',
                  color: 'var(--text-secondary, #475569)',
                  fontSize: '13px',
                  fontWeight: 600,
                  border: '1px solid var(--border-subtle, #E5E7EB)',
                  cursor: 'pointer',
                }}
              >
                Sign Out ({currentUser.phone || 'Owner'})
              </button>
            )}
          </div>

          <p style={{ marginTop: 'var(--space-3)', fontSize: '11px', color: 'var(--text-tertiary)', textAlign: 'center' }}>
            Paid competitive visibility platform
          </p>
        </div>
      </div>
    </>
  );
}
