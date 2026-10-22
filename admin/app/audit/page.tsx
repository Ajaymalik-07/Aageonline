'use client';

import React, { useEffect, useState } from 'react';

interface AuditLogItem {
  id: string;
  timestamp: string;
  actor: string;
  action: string;
  details: string;
  status: string;
  severity: string;
}

export default function AdminAuditPage() {
  const [logs, setLogs] = useState<AuditLogItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  useEffect(() => {
    async function loadAuditLogs() {
      try {
        setLoading(true);
        setError(null);
        const res = await fetch('/api/audit');
        if (res.status === 401 || res.status === 403) {
          window.location.href = '/login?from=/audit';
          return;
        }
        if (!res.ok) {
          throw new Error(`Failed to load audit logs: HTTP ${res.status}`);
        }
        const data = await res.json();
        setLogs(data?.logs || []);
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'Error fetching audit logs');
      } finally {
        setLoading(false);
      }
    }

    loadAuditLogs();
  }, []);

  const filtered = logs.filter((log) => {
    const q = search.toLowerCase();
    return (
      log.actor.toLowerCase().includes(q) ||
      log.action.toLowerCase().includes(q) ||
      log.details.toLowerCase().includes(q)
    );
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 800, margin: 0, color: '#FFFFFF', letterSpacing: '-0.02em' }}>
            Platform Audit Trail
          </h1>
          <p style={{ margin: '6px 0 0 0', color: 'var(--text-muted)', fontSize: '13px' }}>
            Append-only, immutable record of administrative mutations, settlements, and supervisor actions.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '12px' }}>
          <input
            type="text"
            placeholder="Search by actor, action, or details..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="admin-input"
            style={{ width: '280px' }}
          />
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
            Audit Log Entries ({filtered.length} Recorded Events)
          </span>
          <span style={{ fontSize: '11px', color: 'var(--text-dim)' }}>
            Immutable security log
          </span>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table className="admin-table">
            <thead>
              <tr>
                <th>Event ID</th>
                <th>Timestamp</th>
                <th>Actor / Identity</th>
                <th>Action Type</th>
                <th>Details &amp; Context</th>
                <th>Severity</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: '36px', color: 'var(--text-muted)' }}>
                    Loading immutable audit trail...
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: '36px', color: 'var(--text-muted)' }}>
                    {search ? 'No audit events matching search criteria.' : 'No audit records logged yet.'}
                  </td>
                </tr>
              ) : (
                filtered.map((log) => (
                  <tr key={log.id}>
                    <td>
                      <code style={{ fontSize: '11px', color: 'var(--text-dim)' }}>{log.id}</code>
                    </td>
                    <td style={{ fontSize: '12px', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                      {new Date(log.timestamp).toLocaleString()}
                    </td>
                    <td>
                      <div style={{ fontWeight: 600, color: '#FFFFFF' }}>{log.actor}</div>
                    </td>
                    <td>
                      <code style={{ fontSize: '12px', color: 'var(--brand-highlight)', fontWeight: 700 }}>
                        {log.action}
                      </code>
                    </td>
                    <td style={{ color: '#CBD5E1', maxWidth: '400px', fontSize: '12px' }}>
                      {log.details}
                    </td>
                    <td>
                      <span className="badge badge-info">{log.severity || 'INFO'}</span>
                    </td>
                    <td>
                      <span className="badge badge-success">{log.status}</span>
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
