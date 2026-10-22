'use client';

import React, { useEffect, useState } from 'react';

interface SubscriberItem {
  id: string;
  email: string;
  source: string;
  status: 'ACTIVE' | 'UNSUBSCRIBED' | 'SUPPRESSED';
  consentTimestamp: string;
}

export default function AdminNewsletterPage() {
  const [subscribers, setSubscribers] = useState<SubscriberItem[]>([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadSubscribers() {
      try {
        setLoading(true);
        setError(null);
        const res = await fetch('/api/newsletter');
        if (res.status === 401 || res.status === 403) {
          window.location.href = '/login?from=/newsletter';
          return;
        }
        if (!res.ok) {
          throw new Error(`Failed to load newsletter subscribers: HTTP ${res.status}`);
        }
        const data = await res.json();
        setSubscribers(Array.isArray(data?.subscribers) ? data.subscribers : Array.isArray(data) ? data : []);
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'Error fetching subscriber registry');
      } finally {
        setLoading(false);
      }
    }

    loadSubscribers();
  }, []);

  const filtered = subscribers.filter((s) => {
    const q = search.toLowerCase();
    const matchesSearch = s.email.toLowerCase().includes(q) || s.source.toLowerCase().includes(q);
    const matchesStatus = statusFilter === 'ALL' || s.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const exportCsv = () => {
    const headers = 'ID,Email,Source,Status,ConsentTimestamp\n';
    const rows = filtered
      .map((s) => `"${s.id}","${s.email}","${s.source}","${s.status}","${s.consentTimestamp}"`)
      .join('\n');
    const blob = new Blob([headers + rows], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `newsletter-subscribers-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 800, margin: 0, color: '#FFFFFF', letterSpacing: '-0.02em' }}>
            Newsletter &amp; Subscriber Registry
          </h1>
          <p style={{ margin: '6px 0 0 0', color: 'var(--text-muted)', fontSize: '13px' }}>
            Lawful consent records, subscription sources, and opt-out suppression state.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '12px' }}>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="admin-input"
            style={{ width: '150px' }}
          >
            <option value="ALL">All Statuses</option>
            <option value="ACTIVE">Active</option>
            <option value="UNSUBSCRIBED">Unsubscribed</option>
          </select>
          <input
            type="text"
            placeholder="Search email, source..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="admin-input"
            style={{ width: '240px' }}
          />
          <button
            onClick={exportCsv}
            disabled={filtered.length === 0}
            style={{
              padding: '10px 16px',
              backgroundColor: 'rgba(255, 255, 255, 0.08)',
              color: '#FFFFFF',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-sm)',
              fontWeight: 600,
              fontSize: '13px',
              cursor: filtered.length === 0 ? 'not-allowed' : 'pointer',
            }}
          >
            ⬇ Export CSV
          </button>
        </div>
      </div>

      {/* Consent Governance Alert */}
      <div
        style={{
          padding: '14px 18px',
          borderRadius: 'var(--radius-sm)',
          backgroundColor: 'rgba(16, 185, 129, 0.1)',
          border: '1px solid rgba(16, 185, 129, 0.3)',
          display: 'flex',
          gap: '12px',
          alignItems: 'center',
          fontSize: '12px',
          color: '#6EE7B7',
        }}
      >
        <span style={{ fontSize: '18px' }}>📋</span>
        <div>
          <strong>Consent &amp; Privacy Compliance:</strong> Every record retains immutable opt-in provenance (`source`) and verifiable timestamp. Unsubscribed addresses are suppressed from all future outbound mailings.
        </div>
      </div>

      {/* KPI Stats Strip */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
        <div className="admin-card" style={{ padding: '16px 20px' }}>
          <div style={{ fontSize: '11px', color: 'var(--text-dim)', fontWeight: 600, textTransform: 'uppercase' }}>
            Active Subscribers
          </div>
          <div style={{ fontSize: '24px', fontWeight: 800, color: '#10B981', marginTop: '6px' }}>
            {subscribers.filter((s) => s.status === 'ACTIVE').length}
          </div>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>
            Consented recipients
          </div>
        </div>

        <div className="admin-card" style={{ padding: '16px 20px' }}>
          <div style={{ fontSize: '11px', color: 'var(--text-dim)', fontWeight: 600, textTransform: 'uppercase' }}>
            Unsubscribed / Suppressed
          </div>
          <div style={{ fontSize: '24px', fontWeight: 800, color: '#F59E0B', marginTop: '6px' }}>
            {subscribers.filter((s) => s.status === 'UNSUBSCRIBED').length}
          </div>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>
            Opt-out respected
          </div>
        </div>

        <div className="admin-card" style={{ padding: '16px 20px' }}>
          <div style={{ fontSize: '11px', color: 'var(--text-dim)', fontWeight: 600, textTransform: 'uppercase' }}>
            Delivery Gateway
          </div>
          <div style={{ fontSize: '24px', fontWeight: 800, color: 'var(--brand-highlight)', marginTop: '6px' }}>
            SMTP Mock Mode
          </div>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>
            Zero unintended blast sends
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

      {/* Subscribers Table */}
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
            Subscribers Registry ({filtered.length})
          </span>
          <span style={{ fontSize: '11px', color: 'var(--text-dim)' }}>
            Strict Double Opt-In Logs
          </span>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table className="admin-table">
            <thead>
              <tr>
                <th>Subscriber Email</th>
                <th>Consent Source</th>
                <th>Opt-In Timestamp</th>
                <th>Subscription Status</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={4} style={{ textAlign: 'center', padding: '40px', color: 'var(--text-dim)' }}>
                    Loading subscriber registry...
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={4} style={{ textAlign: 'center', padding: '40px', color: 'var(--text-dim)' }}>
                    No subscribers matching query &ldquo;{search}&rdquo;
                  </td>
                </tr>
              ) : (
                filtered.map((s) => (
                  <tr key={s.id}>
                    <td>
                      <div style={{ fontWeight: 600, color: '#FFFFFF' }}>{s.email}</div>
                      <div style={{ fontSize: '11px', color: 'var(--text-dim)' }}>{s.id}</div>
                    </td>
                    <td>
                      <code style={{ fontSize: '12px', color: 'var(--brand-highlight)', background: 'rgba(234, 88, 12, 0.1)', padding: '2px 6px', borderRadius: '4px' }}>
                        {s.source}
                      </code>
                    </td>
                    <td>
                      <div style={{ fontSize: '12px', color: '#CBD5E1' }}>
                        {new Date(s.consentTimestamp).toLocaleDateString('en-IN', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </div>
                      <div style={{ fontSize: '11px', color: 'var(--text-dim)' }}>
                        {new Date(s.consentTimestamp).toLocaleTimeString('en-IN', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </div>
                    </td>
                    <td>
                      <span className={`badge ${s.status === 'ACTIVE' ? 'badge-success' : 'badge-neutral'}`}>
                        {s.status}
                      </span>
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
