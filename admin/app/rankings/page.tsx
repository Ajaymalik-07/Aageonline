'use client';

import React, { useEffect, useState } from 'react';

interface RankingHistoryEntry {
  position: number;
  qualifyingAmountRupees: number;
  settledAt: string;
}

interface RankingItem {
  id: string;
  marketId: string;
  marketSlug: string;
  marketName: string;
  position: number;
  businessId: string;
  businessName: string;
  qualifyingAmountRupees: number;
  settledAt: string;
  transactionRef: string;
  history?: RankingHistoryEntry[];
}

export default function AdminRankingsPage() {
  const [rankings, setRankings] = useState<RankingItem[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedRanking, setSelectedRanking] = useState<RankingItem | null>(null);

  useEffect(() => {
    async function loadRankings() {
      try {
        setLoading(true);
        setError(null);
        const res = await fetch('/api/rankings');
        if (res.status === 401 || res.status === 403) {
          window.location.href = '/login?from=/rankings';
          return;
        }
        if (!res.ok) {
          throw new Error(`Failed to load rankings: HTTP ${res.status}`);
        }
        const data = await res.json();
        const items = Array.isArray(data?.rankings) ? data.rankings : Array.isArray(data) ? data : [];
        setRankings(items);
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'Error fetching ranking ladder');
      } finally {
        setLoading(false);
      }
    }

    loadRankings();
  }, []);

  const filtered = rankings.filter((r) => {
    const q = search.toLowerCase();
    return (
      (r.businessName && r.businessName.toLowerCase().includes(q)) ||
      (r.marketName && r.marketName.toLowerCase().includes(q)) ||
      (r.marketSlug && r.marketSlug.toLowerCase().includes(q)) ||
      (r.transactionRef && r.transactionRef.toLowerCase().includes(q))
    );
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 800, margin: 0, color: '#FFFFFF', letterSpacing: '-0.02em' }}>
            Active Rankings &amp; Position Ladders
          </h1>
          <p style={{ margin: '6px 0 0 0', color: 'var(--text-muted)', fontSize: '13px' }}>
            Current paid visibility positions, qualifying bid floors, and historical ledger audit trails.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '12px' }}>
          <input
            type="text"
            placeholder="Search business, market, transaction..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="admin-input"
            style={{ width: '280px' }}
          />
        </div>
      </div>

      {/* Statutory Invariant Notice */}
      <div
        style={{
          padding: '14px 18px',
          borderRadius: 'var(--radius-sm)',
          backgroundColor: 'rgba(59, 130, 246, 0.1)',
          border: '1px solid rgba(59, 130, 246, 0.3)',
          display: 'flex',
          gap: '12px',
          alignItems: 'center',
          fontSize: '12px',
          color: '#93C5FD',
        }}
      >
        <span style={{ fontSize: '18px' }}>🛡️</span>
        <div>
          <strong>Financial Finality &amp; Integrity Guard:</strong> Rankings are modified strictly via authenticated, server-verified payment settlements. Administrative interfaces cannot manually overwrite position ladder rank order or bypass transactional row locks.
        </div>
      </div>

      {/* KPI Stats Strip */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
        <div className="admin-card" style={{ padding: '16px 20px' }}>
          <div style={{ fontSize: '11px', color: 'var(--text-dim)', fontWeight: 600, textTransform: 'uppercase' }}>
            Occupied Positions
          </div>
          <div style={{ fontSize: '24px', fontWeight: 800, color: '#FFFFFF', marginTop: '6px' }}>
            {rankings.length}
          </div>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>
            Across all active markets
          </div>
        </div>

        <div className="admin-card" style={{ padding: '16px 20px' }}>
          <div style={{ fontSize: '11px', color: 'var(--text-dim)', fontWeight: 600, textTransform: 'uppercase' }}>
            Highest Rank Value
          </div>
          <div style={{ fontSize: '24px', fontWeight: 800, color: 'var(--brand-highlight)', marginTop: '6px' }}>
            ₹{rankings.reduce((max, r) => Math.max(max, r.qualifyingAmountRupees || 0), 0).toLocaleString('en-IN')}
          </div>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>
            Current top position floor
          </div>
        </div>

        <div className="admin-card" style={{ padding: '16px 20px' }}>
          <div style={{ fontSize: '11px', color: 'var(--text-dim)', fontWeight: 600, textTransform: 'uppercase' }}>
            Concurrency Engine
          </div>
          <div style={{ fontSize: '24px', fontWeight: 800, color: '#10B981', marginTop: '6px' }}>
            PostgreSQL Lock
          </div>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>
            Zero lost mutations
          </div>
        </div>
      </div>

      {/* Error Banner */}
      {error && (
        <div
          style={{
            padding: '14px 18px',
            borderRadius: 'var(--radius-sm)',
            backgroundColor: 'rgba(239, 68, 68, 0.15)',
            border: '1px solid rgba(239, 68, 68, 0.35)',
            color: '#F87171',
            fontSize: '13px',
          }}
        >
          {error}
        </div>
      )}

      {/* Rankings Table */}
      <div className="admin-card">
        <div
          style={{
            padding: '16px 20px',
            borderBottom: '1px solid var(--border-subtle)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <span style={{ fontSize: '13px', fontWeight: 700, color: '#FFFFFF' }}>
            Active Market Position Ladders ({filtered.length})
          </span>
          <span style={{ fontSize: '11px', color: 'var(--text-dim)' }}>
            Authority: Append-Only Position Ledger
          </span>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table className="admin-table">
            <thead>
              <tr>
                <th>Rank</th>
                <th>Business Name</th>
                <th>Market Pair</th>
                <th>Qualifying Price</th>
                <th>Last Settlement</th>
                <th>Transaction Ref</th>
                <th>Audit Details</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: '40px', color: 'var(--text-dim)' }}>
                    Loading ranking ladders...
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: '40px', color: 'var(--text-dim)' }}>
                    No ranking records found matching &ldquo;{search}&rdquo;
                  </td>
                </tr>
              ) : (
                filtered.map((r) => (
                  <tr key={r.id}>
                    <td>
                      <div
                        style={{
                          width: '32px',
                          height: '32px',
                          borderRadius: '8px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontWeight: 800,
                          fontSize: '14px',
                          background:
                            r.position === 1
                              ? 'linear-gradient(135deg, #EA580C, #FB923C)'
                              : r.position === 2
                              ? 'rgba(255, 255, 255, 0.15)'
                              : 'rgba(255, 255, 255, 0.05)',
                          color: '#FFFFFF',
                          border: r.position === 1 ? 'none' : '1px solid var(--border-subtle)',
                        }}
                      >
                        #{r.position}
                      </div>
                    </td>
                    <td>
                      <div style={{ fontWeight: 600, color: '#FFFFFF' }}>{r.businessName}</div>
                      <div style={{ fontSize: '11px', color: 'var(--text-dim)' }}>{r.businessId}</div>
                    </td>
                    <td>
                      <div style={{ fontWeight: 500, color: '#E2E8F0' }}>{r.marketName}</div>
                      <a
                        href={`http://localhost:3000/${r.marketSlug}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{ fontSize: '11px', color: '#60A5FA', textDecoration: 'underline' }}
                      >
                        /{r.marketSlug} ↗
                      </a>
                    </td>
                    <td>
                      <span style={{ fontWeight: 700, color: 'var(--brand-highlight)', fontSize: '14px' }}>
                        ₹{r.qualifyingAmountRupees.toLocaleString('en-IN')}
                      </span>
                    </td>
                    <td>
                      <div style={{ fontSize: '12px', color: '#CBD5E1' }}>
                        {new Date(r.settledAt).toLocaleDateString('en-IN', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </div>
                      <div style={{ fontSize: '11px', color: 'var(--text-dim)' }}>
                        {new Date(r.settledAt).toLocaleTimeString('en-IN', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </div>
                    </td>
                    <td>
                      <code style={{ fontSize: '11px', color: 'var(--text-muted)', background: 'rgba(255, 255, 255, 0.04)', padding: '2px 6px', borderRadius: '4px' }}>
                        {r.transactionRef}
                      </code>
                    </td>
                    <td>
                      <button
                        onClick={() => setSelectedRanking(r)}
                        style={{
                          padding: '6px 12px',
                          background: 'rgba(255, 255, 255, 0.06)',
                          border: '1px solid var(--border-subtle)',
                          borderRadius: 'var(--radius-sm)',
                          color: '#FFFFFF',
                          fontSize: '11px',
                          cursor: 'pointer',
                          fontWeight: 600,
                        }}
                      >
                        View History ({r.history?.length || 1})
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* History Modal */}
      {selectedRanking && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(7, 21, 38, 0.85)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '16px',
          }}
        >
          <div
            className="admin-card"
            style={{
              width: '100%',
              maxWidth: '560px',
              padding: '24px',
              position: 'relative',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
              <div>
                <h2 style={{ fontSize: '18px', fontWeight: 800, margin: 0, color: '#FFFFFF' }}>
                  Position Mutation History
                </h2>
                <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: 'var(--text-muted)' }}>
                  {selectedRanking.businessName} in {selectedRanking.marketName}
                </p>
              </div>
              <button
                onClick={() => setSelectedRanking(null)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--text-muted)',
                  fontSize: '18px',
                  cursor: 'pointer',
                }}
              >
                ✕
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '16px' }}>
              {selectedRanking.history?.map((h, i) => (
                <div
                  key={i}
                  style={{
                    padding: '12px 16px',
                    borderRadius: 'var(--radius-sm)',
                    background: 'rgba(255, 255, 255, 0.03)',
                    border: '1px solid var(--border-subtle)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <span
                      style={{
                        padding: '4px 8px',
                        borderRadius: '4px',
                        background: h.position === 1 ? 'var(--brand-primary)' : 'rgba(255, 255, 255, 0.1)',
                        color: '#FFFFFF',
                        fontWeight: 700,
                        fontSize: '12px',
                      }}
                    >
                      Rank #{h.position}
                    </span>
                    <span style={{ fontSize: '13px', fontWeight: 600, color: '#FFFFFF' }}>
                      ₹{h.qualifyingAmountRupees.toLocaleString('en-IN')}
                    </span>
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                    {new Date(h.settledAt).toLocaleString('en-IN')}
                  </div>
                </div>
              ))}
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '20px' }}>
              <button
                onClick={() => setSelectedRanking(null)}
                style={{
                  padding: '8px 16px',
                  background: 'var(--brand-primary)',
                  border: 'none',
                  borderRadius: 'var(--radius-sm)',
                  color: '#FFFFFF',
                  fontWeight: 600,
                  fontSize: '12px',
                  cursor: 'pointer',
                }}
              >
                Close History
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
