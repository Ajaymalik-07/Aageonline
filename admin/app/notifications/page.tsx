'use client';

import React, { useEffect, useState } from 'react';

interface NotificationItem {
  id: string;
  severity: 'INFO' | 'WARNING' | 'CRITICAL';
  title: string;
  message: string;
  source: string;
  timestamp: string;
  isRead: boolean;
  link?: string;
}

export default function AdminNotificationsPage() {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadNotifications = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch('/api/notifications');
      if (res.status === 401 || res.status === 403) {
        window.location.href = '/login?from=/notifications';
        return;
      }
      if (!res.ok) {
        throw new Error(`Failed to load notifications: HTTP ${res.status}`);
      }
      const data = await res.json();
      setNotifications(Array.isArray(data?.notifications) ? data.notifications : Array.isArray(data) ? data : []);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error fetching operational alerts');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadNotifications();
  }, []);

  const markAsRead = async (id: string) => {
    try {
      await fetch('/api/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, action: 'MARK_READ' }),
      });
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
      );
    } catch {
      // Ignored for UX responsiveness
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 800, margin: 0, color: '#FFFFFF', letterSpacing: '-0.02em' }}>
            Operational Alerts &amp; System Notifications
          </h1>
          <p style={{ margin: '6px 0 0 0', color: 'var(--text-muted)', fontSize: '13px' }}>
            Real-time event stream of payment drops, discovery requests, and supervisor telemetry.
          </p>
        </div>

        <button
          onClick={loadNotifications}
          disabled={loading}
          style={{
            padding: '10px 18px',
            backgroundColor: 'rgba(255, 255, 255, 0.08)',
            color: '#FFFFFF',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-sm)',
            fontWeight: 600,
            fontSize: '13px',
            cursor: 'pointer',
          }}
        >
          {loading ? 'Refreshing...' : '↻ Refresh Alerts'}
        </button>
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

      {/* Notifications List */}
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
            Recent Operational Alerts ({notifications.length})
          </span>
          <span style={{ fontSize: '11px', color: 'var(--text-dim)' }}>
            Unread: {notifications.filter((n) => !n.isRead).length}
          </span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column' }}>
          {loading ? (
            <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-dim)' }}>
              Loading operational event feed...
            </div>
          ) : notifications.length === 0 ? (
            <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-dim)' }}>
              No operational notifications in log.
            </div>
          ) : (
            notifications.map((n) => (
              <div
                key={n.id}
                style={{
                  padding: '18px 20px',
                  borderBottom: '1px solid var(--border-subtle)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  gap: '16px',
                  backgroundColor: n.isRead ? 'transparent' : 'rgba(234, 88, 12, 0.04)',
                }}
              >
                <div style={{ display: 'flex', gap: '14px', alignItems: 'flex-start' }}>
                  <div
                    style={{
                      width: '10px',
                      height: '10px',
                      borderRadius: '50%',
                      marginTop: '5px',
                      backgroundColor:
                        n.severity === 'CRITICAL'
                          ? '#EF4444'
                          : n.severity === 'WARNING'
                          ? '#F59E0B'
                          : '#3B82F6',
                    }}
                  />
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span style={{ fontWeight: 700, color: '#FFFFFF', fontSize: '14px' }}>
                        {n.title}
                      </span>
                      <span
                        className={`badge ${
                          n.severity === 'WARNING' ? 'badge-warning' : 'badge-info'
                        }`}
                      >
                        {n.severity}
                      </span>
                      <span style={{ fontSize: '11px', color: 'var(--text-dim)' }}>
                        {n.source}
                      </span>
                    </div>

                    <p style={{ margin: '6px 0 0 0', fontSize: '13px', color: 'var(--text-muted)' }}>
                      {n.message}
                    </p>

                    <div style={{ display: 'flex', gap: '16px', marginTop: '8px', fontSize: '11px', color: 'var(--text-dim)' }}>
                      <span>{new Date(n.timestamp).toLocaleString('en-IN')}</span>
                      {n.link && (
                        <a href={n.link} style={{ color: '#60A5FA', textDecoration: 'underline' }}>
                          View Associated Record →
                        </a>
                      )}
                    </div>
                  </div>
                </div>

                {!n.isRead && (
                  <button
                    onClick={() => markAsRead(n.id)}
                    style={{
                      padding: '6px 12px',
                      background: 'rgba(255, 255, 255, 0.06)',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: 'var(--radius-sm)',
                      color: 'var(--text-muted)',
                      fontSize: '11px',
                      cursor: 'pointer',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    Acknowledge
                  </button>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
