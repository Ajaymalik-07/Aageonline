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
        const { getActiveDevSession } = await import('../../../lib/auth/store.ts');
        const session = getActiveDevSession();

        if (!session) {
          router.replace('/auth/login?returnUrl=/business/dashboard');
          return;
        }

        const { resolveWorkspaceContext, getWorkspaceOverview } = await import(
          '../../../lib/workspace/store.ts'
        );
        const ctx = await resolveWorkspaceContext(session.userId, businessIdParam);
        const data = await getWorkspaceOverview(ctx.currentBusiness.id, session.userId);
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
      <div style={{ padding: 'var(--space-12) 0', textAlign: 'center', color: 'rgba(255, 255, 255, 0.7)' }}>
        Loading business metrics...
      </div>
    );
  }

  if (error) {
    return (
      <div
        style={{
          maxWidth: '560px',
          margin: 'var(--space-8) auto',
          backgroundColor: '#0B1F33',
          border: '1px solid rgba(239, 68, 68, 0.3)',
          borderRadius: 'var(--radius-xl)',
          padding: 'var(--space-8)',
          textAlign: 'center',
        }}
      >
        <div style={{ color: '#F87171', fontWeight: 800, fontSize: 'var(--font-size-lg)', marginBottom: '8px' }}>
          {error.statusCode === 403 ? 'Access Restricted (403)' : 'Workspace Error'}
        </div>
        <p style={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: 'var(--font-size-sm)', marginBottom: 'var(--space-6)' }}>
          {error.message}
        </p>
        <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
          <a
            href="/businesses"
            style={{
              backgroundColor: '#EA580C',
              color: '#FFFFFF',
              padding: '10px 18px',
              borderRadius: 'var(--radius-pill)',
              fontSize: 'var(--font-size-xs)',
              fontWeight: 700,
              textDecoration: 'none',
            }}
          >
            Explore Public Businesses
          </a>
          <a
            href="/auth/login"
            style={{
              backgroundColor: 'rgba(255, 255, 255, 0.1)',
              color: '#FFFFFF',
              padding: '10px 18px',
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

  const { business, membership, activeMarketsCount, eligibleMarketsCount, participatingMarketsCount, hasPaidPosition, visibilitySummary } = overview;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
      {/* Header Profile Summary */}
      <div
        style={{
          backgroundColor: '#0B1F33',
          borderRadius: 'var(--radius-xl)',
          padding: 'var(--space-6)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 'var(--space-4)',
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <h1 style={{ fontSize: 'var(--font-size-2xl)', fontWeight: 800, margin: 0, color: '#FFFFFF' }}>
              {business.name}
            </h1>
            <span
              style={{
                fontSize: '11px',
                fontWeight: 700,
                padding: '2px 8px',
                borderRadius: '4px',
                backgroundColor: business.verificationStatus === 'VERIFIED' ? 'rgba(34, 197, 94, 0.2)' : 'rgba(255, 255, 255, 0.1)',
                color: business.verificationStatus === 'VERIFIED' ? '#4ADE80' : 'rgba(255, 255, 255, 0.7)',
              }}
            >
              {business.verificationStatus}
            </span>
          </div>
          <p style={{ margin: 0, fontSize: 'var(--font-size-sm)', color: 'rgba(255, 255, 255, 0.7)' }}>
            {business.tagline || 'Commercial enterprise registered on AageOnline.'}
          </p>
        </div>

        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <a
            href={`/businesses/${business.slug}`}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              fontSize: 'var(--font-size-xs)',
              fontWeight: 700,
              color: 'rgba(255, 255, 255, 0.8)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              borderRadius: 'var(--radius-pill)',
              padding: '8px 16px',
              textDecoration: 'none',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            View Public Profile ↗
          </a>
          <a
            href={`/business/dashboard/profile?businessId=${business.id}`}
            style={{
              fontSize: 'var(--font-size-xs)',
              fontWeight: 700,
              backgroundColor: '#EA580C',
              color: '#FFFFFF',
              borderRadius: 'var(--radius-pill)',
              padding: '8px 16px',
              textDecoration: 'none',
            }}
          >
            Edit Profile
          </a>
        </div>
      </div>

      {/* Truthful Metrics Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: 'var(--space-4)',
        }}
      >
        <div
          style={{
            backgroundColor: '#0B1F33',
            borderRadius: 'var(--radius-lg)',
            padding: 'var(--space-5)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
          }}
        >
          <div style={{ fontSize: 'var(--font-size-xs)', color: 'rgba(255, 255, 255, 0.6)', fontWeight: 600, textTransform: 'uppercase' }}>
            Active Markets
          </div>
          <div style={{ fontSize: 'var(--font-size-3xl)', fontWeight: 800, color: '#FFFFFF', marginTop: '6px' }}>
            {activeMarketsCount}
          </div>
          <div style={{ fontSize: '11px', color: 'rgba(255, 255, 255, 0.5)', marginTop: '4px' }}>
            Configured market participations
          </div>
        </div>

        <div
          style={{
            backgroundColor: '#0B1F33',
            borderRadius: 'var(--radius-lg)',
            padding: 'var(--space-5)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
          }}
        >
          <div style={{ fontSize: 'var(--font-size-xs)', color: 'rgba(255, 255, 255, 0.6)', fontWeight: 600, textTransform: 'uppercase' }}>
            Eligible Markets
          </div>
          <div style={{ fontSize: 'var(--font-size-3xl)', fontWeight: 800, color: '#FFFFFF', marginTop: '6px' }}>
            {eligibleMarketsCount}
          </div>
          <div style={{ fontSize: '11px', color: 'rgba(255, 255, 255, 0.5)', marginTop: '4px' }}>
            Unactivated regional categories
          </div>
        </div>

        <div
          style={{
            backgroundColor: '#0B1F33',
            borderRadius: 'var(--radius-lg)',
            padding: 'var(--space-5)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
          }}
        >
          <div style={{ fontSize: 'var(--font-size-xs)', color: 'rgba(255, 255, 255, 0.6)', fontWeight: 600, textTransform: 'uppercase' }}>
            Visibility Status
          </div>
          <div
            style={{
              fontSize: 'var(--font-size-xl)',
              fontWeight: 800,
              color: hasPaidPosition ? '#4ADE80' : '#FB923C',
              marginTop: '10px',
            }}
          >
            {hasPaidPosition ? 'Listed (#Paid)' : 'Unranked'}
          </div>
          <div style={{ fontSize: '11px', color: 'rgba(255, 255, 255, 0.5)', marginTop: '6px' }}>
            {hasPaidPosition ? 'Active paid ranking in market' : 'No active paid visibility position'}
          </div>
        </div>

        <div
          style={{
            backgroundColor: '#0B1F33',
            borderRadius: 'var(--radius-lg)',
            padding: 'var(--space-5)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
          }}
        >
          <div style={{ fontSize: 'var(--font-size-xs)', color: 'rgba(255, 255, 255, 0.6)', fontWeight: 600, textTransform: 'uppercase' }}>
            Assigned RBAC Role
          </div>
          <div style={{ fontSize: 'var(--font-size-2xl)', fontWeight: 800, color: '#FFFFFF', marginTop: '8px' }}>
            {membership.role}
          </div>
          <div style={{ fontSize: '11px', color: 'rgba(255, 255, 255, 0.5)', marginTop: '4px' }}>
            Status: {membership.status}
          </div>
        </div>
      </div>

      {/* Truthful Visibility Activity Section (Empty state where data does not exist yet) */}
      <section
        aria-label="Visibility Activity"
        style={{
          backgroundColor: '#0B1F33',
          borderRadius: 'var(--radius-xl)',
          padding: 'var(--space-6)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
        }}
      >
        <h2 style={{ fontSize: 'var(--font-size-lg)', fontWeight: 800, color: '#FFFFFF', margin: '0 0 var(--space-3) 0' }}>
          Market Visibility Activity
        </h2>
        <div
          style={{
            backgroundColor: 'rgba(255, 255, 255, 0.03)',
            borderRadius: 'var(--radius-md)',
            padding: 'var(--space-6)',
            textAlign: 'center',
            color: 'rgba(255, 255, 255, 0.6)',
            fontSize: 'var(--font-size-sm)',
          }}
        >
          <div style={{ marginBottom: '8px', color: '#FB923C', fontWeight: 700 }}>
            No visibility activity is available yet.
          </div>
          <p style={{ margin: 0, maxWidth: '520px', marginLeft: 'auto', marginRight: 'auto', lineHeight: 1.5 }}>
            {visibilitySummary.message}
          </p>
        </div>
      </section>

      {/* Paid Visibility Disclosure */}
      <div
        style={{
          backgroundColor: 'rgba(234, 88, 12, 0.08)',
          border: '1px solid rgba(234, 88, 12, 0.25)',
          borderRadius: 'var(--radius-lg)',
          padding: 'var(--space-4) var(--space-5)',
          fontSize: 'var(--font-size-xs)',
          color: 'rgba(255, 255, 255, 0.8)',
          lineHeight: 1.5,
        }}
      >
        <strong style={{ color: '#FB923C' }}>Paid Visibility Disclosure: </strong>
        Market positions represent transparent paid visibility inside defined local markets and do not independently establish that a business is the highest rated, top quality, or endorsed by AageOnline.
      </div>
    </div>
  );
}

export default function WorkspaceOverviewPage() {
  return (
    <Suspense fallback={<div style={{ color: '#FFFFFF' }}>Loading overview...</div>}>
      <DashboardOverviewContent />
    </Suspense>
  );
}
