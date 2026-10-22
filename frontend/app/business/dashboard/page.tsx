'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import type { WorkspaceOverviewData } from '../../../types/workspace.ts';

function DashboardOverviewContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const businessIdParam = searchParams.get('businessId') || undefined;

  const [overview, setOverview] = useState<WorkspaceOverviewData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<{ message: string; statusCode: number } | null>(null);

  useEffect(() => {
    async function loadOverview() {
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
          router.replace('/business/claim?returnUrl=/business/dashboard');
          return;
        }

        const { resolveWorkspaceContext, getWorkspaceOverview } = await import(
          '../../../lib/workspace/store.ts'
        );
        const ctx = await resolveWorkspaceContext(userId, businessIdParam);
        const data = await getWorkspaceOverview(ctx.currentBusiness.id, userId);
        setOverview(data);
      } catch (err: unknown) {
        const statusCode = (err as { statusCode?: number }).statusCode || 500;
        const message = err instanceof Error ? err.message : 'Failed to load business workspace';
        setError({ message, statusCode });
      } finally {
        setLoading(false);
      }
    }

    loadOverview();
  }, [businessIdParam, router]);

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
        <div
          style={{
            height: '140px',
            backgroundColor: '#FFFFFF',
            border: '1px solid #E2E8F0',
            borderRadius: 'var(--radius-xl)',
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04)',
          }}
        />
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: 'var(--space-4)',
          }}
        >
          <div style={{ height: '120px', backgroundColor: '#FFFFFF', borderRadius: 'var(--radius-lg)', border: '1px solid #E2E8F0' }} />
          <div style={{ height: '120px', backgroundColor: '#FFFFFF', borderRadius: 'var(--radius-lg)', border: '1px solid #E2E8F0' }} />
          <div style={{ height: '120px', backgroundColor: '#FFFFFF', borderRadius: 'var(--radius-lg)', border: '1px solid #E2E8F0' }} />
          <div style={{ height: '120px', backgroundColor: '#FFFFFF', borderRadius: 'var(--radius-lg)', border: '1px solid #E2E8F0' }} />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div
        style={{
          maxWidth: '580px',
          margin: 'var(--space-12) auto',
          backgroundColor: '#FFFFFF',
          border: '1px solid #FCA5A5',
          borderRadius: 'var(--radius-xl)',
          padding: 'var(--space-8)',
          textAlign: 'center',
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.06)',
        }}
      >
        <div
          style={{
            width: '48px',
            height: '48px',
            borderRadius: '50%',
            backgroundColor: '#FEE2E2',
            border: '1px solid #FCA5A5',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 16px auto',
            fontSize: '20px',
            color: '#DC2626',
          }}
        >
          ⚠
        </div>
        <h2 style={{ color: '#991B1B', fontWeight: 800, fontSize: 'var(--font-size-xl)', marginBottom: '8px' }}>
          {error.statusCode === 403 ? 'Workspace Access Restricted (403)' : 'Workspace Error'}
        </h2>
        <p style={{ color: '#475569', fontSize: 'var(--font-size-sm)', marginBottom: 'var(--space-6)', lineHeight: 1.5 }}>
          {error.message}
        </p>
        <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
          <a
            href="/businesses"
            style={{
              backgroundColor: '#EA580C',
              color: '#FFFFFF',
              padding: '10px 20px',
              borderRadius: 'var(--radius-pill)',
              fontSize: 'var(--font-size-xs)',
              fontWeight: 700,
              textDecoration: 'none',
              boxShadow: '0 2px 10px rgba(234, 88, 12, 0.25)',
            }}
          >
            Explore Public Businesses
          </a>
          <a
            href="/business/claim"
            style={{
              backgroundColor: '#F1F5F9',
              color: '#334155',
              border: '1px solid #CBD5E1',
              padding: '10px 20px',
              borderRadius: 'var(--radius-pill)',
              fontSize: 'var(--font-size-xs)',
              fontWeight: 700,
              textDecoration: 'none',
            }}
          >
            Switch Account
          </a>
        </div>
      </div>
    );
  }

  if (!overview) return null;

  const { business, membership, activeMarketsCount, eligibleMarketsCount, hasPaidPosition, visibilitySummary } = overview;
  const businessInitial = (business.name || 'B').charAt(0).toUpperCase();

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-8)' }}>
      {/* 1. Flagship Business Profile Banner */}
      <section
        aria-label="Business Profile Overview"
        style={{
          position: 'relative',
          backgroundColor: '#FFFFFF',
          backgroundImage: `
            radial-gradient(circle at 92% 10%, rgba(234, 88, 12, 0.07) 0%, transparent 45%),
            linear-gradient(135deg, #FFFFFF 0%, #FFFBF5 100%)
          `,
          borderRadius: 'var(--radius-xl)',
          padding: 'clamp(var(--space-6), 3vw, var(--space-8))',
          border: '1px solid #E2E8F0',
          boxShadow: '0 2px 12px rgba(15, 23, 42, 0.04)',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 'var(--space-6)',
            position: 'relative',
            zIndex: 1,
          }}
        >
          {/* Identity Info */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-5)', flexWrap: 'wrap' }}>
            {/* Monogram Box */}
            <div
              style={{
                width: '64px',
                height: '64px',
                borderRadius: 'var(--radius-lg)',
                background: 'linear-gradient(135deg, #EA580C 0%, #C2410C 100%)',
                boxShadow: '0 4px 16px rgba(234, 88, 12, 0.3)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '28px',
                fontWeight: 900,
                color: '#FFFFFF',
                flexShrink: 0,
              }}
            >
              {businessInitial}
            </div>

            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap', marginBottom: '6px' }}>
                <h1
                  style={{
                    fontSize: 'clamp(22px, 3vw, 28px)',
                    fontWeight: 900,
                    margin: 0,
                    color: '#0F172A',
                    letterSpacing: '-0.025em',
                  }}
                >
                  {business.name}
                </h1>

                {/* Verification Badge */}
                <span
                  style={{
                    fontSize: '11px',
                    fontWeight: 800,
                    padding: '3px 10px',
                    borderRadius: 'var(--radius-pill)',
                    backgroundColor:
                      business.verificationStatus === 'VERIFIED'
                        ? '#ECFDF5'
                        : '#F1F5F9',
                    color: business.verificationStatus === 'VERIFIED' ? '#059669' : '#64748B',
                    border:
                      business.verificationStatus === 'VERIFIED'
                        ? '1px solid #A7F3D0'
                        : '1px solid #CBD5E1',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                  }}
                >
                  {business.verificationStatus === 'VERIFIED' ? 'Verified Enterprise ✓' : business.verificationStatus}
                </span>

                {/* Role Pill */}
                <span
                  style={{
                    fontSize: '11px',
                    fontWeight: 800,
                    padding: '3px 10px',
                    borderRadius: 'var(--radius-pill)',
                    backgroundColor: '#FFFBEB',
                    color: '#D97706',
                    border: '1px solid #FDE68A',
                  }}
                >
                  {membership.role}
                </span>
              </div>

              <p style={{ margin: 0, fontSize: 'var(--font-size-sm)', color: '#64748B', maxWidth: '640px', lineHeight: 1.5 }}>
                {business.tagline || 'Commercial enterprise registered on AageOnline competitive visibility platform.'}
              </p>
            </div>
          </div>

          {/* Direct Operational Actions */}
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
            <a
              href={`/business/dashboard/profile?businessId=${business.id}`}
              className="card-lift"
              style={{
                fontSize: '13px',
                fontWeight: 800,
                backgroundColor: '#EA580C',
                color: '#FFFFFF',
                borderRadius: 'var(--radius-pill)',
                padding: '9px 20px',
                textDecoration: 'none',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                boxShadow: '0 2px 10px rgba(234, 88, 12, 0.25)',
                transition: 'all var(--motion-fast)',
              }}
            >
              <span>Edit Profile & Socials</span>
              <span>→</span>
            </a>

            <a
              href={`/business/dashboard/markets?businessId=${business.id}`}
              className="card-lift"
              style={{
                fontSize: '13px',
                fontWeight: 700,
                color: '#334155',
                backgroundColor: '#FFFFFF',
                border: '1px solid #CBD5E1',
                borderRadius: 'var(--radius-pill)',
                padding: '9px 18px',
                textDecoration: 'none',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04)',
                transition: 'all var(--motion-fast)',
              }}
            >
              <span>Manage Rankings</span>
              <span>→</span>
            </a>
          </div>
        </div>
      </section>

      {/* 2. Platform Purpose & Step-by-Step Guidance Banner */}
      <section
        aria-label="Platform Purpose & Quick Guidance"
        style={{
          backgroundColor: '#FFFFFF',
          borderRadius: 'var(--radius-xl)',
          padding: 'var(--space-6)',
          border: '1px solid #E2E8F0',
          boxShadow: '0 1px 4px rgba(0, 0, 0, 0.03)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
          <span
            style={{
              fontSize: '11px',
              fontWeight: 800,
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
              padding: '3px 10px',
              borderRadius: 'var(--radius-pill)',
              backgroundColor: '#EFF6FF',
              color: '#2563EB',
              border: '1px solid #BFDBFE',
            }}
          >
            How AageOnline Works
          </span>
          <span style={{ fontSize: '13px', fontWeight: 700, color: '#334155' }}>
            3 steps to maximize high-intent customer leads in your market
          </span>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
            gap: 'var(--space-4)',
          }}
        >
          <div
            style={{
              padding: '16px',
              borderRadius: 'var(--radius-lg)',
              backgroundColor: '#F8FAFC',
              border: '1px solid #E2E8F0',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
              <span style={{ fontWeight: 900, fontSize: '14px', color: '#EA580C' }}>Step 1</span>
              <strong style={{ fontSize: '14px', color: '#0F172A' }}>Complete Profile & Channels</strong>
            </div>
            <p style={{ fontSize: '12px', color: '#64748B', margin: 0, lineHeight: 1.5 }}>
              Add WhatsApp, Instagram, phone, email, and description on the <strong>Business Profile</strong> tab so searchers can contact you directly.
            </p>
          </div>

          <div
            style={{
              padding: '16px',
              borderRadius: 'var(--radius-lg)',
              backgroundColor: '#F8FAFC',
              border: '1px solid #E2E8F0',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
              <span style={{ fontWeight: 900, fontSize: '14px', color: '#EA580C' }}>Step 2</span>
              <strong style={{ fontSize: '14px', color: '#0F172A' }}>Select Target Markets</strong>
            </div>
            <p style={{ fontSize: '12px', color: '#64748B', margin: 0, lineHeight: 1.5 }}>
              Navigate to <strong>Markets & Positions</strong> to view the exact Category + City markets where local consumers search for your trade.
            </p>
          </div>

          <div
            style={{
              padding: '16px',
              borderRadius: 'var(--radius-lg)',
              backgroundColor: '#F8FAFC',
              border: '1px solid #E2E8F0',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
              <span style={{ fontWeight: 900, fontSize: '14px', color: '#EA580C' }}>Step 3</span>
              <strong style={{ fontSize: '14px', color: '#0F172A' }}>Claim Top Visibility (#1, #2, #3)</strong>
            </div>
            <p style={{ fontSize: '12px', color: '#64748B', margin: 0, lineHeight: 1.5 }}>
              Compete for transparent paid positions. Outbidding competitors places your enterprise directly at the top of customer search listings.
            </p>
          </div>
        </div>
      </section>

      {/* 3. Truthful Operational Metrics (4 Stat Cards) */}
      <section aria-label="Key Workspace Metrics">
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
            gap: 'var(--space-4)',
          }}
        >
          {/* Active Markets */}
          <div
            className="card-lift"
            style={{
              backgroundColor: '#FFFFFF',
              borderRadius: 'var(--radius-lg)',
              padding: 'var(--space-6)',
              border: '1px solid #E2E8F0',
              boxShadow: '0 2px 8px rgba(15, 23, 42, 0.04)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
              <span style={{ fontSize: '11px', color: '#64748B', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                Active Markets
              </span>
              <div
                style={{
                  width: '34px',
                  height: '34px',
                  borderRadius: '50%',
                  backgroundColor: '#EFF6FF',
                  border: '1px solid #BFDBFE',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '15px',
                }}
              >
                🌐
              </div>
            </div>
            <div style={{ fontSize: '36px', fontWeight: 900, color: '#0F172A', lineHeight: 1 }}>
              {activeMarketsCount}
            </div>
            <div style={{ fontSize: '12px', color: '#64748B', marginTop: '10px' }}>
              Active Category + Location participations
            </div>
          </div>

          {/* Eligible Markets */}
          <div
            className="card-lift"
            style={{
              backgroundColor: '#FFFFFF',
              borderRadius: 'var(--radius-lg)',
              padding: 'var(--space-6)',
              border: '1px solid #E2E8F0',
              boxShadow: '0 2px 8px rgba(15, 23, 42, 0.04)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
              <span style={{ fontSize: '11px', color: '#64748B', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                Eligible Expansion
              </span>
              <div
                style={{
                  width: '34px',
                  height: '34px',
                  borderRadius: '50%',
                  backgroundColor: '#FFF7ED',
                  border: '1px solid #FED7AA',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '15px',
                }}
              >
                🎯
              </div>
            </div>
            <div style={{ fontSize: '36px', fontWeight: 900, color: '#0F172A', lineHeight: 1 }}>
              {eligibleMarketsCount}
            </div>
            <div style={{ fontSize: '12px', color: '#64748B', marginTop: '10px' }}>
              Available categories open for expansion
            </div>
          </div>

          {/* Visibility Standing */}
          <div
            className="card-lift"
            style={{
              backgroundColor: '#FFFFFF',
              borderRadius: 'var(--radius-lg)',
              padding: 'var(--space-6)',
              border: hasPaidPosition ? '1px solid #A7F3D0' : '1px solid #FED7AA',
              boxShadow: hasPaidPosition
                ? '0 2px 10px rgba(16, 185, 129, 0.08)'
                : '0 2px 10px rgba(234, 88, 12, 0.08)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
              <span style={{ fontSize: '11px', color: '#64748B', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                Visibility Status
              </span>
              <div
                style={{
                  width: '34px',
                  height: '34px',
                  borderRadius: '50%',
                  backgroundColor: hasPaidPosition ? '#ECFDF5' : '#FFF7ED',
                  border: hasPaidPosition ? '1px solid #A7F3D0' : '1px solid #FED7AA',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '15px',
                }}
              >
                🏆
              </div>
            </div>
            <div
              style={{
                fontSize: '26px',
                fontWeight: 900,
                color: hasPaidPosition ? '#059669' : '#EA580C',
                lineHeight: 1.1,
              }}
            >
              {hasPaidPosition ? 'Ranked (Paid ✓)' : 'Standard / Unranked'}
            </div>
            <div style={{ fontSize: '12px', color: '#64748B', marginTop: '10px' }}>
              {hasPaidPosition ? 'Active paid ranking in target market' : 'No paid top placement active'}
            </div>
          </div>

          {/* Assigned RBAC Role */}
          <div
            className="card-lift"
            style={{
              backgroundColor: '#FFFFFF',
              borderRadius: 'var(--radius-lg)',
              padding: 'var(--space-6)',
              border: '1px solid #E2E8F0',
              boxShadow: '0 2px 8px rgba(15, 23, 42, 0.04)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
              <span style={{ fontSize: '11px', color: '#64748B', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                Access Permission
              </span>
              <div
                style={{
                  width: '34px',
                  height: '34px',
                  borderRadius: '50%',
                  backgroundColor: '#FAF5FF',
                  border: '1px solid #E9D5FF',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '15px',
                }}
              >
                🛡️
              </div>
            </div>
            <div style={{ fontSize: '26px', fontWeight: 900, color: '#0F172A', lineHeight: 1.1 }}>
              {membership.role}
            </div>
            <div style={{ fontSize: '12px', color: '#64748B', marginTop: '10px' }}>
              Membership Status: {membership.status}
            </div>
          </div>
        </div>
      </section>

      {/* 4. Central Competitive Visibility Hub */}
      <section
        aria-label="Competitive Market Visibility Hub"
        style={{
          backgroundColor: '#FFFFFF',
          borderRadius: 'var(--radius-xl)',
          padding: 'clamp(var(--space-6), 3vw, var(--space-8))',
          border: '1px solid #E2E8F0',
          boxShadow: '0 2px 12px rgba(15, 23, 42, 0.04)',
        }}
      >
        <div style={{ marginBottom: 'var(--space-5)' }}>
          {/* Eyebrow Pill */}
          <div style={{ display: 'inline-flex', marginBottom: '8px' }}>
            <span
              style={{
                fontSize: '11px',
                fontWeight: 800,
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                padding: '4px 14px',
                borderRadius: 'var(--radius-pill)',
                backgroundColor: '#FFF7ED',
                color: '#EA580C',
                border: '1px solid #FED7AA',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              <span
                style={{
                  width: '6px',
                  height: '6px',
                  borderRadius: '50%',
                  backgroundColor: '#EA580C',
                  display: 'inline-block',
                }}
              />
              Competitive Visibility Hub
            </span>
          </div>

          <h2 style={{ fontSize: 'clamp(18px, 2.5vw, 22px)', fontWeight: 800, color: '#0F172A', margin: '0 0 6px 0' }}>
            Local Market Visibility Standing
          </h2>
          <p style={{ margin: 0, fontSize: 'var(--font-size-sm)', color: '#64748B', maxWidth: '680px', lineHeight: 1.5 }}>
            AageOnline empowers eligible businesses to compete for transparent, paid visibility positions inside well-defined Location + Category markets.
          </p>
        </div>

        {/* Dynamic Status Presentation */}
        {hasPaidPosition ? (
          <div
            style={{
              backgroundColor: '#ECFDF5',
              border: '1px solid #A7F3D0',
              borderRadius: 'var(--radius-lg)',
              padding: 'var(--space-6)',
              display: 'flex',
              flexWrap: 'wrap',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 'var(--space-4)',
            }}
          >
            <div style={{ maxWidth: '580px' }}>
              <div style={{ color: '#059669', fontWeight: 800, fontSize: 'var(--font-size-base)', marginBottom: '4px' }}>
                Active Paid Visibility Secured ✓
              </div>
              <p style={{ margin: 0, fontSize: 'var(--font-size-sm)', color: '#065F46', lineHeight: 1.5 }}>
                {visibilitySummary.message}
              </p>
            </div>
            <a
              href={`/business/dashboard/markets?businessId=${business.id}`}
              className="card-lift"
              style={{
                backgroundColor: '#059669',
                color: '#FFFFFF',
                padding: '10px 22px',
                borderRadius: 'var(--radius-pill)',
                fontSize: '13px',
                fontWeight: 800,
                textDecoration: 'none',
                boxShadow: '0 2px 10px rgba(5, 150, 105, 0.25)',
              }}
            >
              Manage Positions →
            </a>
          </div>
        ) : (
          <div
            style={{
              backgroundColor: '#FFF7ED',
              border: '1px solid #FED7AA',
              borderRadius: 'var(--radius-lg)',
              padding: 'var(--space-6)',
              display: 'flex',
              flexDirection: 'column',
              gap: 'var(--space-5)',
            }}
          >
            <div
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 'var(--space-4)',
              }}
            >
              <div>
                <div style={{ color: '#C2410C', fontWeight: 800, fontSize: 'var(--font-size-base)', marginBottom: '4px' }}>
                  No Active Paid Position in Verified Markets
                </div>
                <p style={{ margin: 0, fontSize: 'var(--font-size-sm)', color: '#7C2D12', maxWidth: '640px', lineHeight: 1.5 }}>
                  {visibilitySummary.message} Boost your placement to #1, #2, or #3 to appear at the very top of local customer searches.
                </p>
              </div>

              <a
                href={`/business/dashboard/markets?businessId=${business.id}`}
                className="card-lift"
                style={{
                  backgroundColor: '#EA580C',
                  color: '#FFFFFF',
                  padding: '10px 22px',
                  borderRadius: 'var(--radius-pill)',
                  fontSize: '13px',
                  fontWeight: 800,
                  textDecoration: 'none',
                  boxShadow: '0 2px 10px rgba(234, 88, 12, 0.25)',
                  whiteSpace: 'nowrap',
                }}
              >
                Explore Markets & Compete →
              </a>
            </div>

            {/* 3 Core Platform Guarantees */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: 'var(--space-3)',
                borderTop: '1px solid #FED7AA',
                paddingTop: 'var(--space-4)',
              }}
            >
              <div style={{ fontSize: '13px', color: '#9A3412', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 600 }}>
                <span>⚡</span> Server-Calculated Pricing
              </div>
              <div style={{ fontSize: '13px', color: '#9A3412', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 600 }}>
                <span>🔒</span> Atomic Position Locking
              </div>
              <div style={{ fontSize: '13px', color: '#9A3412', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 600 }}>
                <span>📜</span> Tamper-Proof Audit Log
              </div>
            </div>
          </div>
        )}
      </section>

      {/* 5. Workspace Operations & Fast Launchpad (3 Sub-Page Cards) */}
      <section aria-label="Workspace Quick Navigation">
        <h2 style={{ fontSize: 'var(--font-size-lg)', fontWeight: 800, color: '#0F172A', margin: '0 0 var(--space-4) 0' }}>
          Workspace Operations & Modules
        </h2>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: 'var(--space-4)',
          }}
        >
          {/* Card 1: Markets */}
          <a
            href={`/business/dashboard/markets?businessId=${business.id}`}
            className="card-lift"
            style={{
              backgroundColor: '#FFFFFF',
              border: '1px solid #E2E8F0',
              borderRadius: 'var(--radius-lg)',
              padding: 'var(--space-6)',
              textDecoration: 'none',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              boxShadow: '0 2px 8px rgba(15, 23, 42, 0.04)',
            }}
          >
            <div>
              <div
                style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: 'var(--radius-md)',
                  backgroundColor: '#FFF7ED',
                  border: '1px solid #FED7AA',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '18px',
                  marginBottom: '14px',
                }}
              >
                🎯
              </div>
              <h3 style={{ fontSize: '16px', fontWeight: 800, color: '#0F172A', margin: '0 0 6px 0' }}>
                Markets & Pricing Engine
              </h3>
              <p style={{ fontSize: '13px', color: '#64748B', margin: 0, lineHeight: 1.5 }}>
                Calculate position prices for your city + category, compare competitor rankings, and initiate rank claims.
              </p>
            </div>
            <div style={{ fontSize: '12px', fontWeight: 800, color: '#EA580C', marginTop: '16px' }}>
              Open Markets & Compete →
            </div>
          </a>

          {/* Card 2: Ranking History */}
          <a
            href={`/business/dashboard/ranking-history?businessId=${business.id}`}
            className="card-lift"
            style={{
              backgroundColor: '#FFFFFF',
              border: '1px solid #E2E8F0',
              borderRadius: 'var(--radius-lg)',
              padding: 'var(--space-6)',
              textDecoration: 'none',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              boxShadow: '0 2px 8px rgba(15, 23, 42, 0.04)',
            }}
          >
            <div>
              <div
                style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: 'var(--radius-md)',
                  backgroundColor: '#EFF6FF',
                  border: '1px solid #BFDBFE',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '18px',
                  marginBottom: '14px',
                }}
              >
                📜
              </div>
              <h3 style={{ fontSize: '16px', fontWeight: 800, color: '#0F172A', margin: '0 0 6px 0' }}>
                Auditable Position History
              </h3>
              <p style={{ fontSize: '13px', color: '#64748B', margin: 0, lineHeight: 1.5 }}>
                Review permanent append-only audit trail of all position shifts, overtakes, and transaction receipts.
              </p>
            </div>
            <div style={{ fontSize: '12px', fontWeight: 800, color: '#2563EB', marginTop: '16px' }}>
              View History Ledger →
            </div>
          </a>

          {/* Card 3: Business Profile */}
          <a
            href={`/business/dashboard/profile?businessId=${business.id}`}
            className="card-lift"
            style={{
              backgroundColor: '#FFFFFF',
              border: '1px solid #E2E8F0',
              borderRadius: 'var(--radius-lg)',
              padding: 'var(--space-6)',
              textDecoration: 'none',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              boxShadow: '0 2px 8px rgba(15, 23, 42, 0.04)',
            }}
          >
            <div>
              <div
                style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: 'var(--radius-md)',
                  backgroundColor: '#FAF5FF',
                  border: '1px solid #E9D5FF',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '18px',
                  marginBottom: '14px',
                }}
              >
                🏢
              </div>
              <h3 style={{ fontSize: '16px', fontWeight: 800, color: '#0F172A', margin: '0 0 6px 0' }}>
                Business Profile & Socials
              </h3>
              <p style={{ fontSize: '13px', color: '#64748B', margin: 0, lineHeight: 1.5 }}>
                Update public listing details, address, website, WhatsApp, Instagram, LinkedIn, and telephone.
              </p>
            </div>
            <div style={{ fontSize: '12px', fontWeight: 800, color: '#9333EA', marginTop: '16px' }}>
              Edit Profile & Showcase →
            </div>
          </a>
        </div>
      </section>

      {/* 6. Paid Visibility Regulatory & Compliance Notice */}
      <aside
        aria-label="Paid Visibility Compliance"
        style={{
          backgroundColor: '#FFFBEB',
          border: '1px solid #FDE68A',
          borderRadius: 'var(--radius-lg)',
          padding: 'var(--space-4) var(--space-5)',
          display: 'flex',
          alignItems: 'flex-start',
          gap: '12px',
        }}
      >
        <span style={{ fontSize: '18px', color: '#D97706', flexShrink: 0, lineHeight: 1 }}>
          ⚖️
        </span>
        <div style={{ fontSize: 'var(--font-size-xs)', color: '#92400E', lineHeight: 1.6 }}>
          <strong style={{ color: '#B45309' }}>Paid Visibility Standard: </strong>
          AageOnline positions represent transparent, paid visibility inside defined local markets. Position rankings do not independently establish that a business is the highest rated, top quality, or endorsed by AageOnline. All position movements are permanent, server-verified, and append-only.
        </div>
      </aside>
    </div>
  );
}

export default function WorkspaceOverviewPage() {
  return (
    <Suspense
      fallback={
        <div
          style={{
            height: '240px',
            backgroundColor: '#FFFFFF',
            borderRadius: 'var(--radius-xl)',
            border: '1px solid #E2E8F0',
          }}
        />
      }
    >
      <DashboardOverviewContent />
    </Suspense>
  );
}
