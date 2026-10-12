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
        const { getActiveDevSession } = await import('../../../../lib/auth/store.ts');
        const session = getActiveDevSession();

        if (!session) {
          router.replace('/auth/login?returnUrl=/business/dashboard/ranking-history');
          return;
        }

        const { resolveWorkspaceContext } = await import('../../../../lib/workspace/store.ts');
        const ctx = await resolveWorkspaceContext(session.userId, businessIdParam);

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
        <h1 style={{ fontSize: 'var(--font-size-2xl)', fontWeight: 800, margin: '0 0 var(--space-2) 0', color: '#FFFFFF' }}>
          Ranking Movement &amp; Visibility History
        </h1>
        <p style={{ margin: 0, fontSize: 'var(--font-size-sm)', color: 'rgba(255, 255, 255, 0.7)' }}>
          Auditable record of all position changes resulting from verified market settlements.
        </p>
      </div>

      {/* Transparency Banner */}
      <div
        style={{
          backgroundColor: 'rgba(234, 88, 12, 0.08)',
          border: '1px solid rgba(234, 88, 12, 0.25)',
          borderRadius: 'var(--radius-lg)',
          padding: 'var(--space-4) var(--space-5)',
          display: 'flex',
          alignItems: 'center',
          gap: 'var(--space-3)',
        }}
      >
        <span style={{ fontSize: '18px' }}>ℹ️</span>
        <div style={{ fontSize: 'var(--font-size-xs)', color: '#FB923C', lineHeight: 1.5 }}>
          <strong>Transparency Notice:</strong> Visibility rankings reflect active, verified paid placement rules.
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
          backgroundColor: '#0B1F33',
          padding: 'var(--space-3) var(--space-4)',
          borderRadius: 'var(--radius-lg)',
        }}
      >
        <div style={{ display: 'flex', gap: 'var(--space-2)', alignItems: 'center' }}>
          <span style={{ fontSize: 'var(--font-size-xs)', color: 'rgba(255, 255, 255, 0.6)', fontWeight: 600 }}>
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
                backgroundColor: directionFilter === dir ? '#EA580C' : 'rgba(255, 255, 255, 0.08)',
                color: directionFilter === dir ? '#FFFFFF' : 'rgba(255, 255, 255, 0.8)',
                border: 'none',
                padding: '4px 12px',
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

        <div style={{ fontSize: 'var(--font-size-xs)', color: 'rgba(255, 255, 255, 0.5)' }}>
          {totalCount} recorded movement{totalCount !== 1 ? 's' : ''}
        </div>
      </div>

      {/* Error state */}
      {errorMessage && (
        <div
          style={{
            backgroundColor: 'rgba(239, 68, 68, 0.1)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            color: '#F87171',
            padding: 'var(--space-4)',
            borderRadius: 'var(--radius-lg)',
            textAlign: 'center',
            fontSize: 'var(--font-size-sm)',
          }}
        >
          {errorMessage}
        </div>
      )}

      {/* Loading state */}
      {loading ? (
        <div style={{ padding: 'var(--space-12) 0', textAlign: 'center', color: 'rgba(255, 255, 255, 0.6)' }}>
          Loading ranking movement records...
        </div>
      ) : history.length === 0 ? (
        /* Empty state */
        <div
          style={{
            backgroundColor: '#0B1F33',
            borderRadius: 'var(--radius-xl)',
            padding: 'var(--space-12) var(--space-6)',
            textAlign: 'center',
            border: '1px dashed rgba(255, 255, 255, 0.15)',
          }}
        >
          <div style={{ fontSize: '32px', marginBottom: 'var(--space-3)' }}>📊</div>
          <h3 style={{ fontSize: 'var(--font-size-base)', fontWeight: 700, color: '#FFFFFF', margin: '0 0 var(--space-2) 0' }}>
            No Ranking Movement Recorded Yet
          </h3>
          <p style={{ margin: 0, fontSize: 'var(--font-size-xs)', color: 'rgba(255, 255, 255, 0.6)', maxWidth: '440px', marginLeft: 'auto', marginRight: 'auto' }}>
            When your business enters a market or another verified settlement shifts positioning, auditable movements will appear here automatically.
          </p>
        </div>
      ) : (
        /* History Records Table */
        <div
          style={{
            backgroundColor: '#0B1F33',
            borderRadius: 'var(--radius-xl)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            overflow: 'hidden',
          }}
        >
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: 'var(--font-size-xs)' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.1)', backgroundColor: 'rgba(255, 255, 255, 0.02)' }}>
                  <th style={{ padding: '12px 16px', color: 'rgba(255, 255, 255, 0.5)', fontWeight: 700 }}>Market</th>
                  <th style={{ padding: '12px 16px', color: 'rgba(255, 255, 255, 0.5)', fontWeight: 700 }}>Movement</th>
                  <th style={{ padding: '12px 16px', color: 'rgba(255, 255, 255, 0.5)', fontWeight: 700 }}>Position Change</th>
                  <th style={{ padding: '12px 16px', color: 'rgba(255, 255, 255, 0.5)', fontWeight: 700 }}>Details</th>
                  <th style={{ padding: '12px 16px', color: 'rgba(255, 255, 255, 0.5)', fontWeight: 700 }}>Recorded Date</th>
                </tr>
              </thead>
              <tbody>
                {history.map((item) => (
                  <tr
                    key={item.id}
                    style={{
                      borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
                      transition: 'background-color 0.15s ease',
                    }}
                  >
                    <td style={{ padding: '14px 16px', fontWeight: 700, color: '#FFFFFF' }}>
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
                              ? 'rgba(34, 197, 94, 0.15)'
                              : item.direction === 'DOWN'
                              ? 'rgba(239, 68, 68, 0.15)'
                              : 'rgba(59, 130, 246, 0.15)',
                          color:
                            item.direction === 'UP'
                              ? '#4ADE80'
                              : item.direction === 'DOWN'
                              ? '#F87171'
                              : '#60A5FA',
                        }}
                      >
                        {item.direction === 'UP' ? '▲ Advanced' : item.direction === 'DOWN' ? '▼ Dropped' : '★ New Entry'}
                      </span>
                    </td>
                    <td style={{ padding: '14px 16px', fontWeight: 800 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span style={{ color: 'rgba(255, 255, 255, 0.6)' }}>
                          {item.previousPosition !== null ? `#${item.previousPosition}` : 'None'}
                        </span>
                        <span style={{ color: 'rgba(255, 255, 255, 0.4)' }}>→</span>
                        <span style={{ color: '#EA580C', fontSize: '13px' }}>#{item.newPosition}</span>
                      </div>
                    </td>
                    <td style={{ padding: '14px 16px', color: 'rgba(255, 255, 255, 0.75)', maxWidth: '340px' }}>
                      {item.movementText}
                    </td>
                    <td style={{ padding: '14px 16px', color: 'rgba(255, 255, 255, 0.5)', whiteSpace: 'nowrap' }}>
                      {new Date(item.createdAt).toLocaleString('en-IN', {
                        dateStyle: 'medium',
                        timeStyle: 'short',
                      })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination Controls */}
          {totalCount > 10 && (
            <div
              style={{
                display: 'flex',
                justifyContent: 'flex-end',
                alignItems: 'center',
                gap: 'var(--space-3)',
                padding: 'var(--space-3) var(--space-4)',
                borderTop: '1px solid rgba(255, 255, 255, 0.08)',
              }}
            >
              <button
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                style={{
                  backgroundColor: 'rgba(255, 255, 255, 0.08)',
                  color: page <= 1 ? 'rgba(255, 255, 255, 0.3)' : '#FFFFFF',
                  border: 'none',
                  padding: '4px 10px',
                  borderRadius: 'var(--radius-md)',
                  fontSize: '11px',
                  cursor: page <= 1 ? 'not-allowed' : 'pointer',
                }}
              >
                Previous
              </button>
              <span style={{ fontSize: '11px', color: 'rgba(255, 255, 255, 0.6)' }}>
                Page {page} of {Math.ceil(totalCount / 10)}
              </span>
              <button
                disabled={page >= Math.ceil(totalCount / 10)}
                onClick={() => setPage((p) => p + 1)}
                style={{
                  backgroundColor: 'rgba(255, 255, 255, 0.08)',
                  color: page >= Math.ceil(totalCount / 10) ? 'rgba(255, 255, 255, 0.3)' : '#FFFFFF',
                  border: 'none',
                  padding: '4px 10px',
                  borderRadius: 'var(--radius-md)',
                  fontSize: '11px',
                  cursor: page >= Math.ceil(totalCount / 10) ? 'not-allowed' : 'pointer',
                }}
              >
                Next
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function RankingHistoryPage() {
  return (
    <Suspense
      fallback={
        <div style={{ padding: 'var(--space-12) 0', textAlign: 'center', color: 'rgba(255, 255, 255, 0.7)' }}>
          Loading ranking history...
        </div>
      }
    >
      <RankingHistoryContent />
    </Suspense>
  );
}
