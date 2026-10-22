'use client';

import React, { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { MobileNav } from './MobileNav';

export function Header() {
  const pathname = usePathname();
  const [isScrolled, setIsScrolled] = useState(false);
  const [activeHash, setActiveHash] = useState<string>('');
  const [currentUser, setCurrentUser] = useState<{ id: string; phone?: string; displayName?: string } | null>(null);

  useEffect(() => {
    let isMounted = true;
    async function checkAuth() {
      try {
        const res = await fetch('/api/auth/me');
        if (res.ok) {
          const data = await res.json();
          if (isMounted && data.user) {
            setCurrentUser(data.user);
          }
        } else {
          if (isMounted) {
            setCurrentUser(null);
          }
        }
      } catch {
        if (isMounted) {
          setCurrentUser(null);
        }
      }
    }
    checkAuth();
    return () => {
      isMounted = false;
    };
  }, [pathname]);

  const handleHeaderSignOut = async (e: React.MouseEvent) => {
    e.preventDefault();
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch {
      // safe fallback
    }
    setCurrentUser(null);
    window.location.href = '/business/claim';
  };

  useEffect(() => {
    const sectionIds = ['markets', 'categories', 'cities', 'rankings', 'how-it-works', 'trust'];

    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);

      // On homepage, dynamically track the visible section as user scrolls up or down
      if (pathname === '/' || pathname === '') {
        const headerOffset = 130;
        let activeId = '';

        for (const id of sectionIds) {
          const el = document.getElementById(id);
          if (el) {
            const rect = el.getBoundingClientRect();
            // Section top is at or above viewport trigger line and section bottom is below it
            if (rect.top <= headerOffset && rect.bottom > headerOffset) {
              activeId = `#${id}`;
              break;
            }
          }
        }

        // If near top of page (hero), clear highlight
        if (window.scrollY < 100) {
          activeId = '';
        } else if (!activeId) {
          // Bottom fallback: if scrolled near or past bottom of page
          for (let i = sectionIds.length - 1; i >= 0; i--) {
            const el = document.getElementById(sectionIds[i]);
            if (el && el.getBoundingClientRect().top <= headerOffset + 120) {
              activeId = `#${sectionIds[i]}`;
              break;
            }
          }
        }

        setActiveHash(activeId);
      }
    };

    const handleHashChange = () => {
      if (typeof window !== 'undefined' && window.location.hash) {
        setActiveHash(window.location.hash);
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('hashchange', handleHashChange);
    handleScroll();

    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('hashchange', handleHashChange);
    };
  }, [pathname]);

  // Suppress public marketing header inside dedicated Business Workspace routes
  if (pathname?.startsWith('/business/dashboard')) {
    return null;
  }

  const isHome = pathname === '/' || pathname === '';

  const navLinks = [
    {
      label: 'Markets',
      href: isHome ? '#markets' : '/#markets',
      hash: '#markets',
      isActive: isHome && activeHash === '#markets',
    },
    {
      label: 'Categories',
      href: isHome ? '#categories' : '/#categories',
      hash: '#categories',
      isActive: isHome && activeHash === '#categories',
    },
    {
      label: 'Cities',
      href: isHome ? '#cities' : '/#cities',
      hash: '#cities',
      isActive: isHome && activeHash === '#cities',
    },
    {
      label: 'Live Rankings',
      href: isHome ? '#rankings' : '/#rankings',
      hash: '#rankings',
      isActive: isHome && activeHash === '#rankings',
      isLive: true,
    },
    {
      label: 'How It Works',
      href: isHome ? '#how-it-works' : '/#how-it-works',
      hash: '#how-it-works',
      isActive: isHome && activeHash === '#how-it-works',
    },
    {
      label: 'Trust & Governance',
      href: isHome ? '#trust' : '/#trust',
      hash: '#trust',
      isActive: isHome && activeHash === '#trust',
    },
  ];

  return (
    <header
      role="banner"
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 100,
        transition: 'all var(--motion-normal)',
        backgroundColor: isScrolled ? 'rgba(255, 255, 255, 0.96)' : 'rgba(255, 255, 255, 0.92)',
        borderBottom: '1px solid var(--border-subtle, #E5E7EB)',
        boxShadow: isScrolled
          ? '0 4px 20px -2px rgba(15, 23, 42, 0.08), 0 1px 3px rgba(15, 23, 42, 0.05)'
          : '0 1px 2px rgba(15, 23, 42, 0.03)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
      }}
    >
      <style>{`
        header[role="banner"] .aage-nav-link:hover {
          color: var(--text-primary, #111827) !important;
          background-color: rgba(255, 255, 255, 0.95) !important;
        }
        header[role="banner"] .aage-nav-link.is-active:hover {
          color: #EA580C !important;
          background-color: #FFFFFF !important;
        }
        .header-cta:hover {
          background-color: #C2410C !important;
          transform: translateY(-1px);
          box-shadow: 0 4px 16px rgba(234, 88, 12, 0.4) !important;
        }
        .header-cta:active {
          transform: translateY(0);
        }
      `}</style>
      <div
        className="container"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          height: isScrolled ? '64px' : '70px',
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
              gap: '10px',
            }}
          >
            <span
              style={{
                fontSize: '22px',
                fontWeight: 900,
                letterSpacing: '-0.025em',
                color: 'var(--text-primary, #111827)',
                display: 'inline-flex',
                alignItems: 'center',
              }}
            >
              Aage<span style={{ color: '#EA580C' }}>Online</span>
            </span>

            <span
              style={{
                fontSize: '10px',
                fontWeight: 800,
                letterSpacing: '0.06em',
                textTransform: 'uppercase',
                padding: '3px 9px',
                borderRadius: 'var(--radius-pill)',
                backgroundColor: 'rgba(234, 88, 12, 0.08)',
                color: '#EA580C',
                border: '1px solid rgba(234, 88, 12, 0.22)',
              }}
              className="desktop-nav"
            >
              Market Platform
            </span>
          </a>
        </div>

        {/* Center: Primary Navigation with In-Page Smooth Scroll */}
        <nav
          aria-label="Primary Navigation"
          className="desktop-nav"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '2px',
            padding: '4px 6px',
            borderRadius: 'var(--radius-pill)',
            backgroundColor: 'rgba(241, 245, 249, 0.85)',
            border: '1px solid var(--border-subtle, #E5E7EB)',
            boxShadow: 'inset 0 1px 2px rgba(0, 0, 0, 0.03)',
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
          }}
        >
          {navLinks.map((item) => (
            <a
              key={item.label}
              href={item.href}
              onClick={(e) => {
                if (isHome && item.hash) {
                  e.preventDefault();
                  const targetEl = document.querySelector(item.hash);
                  if (targetEl) {
                    targetEl.scrollIntoView({ behavior: 'smooth' });
                    window.history.pushState(null, '', item.hash);
                    setActiveHash(item.hash);
                  }
                } else {
                  setActiveHash(item.hash);
                }
              }}
              className={`aage-nav-link ${item.isActive ? 'is-active' : ''}`}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '7px 14px',
                borderRadius: 'var(--radius-pill)',
                fontSize: '13px',
                fontWeight: item.isActive ? 700 : 500,
                color: item.isActive ? '#EA580C' : 'var(--text-secondary, #475569)',
                backgroundColor: item.isActive ? '#FFFFFF' : 'transparent',
                border: item.isActive ? '1px solid rgba(234, 88, 12, 0.22)' : '1px solid transparent',
                boxShadow: item.isActive ? '0 1px 3px rgba(0, 0, 0, 0.06)' : 'none',
                textDecoration: 'none',
                transition: 'all var(--motion-fast)',
              }}
            >
              {item.isLive && (
                <span
                  style={{
                    width: '6px',
                    height: '6px',
                    borderRadius: '50%',
                    backgroundColor: '#22C55E',
                    boxShadow: '0 0 8px rgba(34, 197, 94, 0.9)',
                    display: 'inline-block',
                  }}
                  aria-hidden="true"
                />
              )}
              {item.label}
            </a>
          ))}
        </nav>

        {/* Right: Actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
          <a
            href="/business/claim"
            className="header-cta aage-button desktop-nav"
            style={{
              padding: '9px 18px',
              borderRadius: 'var(--radius-pill)',
              backgroundColor: '#EA580C',
              color: '#ffffff',
              fontSize: '13px',
              fontWeight: 700,
              textDecoration: 'none',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              minHeight: '40px',
              border: 'none',
              boxShadow: '0 2px 10px rgba(234, 88, 12, 0.3)',
              transition: 'all var(--motion-fast)',
            }}
          >
            Claim Business →
          </a>

          {currentUser && (
            <button
              type="button"
              onClick={handleHeaderSignOut}
              aria-label="Sign out of business account"
              className="desktop-nav"
              style={{
                padding: '8px 14px',
                borderRadius: 'var(--radius-pill)',
                backgroundColor: 'rgba(15, 23, 42, 0.05)',
                color: 'var(--text-secondary, #475569)',
                fontSize: '12px',
                fontWeight: 600,
                border: '1px solid var(--border-subtle, #E5E7EB)',
                cursor: 'pointer',
                transition: 'all var(--motion-fast)',
              }}
            >
              Sign Out
            </button>
          )}

          {/* Mobile Navigation Drawer Trigger */}
          <MobileNav
            currentUser={currentUser}
            onSignOut={handleHeaderSignOut}
          />
        </div>
      </div>
    </header>
  );
}
