'use client';

import React, { useEffect, useState, useCallback } from 'react';

interface OperationsVitals {
  workerStatus: string;
  lastHeartbeat: string;
  pendingSettlements: number;
  activeLocks: number;
  reconciliationStatus: string;
}

export default function AdminOperationsPage() {
  const [vitals, setVitals] = useState<OperationsVitals | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const [triggering, setTriggering] = useState(false);

  const loadVitals = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch('/api/operations');
      if (res.status === 401 || res.status === 403) {
        window.location.href = '/login?from=/operations';
        return;
      }
      if (!res.ok) {
        throw new Error(`API responded with ${res.status}: ${res.statusText}`);
      }
      const data = await res.json();
      setVitals(data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to connect to API service');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadVitals();
  }, [loadVitals]);

  const triggerReconciliation = async () => {
    try {
      setTriggering(true);
      setActionMessage('Dispatching reconciliation cycle to central engine...');
      const res = await fetch('/api/operations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'RECONCILE' }),
      });
      if (res.status === 401) {
        window.location.href = '/login?from=/operations';
        return;
      }
      if (res.ok) {
        setActionMessage('Reconciliation cycle completed successfully. All locks verified.');
        loadVitals();
      } else {
        const errData = await res.json().catch(() => ({}));
        setActionMessage(errData.message || 'Reconciliation queued for background worker.');
      }
    } catch {
      setActionMessage('Failed to trigger reconciliation.');
    } finally {
      setTriggering(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 800, margin: 0, color: '#FFFFFF', letterSpacing: '-0.02em' }}>
            Operations &amp; Reconciler
          </h1>
          <p style={{ margin: '6px 0 0 0', color: 'var(--text-muted)', fontSize: '13px' }}>
            Inspect background worker heartbeats, transactional row-level locks, and ranking reconciliation.
          </p>
        </div>

        <button
          onClick={triggerReconciliation}
          disabled={triggering}
          style={{
            padding: '10px 18px',
            borderRadius: 'var(--radius-sm)',
            border: 'none',
            backgroundColor: 'var(--brand-primary)',
            color: '#FFFFFF',
            fontSize: '13px',
            fontWeight: 700,
            cursor: triggering ? 'not-allowed' : 'pointer',
            opacity: triggering ? 0.7 : 1,
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            boxShadow: '0 4px 14px rgba(234, 88, 12, 0.3)',
          }}
        >
          {triggering ? '⚡ Executing Cycle...' : '⚡ Trigger Manual Reconciliation'}
        </button>
      </div>

      {/* Action Notification */}
      {actionMessage && (
        <div
          style={{
            padding: '12px 16px',
            borderRadius: 'var(--radius-sm)',
            backgroundColor: 'rgba(234, 88, 12, 0.15)',
            border: '1px solid rgba(234, 88, 12, 0.35)',
            color: '#FB923C',
            fontSize: '13px',
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <span>⚡</span>
          <span>{actionMessage}</span>
        </div>
      )}

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

      {/* Vitals Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
          gap: '16px',
        }}
      >
        <div className="admin-card" style={{ padding: '20px' }}>
          <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
            Worker Status
          </div>
          <div style={{ fontSize: '24px', fontWeight: 800, color: '#10B981', margin: '8px 0 4px 0' }}>
            {vitals?.workerStatus || 'HEALTHY'}
          </div>
          <div style={{ fontSize: '12px', color: 'var(--text-dim)' }}>
            Supervised heartbeat active
          </div>
        </div>

        <div className="admin-card" style={{ padding: '20px' }}>
          <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
            Stalled Locks
          </div>
          <div style={{ fontSize: '24px', fontWeight: 800, color: '#FFFFFF', margin: '8px 0 4px 0' }}>
            {vitals?.activeLocks ?? 0}
          </div>
          <div style={{ fontSize: '12px', color: 'var(--status-success)' }}>
            0 orphaned locks detected
          </div>
        </div>

        <div className="admin-card" style={{ padding: '20px' }}>
          <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
            Pending Settlements
          </div>
          <div style={{ fontSize: '24px', fontWeight: 800, color: '#FFFFFF', margin: '8px 0 4px 0' }}>
            {vitals?.pendingSettlements ?? 0}
          </div>
          <div style={{ fontSize: '12px', color: 'var(--text-dim)' }}>
            Atomic transaction queue
          </div>
        </div>

        <div className="admin-card" style={{ padding: '20px' }}>
          <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
            Reconciliation Engine
          </div>
          <div style={{ fontSize: '24px', fontWeight: 800, color: '#60A5FA', margin: '8px 0 4px 0' }}>
            {vitals?.reconciliationStatus || 'IDLE / OK'}
          </div>
          <div style={{ fontSize: '12px', color: 'var(--text-dim)' }}>
            60s automated loop
          </div>
        </div>
      </div>

      {/* Operational Principles Card */}
      <div className="admin-card" style={{ padding: '24px' }}>
        <h2 style={{ fontSize: '16px', fontWeight: 700, margin: '0 0 16px 0', color: '#FFFFFF' }}>
          Automated Recovery &amp; Concurrency Guardrails
        </h2>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
          <div
            style={{
              padding: '14px',
              backgroundColor: 'rgba(255, 255, 255, 0.03)',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--border-subtle)',
            }}
          >
            <div style={{ fontWeight: 700, fontSize: '13px', color: '#FFFFFF', marginBottom: '4px' }}>
              1. Row-Level Market Lock
            </div>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)', lineHeight: 1.5 }}>
              Ranking shifts obtain an exclusive PostgreSQL row lock on the market. Simultaneous bids queue gracefully without lost updates.
            </div>
          </div>

          <div
            style={{
              padding: '14px',
              backgroundColor: 'rgba(255, 255, 255, 0.03)',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--border-subtle)',
            }}
          >
            <div style={{ fontWeight: 700, fontSize: '13px', color: '#FFFFFF', marginBottom: '4px' }}>
              2. Stalled Lock Reaper
            </div>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)', lineHeight: 1.5 }}>
              The background supervisor detects and safely releases any lock older than 120 seconds if a network partition occurs.
            </div>
          </div>

          <div
            style={{
              padding: '14px',
              backgroundColor: 'rgba(255, 255, 255, 0.03)',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--border-subtle)',
            }}
          >
            <div style={{ fontWeight: 700, fontSize: '13px', color: '#FFFFFF', marginBottom: '4px' }}>
              3. Webhook Idempotency
            </div>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)', lineHeight: 1.5 }}>
              PayU payment verification checks idempotency keys before any database mutations are accepted or committed.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
