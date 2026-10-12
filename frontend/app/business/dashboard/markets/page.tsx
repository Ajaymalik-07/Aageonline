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
        const { getActiveDevSession } = await import('../../../../lib/auth/store.ts');
        const session = getActiveDevSession();

        if (!session) {
          router.replace('/auth/login?returnUrl=/business/dashboard/markets');
          return;
        }

        const { resolveWorkspaceContext, getWorkspaceMarkets } = await import(
          '../../../../lib/workspace/store.ts'
        );
        const ctx = await resolveWorkspaceContext(session.userId, businessIdParam);
        setBusinessName(ctx.currentBusiness.name);

        const marketItems = await getWorkspaceMarkets(ctx.currentBusiness.id, session.userId);
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
      <div style={{ padding: 'var(--space-12) 0', textAlign: 'center', color: 'rgba(255, 255, 255, 0.7)' }}>
        Loading market participations...
      </div>
    );
  }

  if (errorMessage) {
    return (
      <div style={{ textAlign: 'center', color: '#F87171', padding: 'var(--space-8)' }}>
        {errorMessage}
      </div>
    );
  }

  const activeMarkets = markets.filter((m) => m.status === 'ACTIVE');
  const eligibleMarkets = markets.filter((m) => m.status === 'ELIGIBLE');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
      <div>
        <h1 style={{ fontSize: 'var(--font-size-2xl)', fontWeight: 800, margin: '0 0 var(--space-2) 0', color: '#FFFFFF' }}>
          Market Participations &amp; Positions
        </h1>
        <p style={{ margin: 0, fontSize: 'var(--font-size-sm)', color: 'rgba(255, 255, 255, 0.7)' }}>
          Review active local markets and paid visibility positioning for {businessName}.
        </p>
      </div>

      {/* Active Markets Section */}
      <section aria-label="Active Markets">
        <h2 style={{ fontSize: 'var(--font-size-lg)', fontWeight: 800, color: '#FFFFFF', margin: '0 0 var(--space-3) 0' }}>
          Active Markets ({activeMarkets.length})
        </h2>

        {activeMarkets.length === 0 ? (
          <div
            style={{
              backgroundColor: '#0B1F33',
              borderRadius: 'var(--radius-lg)',
              padding: 'var(--space-6)',
              textAlign: 'center',
              color: 'rgba(255, 255, 255, 0.6)',
              fontSize: 'var(--font-size-sm)',
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
                  backgroundColor: '#0B1F33',
                  borderRadius: 'var(--radius-lg)',
                  padding: 'var(--space-5)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  display: 'flex',
                  flexWrap: 'wrap',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 'var(--space-4)',
                }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontWeight: 800, fontSize: 'var(--font-size-base)', color: '#FFFFFF' }}>
                      {item.market.name}
                    </span>
                    <span
                      style={{
                        fontSize: '10px',
                        fontWeight: 800,
                        backgroundColor: 'rgba(34, 197, 94, 0.15)',
                        color: '#4ADE80',
                        padding: '2px 6px',
                        borderRadius: '4px',
                      }}
                    >
                      ACTIVE
                    </span>
                  </div>
                  <div style={{ fontSize: 'var(--font-size-xs)', color: 'rgba(255, 255, 255, 0.6)', marginTop: '4px' }}>
                    Market Slug: <code>/{item.market.slug}</code>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-4)' }}>
                  <div style={{ textAlign: 'right' }}>
                    <div
                      style={{
                        fontSize: 'var(--font-size-base)',
                        fontWeight: 800,
                        color: item.position ? '#FB923C' : 'rgba(255, 255, 255, 0.5)',
                      }}
                    >
                      {item.positionLabel}
                    </div>
                    {item.qualifyingAmountRupees && (
                      <div style={{ fontSize: '11px', color: 'rgba(255, 255, 255, 0.6)' }}>
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
                      color: expandedPricingMarketIds[item.market.id] ? '#F97316' : '#FFFFFF',
                      backgroundColor: expandedPricingMarketIds[item.market.id]
                        ? 'rgba(249, 115, 22, 0.15)'
                        : 'rgba(255, 255, 255, 0.08)',
                      border: expandedPricingMarketIds[item.market.id]
                        ? '1px solid rgba(249, 115, 22, 0.4)'
                        : '1px solid rgba(255, 255, 255, 0.15)',
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
                      color: '#FFFFFF',
                      backgroundColor: 'rgba(255, 255, 255, 0.08)',
                      border: '1px solid rgba(255, 255, 255, 0.15)',
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
                      borderTop: '1px solid rgba(255, 255, 255, 0.08)',
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
        <h2 style={{ fontSize: 'var(--font-size-lg)', fontWeight: 800, color: '#FFFFFF', margin: '0 0 var(--space-3) 0' }}>
          Eligible Markets ({eligibleMarkets.length})
        </h2>

        {eligibleMarkets.length === 0 ? (
          <div
            style={{
              backgroundColor: '#0B1F33',
              borderRadius: 'var(--radius-lg)',
              padding: 'var(--space-6)',
              textAlign: 'center',
              color: 'rgba(255, 255, 255, 0.6)',
              fontSize: 'var(--font-size-sm)',
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
                  backgroundColor: '#0B1F33',
                  borderRadius: 'var(--radius-lg)',
                  padding: 'var(--space-5)',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
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
                    <span style={{ fontWeight: 700, color: '#FFFFFF' }}>{item.market.name}</span>
                    <div style={{ fontSize: '11px', color: 'rgba(255, 255, 255, 0.5)', marginTop: '2px' }}>
                      Eligible based on registered service location and category.
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
                    <span
                      style={{
                        fontSize: '11px',
                        fontWeight: 700,
                        color: 'rgba(255, 255, 255, 0.6)',
                        backgroundColor: 'rgba(255, 255, 255, 0.06)',
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
                        color: expandedPricingMarketIds[item.market.id] ? '#F97316' : '#FFFFFF',
                        backgroundColor: expandedPricingMarketIds[item.market.id]
                          ? 'rgba(249, 115, 22, 0.15)'
                          : 'rgba(255, 255, 255, 0.08)',
                        border: expandedPricingMarketIds[item.market.id]
                          ? '1px solid rgba(249, 115, 22, 0.4)'
                          : '1px solid rgba(255, 255, 255, 0.15)',
                        borderRadius: 'var(--radius-pill)',
                        padding: '6px 12px',
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
                      borderTop: '1px solid rgba(255, 255, 255, 0.08)',
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

      {/* Future Market Visibility Controls Placeholder */}
      <div
        style={{
          backgroundColor: '#0B1F33',
          borderRadius: 'var(--radius-xl)',
          padding: 'var(--space-6)',
          border: '1px dashed rgba(255, 255, 255, 0.2)',
          textAlign: 'center',
          color: 'rgba(255, 255, 255, 0.7)',
        }}
      >
        <div style={{ color: '#FB923C', fontWeight: 800, fontSize: 'var(--font-size-sm)', marginBottom: '4px' }}>
          Market Visibility Controls
        </div>
        <p style={{ margin: 0, fontSize: 'var(--font-size-xs)', color: 'rgba(255, 255, 255, 0.6)' }}>
          Future visibility and position controls will appear here when the ranking engine is connected.
        </p>
      </div>

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
        Market position represents paid visibility within the selected AageOnline market and does not independently establish that the business is the best choice or top-rated.
      </div>
    </div>
  );
}

export default function WorkspaceMarketsPage() {
  return (
    <Suspense fallback={<div style={{ color: '#FFFFFF' }}>Loading markets...</div>}>
      <MarketsManagementContent />
    </Suspense>
  );
}
