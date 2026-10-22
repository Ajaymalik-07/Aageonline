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
        let userId: string | null = null;

        try {
          const res = await fetch('/api/auth/me');
          if (res.ok) {
            const data = await res.json();
            if (data.user) {
              userId = data.user.id;
              const { registerUserInStore, setActiveDevUser: setDevUser } = await import('../../../lib/auth/store.ts');
              registerUserInStore(data.user);
              if (process.env.NODE_ENV !== 'production') {
                setDevUser(data.user.id);
              }
              if (data.businesses && Array.isArray(data.businesses)) {
                const { registerBusinessInStore, getBusinessById } = await import('../../../lib/taxonomy/businesses.ts');
                const { registerMembershipInStore } = await import('../../../lib/memberships/store.ts');
                for (const b of data.businesses) {
                  if (!getBusinessById(b.id)) {
                    registerBusinessInStore({
                      id: b.id,
                      slug: b.slug,
                      name: b.name,
                      legalName: b.legalName,
                      description: b.description || b.name,
                      primaryCityId: b.cityName,
                      verificationStatus: b.verificationStatus,
                      publicationStatus: b.publicationStatus,
                      phone: b.phone,
                      socialLinks: { whatsapp: b.whatsappPhone },
                      createdAt: b.createdAt || new Date().toISOString(),
                      updatedAt: b.createdAt || new Date().toISOString(),
                    });
                  }
                  registerMembershipInStore({
                    id: `mem-${b.id}-${data.user.id}`,
                    businessId: b.id,
                    userId: data.user.id,
                    role: (b.role as any) || 'OWNER',
                    status: 'ACTIVE',
                    createdAt: b.createdAt || new Date().toISOString(),
                    updatedAt: b.createdAt || new Date().toISOString(),
                  });
                }
              }
            }
          }
        } catch {
          // fallback
        }

        if (!userId) {
          const { getActiveDevSession } = await import('../../../lib/auth/store.ts');
          const session = getActiveDevSession();
          if (session) {
            userId = session.userId;
          }
        }

        if (!userId) {
          router.replace(`/business/claim?returnUrl=${encodeURIComponent(pathname)}`);
          return;
        }

        const { resolveWorkspaceContext } = await import('../../../lib/workspace/store.ts');
        let ctx;
        try {
          ctx = await resolveWorkspaceContext(userId, targetBizId);
        } catch (firstErr) {
          if (targetBizId) {
            try {
              ctx = await resolveWorkspaceContext(userId);
            } catch {
              throw firstErr;
            }
          } else {
            throw firstErr;
          }
        }
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
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch {
      // safe fallback
    }
    try {
      const { setActiveDevUser } = await import('../../../lib/auth/store.ts');
      setActiveDevUser(null);
    } catch {
      // safe fallback
    }
    router.replace('/business/claim');
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
          backgroundColor: '#FFFFFF',
          borderBottom: '1px solid #E2E8F0',
          padding: '14px var(--container-gutter)',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04)',
        }}
      >
        <div
          style={{
            maxWidth: 'var(--container-max)',
            margin: '0 auto',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '20px', fontWeight: 900, color: '#0F172A', letterSpacing: '-0.025em' }}>
              Aage<span style={{ color: '#EA580C' }}>Online</span>
            </span>
            <span
              style={{
                fontSize: '11px',
                fontWeight: 800,
                textTransform: 'uppercase',
                padding: '3px 9px',
                borderRadius: 'var(--radius-pill)',
                backgroundColor: '#FFF7ED',
                color: '#EA580C',
                border: '1px solid #FED7AA',
              }}
            >
              Workspace
            </span>
          </div>
          <div style={{ fontSize: 'var(--font-size-xs)', color: '#64748B', fontWeight: 600 }}>
            Loading workspace session...
          </div>
        </div>
      </nav>
    );
  }

  if (authError || !context) {
    return (
      <nav
        aria-label="Workspace Navigation"
        style={{
          backgroundColor: '#FFFFFF',
          borderBottom: '1px solid #E2E8F0',
          padding: '14px var(--container-gutter)',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04)',
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
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '20px', fontWeight: 900, color: '#0F172A', letterSpacing: '-0.025em' }}>
              Aage<span style={{ color: '#EA580C' }}>Online</span>
            </span>
            <span
              style={{
                fontSize: '11px',
                fontWeight: 800,
                textTransform: 'uppercase',
                padding: '3px 9px',
                borderRadius: 'var(--radius-pill)',
                backgroundColor: '#FFF7ED',
                color: '#EA580C',
                border: '1px solid #FED7AA',
              }}
            >
              Workspace
            </span>
          </div>
          <button
            onClick={() => router.push('/business/claim')}
            style={{
              backgroundColor: '#EA580C',
              border: 'none',
              color: '#FFFFFF',
              padding: '7px 18px',
              borderRadius: 'var(--radius-pill)',
              fontSize: '13px',
              fontWeight: 700,
              cursor: 'pointer',
              boxShadow: '0 2px 10px rgba(234, 88, 12, 0.25)',
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
    {
      label: 'Overview',
      purpose: 'Live Visibility',
      icon: '📊',
      href: targetBizId ? `/business/dashboard?businessId=${targetBizId}` : '/business/dashboard',
      active: pathname === '/business/dashboard',
    },
    {
      label: 'Business Profile',
      purpose: 'Showcase & Socials',
      icon: '🏢',
      href: targetBizId ? `/business/dashboard/profile?businessId=${targetBizId}` : '/business/dashboard/profile',
      active: pathname === '/business/dashboard/profile',
    },
    {
      label: 'Markets & Positions',
      purpose: 'Compete & Rank',
      icon: '🎯',
      href: targetBizId ? `/business/dashboard/markets?businessId=${targetBizId}` : '/business/dashboard/markets',
      active: pathname === '/business/dashboard/markets',
    },
    {
      label: 'Ranking History',
      purpose: 'Audit & Log',
      icon: '📜',
      href: targetBizId ? `/business/dashboard/ranking-history?businessId=${targetBizId}` : '/business/dashboard/ranking-history',
      active: pathname === '/business/dashboard/ranking-history',
    },
    {
      label: 'Notifications',
      purpose: 'Position Alerts',
      icon: '🔔',
      href: targetBizId ? `/business/dashboard/notifications?businessId=${targetBizId}` : '/business/dashboard/notifications',
      active: pathname === '/business/dashboard/notifications',
    },
  ];

  const hasRealName = Boolean(
    currentUser.displayName &&
    currentUser.displayName !== 'Business Owner' &&
    !currentUser.displayName.startsWith('Partner (')
  );
  const ownerDisplayName = hasRealName ? currentUser.displayName! : 'Business Owner';
  const hasRealEmail = Boolean(
    currentUser.email &&
    !currentUser.email.includes('@owner.aageonline.in') &&
    !currentUser.email.includes('@mobile.aageonline.com')
  );
  const ownerDisplayEmail = hasRealEmail ? currentUser.email! : 'Not added';
  const ownerDisplayPhone = currentUser.phone ? `+91 ${currentUser.phone.replace(/^\+?91/, '')}` : null;
  const userInitial = (hasRealName ? ownerDisplayName : (ownerDisplayPhone ? 'O' : 'U')).charAt(0).toUpperCase();

  return (
    <div
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 100,
        backgroundColor: 'rgba(255, 255, 255, 0.96)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        borderBottom: '1px solid #E2E8F0',
        boxShadow: '0 2px 12px rgba(15, 23, 42, 0.04)',
      }}
    >
      {/* Top Bar: Brand, Business Context & User Controls */}
      <div
        className="container"
        style={{
          paddingTop: '10px',
          paddingBottom: '10px',
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 'var(--space-3)',
        }}
      >
        {/* Left: Brand & Business Switcher */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', flexWrap: 'wrap' }}>
          <a
            href="/"
            aria-label="AageOnline Homepage"
            style={{
              textDecoration: 'none',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            <span
              style={{
                fontSize: '22px',
                fontWeight: 900,
                letterSpacing: '-0.03em',
                color: '#0F172A',
                display: 'inline-flex',
                alignItems: 'center',
              }}
            >
              Aage<span style={{ color: '#EA580C' }}>Online</span>
            </span>

            <span
              style={{
                fontSize: '11px',
                fontWeight: 800,
                letterSpacing: '0.05em',
                textTransform: 'uppercase',
                padding: '3px 9px',
                borderRadius: 'var(--radius-pill)',
                backgroundColor: '#FFF7ED',
                color: '#EA580C',
                border: '1px solid #FED7AA',
              }}
            >
              Workspace
            </span>
          </a>

          <div style={{ height: '20px', width: '1px', backgroundColor: '#E2E8F0' }} />

          {/* Business Switcher / Current Active Business */}
          {availableBusinesses.length > 1 ? (
            <div style={{ position: 'relative', display: 'inline-flex', alignItems: 'center' }}>
              <select
                value={currentBusiness.id}
                onChange={(e) => handleSwitchBusiness(e.target.value)}
                aria-label="Switch Business"
                style={{
                  backgroundColor: '#FFFFFF',
                  color: '#0F172A',
                  border: '1px solid #CBD5E1',
                  borderRadius: 'var(--radius-pill)',
                  padding: '6px 28px 6px 12px',
                  fontSize: '13px',
                  fontWeight: 700,
                  outline: 'none',
                  cursor: 'pointer',
                  appearance: 'none',
                  WebkitAppearance: 'none',
                  boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)',
                }}
              >
                {availableBusinesses.map((item) => (
                  <option key={item.business.id} value={item.business.id}>
                    {item.business.name} ({item.membership.role})
                  </option>
                ))}
              </select>
              <span
                style={{
                  position: 'absolute',
                  right: '11px',
                  pointerEvents: 'none',
                  fontSize: '10px',
                  color: '#64748B',
                }}
              >
                ▼
              </span>
            </div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontWeight: 800, fontSize: '14px', color: '#0F172A' }}>
                {currentBusiness.name}
              </span>
              <span
                style={{
                  fontSize: '11px',
                  fontWeight: 800,
                  padding: '2px 8px',
                  borderRadius: 'var(--radius-pill)',
                  backgroundColor:
                    currentBusiness.verificationStatus === 'VERIFIED'
                      ? '#ECFDF5'
                      : '#F1F5F9',
                  color: currentBusiness.verificationStatus === 'VERIFIED' ? '#059669' : '#64748B',
                  border:
                    currentBusiness.verificationStatus === 'VERIFIED'
                      ? '1px solid #A7F3D0'
                      : '1px solid #CBD5E1',
                }}
              >
                {currentBusiness.verificationStatus === 'VERIFIED' ? 'Verified ✓' : currentBusiness.verificationStatus}
              </span>
            </div>
          )}

          {/* Membership Role Pill */}
          <span
            style={{
              fontSize: '11px',
              fontWeight: 800,
              padding: '3px 10px',
              borderRadius: 'var(--radius-pill)',
              backgroundColor:
                membership.role === 'OWNER'
                  ? '#FFFBEB'
                  : membership.role === 'ADMIN'
                  ? '#EFF6FF'
                  : '#FAF5FF',
              color:
                membership.role === 'OWNER'
                  ? '#D97706'
                  : membership.role === 'ADMIN'
                  ? '#2563EB'
                  : '#9333EA',
              border:
                membership.role === 'OWNER'
                  ? '1px solid #FDE68A'
                  : membership.role === 'ADMIN'
                  ? '1px solid #BFDBFE'
                  : '1px solid #E9D5FF',
              letterSpacing: '0.04em',
            }}
          >
            {membership.role}
          </span>
        </div>

        {/* Right: Single Canonical "View Public Listing" Link, User Profile & Sign Out */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
          {currentBusiness.slug && (
            <a
              href={`/businesses/${currentBusiness.slug}`}
              target="_blank"
              rel="noopener noreferrer"
              title="Open your public business listing on AageOnline in a new tab"
              style={{
                fontSize: '13px',
                fontWeight: 700,
                color: '#334155',
                textDecoration: 'none',
                padding: '6px 14px',
                borderRadius: 'var(--radius-pill)',
                backgroundColor: '#F8FAFC',
                border: '1px solid #E2E8F0',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                boxShadow: '0 1px 2px rgba(0, 0, 0, 0.03)',
                transition: 'all var(--motion-fast)',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#FFF7ED';
                e.currentTarget.style.borderColor = '#FED7AA';
                e.currentTarget.style.color = '#EA580C';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = '#F8FAFC';
                e.currentTarget.style.borderColor = '#E2E8F0';
                e.currentTarget.style.color = '#334155';
              }}
            >
              <span>View Public Listing</span>
              <span style={{ fontSize: '12px' }}>↗</span>
            </a>
          )}

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                backgroundColor: '#FFF7ED',
                border: '1px solid #FED7AA',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 900,
                fontSize: '13px',
                color: '#EA580C',
              }}
            >
              {userInitial}
            </div>

            <div style={{ fontSize: 'var(--font-size-xs)', textAlign: 'left', lineHeight: 1.2 }}>
              <span style={{ display: 'block', fontWeight: 800, color: '#0F172A' }}>
                {ownerDisplayName}
              </span>
              <span style={{ fontSize: '11px', color: '#64748B' }}>
                {ownerDisplayPhone ? `📱 ${ownerDisplayPhone}` : ownerDisplayEmail}
              </span>
            </div>
          </div>

          <button
            onClick={handleSignOut}
            style={{
              backgroundColor: '#FFFFFF',
              color: '#64748B',
              border: '1px solid #E2E8F0',
              padding: '6px 14px',
              borderRadius: 'var(--radius-pill)',
              fontSize: '12px',
              fontWeight: 700,
              cursor: 'pointer',
              transition: 'all var(--motion-fast)',
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.backgroundColor = '#FEE2E2';
              e.currentTarget.style.borderColor = '#FCA5A5';
              e.currentTarget.style.color = '#DC2626';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.backgroundColor = '#FFFFFF';
              e.currentTarget.style.borderColor = '#E2E8F0';
              e.currentTarget.style.color = '#64748B';
            }}
          >
            Sign Out
          </button>
        </div>
      </div>

      {/* Nav Tabs Rail with Clear Purpose Descriptions for Every Section */}
      <nav
        aria-label="Workspace Sections Navigation"
        className="container hide-scrollbar"
        style={{
          display: 'flex',
          gap: '8px',
          paddingTop: '6px',
          paddingBottom: '10px',
          borderTop: '1px solid #F1F5F9',
          overflowX: 'auto',
        }}
      >
        {navLinks.map((tab) => (
          <a
            key={tab.label}
            href={tab.href}
            style={{
              padding: '7px 16px',
              fontSize: '13px',
              fontWeight: tab.active ? 800 : 600,
              color: tab.active ? '#EA580C' : '#475569',
              backgroundColor: tab.active ? '#FFF7ED' : '#FFFFFF',
              border: tab.active ? '1px solid #FED7AA' : '1px solid #E2E8F0',
              borderRadius: 'var(--radius-pill)',
              textDecoration: 'none',
              whiteSpace: 'nowrap',
              boxShadow: tab.active
                ? '0 2px 8px rgba(234, 88, 12, 0.12)'
                : '0 1px 2px rgba(0, 0, 0, 0.03)',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              transition: 'all var(--motion-fast)',
            }}
          >
            <span style={{ fontSize: '15px' }}>{tab.icon}</span>
            <span>{tab.label}</span>
            <span
              style={{
                fontSize: '10px',
                fontWeight: 700,
                padding: '1px 6px',
                borderRadius: 'var(--radius-pill)',
                backgroundColor: tab.active ? '#EA580C' : '#F1F5F9',
                color: tab.active ? '#FFFFFF' : '#64748B',
                letterSpacing: '0.02em',
              }}
            >
              {tab.purpose}
            </span>
          </a>
        ))}
      </nav>
    </div>
  );
}
