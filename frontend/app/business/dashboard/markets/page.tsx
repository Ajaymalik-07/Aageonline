'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import type { WorkspaceMarketItem } from '../../../../types/workspace.ts';
import { MarketPositionPricingCalculator } from '../../../../features/business-workspace/MarketPositionPricingCalculator.tsx';

function MarketsManagementContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const businessIdParam = searchParams.get('businessId') || undefined;

  const [markets, setMarkets] = useState<WorkspaceMarketItem[]>([]);
  const [businessName, setBusinessName] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [expandedPricingMarketIds, setExpandedPricingMarketIds] = useState<Record<string, boolean>>({});

  const togglePricing = (marketId: string) => {
    setExpandedPricingMarketIds((prev) => ({
      ...prev,
      [marketId]: !prev[marketId],
    }));
  };

  useEffect(() => {
    async function loadMarkets() {
      try {
        let userId: string | null = null;
        try {
          const res = await fetch('/api/auth/me');
          if (res.ok) {
            const data = await res.json();
            if (data.user) {
              userId = data.user.id;
              const { registerUserInStore, setActiveDevUser: setDevUser } = await import('../../../../lib/auth/store.ts');
              registerUserInStore(data.user);
              if (process.env.NODE_ENV !== 'production') {
                setDevUser(data.user.id);
              }
            }
          }
        } catch {
          // fallback
        }

        if (!userId) {
          const { getActiveDevSession } = await import('../../../../lib/auth/store.ts');
          const session = getActiveDevSession();
          if (session) userId = session.userId;
        }

        if (!userId) {
          router.replace('/business/claim?returnUrl=/business/dashboard/markets');
          return;
        }

        const { resolveWorkspaceContext, getWorkspaceMarkets } = await import(
          '../../../../lib/workspace/store.ts'
        );
        const ctx = await resolveWorkspaceContext(userId, businessIdParam);
        setBusinessName(ctx.currentBusiness.name);

        const marketItems = await getWorkspaceMarkets(ctx.currentBusiness.id, userId);
        setMarkets(marketItems);
      } catch (err: unknown) {
        setErrorMessage(err instanceof Error ? err.message : 'Failed to load markets');
      } finally {
        setLoading(false);
      }
    }

    loadMarkets();
  }, [businessIdParam, router]);

  if (loading) {
    return (
      <div style={{ padding: 'var(--space-12) 0', textAlign: 'center', color: '#64748B', fontWeight: 600 }}>
        Loading market participations...
      </div>
    );
  }

  if (errorMessage) {
    return (
      <div
        style={{
          backgroundColor: '#FEE2E2',
          border: '1px solid #FCA5A5',
          borderRadius: 'var(--radius-lg)',
          padding: 'var(--space-6)',
          color: '#991B1B',
          textAlign: 'center',
        }}
      >
        <p style={{ margin: 0, fontWeight: 700 }}>{errorMessage}</p>
      </div>
    );
  }

  const activeMarkets = markets.filter((m) => m.status === 'ACTIVE');
  const eligibleMarkets = markets.filter((m) => m.status === 'ELIGIBLE');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
      <div>
        <h1 style={{ fontSize: 'var(--font-size-2xl)', fontWeight: 800, margin: '0 0 var(--space-2) 0', color: '#0F172A' }}>
          Market Participations &amp; Positions
        </h1>
        <p style={{ margin: 0, fontSize: 'var(--font-size-sm)', color: '#64748B' }}>
          Review active local markets and paid visibility positioning for {businessName}.
        </p>
      </div>

      {/* Active Markets Section */}
      <section aria-label="Active Markets">
        <h2 style={{ fontSize: 'var(--font-size-lg)', fontWeight: 800, color: '#0F172A', margin: '0 0 var(--space-3) 0' }}>
          Active Markets ({activeMarkets.length})
        </h2>

        {activeMarkets.length === 0 ? (
          <div
            style={{
              backgroundColor: '#FFFFFF',
              borderRadius: 'var(--radius-lg)',
              padding: 'var(--space-6)',
              textAlign: 'center',
              color: '#64748B',
              fontSize: 'var(--font-size-sm)',
              border: '1px solid #E2E8F0',
            }}
          >
            No active market participations currently recorded for this business.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
            {activeMarkets.map((item) => (
              <div
                key={item.market.id}
                style={{
                  backgroundColor: '#FFFFFF',
                  borderRadius: 'var(--radius-lg)',
                  padding: 'var(--space-5)',
                  border: '1px solid #E2E8F0',
                  boxShadow: '0 2px 8px rgba(15, 23, 42, 0.04)',
                  display: 'flex',
                  flexWrap: 'wrap',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 'var(--space-4)',
                }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontWeight: 800, fontSize: 'var(--font-size-base)', color: '#0F172A' }}>
                      {item.market.name}
                    </span>
                    <span
                      style={{
                        fontSize: '10px',
                        fontWeight: 800,
                        backgroundColor: '#ECFDF5',
                        color: '#059669',
                        border: '1px solid #A7F3D0',
                        padding: '2px 8px',
                        borderRadius: 'var(--radius-pill)',
                      }}
                    >
                      ACTIVE ✓
                    </span>
                  </div>
                  <div style={{ fontSize: 'var(--font-size-xs)', color: '#64748B', marginTop: '4px' }}>
                    Market Slug: <code style={{ backgroundColor: '#F1F5F9', padding: '2px 6px', borderRadius: '4px' }}>/{item.market.slug}</code>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-4)' }}>
                  <div style={{ textAlign: 'right' }}>
                    <div
                      style={{
                        fontSize: 'var(--font-size-base)',
                        fontWeight: 800,
                        color: item.position ? '#EA580C' : '#64748B',
                      }}
                    >
                      {item.positionLabel}
                    </div>
                    {item.qualifyingAmountRupees && (
                      <div style={{ fontSize: '11px', color: '#64748B' }}>
                        Floor: ₹{item.qualifyingAmountRupees.toLocaleString('en-IN')}
                      </div>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={() => togglePricing(item.market.id)}
                    style={{
                      fontSize: 'var(--font-size-xs)',
                      fontWeight: 700,
                      color: expandedPricingMarketIds[item.market.id] ? '#EA580C' : '#334155',
                      backgroundColor: expandedPricingMarketIds[item.market.id]
                        ? '#FFF7ED'
                        : '#F8FAFC',
                      border: expandedPricingMarketIds[item.market.id]
                        ? '1px solid #FED7AA'
                        : '1px solid #CBD5E1',
                      borderRadius: 'var(--radius-pill)',
                      padding: '8px 14px',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    {expandedPricingMarketIds[item.market.id] ? 'Hide Pricing Engine' : 'Calculate Target Position'}
                  </button>

                  <a
                    href={`/${item.market.slug}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      fontSize: 'var(--font-size-xs)',
                      fontWeight: 700,
                      color: '#334155',
                      backgroundColor: '#FFFFFF',
                      border: '1px solid #CBD5E1',
                      borderRadius: 'var(--radius-pill)',
                      padding: '8px 14px',
                      textDecoration: 'none',
                    }}
                  >
                    View Market ↗
                  </a>
                </div>

                {expandedPricingMarketIds[item.market.id] && (
                  <div
                    style={{
                      width: '100%',
                      marginTop: 'var(--space-4)',
                      borderTop: '1px solid #E2E8F0',
                      paddingTop: 'var(--space-4)',
                    }}
                  >
                    <MarketPositionPricingCalculator
                      marketId={item.market.id}
                      marketName={item.market.name}
                      currentPosition={item.position ?? null}
                      businessId={businessIdParam}
                    />
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Eligible Markets Section */}
      <section aria-label="Eligible Markets">
        <h2 style={{ fontSize: 'var(--font-size-lg)', fontWeight: 800, color: '#0F172A', margin: '0 0 var(--space-3) 0' }}>
          Eligible Markets ({eligibleMarkets.length})
        </h2>

        {eligibleMarkets.length === 0 ? (
          <div
            style={{
              backgroundColor: '#FFFFFF',
              borderRadius: 'var(--radius-lg)',
              padding: 'var(--space-6)',
              textAlign: 'center',
              color: '#64748B',
              fontSize: 'var(--font-size-sm)',
              border: '1px solid #E2E8F0',
            }}
          >
            No unactivated eligible markets found for this business.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
            {eligibleMarkets.map((item) => (
              <div
                key={item.market.id}
                style={{
                  backgroundColor: '#FFFFFF',
                  borderRadius: 'var(--radius-lg)',
                  padding: 'var(--space-5)',
                  border: '1px solid #E2E8F0',
                  boxShadow: '0 2px 8px rgba(15, 23, 42, 0.04)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 'var(--space-3)',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    flexWrap: 'wrap',
                    gap: 'var(--space-3)',
                  }}
                >
                  <div>
                    <span style={{ fontWeight: 800, color: '#0F172A', fontSize: '15px' }}>{item.market.name}</span>
                    <div style={{ fontSize: '12px', color: '#64748B', marginTop: '2px' }}>
                      Eligible based on registered service location and category.
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
                    <span
                      style={{
                        fontSize: '11px',
                        fontWeight: 700,
                        color: '#64748B',
                        backgroundColor: '#F1F5F9',
                        border: '1px solid #E2E8F0',
                        padding: '4px 10px',
                        borderRadius: 'var(--radius-pill)',
                      }}
                    >
                      Unranked / Available
                    </span>
                    <button
                      type="button"
                      onClick={() => togglePricing(item.market.id)}
                      style={{
                        fontSize: 'var(--font-size-xs)',
                        fontWeight: 700,
                        color: expandedPricingMarketIds[item.market.id] ? '#EA580C' : '#334155',
                        backgroundColor: expandedPricingMarketIds[item.market.id]
                          ? '#FFF7ED'
                          : '#F8FAFC',
                        border: expandedPricingMarketIds[item.market.id]
                          ? '1px solid #FED7AA'
                          : '1px solid #CBD5E1',
                        borderRadius: 'var(--radius-pill)',
                        padding: '6px 14px',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease',
                      }}
                    >
                      {expandedPricingMarketIds[item.market.id] ? 'Hide Pricing' : 'Calculate Entry Floor'}
                    </button>
                  </div>
                </div>

                {expandedPricingMarketIds[item.market.id] && (
                  <div
                    style={{
                      width: '100%',
                      marginTop: 'var(--space-2)',
                      borderTop: '1px solid #E2E8F0',
                      paddingTop: 'var(--space-4)',
                    }}
                  >
                    <MarketPositionPricingCalculator
                      marketId={item.market.id}
                      marketName={item.market.name}
                      currentPosition={null}
                      businessId={businessIdParam}
                    />
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Market Visibility Controls Info */}
      <div
        style={{
          backgroundColor: '#FFFBEB',
          borderRadius: 'var(--radius-xl)',
          padding: 'var(--space-6)',
          border: '1px dashed #FDE68A',
          textAlign: 'center',
          color: '#92400E',
        }}
      >
        <div style={{ color: '#B45309', fontWeight: 800, fontSize: 'var(--font-size-sm)', marginBottom: '4px' }}>
          Market Visibility Controls
        </div>
        <p style={{ margin: 0, fontSize: 'var(--font-size-xs)', color: '#78350F' }}>
          Position rankings are updated in real-time inside database transactions upon server-verified payments.
        </p>
      </div>
    </div>
  );
}

export default function WorkspaceMarketsPage() {
  return (
    <Suspense fallback={<div style={{ color: '#64748B', padding: 'var(--space-8)' }}>Loading markets...</div>}>
      <MarketsManagementContent />
    </Suspense>
  );
}
