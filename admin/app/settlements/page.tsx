'use client';

import React, { useEffect, useState } from 'react';

interface SettlementItem {
  id: string;
  marketSlug: string;
  marketName: string;
  businessId: string;
  businessName: string;
  awardedPosition: number;
  qualifyingAmountRupees: number;
  status: string;
  settledAt: string;
  transactionRef: string;
}

export default function AdminSettlementsPage() {
  const [settlements, setSettlements] = useState<SettlementItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadSettlements() {
      try {
        setLoading(true);
        setError(null);
        const res = await fetch('/api/settlements');
        if (res.status === 401 || res.status === 403) {
          window.location.href = '/login?from=/settlements';
          return;
        }
        if (!res.ok) {
          throw new Error(`Failed to load settlements: HTTP ${res.status}`);
        }
        const data = await res.json();
        setSettlements(data?.settlements || []);
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'Error fetching settlements');
      } finally {
        setLoading(false);
      }
    }

    loadSettlements();
  }, []);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 800, margin: 0, color: '#FFFFFF', letterSpacing: '-0.02em' }}>
            Ranking Settlement &amp; Audit
          </h1>
          <p style={{ margin: '6px 0 0 0', color: 'var(--text-muted)', fontSize: '13px' }}>
            Auditable records of paid position settlements locked atomically into market ranking history.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span className="badge badge-success">ATOMIC TRANSACTIONS VERIFIED</span>
        </div>
      </div>

      {/* Invariants Card */}
      <div
        style={{
          padding: '16px 20px',
          borderRadius: 'var(--radius-sm)',
          backgroundColor: 'rgba(234, 88, 12, 0.08)',
          border: '1px solid rgba(234, 88, 12, 0.25)',
          display: 'flex',
          flexDirection: 'column',
          gap: '6px',
        }}
      >
        <div style={{ fontSize: '13px', fontWeight: 700, color: '#FB923C' }}>
          Payment &amp; Settlement Finality Policy
        </div>
        <div style={{ fontSize: '12px', color: 'var(--text-muted)', lineHeight: 1.5 }}>
          In accordance with AageOnline core architecture, all settlements are final. When a competitor secures a higher position,
          previously awarded businesses shift down atomically without financial refunds or credit balances.
        </div>
      </div>

      {/* Error */}
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

      {/* Dense Table Card */}
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
            Settlement Ledger ({settlements.length} Records)
          </span>
          <span style={{ fontSize: '11px', color: 'var(--text-dim)' }}>
            Append-only financial persistence
          </span>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table className="admin-table">
            <thead>
              <tr>
                <th>Settlement ID</th>
                <th>Market Vertical</th>
                <th>Winning Business</th>
                <th>Awarded Position</th>
                <th>Qualifying Paid</th>
                <th>Payment Provider Ref</th>
                <th>Timestamp</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={8} style={{ textAlign: 'center', padding: '36px', color: 'var(--text-muted)' }}>
                    Loading settlement records...
                  </td>
                </tr>
              ) : settlements.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ textAlign: 'center', padding: '36px', color: 'var(--text-muted)' }}>
                    No settled positions recorded yet.
                  </td>
                </tr>
              ) : (
                settlements.map((s) => (
                  <tr key={s.id}>
                    <td>
                      <code style={{ fontSize: '12px', color: '#FB923C' }}>{s.id}</code>
                    </td>
                    <td>
                      <div style={{ fontWeight: 600, color: '#FFFFFF' }}>{s.marketName}</div>
                      <div style={{ fontSize: '11px', color: 'var(--text-dim)' }}>{s.marketSlug}</div>
                    </td>
                    <td>
                      <div style={{ fontWeight: 600, color: '#E2E8F0' }}>{s.businessName}</div>
                      <div style={{ fontSize: '11px', color: 'var(--text-dim)', fontFamily: 'monospace' }}>
                        {s.businessId}
                      </div>
                    </td>
                    <td>
                      <span className="badge badge-warning" style={{ fontWeight: 800 }}>
                        Rank #{s.awardedPosition}
                      </span>
                    </td>
                    <td style={{ fontFamily: 'monospace', fontWeight: 700, color: '#10B981' }}>
                      ₹{s.qualifyingAmountRupees.toLocaleString('en-IN')}
                    </td>
                    <td>
                      <code style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                        {s.transactionRef}
                      </code>
                    </td>
                    <td style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                      {new Date(s.settledAt).toLocaleString()}
                    </td>
                    <td>
                      <span className="badge badge-success">{s.status}</span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
