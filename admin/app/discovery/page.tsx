'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';

interface DiscoveryRequest {
  id: string;
  type: 'MARKET' | 'CATEGORY' | 'LOCATION';
  name: string;
  suggestedSlug: string;
  source: string;
  submittedAt: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'DEFERRED';
  submissionCount: number;
  reviewNotes?: string;
}

export default function AdminDiscoveryPage() {
  const [requests, setRequests] = useState<DiscoveryRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'PENDING' | 'APPROVED' | 'REJECTED'>('ALL');
  const [reviewingItem, setReviewingItem] = useState<DiscoveryRequest | null>(null);
  const [actionReason, setActionReason] = useState('');
  const [submittingAction, setSubmittingAction] = useState(false);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  const loadDiscoveryRequests = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch('/api/discovery');
      if (res.status === 401 || res.status === 403) {
        window.location.href = '/login?from=/discovery';
        return;
      }
      if (!res.ok) {
        throw new Error(`Failed to load discovery queue: HTTP ${res.status}`);
      }
      const data = await res.json();
      const items: DiscoveryRequest[] = Array.isArray(data?.requests)
        ? data.requests
        : Array.isArray(data)
        ? data
        : [];
      setRequests(items);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error fetching discovery pipeline');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDiscoveryRequests();
  }, []);

  const handleReviewAction = async (action: 'APPROVE' | 'REJECT' | 'DEFER') => {
    if (!reviewingItem) return;

    try {
      setSubmittingAction(true);
      setError(null);
      setActionSuccess(null);

      const res = await fetch('/api/discovery', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: reviewingItem.id,
          action,
          reason: actionReason || `Admin ${action.toLowerCase()} via Discovery Queue`,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message || `HTTP ${res.status}`);
      }

      setActionSuccess(`Successfully ${action.toLowerCase()}d "${reviewingItem.name}".`);
      setReviewingItem(null);
      setActionReason('');
      await loadDiscoveryRequests();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to update discovery status');
    } finally {
      setSubmittingAction(false);
    }
  };

  const filtered = requests.filter((item) => {
    const q = search.toLowerCase();
    const matchesSearch =
      item.name.toLowerCase().includes(q) ||
      item.suggestedSlug.toLowerCase().includes(q) ||
      item.source.toLowerCase().includes(q) ||
      item.type.toLowerCase().includes(q);

    const matchesStatus = statusFilter === 'ALL' || item.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const pendingCount = requests.filter((r) => r.status === 'PENDING').length;
  const approvedCount = requests.filter((r) => r.status === 'APPROVED').length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 800, margin: 0, color: '#FFFFFF', letterSpacing: '-0.02em' }}>
            Discovery Queue &amp; Taxonomy Approvals
          </h1>
          <p style={{ margin: '6px 0 0 0', color: 'var(--text-muted)', fontSize: '13px' }}>
            Review user suggestions, new business claim categories, and automated expansion scans before publication.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <Link
            href="/markets"
            style={{
              padding: '8px 16px',
              borderRadius: 'var(--radius-sm)',
              backgroundColor: 'rgba(234, 88, 12, 0.1)',
              border: '1px solid rgba(234, 88, 12, 0.25)',
              color: 'var(--brand-highlight)',
              fontSize: '13px',
              fontWeight: 700,
              textDecoration: 'none',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            📍 Go to Published Markets →
          </Link>
        </div>
      </div>

      {/* EDUCATIONAL ARCHITECTURE BANNER: Market vs Discovery */}
      <div
        style={{
          padding: '16px 20px',
          borderRadius: 'var(--radius-sm)',
          backgroundColor: 'rgba(59, 130, 246, 0.08)',
          border: '1px solid rgba(59, 130, 246, 0.25)',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: '16px',
        }}
      >
        <div>
          <div style={{ fontSize: '12px', fontWeight: 800, color: '#93C5FD', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span>🔍</span> Discovery Queue (This Page)
          </div>
          <p style={{ margin: '6px 0 0 0', fontSize: '12px', color: '#BFDBFE', lineHeight: 1.5 }}>
            <strong>Inbound Taxonomy Expansion:</strong> Candidate locations, categories, and markets submitted by users or scrapers that are <em>held in draft</em>. They are <strong>NOT live</strong> and will not appear in search or sitemaps until approved.
          </p>
        </div>

        <div>
          <div style={{ fontSize: '12px', fontWeight: 800, color: '#FDBA74', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span>📍</span> Published Markets (/markets)
          </div>
          <p style={{ margin: '6px 0 0 0', fontSize: '12px', color: '#FED7AA', lineHeight: 1.5 }}>
            <strong>Active Bidding Ladders:</strong> Officially approved Location + Category pairs live on the public site where businesses actively compete for paid visibility rankings (#1, #2, #3).
          </p>
        </div>
      </div>

      {/* KPI Counters Strip */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
        <div className="admin-card" style={{ padding: '16px 20px' }}>
          <div style={{ fontSize: '11px', color: 'var(--text-dim)', fontWeight: 600, textTransform: 'uppercase' }}>
            Pending Reviews
          </div>
          <div style={{ fontSize: '26px', fontWeight: 800, color: pendingCount > 0 ? '#F59E0B' : '#10B981', marginTop: '6px' }}>
            {pendingCount}
          </div>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>
            Awaiting admin sign-off
          </div>
        </div>

        <div className="admin-card" style={{ padding: '16px 20px' }}>
          <div style={{ fontSize: '11px', color: 'var(--text-dim)', fontWeight: 600, textTransform: 'uppercase' }}>
            Approved for Launch
          </div>
          <div style={{ fontSize: '26px', fontWeight: 800, color: '#10B981', marginTop: '6px' }}>
            {approvedCount}
          </div>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>
            Promoted to canonical catalog
          </div>
        </div>

        <div className="admin-card" style={{ padding: '16px 20px' }}>
          <div style={{ fontSize: '11px', color: 'var(--text-dim)', fontWeight: 600, textTransform: 'uppercase' }}>
            Total Expansion Candidates
          </div>
          <div style={{ fontSize: '26px', fontWeight: 800, color: '#FFFFFF', marginTop: '6px' }}>
            {requests.length}
          </div>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>
            Across all discovery streams
          </div>
        </div>
      </div>

      {/* Action Success Alert */}
      {actionSuccess && (
        <div
          style={{
            padding: '14px 18px',
            borderRadius: 'var(--radius-sm)',
            backgroundColor: 'rgba(16, 185, 129, 0.15)',
            border: '1px solid rgba(16, 185, 129, 0.35)',
            color: '#34D399',
            fontSize: '13px',
          }}
        >
          {actionSuccess}
        </div>
      )}

      {/* Error Alert */}
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

      {/* Table Card */}
      <div className="admin-card">
        {/* Controls Toolbar */}
        <div
          style={{
            padding: '16px 20px',
            borderBottom: '1px solid var(--border-subtle)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '12px',
          }}
        >
          <div style={{ display: 'flex', gap: '8px' }}>
            {(['ALL', 'PENDING', 'APPROVED', 'REJECTED'] as const).map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                style={{
                  padding: '6px 12px',
                  borderRadius: 'var(--radius-sm)',
                  border: statusFilter === st ? '1px solid var(--brand-primary)' : '1px solid var(--border-subtle)',
                  backgroundColor: statusFilter === st ? 'rgba(234, 88, 12, 0.15)' : 'transparent',
                  color: statusFilter === st ? '#FFFFFF' : 'var(--text-muted)',
                  fontSize: '12px',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                {st} {st === 'PENDING' && pendingCount > 0 ? `(${pendingCount})` : ''}
              </button>
            ))}
          </div>

          <input
            type="text"
            placeholder="Search candidate name, slug, source..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="admin-input"
            style={{ width: '280px' }}
          />
        </div>

        {/* Requests Table */}
        <div style={{ overflowX: 'auto' }}>
          <table className="admin-table">
            <thead>
              <tr>
                <th>Candidate Entity &amp; Proposed Slug</th>
                <th>Classification</th>
                <th>Source Origin</th>
                <th>Demand Velocity</th>
                <th>Status</th>
                <th>Review Notes</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: '36px', color: 'var(--text-muted)' }}>
                    Loading discovery queue...
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: '36px', color: 'var(--text-muted)' }}>
                    No discovery candidates matching filter.
                  </td>
                </tr>
              ) : (
                filtered.map((item) => (
                  <tr key={item.id}>
                    <td>
                      <div style={{ fontWeight: 700, color: '#FFFFFF', fontSize: '13px' }}>{item.name}</div>
                      <code style={{ fontSize: '11px', color: 'var(--brand-highlight)', background: 'rgba(234, 88, 12, 0.1)', padding: '2px 6px', borderRadius: '4px' }}>
                        /{item.suggestedSlug}
                      </code>
                    </td>

                    <td>
                      <span className={`badge ${item.type === 'MARKET' ? 'badge-info' : 'badge-neutral'}`}>
                        {item.type}
                      </span>
                    </td>

                    <td style={{ fontSize: '12px', color: '#E2E8F0' }}>
                      {item.source}
                    </td>

                    <td>
                      <span style={{ fontWeight: 700, color: item.submissionCount >= 4 ? 'var(--brand-highlight)' : '#FFFFFF' }}>
                        {item.submissionCount} requests
                      </span>
                    </td>

                    <td>
                      <span
                        className={`badge ${
                          item.status === 'APPROVED'
                            ? 'badge-success'
                            : item.status === 'REJECTED'
                            ? 'badge-danger'
                            : 'badge-warning'
                        }`}
                      >
                        {item.status}
                      </span>
                    </td>

                    <td style={{ fontSize: '12px', color: 'var(--text-muted)', maxWidth: '280px' }}>
                      {item.reviewNotes || '—'}
                    </td>

                    <td>
                      {item.status === 'PENDING' ? (
                        <button
                          onClick={() => {
                            setReviewingItem(item);
                            setActionReason(item.reviewNotes || '');
                          }}
                          style={{
                            padding: '6px 14px',
                            backgroundColor: 'var(--brand-primary)',
                            color: '#FFFFFF',
                            border: 'none',
                            borderRadius: 'var(--radius-sm)',
                            fontWeight: 700,
                            fontSize: '11px',
                            cursor: 'pointer',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          Review &amp; Decide →
                        </button>
                      ) : (
                        <button
                          onClick={() => {
                            setReviewingItem(item);
                            setActionReason(item.reviewNotes || '');
                          }}
                          style={{
                            padding: '6px 12px',
                            backgroundColor: 'rgba(255, 255, 255, 0.05)',
                            border: '1px solid var(--border-subtle)',
                            color: 'var(--text-muted)',
                            borderRadius: 'var(--radius-sm)',
                            fontSize: '11px',
                            cursor: 'pointer',
                          }}
                        >
                          Revisit
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Review Decision Modal */}
      {reviewingItem && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(7, 21, 38, 0.88)',
            backdropFilter: 'blur(6px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '20px',
          }}
        >
          <div
            className="admin-card"
            style={{
              width: '100%',
              maxWidth: '540px',
              padding: '24px',
              position: 'relative',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
              <div>
                <h2 style={{ fontSize: '18px', fontWeight: 800, margin: 0, color: '#FFFFFF' }}>
                  Decide Taxonomy Expansion
                </h2>
                <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: 'var(--text-muted)' }}>
                  {reviewingItem.name} ({reviewingItem.type})
                </p>
              </div>
              <button
                onClick={() => setReviewingItem(null)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--text-muted)',
                  fontSize: '20px',
                  cursor: 'pointer',
                }}
              >
                ✕
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginBottom: '20px' }}>
              <div style={{ padding: '12px 14px', background: 'rgba(255, 255, 255, 0.03)', borderRadius: 'var(--radius-sm)', fontSize: '12px' }}>
                <div><span style={{ color: 'var(--text-muted)' }}>Proposed Slug:</span> <code style={{ color: 'var(--brand-highlight)' }}>/{reviewingItem.suggestedSlug}</code></div>
                <div style={{ marginTop: '4px' }}><span style={{ color: 'var(--text-muted)' }}>Submission Source:</span> <span style={{ color: '#FFFFFF' }}>{reviewingItem.source}</span></div>
                <div style={{ marginTop: '4px' }}><span style={{ color: 'var(--text-muted)' }}>Demand Velocity:</span> <strong style={{ color: '#10B981' }}>{reviewingItem.submissionCount} distinct submissions</strong></div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '6px' }}>
                  Administrative Reason / Review Log Note *
                </label>
                <textarea
                  value={actionReason}
                  onChange={(e) => setActionReason(e.target.value)}
                  placeholder="e.g. Validated consumer search velocity. Approved for Q4 market catalog."
                  className="admin-input"
                  rows={3}
                />
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button
                type="button"
                onClick={() => setReviewingItem(null)}
                style={{
                  padding: '8px 16px',
                  background: 'transparent',
                  border: '1px solid var(--border-subtle)',
                  color: 'var(--text-muted)',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: '12px',
                  cursor: 'pointer',
                }}
              >
                Cancel
              </button>

              <button
                type="button"
                disabled={submittingAction}
                onClick={() => handleReviewAction('REJECT')}
                style={{
                  padding: '8px 14px',
                  background: 'rgba(239, 68, 68, 0.15)',
                  border: '1px solid rgba(239, 68, 68, 0.35)',
                  color: '#F87171',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: '12px',
                  fontWeight: 700,
                  cursor: submittingAction ? 'not-allowed' : 'pointer',
                }}
              >
                Reject
              </button>

              <button
                type="button"
                disabled={submittingAction}
                onClick={() => handleReviewAction('APPROVE')}
                style={{
                  padding: '8px 18px',
                  background: 'var(--brand-primary)',
                  border: 'none',
                  color: '#FFFFFF',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: '12px',
                  fontWeight: 700,
                  cursor: submittingAction ? 'not-allowed' : 'pointer',
                }}
              >
                {submittingAction ? 'Processing...' : '✓ Approve & Promote to Markets'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
