'use client';

/**
 * AageOnline — Business Workspace Notifications & Preferences Page
 *
 * Provides:
 * - Inbox of in-app ranking drop milestone alerts
 * - Unread counter and idempotent mark-as-read actions
 * - Opt-in/opt-out preferences for email and in-app alerts
 * - Rapid-movement digest window settings
 */

import React, { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import type { BusinessNotification, NotificationPreference } from '../../../../types/notification.ts';

function NotificationsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const businessIdParam = searchParams.get('businessId') || undefined;

  const [notifications, setNotifications] = useState<BusinessNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [filterUnread, setFilterUnread] = useState(false);
  const [preferences, setPreferences] = useState<NotificationPreference | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const [businessId, setBusinessId] = useState<string>('');

  const loadData = async (bId: string) => {
    try {
      setLoading(true);
      // 1. Notifications list
      const notifRes = await fetch(
        `/api/business/dashboard/notifications?businessId=${bId}&unreadOnly=${filterUnread}`
      );
      const notifData = await notifRes.json();
      if (notifRes.ok) {
        setNotifications(notifData.data.notifications || []);
      }

      // 2. Unread count
      const countRes = await fetch(
        `/api/business/dashboard/notifications/unread-count?businessId=${bId}`
      );
      const countData = await countRes.json();
      if (countRes.ok) {
        setUnreadCount(countData.data.unreadCount || 0);
      }

      // 3. Preferences
      const prefRes = await fetch(
        `/api/business/dashboard/notification-preferences?businessId=${bId}`
      );
      const prefData = await prefRes.json();
      if (prefRes.ok) {
        setPreferences(prefData.data);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    async function init() {
      const { getActiveDevSession } = await import('../../../../lib/auth/store.ts');
      const session = getActiveDevSession();
      if (!session) {
        router.replace('/auth/login?returnUrl=/business/dashboard/notifications');
        return;
      }

      const { resolveWorkspaceContext } = await import('../../../../lib/workspace/store.ts');
      const ctx = await resolveWorkspaceContext(session.userId, businessIdParam);
      setBusinessId(ctx.currentBusiness.id);
      loadData(ctx.currentBusiness.id);
    }

    init();
  }, [businessIdParam, filterUnread, router]);

  const handleMarkRead = async (notifId: string) => {
    if (!businessId) return;
    try {
      const res = await fetch(`/api/business/dashboard/notifications/${notifId}/read`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ businessId }),
      });
      if (res.ok) {
        setNotifications((prev) =>
          prev.map((n) => (n.id === notifId ? { ...n, isRead: true } : n))
        );
        setUnreadCount((c) => Math.max(0, c - 1));
      }
    } catch {
      // ignore
    }
  };

  const handleUpdatePreference = async (
    field: 'emailRankingDrops' | 'inAppRankingDrops' | 'digestWindowMinutes',
    value: boolean | number
  ) => {
    if (!preferences || !businessId) return;
    const updated = { ...preferences, [field]: value };
    setPreferences(updated);

    try {
      const res = await fetch('/api/business/dashboard/notification-preferences', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          businessId,
          emailRankingDrops: updated.emailRankingDrops,
          inAppRankingDrops: updated.inAppRankingDrops,
          digestWindowMinutes: updated.digestWindowMinutes,
        }),
      });
      if (res.ok) {
        setActionMessage('Notification preferences updated successfully.');
        setTimeout(() => setActionMessage(null), 3000);
      }
    } catch {
      setActionMessage('Failed to save preferences.');
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 'var(--space-4)' }}>
        <div>
          <h1 style={{ fontSize: 'var(--font-size-2xl)', fontWeight: 800, margin: '0 0 var(--space-2) 0', color: '#FFFFFF' }}>
            Notifications &amp; Milestone Alerts
          </h1>
          <p style={{ margin: 0, fontSize: 'var(--font-size-sm)', color: 'rgba(255, 255, 255, 0.7)' }}>
            Stay informed when ranking movement crosses significant competitive thresholds.
          </p>
        </div>

        {unreadCount > 0 && (
          <span
            style={{
              backgroundColor: 'rgba(234, 88, 12, 0.2)',
              border: '1px solid rgba(234, 88, 12, 0.4)',
              color: '#FB923C',
              padding: '6px 14px',
              borderRadius: 'var(--radius-pill)',
              fontSize: '12px',
              fontWeight: 800,
            }}
          >
            {unreadCount} Unread Alert{unreadCount !== 1 ? 's' : ''}
          </span>
        )}
      </div>

      {actionMessage && (
        <div
          style={{
            backgroundColor: 'rgba(34, 197, 94, 0.15)',
            border: '1px solid rgba(34, 197, 94, 0.3)',
            color: '#4ADE80',
            padding: '10px 16px',
            borderRadius: 'var(--radius-md)',
            fontSize: 'var(--font-size-xs)',
            fontWeight: 600,
          }}
        >
          {actionMessage}
        </div>
      )}

      {/* Filter Tabs */}
      <div
        style={{
          display: 'flex',
          gap: 'var(--space-2)',
          borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
          paddingBottom: 'var(--space-2)',
        }}
      >
        <button
          onClick={() => setFilterUnread(false)}
          style={{
            backgroundColor: !filterUnread ? '#EA580C' : 'transparent',
            color: '#FFFFFF',
            border: 'none',
            padding: '6px 14px',
            borderRadius: 'var(--radius-pill)',
            fontSize: '12px',
            fontWeight: 700,
            cursor: 'pointer',
          }}
        >
          All Notifications
        </button>
        <button
          onClick={() => setFilterUnread(true)}
          style={{
            backgroundColor: filterUnread ? '#EA580C' : 'transparent',
            color: '#FFFFFF',
            border: 'none',
            padding: '6px 14px',
            borderRadius: 'var(--radius-pill)',
            fontSize: '12px',
            fontWeight: 700,
            cursor: 'pointer',
          }}
        >
          Unread Only {unreadCount > 0 && `(${unreadCount})`}
        </button>
      </div>

      {/* Notifications List */}
      {loading ? (
        <div style={{ padding: 'var(--space-12) 0', textAlign: 'center', color: 'rgba(255, 255, 255, 0.6)' }}>
          Loading notifications...
        </div>
      ) : notifications.length === 0 ? (
        <div
          style={{
            backgroundColor: '#0B1F33',
            borderRadius: 'var(--radius-xl)',
            padding: 'var(--space-12) var(--space-6)',
            textAlign: 'center',
            border: '1px dashed rgba(255, 255, 255, 0.15)',
          }}
        >
          <div style={{ fontSize: '32px', marginBottom: 'var(--space-3)' }}>🔔</div>
          <h3 style={{ fontSize: 'var(--font-size-base)', fontWeight: 700, color: '#FFFFFF', margin: '0 0 var(--space-2) 0' }}>
            No Notifications
          </h3>
          <p style={{ margin: 0, fontSize: 'var(--font-size-xs)', color: 'rgba(255, 255, 255, 0.6)' }}>
            {filterUnread
              ? 'You have caught up on all unread ranking alerts.'
              : 'When ranking drops cross milestones (#1→#5, #5→#10, etc.), alerts will appear here.'}
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
          {notifications.map((notif) => (
            <div
              key={notif.id}
              style={{
                backgroundColor: notif.isRead ? '#0B1F33' : 'rgba(11, 31, 51, 0.95)',
                border: notif.isRead
                  ? '1px solid rgba(255, 255, 255, 0.08)'
                  : '1px solid rgba(234, 88, 12, 0.35)',
                borderRadius: 'var(--radius-lg)',
                padding: 'var(--space-4) var(--space-5)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                gap: 'var(--space-4)',
              }}
            >
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  {!notif.isRead && (
                    <span
                      style={{
                        width: '8px',
                        height: '8px',
                        borderRadius: '50%',
                        backgroundColor: '#EA580C',
                        display: 'inline-block',
                      }}
                    />
                  )}
                  <span style={{ fontWeight: 800, color: '#FFFFFF', fontSize: 'var(--font-size-sm)' }}>
                    {notif.title}
                  </span>
                  {notif.milestone && (
                    <span
                      style={{
                        fontSize: '10px',
                        fontWeight: 800,
                        backgroundColor: 'rgba(239, 68, 68, 0.15)',
                        color: '#F87171',
                        padding: '2px 6px',
                        borderRadius: '4px',
                      }}
                    >
                      {notif.milestone}
                    </span>
                  )}
                </div>
                <p style={{ margin: 0, fontSize: 'var(--font-size-xs)', color: 'rgba(255, 255, 255, 0.75)', lineHeight: 1.5 }}>
                  {notif.message}
                </p>
                <span style={{ fontSize: '10px', color: 'rgba(255, 255, 255, 0.4)', marginTop: '2px' }}>
                  {new Date(notif.createdAt).toLocaleString('en-IN', {
                    dateStyle: 'medium',
                    timeStyle: 'short',
                  })}
                </span>
              </div>

              {!notif.isRead && (
                <button
                  onClick={() => handleMarkRead(notif.id)}
                  style={{
                    backgroundColor: 'rgba(255, 255, 255, 0.08)',
                    color: '#FFFFFF',
                    border: '1px solid rgba(255, 255, 255, 0.15)',
                    padding: '6px 12px',
                    borderRadius: 'var(--radius-md)',
                    fontSize: '11px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                  }}
                >
                  Mark Read
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Notification Preferences Card */}
      {preferences && (
        <div
          style={{
            backgroundColor: '#0B1F33',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: 'var(--radius-xl)',
            padding: 'var(--space-6)',
            marginTop: 'var(--space-4)',
          }}
        >
          <h2 style={{ fontSize: 'var(--font-size-base)', fontWeight: 800, color: '#FFFFFF', margin: '0 0 var(--space-4) 0' }}>
            Alert Preferences &amp; Anti-Spam Coalescing
          </h2>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
            {/* In-app toggle */}
            <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={preferences.inAppRankingDrops}
                onChange={(e) => handleUpdatePreference('inAppRankingDrops', e.target.checked)}
                style={{ width: '16px', height: '16px', accentColor: '#EA580C' }}
              />
              <span style={{ fontSize: 'var(--font-size-xs)', color: '#FFFFFF', fontWeight: 600 }}>
                In-app notifications for ranking milestone drops
              </span>
            </label>

            {/* Email toggle */}
            <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={preferences.emailRankingDrops}
                onChange={(e) => handleUpdatePreference('emailRankingDrops', e.target.checked)}
                style={{ width: '16px', height: '16px', accentColor: '#EA580C' }}
              />
              <span style={{ fontSize: 'var(--font-size-xs)', color: '#FFFFFF', fontWeight: 600 }}>
                Email alerts for milestone drops (requires configured email channel)
              </span>
            </label>

            {/* Digest Window */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: 'var(--space-2)' }}>
              <span style={{ fontSize: 'var(--font-size-xs)', color: 'rgba(255, 255, 255, 0.7)' }}>
                Rapid-movement coalescing window:
              </span>
              <select
                value={preferences.digestWindowMinutes}
                onChange={(e) => handleUpdatePreference('digestWindowMinutes', parseInt(e.target.value, 10))}
                style={{
                  backgroundColor: 'rgba(255, 255, 255, 0.08)',
                  color: '#FFFFFF',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  borderRadius: 'var(--radius-md)',
                  padding: '4px 10px',
                  fontSize: '11px',
                }}
              >
                <option value={0} style={{ backgroundColor: '#0B1F33' }}>No coalescing (immediate)</option>
                <option value={15} style={{ backgroundColor: '#0B1F33' }}>15 minutes (recommended)</option>
                <option value={60} style={{ backgroundColor: '#0B1F33' }}>1 hour</option>
              </select>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function NotificationsPage() {
  return (
    <Suspense
      fallback={
        <div style={{ padding: 'var(--space-12) 0', textAlign: 'center', color: 'rgba(255, 255, 255, 0.7)' }}>
          Loading notifications center...
        </div>
      }
    >
      <NotificationsContent />
    </Suspense>
  );
}
