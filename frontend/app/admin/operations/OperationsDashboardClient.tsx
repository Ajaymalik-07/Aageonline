'use client';

/**
 * AageOnline — Administrative Operations Dashboard Client
 *
 * Provides real-time visibility into payment reconciliation, ranking settlement recovery,
 * worker heartbeats, and audit events using canonical AageOnline design tokens.
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Card } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { Badge } from '../../../components/ui/Badge';
import { Alert } from '../../../components/ui/Alert';
import { LoadingIndicator } from '../../../components/ui/LoadingIndicator';
import { Tabs } from '../../../components/ui/Tabs';
import { Pagination } from '../../../components/ui/Pagination';
import type { PaymentOrder } from '../../../types/payment';
import type { RankingSettlement } from '../../../types/ranking-settlement';
import type { SettlementRecoveryJob } from '../../../lib/db/repositories/recovery-repository';
import type { ReconciliationRun } from '../../../lib/db/repositories/reconciliation-run-repository';
import type { WorkerHeartbeat } from '../../../lib/db/repositories/heartbeat-repository';
import type { ReadinessCheckResult } from '../../../lib/db/readiness';

interface OperationsSummary {
  timestamp: string;
  paymentStats: {
    unresolvedCount: number;
    awaitingVerificationCount: number;
    confirmedUnsettledCount: number;
    oldestUnresolvedAgeMinutes: number;
  };
  recoveryStats: {
    pendingCount: number;
    retryableCount: number;
    terminalFailedCount: number;
    processingCount: number;
    overdueEligibleCount: number;
    oldestOverdueMinutes: number;
  };
  latestPaymentRun: ReconciliationRun | null;
  latestSettlementRun: ReconciliationRun | null;
  latestHeartbeat: WorkerHeartbeat | null;
  notificationStats?: {
    pendingEventsCount: number;
    pendingDeliveriesCount: number;
    retryableDeliveriesCount: number;
    terminalFailedCount: number;
  };
  seoStats?: {
    totalCandidates: number;
    eligibleUrls: number;
    excludedUrls: number;
    criticalFindingsCount: number;
    warningFindingsCount: number;
    lastAuditAt?: string;
    searchConsoleStatus?: {
      configured: boolean;
      submissionStatus?: string;
    };
  };
  readiness: ReadinessCheckResult;
}

export function OperationsDashboardClient() {
  const [activeTab, setActiveTab] = useState<'overview' | 'payments' | 'settlements' | 'events' | 'runs'>('overview');
  const [summary, setSummary] = useState<OperationsSummary | null>(null);
  const [loadingSummary, setLoadingSummary] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [notification, setNotification] = useState<{ type: 'info' | 'warning' | 'danger' | 'success'; message: string } | null>(null);

  // Payments Tab State
  const [payments, setPayments] = useState<PaymentOrder[]>([]);
  const [paymentsPage, setPaymentsPage] = useState(1);
  const [paymentsTotalPages, setPaymentsTotalPages] = useState(1);
  const [paymentStatusFilter, setPaymentStatusFilter] = useState('ALL');
  const [paymentSearch, setPaymentSearch] = useState('');
  const [loadingPayments, setLoadingPayments] = useState(false);

  // Settlements Tab State
  const [settlements, setSettlements] = useState<RankingSettlement[]>([]);
  const [recoveryJobs, setRecoveryJobs] = useState<SettlementRecoveryJob[]>([]);
  const [settlementSubTab, setSettlementSubTab] = useState<'settlements' | 'recoveryJobs'>('settlements');
  const [loadingSettlements, setLoadingSettlements] = useState(false);

  // Runs Tab State
  const [runs, setRuns] = useState<ReconciliationRun[]>([]);
  const [loadingRuns, setLoadingRuns] = useState(false);

  // Fetch Operations Summary
  const fetchSummary = useCallback(async () => {
    try {
      setLoadingSummary(true);
      const res = await fetch('/api/admin/operations/summary');
      if (res.ok) {
        const json = await res.json();
        setSummary(json.data);
      } else {
        const errJson = await res.json().catch(() => ({}));
        setNotification({
          type: 'danger',
          message: errJson.error?.message || 'Failed to fetch operations summary. Admin authorization required.',
        });
      }
    } catch {
      setNotification({ type: 'danger', message: 'Network error fetching operations summary.' });
    } finally {
      setLoadingSummary(false);
    }
  }, []);

  // Fetch Payments
  const fetchPayments = useCallback(async () => {
    try {
      setLoadingPayments(true);
      const url = `/api/admin/payments?page=${paymentsPage}&limit=15&status=${encodeURIComponent(paymentStatusFilter)}&search=${encodeURIComponent(paymentSearch)}`;
      const res = await fetch(url);
      if (res.ok) {
        const json = await res.json();
        setPayments(json.data.orders);
        setPaymentsTotalPages(json.data.pagination.totalPages || 1);
      }
    } finally {
      setLoadingPayments(false);
    }
  }, [paymentsPage, paymentStatusFilter, paymentSearch]);

  // Fetch Settlements & Recovery Jobs
  const fetchSettlements = useCallback(async () => {
    try {
      setLoadingSettlements(true);
      const [settlementsRes, jobsRes] = await Promise.all([
        fetch('/api/admin/settlements?limit=25'),
        fetch('/api/admin/recovery-jobs?limit=25'),
      ]);
      if (settlementsRes.ok) {
        const sJson = await settlementsRes.json();
        setSettlements(sJson.data.settlements);
      }
      if (jobsRes.ok) {
        const jJson = await jobsRes.json();
        setRecoveryJobs(jJson.data.jobs);
      }
    } finally {
      setLoadingSettlements(false);
    }
  }, []);

  // Fetch Runs
  const fetchRuns = useCallback(async () => {
    try {
      setLoadingRuns(true);
      const res = await fetch('/api/admin/reconciliation-runs?limit=30');
      if (res.ok) {
        const json = await res.json();
        setRuns(json.data.runs);
      }
    } finally {
      setLoadingRuns(false);
    }
  }, []);

  useEffect(() => {
    fetchSummary();
  }, [fetchSummary]);

  useEffect(() => {
    if (activeTab === 'payments') fetchPayments();
    if (activeTab === 'settlements') fetchSettlements();
    if (activeTab === 'runs') fetchRuns();
  }, [activeTab, fetchPayments, fetchSettlements, fetchRuns]);

  // Trigger Manual Reconciliation Cycle
  const handleTriggerReconciliation = async () => {
    if (!confirm('Run manual payment reconciliation cycle now? This will re-verify unresolved payments with PayU.')) return;
    try {
      setActionLoading('reconcile');
      const res = await fetch('/api/admin/payment-reconciliation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ batchSize: 20 }),
      });
      const data = await res.json();
      if (res.ok) {
        setNotification({
          type: 'success',
          message: `Payment reconciliation completed: ${data.data.summary.confirmedCount} confirmed, ${data.data.summary.failedCount} failed, ${data.data.summary.inconclusiveCount} inconclusive.`,
        });
        fetchSummary();
        if (activeTab === 'payments') fetchPayments();
      } else {
        setNotification({ type: 'danger', message: data.error?.message || 'Payment reconciliation failed.' });
      }
    } finally {
      setActionLoading(null);
    }
  };

  // Trigger Manual Settlement Recovery Cycle
  const handleTriggerRecovery = async () => {
    if (!confirm('Run manual settlement recovery cycle now? This will discover confirmed payments and settle rankings.')) return;
    try {
      setActionLoading('recovery');
      const res = await fetch('/api/admin/settlement-recovery', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ batchSize: 20 }),
      });
      const data = await res.json();
      if (res.ok) {
        setNotification({
          type: 'success',
          message: `Settlement recovery completed: ${data.data.summary.recoveredCount} settled, ${data.data.summary.retryableCount} retryable, ${data.data.summary.terminalFailedCount} terminal failures.`,
        });
        fetchSummary();
        if (activeTab === 'settlements') fetchSettlements();
      } else {
        setNotification({ type: 'danger', message: data.error?.message || 'Settlement recovery failed.' });
      }
    } finally {
      setActionLoading(null);
    }
  };

  // Reconcile Single Order
  const handleReconcileSingleOrder = async (orderId: string) => {
    if (!confirm(`Reconcile payment order ${orderId} against PayU now?`)) return;
    try {
      setActionLoading(`reconcile-${orderId}`);
      const res = await fetch(`/api/admin/payments/${orderId}/reconcile`, { method: 'POST' });
      const data = await res.json();
      if (res.ok) {
        setNotification({
          type: 'success',
          message: `Order ${orderId}: Outcome ${data.data.outcome} (Status transitioned from ${data.data.previousStatus} to ${data.data.newStatus}).`,
        });
        fetchPayments();
        fetchSummary();
      } else {
        setNotification({ type: 'danger', message: data.error?.message || 'Failed to reconcile order.' });
      }
    } finally {
      setActionLoading(null);
    }
  };

  // Retry Single Recovery Job
  const handleRetryJob = async (jobId: string) => {
    if (!confirm(`Retry settlement recovery job ${jobId} now?`)) return;
    try {
      setActionLoading(`retry-${jobId}`);
      const res = await fetch(`/api/admin/recovery-jobs/${jobId}/retry`, { method: 'POST' });
      const data = await res.json();
      if (res.ok) {
        setNotification({
          type: 'success',
          message: `Recovery job ${jobId} executed: Status is ${data.data.status}.`,
        });
        fetchSettlements();
        fetchSummary();
      } else {
        setNotification({ type: 'danger', message: data.error?.message || 'Failed to retry job.' });
      }
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
      {/* Notifications */}
      {notification && (
        <Alert
          variant={notification.type}
          title={notification.type === 'success' ? 'Operation Completed' : 'Operational Notice'}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span>{notification.message}</span>
            <button
              onClick={() => setNotification(null)}
              style={{ background: 'transparent', border: 'none', cursor: 'pointer', fontWeight: 'bold' }}
              aria-label="Dismiss alert"
            >
              ✕
            </button>
          </div>
        </Alert>
      )}

      {/* Control Bar */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: 'var(--space-4)',
          background: 'var(--color-surface)',
          padding: 'var(--space-4)',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid var(--color-border)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
          <span style={{ fontSize: 'var(--font-size-sm)', fontWeight: 600, color: 'var(--color-navy-light)' }}>
            Reconciler Status:
          </span>
          {summary?.latestHeartbeat ? (
            <Badge variant="verified">
              ● Heartbeat Active ({new Date(summary.latestHeartbeat.lastHeartbeatAt).toLocaleTimeString()})
            </Badge>
          ) : (
            <Badge variant="sponsored">● Heartbeat Unobserved</Badge>
          )}
          <Badge variant={summary?.readiness.ready ? 'verified' : 'neutral'}>
            Persistence: {summary?.readiness.checks.databaseConfigured ? 'PostgreSQL' : 'In-Memory (Dev)'}
          </Badge>
        </div>

        <div style={{ display: 'flex', gap: 'var(--space-3)' }}>
          <Button
            variant="outline"
            size="sm"
            onClick={fetchSummary}
            disabled={loadingSummary}
          >
            {loadingSummary ? 'Refreshing...' : 'Refresh'}
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={handleTriggerReconciliation}
            disabled={Boolean(actionLoading)}
          >
            {actionLoading === 'reconcile' ? 'Reconciling...' : 'Run Payment Reconciler'}
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={handleTriggerRecovery}
            disabled={Boolean(actionLoading)}
          >
            {actionLoading === 'recovery' ? 'Recovering...' : 'Run Settlement Recovery'}
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <Tabs
        activeTab={activeTab}
        onTabChange={(tabId: string) => setActiveTab(tabId as typeof activeTab)}
        tabs={[
          { id: 'overview', label: 'Operations Overview' },
          { id: 'payments', label: `Payment Orders (${summary?.paymentStats.unresolvedCount ?? 0} Unresolved)` },
          { id: 'settlements', label: `Settlements & Recovery (${summary?.recoveryStats.overdueEligibleCount ?? 0} Overdue)` },
          { id: 'runs', label: 'Reconciliation Run History' },
        ]}
      />

      {/* TAB: OVERVIEW */}
      {activeTab === 'overview' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
          {loadingSummary ? (
            <div style={{ padding: 'var(--space-12)', textAlign: 'center' }}>
              <LoadingIndicator size="lg" label="Loading operational indicators..." />
            </div>
          ) : (
            <>
              {/* Metric Cards Grid */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
                  gap: 'var(--space-4)',
                }}
              >
                <Card elevation={2}>
                  <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-navy-muted)', textTransform: 'uppercase' }}>
                    Unresolved Payments
                  </div>
                  <div style={{ fontSize: 'var(--font-size-3xl)', fontWeight: 800, color: 'var(--color-navy)', marginTop: 'var(--space-2)' }}>
                    {summary?.paymentStats.unresolvedCount}
                  </div>
                  <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-navy-muted)', marginTop: 'var(--space-1)' }}>
                    Awaiting verification: {summary?.paymentStats.awaitingVerificationCount}
                  </div>
                </Card>

                <Card elevation={2}>
                  <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-navy-muted)', textTransform: 'uppercase' }}>
                    Confirmed Awaiting Settlement
                  </div>
                  <div style={{ fontSize: 'var(--font-size-3xl)', fontWeight: 800, color: 'var(--color-orange)', marginTop: 'var(--space-2)' }}>
                    {summary?.paymentStats.confirmedUnsettledCount}
                  </div>
                  <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-navy-muted)', marginTop: 'var(--space-1)' }}>
                    Eligible for instant ranking recovery
                  </div>
                </Card>

                <Card elevation={2}>
                  <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-navy-muted)', textTransform: 'uppercase' }}>
                    Recovery Jobs Overdue
                  </div>
                  <div style={{ fontSize: 'var(--font-size-3xl)', fontWeight: 800, color: 'var(--color-navy)', marginTop: 'var(--space-2)' }}>
                    {summary?.recoveryStats.overdueEligibleCount}
                  </div>
                  <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-navy-muted)', marginTop: 'var(--space-1)' }}>
                    Retryable: {summary?.recoveryStats.retryableCount} | Terminal: {summary?.recoveryStats.terminalFailedCount}
                  </div>
                </Card>

                <Card elevation={2}>
                  <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-navy-muted)', textTransform: 'uppercase' }}>
                    Production Readiness
                  </div>
                  <div style={{ fontSize: 'var(--font-size-3xl)', fontWeight: 800, color: summary?.readiness.ready ? '#16A34A' : '#DC2626', marginTop: 'var(--space-2)' }}>
                    {summary?.readiness.ready ? 'READY' : 'DEGRADED'}
                  </div>
                  <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-navy-muted)', marginTop: 'var(--space-1)' }}>
                    PayU: {summary?.readiness.checks.payuConfigured ? 'Configured' : 'Missing'} | DB: {summary?.readiness.checks.databaseReachable ? 'Connected' : 'Offline'}
                  </div>
                </Card>

                <Card elevation={2}>
                  <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-navy-muted)', textTransform: 'uppercase' }}>
                    Notification Outbox
                  </div>
                  <div style={{ fontSize: 'var(--font-size-3xl)', fontWeight: 800, color: 'var(--color-navy)', marginTop: 'var(--space-2)' }}>
                    {(summary?.notificationStats?.pendingDeliveriesCount ?? 0) + (summary?.notificationStats?.pendingEventsCount ?? 0)}
                  </div>
                  <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-navy-muted)', marginTop: 'var(--space-1)' }}>
                    Pending Events: {summary?.notificationStats?.pendingEventsCount ?? 0} | Deliveries: {summary?.notificationStats?.pendingDeliveriesCount ?? 0}
                  </div>
                </Card>

                <Card elevation={2}>
                  <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-navy-muted)', textTransform: 'uppercase' }}>
                    SEO & Sitemap Visibility
                  </div>
                  <div style={{ fontSize: 'var(--font-size-3xl)', fontWeight: 800, color: 'var(--color-navy)', marginTop: 'var(--space-2)' }}>
                    {summary?.seoStats?.eligibleUrls ?? '—'}
                  </div>
                  <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-navy-muted)', marginTop: 'var(--space-1)' }}>
                    Excluded: {summary?.seoStats?.excludedUrls ?? 0} | Issues: {summary?.seoStats?.criticalFindingsCount ?? 0}
                  </div>
                </Card>
              </div>

              {/* Sub-grid: Readiness Diagnostics & Worker Status */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))',
                  gap: 'var(--space-4)',
                }}
              >
                <Card elevation={1}>
                  <h3 style={{ fontSize: 'var(--font-size-lg)', fontWeight: 700, color: 'var(--color-navy)', marginBottom: 'var(--space-3)' }}>
                    Operational Subsystems Readiness
                  </h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
                    {summary?.readiness.operationalStatus &&
                      Object.entries(summary.readiness.operationalStatus).map(([subsystem, status]) => (
                        <div
                          key={subsystem}
                          style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            padding: 'var(--space-2) 0',
                            borderBottom: '1px solid var(--color-border)',
                          }}
                        >
                          <span style={{ textTransform: 'capitalize', fontSize: 'var(--font-size-sm)', fontWeight: 500 }}>
                            {subsystem.replace(/([A-Z])/g, ' $1')}
                          </span>
                          <Badge variant={status === 'PASS' ? 'verified' : status === 'DEGRADED' ? 'sponsored' : 'neutral'}>
                            {status}
                          </Badge>
                        </div>
                      ))}
                  </div>
                </Card>

                <Card elevation={1}>
                  <h3 style={{ fontSize: 'var(--font-size-lg)', fontWeight: 700, color: 'var(--color-navy)', marginBottom: 'var(--space-3)' }}>
                    Reconciler Scheduling & Runs
                  </h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)', fontSize: 'var(--font-size-sm)' }}>
                    <div>
                      <strong>Last Payment Reconciler Run:</strong>{' '}
                      {summary?.latestPaymentRun ? (
                        <span>
                          {new Date(summary.latestPaymentRun.startedAt).toLocaleString()} ({summary.latestPaymentRun.status})
                        </span>
                      ) : (
                        <span style={{ color: 'var(--color-navy-muted)' }}>No recorded runs</span>
                      )}
                    </div>
                    <div>
                      <strong>Last Settlement Recovery Run:</strong>{' '}
                      {summary?.latestSettlementRun ? (
                        <span>
                          {new Date(summary.latestSettlementRun.startedAt).toLocaleString()} ({summary.latestSettlementRun.status})
                        </span>
                      ) : (
                        <span style={{ color: 'var(--color-navy-muted)' }}>No recorded runs</span>
                      )}
                    </div>
                    <div>
                      <strong>Worker Heartbeat:</strong>{' '}
                      {summary?.latestHeartbeat ? (
                        <span>
                          Worker &quot;{summary.latestHeartbeat.workerId}&quot; active at {new Date(summary.latestHeartbeat.lastHeartbeatAt).toLocaleTimeString()}
                        </span>
                      ) : (
                        <span style={{ color: 'var(--color-navy-muted)' }}>Not running daemon</span>
                      )}
                    </div>
                  </div>
                </Card>
              </div>
            </>
          )}
        </div>
      )}

      {/* TAB: PAYMENT ORDERS */}
      {activeTab === 'payments' && (
        <Card elevation={1}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-3)', marginBottom: 'var(--space-4)' }}>
            <input
              type="text"
              placeholder="Search by ID, BidIntent, TxnId, Business..."
              value={paymentSearch}
              onChange={(e) => {
                setPaymentSearch(e.target.value);
                setPaymentsPage(1);
              }}
              style={{
                flex: 1,
                minWidth: '240px',
                padding: 'var(--space-2) var(--space-3)',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--color-border)',
                fontSize: 'var(--font-size-sm)',
              }}
            />
            <select
              value={paymentStatusFilter}
              onChange={(e) => {
                setPaymentStatusFilter(e.target.value);
                setPaymentsPage(1);
              }}
              style={{
                padding: 'var(--space-2) var(--space-3)',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--color-border)',
                fontSize: 'var(--font-size-sm)',
              }}
            >
              <option value="ALL">All Statuses</option>
              <option value="PENDING">PENDING</option>
              <option value="CONFIRMED">CONFIRMED</option>
              <option value="SUCCEEDED">SUCCEEDED</option>
              <option value="FAILED">FAILED</option>
              <option value="CREATED">CREATED</option>
            </select>
          </div>

          {loadingPayments ? (
            <div style={{ padding: 'var(--space-12)', textAlign: 'center' }}>
              <LoadingIndicator size="md" label="Loading payments..." />
            </div>
          ) : payments.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 'var(--space-8)', color: 'var(--color-navy-muted)' }}>
              No payment orders matching filter.
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 'var(--font-size-sm)' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid var(--color-border)', textAlign: 'left' }}>
                    <th style={{ padding: 'var(--space-2)' }}>Order ID</th>
                    <th style={{ padding: 'var(--space-2)' }}>Bid Intent</th>
                    <th style={{ padding: 'var(--space-2)' }}>Txn ID</th>
                    <th style={{ padding: 'var(--space-2)' }}>Amount</th>
                    <th style={{ padding: 'var(--space-2)' }}>Status</th>
                    <th style={{ padding: 'var(--space-2)' }}>Created At</th>
                    <th style={{ padding: 'var(--space-2)' }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {payments.map((order) => (
                    <tr key={order.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                      <td style={{ padding: 'var(--space-2)', fontFamily: 'monospace' }}>{order.id}</td>
                      <td style={{ padding: 'var(--space-2)', fontFamily: 'monospace' }}>{order.bidIntentId}</td>
                      <td style={{ padding: 'var(--space-2)', fontFamily: 'monospace' }}>{order.providerTransactionId || '-'}</td>
                      <td style={{ padding: 'var(--space-2)', fontWeight: 600 }}>₹{order.amountRupees}</td>
                      <td style={{ padding: 'var(--space-2)' }}>
                        <Badge variant={order.status === 'CONFIRMED' ? 'verified' : order.status === 'FAILED' ? 'neutral' : 'sponsored'}>
                          {order.status}
                        </Badge>
                      </td>
                      <td style={{ padding: 'var(--space-2)' }}>{new Date(order.createdAt).toLocaleString()}</td>
                      <td style={{ padding: 'var(--space-2)' }}>
                        {order.status !== 'CONFIRMED' && order.status !== 'FAILED' && (
                          <Button
                            variant="outline"
                            size="sm"
                            disabled={Boolean(actionLoading)}
                            onClick={() => handleReconcileSingleOrder(order.id)}
                          >
                            {actionLoading === `reconcile-${order.id}` ? 'Reconciling...' : 'Reconcile'}
                          </Button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div style={{ marginTop: 'var(--space-4)' }}>
                <Pagination
                  currentPage={paymentsPage}
                  totalPages={paymentsTotalPages}
                  onPageChange={setPaymentsPage}
                />
              </div>
            </div>
          )}
        </Card>
      )}

      {/* TAB: SETTLEMENTS & RECOVERY */}
      {activeTab === 'settlements' && (
        <Card elevation={1}>
          <div style={{ display: 'flex', gap: 'var(--space-3)', marginBottom: 'var(--space-4)' }}>
            <Button
              variant={settlementSubTab === 'settlements' ? 'primary' : 'outline'}
              size="sm"
              onClick={() => setSettlementSubTab('settlements')}
            >
              Ranking Settlements ({settlements.length})
            </Button>
            <Button
              variant={settlementSubTab === 'recoveryJobs' ? 'primary' : 'outline'}
              size="sm"
              onClick={() => setSettlementSubTab('recoveryJobs')}
            >
              Recovery Jobs ({recoveryJobs.length})
            </Button>
          </div>

          {loadingSettlements ? (
            <div style={{ padding: 'var(--space-12)', textAlign: 'center' }}>
              <LoadingIndicator size="md" label="Loading settlements..." />
            </div>
          ) : settlementSubTab === 'settlements' ? (
            settlements.length === 0 ? (
              <div style={{ textAlign: 'center', padding: 'var(--space-8)', color: 'var(--color-navy-muted)' }}>
                No ranking settlements recorded.
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 'var(--font-size-sm)' }}>
                  <thead>
                    <tr style={{ borderBottom: '2px solid var(--color-border)', textAlign: 'left' }}>
                      <th style={{ padding: 'var(--space-2)' }}>Settlement ID</th>
                      <th style={{ padding: 'var(--space-2)' }}>Payment Order</th>
                      <th style={{ padding: 'var(--space-2)' }}>Market</th>
                      <th style={{ padding: 'var(--space-2)' }}>Target #</th>
                      <th style={{ padding: 'var(--space-2)' }}>Final #</th>
                      <th style={{ padding: 'var(--space-2)' }}>Status</th>
                      <th style={{ padding: 'var(--space-2)' }}>Settled At</th>
                    </tr>
                  </thead>
                  <tbody>
                    {settlements.map((s) => (
                      <tr key={s.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                        <td style={{ padding: 'var(--space-2)', fontFamily: 'monospace' }}>{s.id}</td>
                        <td style={{ padding: 'var(--space-2)', fontFamily: 'monospace' }}>{s.paymentOrderId}</td>
                        <td style={{ padding: 'var(--space-2)' }}>{s.marketId}</td>
                        <td style={{ padding: 'var(--space-2)', fontWeight: 600 }}>#{s.targetPosition}</td>
                        <td style={{ padding: 'var(--space-2)', fontWeight: 600 }}>#{s.finalPosition ?? '-'}</td>
                        <td style={{ padding: 'var(--space-2)' }}>
                          <Badge variant={s.status === 'SETTLED' ? 'verified' : 'neutral'}>{s.status}</Badge>
                        </td>
                        <td style={{ padding: 'var(--space-2)' }}>
                          {s.settledAt ? new Date(s.settledAt).toLocaleString() : '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )
          ) : recoveryJobs.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 'var(--space-8)', color: 'var(--color-navy-muted)' }}>
              No recovery jobs currently queued.
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 'var(--font-size-sm)' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid var(--color-border)', textAlign: 'left' }}>
                    <th style={{ padding: 'var(--space-2)' }}>Job ID</th>
                    <th style={{ padding: 'var(--space-2)' }}>Type</th>
                    <th style={{ padding: 'var(--space-2)' }}>Payment Order</th>
                    <th style={{ padding: 'var(--space-2)' }}>Attempts</th>
                    <th style={{ padding: 'var(--space-2)' }}>Next Run</th>
                    <th style={{ padding: 'var(--space-2)' }}>Status</th>
                    <th style={{ padding: 'var(--space-2)' }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {recoveryJobs.map((j) => (
                    <tr key={j.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                      <td style={{ padding: 'var(--space-2)', fontFamily: 'monospace' }}>{j.id}</td>
                      <td style={{ padding: 'var(--space-2)' }}>{j.jobType}</td>
                      <td style={{ padding: 'var(--space-2)', fontFamily: 'monospace' }}>{j.paymentOrderId || '-'}</td>
                      <td style={{ padding: 'var(--space-2)' }}>{j.attempts} / {j.maxAttempts}</td>
                      <td style={{ padding: 'var(--space-2)' }}>{new Date(j.nextRunAt).toLocaleString()}</td>
                      <td style={{ padding: 'var(--space-2)' }}>
                        <Badge variant={j.status === 'COMPLETED' ? 'verified' : j.status === 'FAILED' ? 'neutral' : 'sponsored'}>
                          {j.status}
                        </Badge>
                      </td>
                      <td style={{ padding: 'var(--space-2)' }}>
                        {(j.status === 'FAILED' || j.status === 'RETRYABLE') && (
                          <Button
                            variant="outline"
                            size="sm"
                            disabled={Boolean(actionLoading)}
                            onClick={() => handleRetryJob(j.id)}
                          >
                            {actionLoading === `retry-${j.id}` ? 'Retrying...' : 'Retry Job'}
                          </Button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      )}

      {/* TAB: RUN HISTORY */}
      {activeTab === 'runs' && (
        <Card elevation={1}>
          <h3 style={{ fontSize: 'var(--font-size-lg)', fontWeight: 700, color: 'var(--color-navy)', marginBottom: 'var(--space-4)' }}>
            Durable Reconciliation & Recovery Execution History
          </h3>

          {loadingRuns ? (
            <div style={{ padding: 'var(--space-12)', textAlign: 'center' }}>
              <LoadingIndicator size="md" label="Loading run history..." />
            </div>
          ) : runs.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 'var(--space-8)', color: 'var(--color-navy-muted)' }}>
              No execution records stored yet.
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 'var(--font-size-sm)' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid var(--color-border)', textAlign: 'left' }}>
                    <th style={{ padding: 'var(--space-2)' }}>Run ID</th>
                    <th style={{ padding: 'var(--space-2)' }}>Type</th>
                    <th style={{ padding: 'var(--space-2)' }}>Trigger</th>
                    <th style={{ padding: 'var(--space-2)' }}>Status</th>
                    <th style={{ padding: 'var(--space-2)' }}>Started At</th>
                    <th style={{ padding: 'var(--space-2)' }}>Candidates</th>
                    <th style={{ padding: 'var(--space-2)' }}>Succeeded</th>
                    <th style={{ padding: 'var(--space-2)' }}>Retryable</th>
                    <th style={{ padding: 'var(--space-2)' }}>Failed</th>
                  </tr>
                </thead>
                <tbody>
                  {runs.map((r) => (
                    <tr key={r.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                      <td style={{ padding: 'var(--space-2)', fontFamily: 'monospace' }}>{r.id}</td>
                      <td style={{ padding: 'var(--space-2)' }}>{r.runType}</td>
                      <td style={{ padding: 'var(--space-2)' }}>
                        <Badge variant="neutral">{r.triggerSource}</Badge>
                      </td>
                      <td style={{ padding: 'var(--space-2)' }}>
                        <Badge variant={r.status === 'COMPLETED' ? 'verified' : r.status === 'FAILED' ? 'neutral' : 'sponsored'}>
                          {r.status}
                        </Badge>
                      </td>
                      <td style={{ padding: 'var(--space-2)' }}>{new Date(r.startedAt).toLocaleString()}</td>
                      <td style={{ padding: 'var(--space-2)' }}>{r.candidateCount}</td>
                      <td style={{ padding: 'var(--space-2)', color: '#16A34A', fontWeight: 600 }}>{r.successfulCount}</td>
                      <td style={{ padding: 'var(--space-2)', color: 'var(--color-orange)', fontWeight: 600 }}>{r.retryableCount}</td>
                      <td style={{ padding: 'var(--space-2)', color: '#DC2626', fontWeight: 600 }}>{r.permanentFailedCount}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      )}
    </div>
  );
}
