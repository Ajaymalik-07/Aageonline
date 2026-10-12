'use client';

import React, { useEffect, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import type { WorkspaceContext } from '../../../types/workspace.ts';

export function WorkspaceNav() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const targetBizId = searchParams.get('businessId') || undefined;

  const [context, setContext] = useState<WorkspaceContext | null>(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);

  useEffect(() => {
    async function loadNavContext() {
      try {
        const { getActiveDevSession } = await import('../../../lib/auth/store.ts');
        const session = getActiveDevSession();

        if (!session) {
          router.replace(`/auth/login?returnUrl=${encodeURIComponent(pathname)}`);
          return;
        }

        const { resolveWorkspaceContext } = await import('../../../lib/workspace/store.ts');
        const ctx = await resolveWorkspaceContext(session.userId, targetBizId);
        setContext(ctx);
      } catch (err: unknown) {
        setAuthError(err instanceof Error ? err.message : 'Workspace access denied');
      } finally {
        setLoading(false);
      }
    }

    loadNavContext();
  }, [pathname, targetBizId, router]);

  const handleSignOut = async () => {
    const { setActiveDevUser } = await import('../../../lib/auth/store.ts');
    setActiveDevUser(null);
    router.replace('/auth/login');
  };

  const handleSwitchBusiness = (newBusinessId: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('businessId', newBusinessId);
    router.push(`${pathname}?${params.toString()}`);
  };

  if (loading) {
    return (
      <nav
        aria-label="Workspace Navigation"
        style={{
          backgroundColor: '#0B1F33',
          borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
          padding: '12px var(--container-gutter)',
        }}
      >
        <div style={{ maxWidth: 'var(--container-max)', margin: '0 auto', fontSize: 'var(--font-size-xs)', color: 'rgba(255, 255, 255, 0.6)' }}>
          Loading workspace session...
        </div>
      </nav>
    );
  }

  if (authError || !context) {
    return (
      <nav
        aria-label="Workspace Navigation"
        style={{
          backgroundColor: '#0B1F33',
          borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
          padding: '12px var(--container-gutter)',
        }}
      >
        <div
          style={{
            maxWidth: 'var(--container-max)',
            margin: '0 auto',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <span style={{ fontWeight: 800, color: '#EA580C', fontSize: 'var(--font-size-sm)' }}>
            AageOnline Business Workspace
          </span>
          <button
            onClick={() => router.push('/auth/login')}
            style={{
              backgroundColor: 'transparent',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              color: '#FFFFFF',
              padding: '6px 12px',
              borderRadius: 'var(--radius-pill)',
              fontSize: '12px',
              cursor: 'pointer',
            }}
          >
            Sign In Again
          </button>
        </div>
      </nav>
    );
  }

  const { currentBusiness, membership, currentUser, availableBusinesses } = context;

  const navLinks = [
    { label: 'Overview', href: targetBizId ? `/business/dashboard?businessId=${targetBizId}` : '/business/dashboard', active: pathname === '/business/dashboard' },
    { label: 'Business Profile', href: targetBizId ? `/business/dashboard/profile?businessId=${targetBizId}` : '/business/dashboard/profile', active: pathname === '/business/dashboard/profile' },
    { label: 'Markets & Positions', href: targetBizId ? `/business/dashboard/markets?businessId=${targetBizId}` : '/business/dashboard/markets', active: pathname === '/business/dashboard/markets' },
    { label: 'Ranking History', href: targetBizId ? `/business/dashboard/ranking-history?businessId=${targetBizId}` : '/business/dashboard/ranking-history', active: pathname === '/business/dashboard/ranking-history' },
    { label: 'Notifications', href: targetBizId ? `/business/dashboard/notifications?businessId=${targetBizId}` : '/business/dashboard/notifications', active: pathname === '/business/dashboard/notifications' },
  ];

  return (
    <nav
      aria-label="Workspace Navigation"
      style={{
        backgroundColor: '#0B1F33',
        borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
      }}
    >
      {/* Top Bar */}
      <div
        className="container"
        style={{
          paddingTop: '12px',
          paddingBottom: '12px',
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 'var(--space-3)',
        }}
      >
        {/* Brand & Business Selector */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', flexWrap: 'wrap' }}>
          <a
            href="/"
            style={{
              fontWeight: 900,
              color: '#FFFFFF',
              textDecoration: 'none',
              fontSize: 'var(--font-size-base)',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <span style={{ color: '#EA580C' }}>Aage</span>Online
            <span
              style={{
                fontSize: '10px',
                fontWeight: 800,
                backgroundColor: 'rgba(234, 88, 12, 0.15)',
                color: '#FB923C',
                padding: '2px 6px',
                borderRadius: '4px',
                textTransform: 'uppercase',
                letterSpacing: '0.04em',
              }}
            >
              Workspace
            </span>
          </a>

          <div style={{ height: '18px', width: '1px', backgroundColor: 'rgba(255, 255, 255, 0.15)' }} />

          {/* Business switcher / Current Business */}
          {availableBusinesses.length > 1 ? (
            <select
              value={currentBusiness.id}
              onChange={(e) => handleSwitchBusiness(e.target.value)}
              aria-label="Switch Business"
              style={{
                backgroundColor: 'rgba(255, 255, 255, 0.08)',
                color: '#FFFFFF',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                borderRadius: 'var(--radius-md)',
                padding: '4px 10px',
                fontSize: 'var(--font-size-xs)',
                fontWeight: 600,
                outline: 'none',
                cursor: 'pointer',
              }}
            >
              {availableBusinesses.map((item) => (
                <option key={item.business.id} value={item.business.id} style={{ backgroundColor: '#0B1F33' }}>
                  {item.business.name} ({item.membership.role})
                </option>
              ))}
            </select>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontWeight: 700, fontSize: 'var(--font-size-sm)', color: '#FFFFFF' }}>
                {currentBusiness.name}
              </span>
              <span
                style={{
                  fontSize: '10px',
                  fontWeight: 800,
                  padding: '2px 6px',
                  borderRadius: '4px',
                  backgroundColor:
                    currentBusiness.verificationStatus === 'VERIFIED'
                      ? 'rgba(34, 197, 94, 0.2)'
                      : 'rgba(255, 255, 255, 0.1)',
                  color: currentBusiness.verificationStatus === 'VERIFIED' ? '#4ADE80' : 'rgba(255, 255, 255, 0.6)',
                }}
              >
                {currentBusiness.verificationStatus}
              </span>
            </div>
          )}

          {/* Membership Role Pill */}
          <span
            style={{
              fontSize: '11px',
              fontWeight: 800,
              padding: '2px 8px',
              borderRadius: 'var(--radius-pill)',
              backgroundColor:
                membership.role === 'OWNER'
                  ? 'rgba(234, 88, 12, 0.2)'
                  : membership.role === 'ADMIN'
                  ? 'rgba(59, 130, 246, 0.2)'
                  : membership.role === 'FINANCE'
                  ? 'rgba(168, 85, 247, 0.2)'
                  : 'rgba(255, 255, 255, 0.12)',
              color:
                membership.role === 'OWNER'
                  ? '#FB923C'
                  : membership.role === 'ADMIN'
                  ? '#60A5FA'
                  : membership.role === 'FINANCE'
                  ? '#C084FC'
                  : 'rgba(255, 255, 255, 0.8)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
            }}
          >
            {membership.role}
          </span>
        </div>

        {/* User Profile & Sign Out */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
          <div style={{ fontSize: 'var(--font-size-xs)', textAlign: 'right' }}>
            <span style={{ display: 'block', fontWeight: 600, color: '#FFFFFF' }}>
              {currentUser.displayName || currentUser.email}
            </span>
            <span style={{ fontSize: '11px', color: 'rgba(255, 255, 255, 0.5)' }}>
              {currentUser.email}
            </span>
          </div>

          <button
            onClick={handleSignOut}
            style={{
              backgroundColor: 'rgba(255, 255, 255, 0.08)',
              color: 'rgba(255, 255, 255, 0.8)',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              padding: '6px 12px',
              borderRadius: 'var(--radius-pill)',
              fontSize: '11px',
              fontWeight: 700,
              cursor: 'pointer',
              transition: 'background-color 0.15s ease',
            }}
          >
            Sign Out
          </button>
        </div>
      </div>

      {/* Nav Tabs */}
      <div
        className="container"
        style={{
          display: 'flex',
          gap: 'var(--space-1)',
          borderTop: '1px solid rgba(255, 255, 255, 0.06)',
        }}
      >
        {navLinks.map((tab) => (
          <a
            key={tab.label}
            href={tab.href}
            style={{
              padding: '10px 16px',
              fontSize: 'var(--font-size-xs)',
              fontWeight: 700,
              color: tab.active ? '#EA580C' : 'rgba(255, 255, 255, 0.7)',
              borderBottom: tab.active ? '2px solid #EA580C' : '2px solid transparent',
              textDecoration: 'none',
              transition: 'color 0.15s ease',
            }}
          >
            {tab.label}
          </a>
        ))}
      </div>
    </nav>
  );
}
