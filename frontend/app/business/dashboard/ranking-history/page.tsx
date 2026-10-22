'use client';

/**
 * AageOnline — Business Workspace Ranking History Page
 *
 * Displays auditable, append-only ranking movement history for the authenticated business.
 * Features:
 * - Filter by market and movement direction
 * - Accessible movement direction badges (Up / Down / Entry)
 * - Clear, neutral wording without objective quality claims
 * - Permanent paid visibility transparency disclosures
 * - Stable bounded pagination
 */

import React, { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import type { RankingHistoryItem } from '../../../../lib/workspace/ranking-history.ts';

function RankingHistoryContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const businessIdParam = searchParams.get('businessId') || undefined;

  const [history, setHistory] = useState<RankingHistoryItem[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(1);
  const [directionFilter, setDirectionFilter] = useState<'ALL' | 'UP' | 'DOWN' | 'ENTRY'>('ALL');
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    async function loadHistory() {
      try {
        setLoading(true);
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
          router.replace('/business/claim?returnUrl=/business/dashboard/ranking-history');
          return;
        }

        const { resolveWorkspaceContext } = await import('../../../../lib/workspace/store.ts');
        const ctx = await resolveWorkspaceContext(userId, businessIdParam);

        const res = await fetch(
          `/api/business/dashboard/ranking-history?businessId=${ctx.currentBusiness.id}&direction=${directionFilter}&page=${page}&limit=10`
        );
        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.error?.message || 'Failed to load ranking history.');
        }

        setHistory(data.data.history || []);
        setTotalCount(data.data.pagination.totalCount || 0);
      } catch (err: unknown) {
        setErrorMessage(err instanceof Error ? err.message : 'Error loading ranking history');
      } finally {
        setLoading(false);
      }
    }

    loadHistory();
  }, [businessIdParam, directionFilter, page, router]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
      {/* Page Header */}
      <div>
        <h1 style={{ fontSize: 'var(--font-size-2xl)', fontWeight: 800, margin: '0 0 var(--space-2) 0', color: '#0F172A' }}>
          Ranking Movement &amp; Visibility History
        </h1>
        <p style={{ margin: 0, fontSize: 'var(--font-size-sm)', color: '#64748B' }}>
          Auditable record of all position changes resulting from verified market settlements.
        </p>
      </div>

      {/* Transparency Banner */}
      <div
        style={{
          backgroundColor: '#FFFBEB',
          border: '1px solid #FDE68A',
          borderRadius: 'var(--radius-lg)',
          padding: 'var(--space-4) var(--space-5)',
          display: 'flex',
          alignItems: 'center',
          gap: 'var(--space-3)',
        }}
      >
        <span style={{ fontSize: '18px' }}>ℹ️</span>
        <div style={{ fontSize: 'var(--font-size-xs)', color: '#92400E', lineHeight: 1.5 }}>
          <strong style={{ color: '#B45309' }}>Transparency Notice:</strong> Visibility rankings reflect active, verified paid placement rules.
          Movement reflects competitive market activity and does not indicate objective business quality, trustworthiness, or editorial endorsement.
        </div>
      </div>

      {/* Filter Bar */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 'var(--space-3)',
          backgroundColor: '#FFFFFF',
          padding: 'var(--space-3) var(--space-4)',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid #E2E8F0',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.03)',
        }}
      >
        <div style={{ display: 'flex', gap: 'var(--space-2)', alignItems: 'center' }}>
          <span style={{ fontSize: 'var(--font-size-xs)', color: '#64748B', fontWeight: 600 }}>
            Filter Movement:
          </span>
          {(['ALL', 'UP', 'DOWN', 'ENTRY'] as const).map((dir) => (
            <button
              key={dir}
              onClick={() => {
                setDirectionFilter(dir);
                setPage(1);
              }}
              style={{
                backgroundColor: directionFilter === dir ? '#EA580C' : '#F1F5F9',
                color: directionFilter === dir ? '#FFFFFF' : '#334155',
                border: directionFilter === dir ? 'none' : '1px solid #CBD5E1',
                padding: '5px 14px',
                borderRadius: 'var(--radius-pill)',
                fontSize: '11px',
                fontWeight: 700,
                cursor: 'pointer',
                transition: 'background-color 0.15s ease',
              }}
            >
              {dir === 'ALL' ? 'All Movements' : dir === 'UP' ? 'Rank Advanced' : dir === 'DOWN' ? 'Rank Dropped' : 'New Entries'}
            </button>
          ))}
        </div>

        <div style={{ fontSize: 'var(--font-size-xs)', color: '#64748B', fontWeight: 600 }}>
          {totalCount} recorded movement{totalCount !== 1 ? 's' : ''}
        </div>
      </div>

      {/* Error state */}
      {errorMessage && (
        <div
          style={{
            backgroundColor: '#FEE2E2',
            border: '1px solid #FCA5A5',
            color: '#991B1B',
            padding: 'var(--space-4)',
            borderRadius: 'var(--radius-lg)',
            textAlign: 'center',
            fontSize: 'var(--font-size-sm)',
            fontWeight: 700,
          }}
        >
          {errorMessage}
        </div>
      )}

      {/* Loading state */}
      {loading ? (
        <div style={{ padding: 'var(--space-12) 0', textAlign: 'center', color: '#64748B', fontWeight: 600 }}>
          Loading ranking movement records...
        </div>
      ) : history.length === 0 ? (
        /* Empty state */
        <div
          style={{
            backgroundColor: '#FFFFFF',
            borderRadius: 'var(--radius-xl)',
            padding: 'var(--space-12) var(--space-6)',
            textAlign: 'center',
            border: '1px dashed #CBD5E1',
          }}
        >
          <div style={{ fontSize: '32px', marginBottom: 'var(--space-3)' }}>📊</div>
          <h3 style={{ fontSize: 'var(--font-size-base)', fontWeight: 800, color: '#0F172A', margin: '0 0 var(--space-2) 0' }}>
            No Ranking Movement Recorded Yet
          </h3>
          <p style={{ margin: 0, fontSize: 'var(--font-size-xs)', color: '#64748B', maxWidth: '440px', marginLeft: 'auto', marginRight: 'auto' }}>
            When your business enters a market or another verified settlement shifts positioning, auditable movements will appear here automatically.
          </p>
        </div>
      ) : (
        /* History Records Table */
        <div
          style={{
            backgroundColor: '#FFFFFF',
            borderRadius: 'var(--radius-xl)',
            border: '1px solid #E2E8F0',
            boxShadow: '0 2px 8px rgba(15, 23, 42, 0.04)',
            overflow: 'hidden',
          }}
        >
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: 'var(--font-size-xs)' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #E2E8F0', backgroundColor: '#F8FAFC' }}>
                  <th style={{ padding: '12px 16px', color: '#475569', fontWeight: 700 }}>Market</th>
                  <th style={{ padding: '12px 16px', color: '#475569', fontWeight: 700 }}>Movement</th>
                  <th style={{ padding: '12px 16px', color: '#475569', fontWeight: 700 }}>Position Change</th>
                  <th style={{ padding: '12px 16px', color: '#475569', fontWeight: 700 }}>Details</th>
                  <th style={{ padding: '12px 16px', color: '#475569', fontWeight: 700 }}>Recorded Date</th>
                </tr>
              </thead>
              <tbody>
                {history.map((item) => (
                  <tr
                    key={item.id}
                    style={{
                      borderBottom: '1px solid #F1F5F9',
                      transition: 'background-color 0.15s ease',
                    }}
                  >
                    <td style={{ padding: '14px 16px', fontWeight: 800, color: '#0F172A' }}>
                      {item.marketName}
                    </td>
                    <td style={{ padding: '14px 16px' }}>
                      <span
                        style={{
                          display: 'inline-block',
                          fontSize: '11px',
                          fontWeight: 800,
                          padding: '3px 8px',
                          borderRadius: 'var(--radius-pill)',
                          backgroundColor:
                            item.direction === 'UP'
                              ? '#ECFDF5'
                              : item.direction === 'DOWN'
                              ? '#FEF2F2'
                              : '#EFF6FF',
                          color:
                            item.direction === 'UP'
                              ? '#059669'
                              : item.direction === 'DOWN'
                              ? '#DC2626'
                              : '#2563EB',
                          border:
                            item.direction === 'UP'
                              ? '1px solid #A7F3D0'
                              : item.direction === 'DOWN'
                              ? '1px solid #FECACA'
                              : '1px solid #BFDBFE',
                        }}
                      >
                        {item.direction === 'UP' ? '▲ Advanced' : item.direction === 'DOWN' ? '▼ Dropped' : '★ New Entry'}
                      </span>
                    </td>
                    <td style={{ padding: '14px 16px', fontWeight: 700, color: '#0F172A' }}>
                      {item.previousPosition !== null ? `#${item.previousPosition}` : 'Unranked'} → #{item.newPosition}
                    </td>
                    <td style={{ padding: '14px 16px', color: '#475569' }}>
                      {item.movementText || item.cause}
                    </td>
                    <td style={{ padding: '14px 16px', color: '#64748B' }}>
                      {new Date(item.createdAt).toLocaleString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalCount > 10 && (
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: 'var(--space-3) var(--space-4)',
                borderTop: '1px solid #E2E8F0',
                backgroundColor: '#F8FAFC',
              }}
            >
              <button
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                style={{
                  backgroundColor: page <= 1 ? '#F1F5F9' : '#FFFFFF',
                  color: page <= 1 ? '#94A3B8' : '#334155',
                  border: '1px solid #CBD5E1',
                  borderRadius: 'var(--radius-pill)',
                  padding: '6px 14px',
                  fontSize: '11px',
                  fontWeight: 700,
                  cursor: page <= 1 ? 'not-allowed' : 'pointer',
                }}
              >
                ← Previous
              </button>
              <span style={{ fontSize: '11px', color: '#64748B' }}>
                Page {page} of {Math.ceil(totalCount / 10)}
              </span>
              <button
                disabled={page >= Math.ceil(totalCount / 10)}
                onClick={() => setPage((p) => p + 1)}
                style={{
                  backgroundColor: page >= Math.ceil(totalCount / 10) ? '#F1F5F9' : '#FFFFFF',
                  color: page >= Math.ceil(totalCount / 10) ? '#94A3B8' : '#334155',
                  border: '1px solid #CBD5E1',
                  borderRadius: 'var(--radius-pill)',
                  padding: '6px 14px',
                  fontSize: '11px',
                  fontWeight: 700,
                  cursor: page >= Math.ceil(totalCount / 10) ? 'not-allowed' : 'pointer',
                }}
              >
                Next →
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function WorkspaceRankingHistoryPage() {
  return (
    <Suspense fallback={<div style={{ color: '#64748B', padding: 'var(--space-8)' }}>Loading ranking history...</div>}>
      <RankingHistoryContent />
    </Suspense>
  );
}
