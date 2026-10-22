'use client';

import React, { useState, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';

interface NavItem {
  label: string;
  href: string;
  icon: string;
  badge?: string;
}

interface NavGroup {
  title: string;
  items: NavItem[];
}

const NAV_GROUPS: NavGroup[] = [
  {
    title: 'OVERVIEW',
    items: [
      { label: 'Dashboard', href: '/', icon: '📊' },
    ],
  },
  {
    title: 'MARKETPLACE',
    items: [
      { label: 'Businesses', href: '/businesses', icon: '🏢' },
      { label: 'Locations', href: '/locations', icon: '📍' },
      { label: 'Categories', href: '/categories', icon: '🏷️' },
      { label: 'Markets', href: '/markets', icon: '🎯' },
      { label: 'Rankings', href: '/rankings', icon: '📈' },
      { label: 'Discovery', href: '/discovery', icon: '🔍' },
    ],
  },
  {
    title: 'LEAD GENERATION & OUTREACH',
    items: [
      { label: 'Lead Scraper', href: '/leads/scraper', icon: '🕷️', badge: 'NEW' },
      { label: 'Email Automation', href: '/leads/email-automation', icon: '✉️', badge: 'NEW' },
      { label: 'Lead Prospects', href: '/leads', icon: '🧲' },
    ],
  },
  {
    title: 'FINANCIAL OPS',
    items: [
      { label: 'Payments', href: '/payments', icon: '💳' },
      { label: 'Settlements', href: '/settlements', icon: '⚖️' },
      { label: 'Operations', href: '/operations', icon: '⚡' },
    ],
  },
  {
    title: 'CONTENT',
    items: [
      { label: 'Blog', href: '/blog', icon: '📰' },
      { label: 'Site Content CMS', href: '/content', icon: '📝' },
      { label: 'Newsletter', href: '/newsletter', icon: '✉️' },
    ],
  },
  {
    title: 'GROWTH & SEO',
    items: [
      { label: 'Analytics', href: '/analytics', icon: '📊' },
      { label: 'SEO Center', href: '/seo', icon: '🌐' },
      { label: 'Redirects', href: '/redirects', icon: '🔀' },
      { label: 'Sitemap & Robots', href: '/sitemap-robots', icon: '🗺️' },
    ],
  },
  {
    title: 'SYSTEM & GOVERNANCE',
    items: [
      { label: 'Notifications', href: '/notifications', icon: '🔔' },
      { label: 'Mail Config', href: '/mail', icon: '📬' },
      { label: 'Audit Trail', href: '/audit', icon: '📜' },
      { label: 'Users & Roles', href: '/users', icon: '👥' },
      { label: 'Settings', href: '/settings', icon: '⚙️' },
    ],
  },
];

interface UserProfile {
  id: string;
  email: string;
  name: string;
  role: string;
}

export default function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const isLoginPage = pathname === '/login';

  const [collapsed, setCollapsed] = useState(false);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loggingOut, setLoggingOut] = useState(false);
  const [unreadAlerts, setUnreadAlerts] = useState<number>(0);

  useEffect(() => {
    if (isLoginPage) return;

    // Fetch authenticated admin profile from session
    async function loadUserProfile() {
      try {
        const res = await fetch('/api/auth');
        if (res.ok) {
          const data = await res.json();
          if (data.authenticated && data.user) {
            setUser(data.user);
          }
        }
      } catch {
        // Handled silently
      }
    }

    async function loadAlerts() {
      try {
        const res = await fetch('/api/notifications');
        if (res.ok) {
          const data = await res.json();
          if (typeof data.unreadCount === 'number') {
            setUnreadAlerts(data.unreadCount);
          }
        }
      } catch {
        // Handled silently
      }
    }

    loadUserProfile();
    loadAlerts();
  }, [isLoginPage]);

  const navRef = React.useRef<HTMLElement>(null);

  // Auto-scroll the active navigation item into clear view on route change
  useEffect(() => {
    if (isLoginPage || !navRef.current) return;
    const activeEl = navRef.current.querySelector<HTMLElement>('[data-active="true"]');
    if (activeEl) {
      const timer = setTimeout(() => {
        activeEl.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
      }, 60);
      return () => clearTimeout(timer);
    }
  }, [pathname, isLoginPage]);

  // If on /login, render without shell
  if (isLoginPage) {
    return <>{children}</>;
  }

  const handleLogout = async () => {
    try {
      setLoggingOut(true);
      await fetch('/api/auth', { method: 'DELETE' });
      window.location.href = '/login';
    } catch {
      window.location.href = '/login';
    } finally {
      setLoggingOut(false);
    }
  };

  const getPageTitle = () => {
    if (pathname === '/') return 'Dashboard Overview';
    if (pathname === '/businesses') return 'Business Directory & Profiles';
    if (pathname === '/locations') return 'Location Hierarchy & Doorway Cities';
    if (pathname === '/categories') return 'Taxonomy & Business Categories';
    if (pathname === '/markets') return 'Markets & Atomic Ladders';
    if (pathname === '/rankings') return 'Current Ranking Positions';
    if (pathname === '/discovery') return 'Discovery Review & Approvals';
    if (pathname === '/payments') return 'Financial Transactions & Webhooks';
    if (pathname === '/settlements') return 'Settled Positions Ledger';
    if (pathname === '/operations') return 'Operations & Reconciliation';
    if (pathname === '/content') return 'Website Content & Disclosures';
    if (pathname === '/blog') return 'Blog Posts & Editorial Engine';
    if (pathname === '/newsletter') return 'Newsletter Subscribers & Consent';
    if (pathname === '/seo') return 'SEO / AEO / GEO Engine';
    if (pathname === '/sitemap-robots') return 'Sitemap & Robots Governance';
    if (pathname === '/analytics') return 'Traffic, Funnels & Telemetry';
    if (pathname === '/leads/scraper') return 'Lead Scraper & Discovery Engine';
    if (pathname === '/leads/email-automation') return 'Email Outreach & Automation Workspace';
    if (pathname === '/leads') return 'Lead Prospects Registry';
    if (pathname === '/notifications') return 'Operational Alerts & Heartbeats';
    if (pathname === '/mail') return 'Email Templates & Mail Server';
    if (pathname === '/audit') return 'Platform Immutable Audit Log';
    if (pathname === '/users') return 'Admin Directory & Roles';
    if (pathname === '/settings') return 'Platform Settings & Diagnostics';
    return 'Control Center';
  };

  const websiteUrl = process.env.NEXT_PUBLIC_WEBSITE_URL || 'http://localhost:3000';

  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: 'var(--bg-deep)' }}>
      {/* Sidebar Navigation */}
      <aside
        style={{
          width: collapsed ? '72px' : '260px',
          minWidth: collapsed ? '72px' : '260px',
          backgroundColor: 'var(--bg-card)',
          borderRight: '1px solid var(--border-subtle)',
          display: 'flex',
          flexDirection: 'column',
          position: 'sticky',
          top: 0,
          height: '100vh',
          maxHeight: '100vh',
          transition: 'width 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
          zIndex: 40,
        }}
      >
        {/* Brand Header */}
        <div
          style={{
            height: '64px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: collapsed ? 'center' : 'space-between',
            padding: collapsed ? '0' : '0 20px',
            borderBottom: '1px solid var(--border-subtle)',
          }}
        >
          {!collapsed ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '18px', fontWeight: 900, color: '#FFFFFF', letterSpacing: '-0.02em' }}>
                Aage<span style={{ color: 'var(--brand-highlight)' }}>Online</span>
              </span>
              <span
                style={{
                  fontSize: '9px',
                  fontWeight: 800,
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em',
                  padding: '2px 6px',
                  borderRadius: '4px',
                  backgroundColor: 'rgba(234, 88, 12, 0.2)',
                  color: 'var(--brand-highlight)',
                  border: '1px solid rgba(234, 88, 12, 0.3)',
                }}
              >
                ADMIN
              </span>
            </div>
          ) : (
            <span style={{ fontSize: '18px', fontWeight: 900, color: 'var(--brand-highlight)' }}>AO</span>
          )}

          <button
            onClick={() => setCollapsed(!collapsed)}
            title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--text-muted)',
              cursor: 'pointer',
              padding: '6px',
              borderRadius: '6px',
              display: collapsed ? 'none' : 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            ←
          </button>
        </div>

        {/* Navigation Groups */}
        <nav
          ref={navRef}
          aria-label="Admin Navigation"
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: collapsed ? '12px 6px' : '14px 10px',
            display: 'flex',
            flexDirection: 'column',
            gap: '14px',
            scrollbarWidth: 'thin',
            scrollbarColor: 'rgba(255, 255, 255, 0.2) transparent',
          }}
        >
          {NAV_GROUPS.map((group, groupIdx) => (
            <div key={groupIdx}>
              {!collapsed && (
                <div
                  style={{
                    fontSize: '10px',
                    fontWeight: 700,
                    letterSpacing: '0.08em',
                    color: 'var(--text-dim)',
                    padding: '0 8px 6px 8px',
                    textTransform: 'uppercase',
                  }}
                >
                  {group.title}
                </div>
              )}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                {group.items.map((item) => {
                  const isExact = pathname === item.href;
                  const isLongerMatch = NAV_GROUPS.some((g) =>
                    g.items.some(
                      (other) =>
                        other.href !== item.href &&
                        other.href.startsWith(item.href) &&
                        (pathname === other.href || pathname.startsWith(other.href + '/'))
                    )
                  );
                  const isActive = isExact || (item.href !== '/' && pathname.startsWith(item.href + '/') && !isLongerMatch);
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      data-active={isActive ? 'true' : 'false'}
                      aria-current={isActive ? 'page' : undefined}
                      title={collapsed ? item.label : undefined}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: collapsed ? 0 : '10px',
                        justifyContent: collapsed ? 'center' : 'flex-start',
                        padding: collapsed ? '8px 0' : '7px 10px',
                        borderRadius: 'var(--radius-sm)',
                        fontSize: '13px',
                        fontWeight: isActive ? 700 : 500,
                        color: isActive ? '#FFFFFF' : 'var(--text-muted)',
                        backgroundColor: isActive
                          ? 'rgba(234, 88, 12, 0.18)'
                          : 'transparent',
                        borderLeft: isActive
                          ? '3px solid var(--brand-primary)'
                          : '3px solid transparent',
                        boxShadow: isActive
                          ? 'inset 0 0 10px rgba(234, 88, 12, 0.12)'
                          : 'none',
                        transition: 'all 0.15s ease',
                      }}
                    >
                      <span style={{ fontSize: '15px' }}>{item.icon}</span>
                      {!collapsed && <span>{item.label}</span>}
                      {!collapsed && item.badge && (
                        <span
                          style={{
                            marginLeft: 'auto',
                            fontSize: '9px',
                            fontWeight: 800,
                            padding: '1px 5px',
                            borderRadius: '4px',
                            backgroundColor: isActive ? 'var(--brand-highlight)' : 'rgba(234, 88, 12, 0.2)',
                            color: isActive ? '#071526' : 'var(--brand-highlight)',
                            letterSpacing: '0.04em',
                          }}
                        >
                          {item.badge}
                        </span>
                      )}
                      {isActive && !collapsed && !item.badge && (
                        <span
                          style={{
                            marginLeft: 'auto',
                            width: '6px',
                            height: '6px',
                            borderRadius: '50%',
                            backgroundColor: 'var(--brand-highlight)',
                            boxShadow: '0 0 8px var(--brand-highlight)',
                          }}
                        />
                      )}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* Sidebar Footer */}
        <div
          style={{
            padding: collapsed ? '12px 6px' : '14px 16px',
            borderTop: '1px solid var(--border-subtle)',
            backgroundColor: 'rgba(0, 0, 0, 0.15)',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
          }}
        >
          {!collapsed ? (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)' }}>
                  AageOnline Control Center
                </div>
                <div style={{ fontSize: '10px', color: 'var(--text-dim)' }}>Decoupled REST (:3001)</div>
              </div>
              <button
                onClick={() => setCollapsed(true)}
                title="Collapse sidebar"
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--text-dim)',
                  cursor: 'pointer',
                  fontSize: '12px',
                }}
              >
                ◀
              </button>
            </div>
          ) : (
            <button
              onClick={() => setCollapsed(false)}
              title="Expand sidebar"
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--text-muted)',
                cursor: 'pointer',
                textAlign: 'center',
                padding: '4px',
              }}
            >
              ▶
            </button>
          )}
        </div>
      </aside>

      {/* Main Container */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, overflowX: 'hidden' }}>
        {/* Top Header / Toolbar */}
        <header
          role="banner"
          style={{
            height: '64px',
            backgroundColor: 'var(--bg-card)',
            borderBottom: '1px solid var(--border-subtle)',
            padding: '0 24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '16px',
            position: 'sticky',
            top: 0,
            zIndex: 30,
          }}
        >
          {/* Breadcrumb / Title */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ fontSize: '15px', fontWeight: 700, color: '#FFFFFF' }}>
              {getPageTitle()}
            </span>
            <span style={{ color: 'var(--text-dim)', fontSize: '13px' }}>/</span>
            <span style={{ color: 'var(--text-dim)', fontSize: '12px' }}>Control Center</span>
          </div>

          {/* Right Toolbar Controls */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            {/* System Status Indicator */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '4px 10px',
                borderRadius: '9999px',
                backgroundColor: 'rgba(16, 185, 129, 0.1)',
                border: '1px solid rgba(16, 185, 129, 0.25)',
                fontSize: '11px',
                color: '#34D399',
                fontWeight: 600,
              }}
            >
              <span
                style={{
                  width: '6px',
                  height: '6px',
                  borderRadius: '50%',
                  backgroundColor: '#10B981',
                  boxShadow: '0 0 6px #10B981',
                }}
              />
              API (:4000)
            </div>

            {/* Notification Bell */}
            <Link
              href="/notifications"
              title="Operational Alerts"
              style={{
                position: 'relative',
                padding: '6px 10px',
                borderRadius: 'var(--radius-sm)',
                backgroundColor: 'rgba(255, 255, 255, 0.04)',
                border: '1px solid var(--border-subtle)',
                color: 'var(--text-muted)',
                fontSize: '14px',
                display: 'flex',
                alignItems: 'center',
              }}
            >
              🔔
              {unreadAlerts > 0 && (
                <span
                  style={{
                    position: 'absolute',
                    top: '-4px',
                    right: '-4px',
                    backgroundColor: 'var(--brand-primary)',
                    color: '#FFFFFF',
                    borderRadius: '9999px',
                    fontSize: '9px',
                    fontWeight: 800,
                    padding: '1px 5px',
                  }}
                >
                  {unreadAlerts}
                </span>
              )}
            </Link>

            {/* Public Site Link */}
            <a
              href={websiteUrl}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                fontSize: '12px',
                fontWeight: 600,
                color: 'var(--brand-highlight)',
                padding: '5px 12px',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid rgba(234, 88, 12, 0.3)',
                backgroundColor: 'rgba(234, 88, 12, 0.08)',
                transition: 'background-color 0.15s ease',
              }}
            >
              Public Site ↗
            </a>

            {/* User Profile Pill */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                padding: '4px 10px 4px 6px',
                borderRadius: '9999px',
                backgroundColor: 'rgba(255, 255, 255, 0.04)',
                border: '1px solid var(--border-subtle)',
              }}
            >
              <div
                style={{
                  width: '28px',
                  height: '28px',
                  borderRadius: '50%',
                  backgroundColor: 'var(--brand-primary)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '12px',
                  fontWeight: 800,
                  color: '#FFFFFF',
                }}
              >
                {user?.name ? user.name.slice(0, 2).toUpperCase() : 'AD'}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span style={{ fontSize: '12px', fontWeight: 700, color: '#FFFFFF', lineHeight: 1.2 }}>
                  {user?.name || 'Administrator'}
                </span>
                <span style={{ fontSize: '10px', color: 'var(--text-dim)', lineHeight: 1 }}>
                  {user?.role || 'SUPER_ADMIN'}
                </span>
              </div>
            </div>

            {/* Logout Button */}
            <button
              onClick={handleLogout}
              disabled={loggingOut}
              title="Sign out of administration"
              style={{
                padding: '6px 12px',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--border-subtle)',
                backgroundColor: 'rgba(255, 255, 255, 0.05)',
                color: 'var(--text-muted)',
                fontSize: '12px',
                fontWeight: 600,
                cursor: loggingOut ? 'not-allowed' : 'pointer',
                transition: 'all 0.15s ease',
              }}
            >
              {loggingOut ? 'Signing out...' : 'Sign Out'}
            </button>
          </div>
        </header>

        {/* Content Body */}
        <main
          role="main"
          style={{
            flex: 1,
            padding: '28px 32px',
            overflowY: 'auto',
            maxWidth: '1600px',
            width: '100%',
            boxSizing: 'border-box',
          }}
        >
          {children}
        </main>
      </div>
    </div>
  );
}
