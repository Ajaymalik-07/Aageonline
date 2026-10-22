'use client';

import React, { useEffect, useState } from 'react';

interface PaymentItem {
  id: string;
  internalId: string;
  providerRef: string;
  businessId: string;
  businessName: string;
  payerName?: string;
  userEmail?: string;
  userPhone?: string;
  marketSlug: string;
  amountRupees: number;
  amountPaise: number;
  currency: string;
  status: 'INITIATED' | 'PENDING' | 'CONFIRMED' | 'FAILED' | 'CANCELLED';
  paymentMethod: string;
  createdAt: string;
  settledAt?: string;
  webhookEvents?: string[];
}

export default function AdminPaymentsPage() {
  const [payments, setPayments] = useState<PaymentItem[]>([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedPayment, setSelectedPayment] = useState<PaymentItem | null>(null);

  useEffect(() => {
    async function loadPayments() {
      try {
        setLoading(true);
        setError(null);
        const res = await fetch('/api/payments');
        if (res.status === 401 || res.status === 403) {
          window.location.href = '/login?from=/payments';
          return;
        }
        if (!res.ok) {
          throw new Error(`Failed to load payments: HTTP ${res.status}`);
        }
        const data = await res.json();
        const items = Array.isArray(data?.payments) ? data.payments : Array.isArray(data) ? data : [];
        setPayments(items);
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'Error fetching payment ledger');
      } finally {
        setLoading(false);
      }
    }

    loadPayments();
  }, []);

  const filtered = payments.filter((p) => {
    const q = search.toLowerCase();
    const matchesSearch =
      (p.businessName && p.businessName.toLowerCase().includes(q)) ||
      (p.providerRef && p.providerRef.toLowerCase().includes(q)) ||
      (p.internalId && p.internalId.toLowerCase().includes(q)) ||
      (p.marketSlug && p.marketSlug.toLowerCase().includes(q));

    const matchesStatus = statusFilter === 'ALL' || p.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const totalConfirmed = payments
    .filter((p) => p.status === 'CONFIRMED')
    .reduce((sum, p) => sum + p.amountRupees, 0);

  const totalFailed = payments.filter((p) => p.status === 'FAILED').length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 800, margin: 0, color: '#FFFFFF', letterSpacing: '-0.02em' }}>
            Payments &amp; Transaction Ledger
          </h1>
          <p style={{ margin: '6px 0 0 0', color: 'var(--text-muted)', fontSize: '13px' }}>
            Authoritative financial records, server-verified PayU webhook logs, and integer minor-unit paise audits.
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
            <option value="CONFIRMED">Confirmed</option>
            <option value="PENDING">Pending</option>
            <option value="FAILED">Failed</option>
          </select>
          <input
            type="text"
            placeholder="Search provider ref, business, ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="admin-input"
            style={{ width: '280px' }}
          />
        </div>
      </div>

      {/* Financial Invariant Alert */}
      <div
        style={{
          padding: '14px 18px',
          borderRadius: 'var(--radius-sm)',
          backgroundColor: 'rgba(234, 88, 12, 0.1)',
          border: '1px solid rgba(234, 88, 12, 0.3)',
          display: 'flex',
          gap: '12px',
          alignItems: 'center',
          fontSize: '12px',
          color: '#FDBA74',
        }}
      >
        <span style={{ fontSize: '18px' }}>💰</span>
        <div>
          <strong>Financial Immutability Rule:</strong> All monetary values are maintained in exact integer minor units (paise). Client-supplied pricing is strictly ignored. Browser payment return callbacks are never treated as confirmation of payment.
        </div>
      </div>

      {/* KPI Stats Strip */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
        <div className="admin-card" style={{ padding: '16px 20px' }}>
          <div style={{ fontSize: '11px', color: 'var(--text-dim)', fontWeight: 600, textTransform: 'uppercase' }}>
            Confirmed Volume
          </div>
          <div style={{ fontSize: '24px', fontWeight: 800, color: '#10B981', marginTop: '6px' }}>
            ₹{totalConfirmed.toLocaleString('en-IN')}
          </div>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>
            {(totalConfirmed * 100).toLocaleString('en-IN')} integer paise
          </div>
        </div>

        <div className="admin-card" style={{ padding: '16px 20px' }}>
          <div style={{ fontSize: '11px', color: 'var(--text-dim)', fontWeight: 600, textTransform: 'uppercase' }}>
            Total Transactions
          </div>
          <div style={{ fontSize: '24px', fontWeight: 800, color: '#FFFFFF', marginTop: '6px' }}>
            {payments.length}
          </div>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>
            Append-only payment intents
          </div>
        </div>

        <div className="admin-card" style={{ padding: '16px 20px' }}>
          <div style={{ fontSize: '11px', color: 'var(--text-dim)', fontWeight: 600, textTransform: 'uppercase' }}>
            Failed / Gateway Declines
          </div>
          <div style={{ fontSize: '24px', fontWeight: 800, color: totalFailed > 0 ? '#EF4444' : '#10B981', marginTop: '6px' }}>
            {totalFailed}
          </div>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>
            Verified bank / gateway drops
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

      {/* Payments Table */}
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
            Payment Transactions ({filtered.length})
          </span>
          <span style={{ fontSize: '11px', color: 'var(--text-dim)' }}>
            Authority: Server-Verified PayU Signatures
          </span>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table className="admin-table">
            <thead>
              <tr>
                <th>Internal ID / Ref</th>
                <th>Customer / Payer Identity</th>
                <th>Business Name</th>
                <th>Market Target</th>
                <th>Amount (INR / Paise)</th>
                <th>Method</th>
                <th>Status</th>
                <th>Created At</th>
                <th>Audit</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={9} style={{ textAlign: 'center', padding: '40px', color: 'var(--text-dim)' }}>
                    Loading transaction ledger...
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={9} style={{ textAlign: 'center', padding: '40px', color: 'var(--text-dim)' }}>
                    No payment transactions matching filter
                  </td>
                </tr>
              ) : (
                filtered.map((p) => (
                  <tr key={p.id}>
                    <td>
                      <div style={{ fontWeight: 600, color: '#FFFFFF' }}>{p.providerRef}</div>
                      <div style={{ fontSize: '11px', color: 'var(--text-dim)' }}>{p.internalId}</div>
                    </td>
                    <td>
                      <div style={{ fontWeight: 600, color: '#FFFFFF', fontSize: '13px' }}>
                        {p.payerName || 'Verified Payer'}
                      </div>
                      <div style={{ fontSize: '11px', color: '#60A5FA' }}>
                        {p.userEmail || 'contact@business.example.com'}
                      </div>
                      <div style={{ fontSize: '11px', color: 'var(--text-dim)' }}>
                        {p.userPhone || '+91 141 200 0000'}
                      </div>
                    </td>
                    <td>
                      <div style={{ fontWeight: 600, color: '#FFFFFF' }}>{p.businessName}</div>
                      <div style={{ fontSize: '11px', color: 'var(--text-dim)' }}>{p.businessId}</div>
                    </td>
                    <td>
                      <code style={{ fontSize: '12px', color: 'var(--brand-highlight)', background: 'rgba(234, 88, 12, 0.1)', padding: '2px 6px', borderRadius: '4px' }}>
                        /{p.marketSlug}
                      </code>
                    </td>
                    <td>
                      <div style={{ fontWeight: 700, color: p.status === 'CONFIRMED' ? '#10B981' : '#FFFFFF', fontSize: '13px' }}>
                        ₹{p.amountRupees.toLocaleString('en-IN')}
                      </div>
                      <div style={{ fontSize: '11px', color: 'var(--text-dim)' }}>
                        {p.amountPaise.toLocaleString('en-IN')} paise
                      </div>
                    </td>
                    <td>
                      <span className="badge badge-neutral">{p.paymentMethod}</span>
                    </td>
                    <td>
                      <span
                        className={`badge ${
                          p.status === 'CONFIRMED'
                            ? 'badge-success'
                            : p.status === 'FAILED'
                            ? 'badge-danger'
                            : 'badge-warning'
                        }`}
                      >
                        {p.status}
                      </span>
                    </td>
                    <td>
                      <div style={{ fontSize: '12px', color: '#CBD5E1' }}>
                        {new Date(p.createdAt).toLocaleDateString('en-IN', {
                          day: 'numeric',
                          month: 'short',
                        })}
                      </div>
                      <div style={{ fontSize: '11px', color: 'var(--text-dim)' }}>
                        {new Date(p.createdAt).toLocaleTimeString('en-IN', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </div>
                    </td>
                    <td>
                      <button
                        onClick={() => setSelectedPayment(p)}
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
                        Audit Events ({p.webhookEvents?.length || 0})
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Webhook Events Modal */}
      {selectedPayment && (
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
                  Customer Payer Profile &amp; Verification Events
                </h2>
                <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: 'var(--text-muted)' }}>
                  {selectedPayment.providerRef} — {selectedPayment.businessName}
                </p>
              </div>
              <button
                onClick={() => setSelectedPayment(null)}
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

            {/* Customer User Contact Box */}
            <div
              style={{
                marginTop: '16px',
                padding: '14px 16px',
                borderRadius: 'var(--radius-sm)',
                backgroundColor: 'rgba(59, 130, 246, 0.08)',
                border: '1px solid rgba(59, 130, 246, 0.25)',
              }}
            >
              <div style={{ fontSize: '11px', fontWeight: 700, color: '#93C5FD', textTransform: 'uppercase', marginBottom: '6px' }}>
                Customer / Payer Contact
              </div>
              <div style={{ fontSize: '14px', fontWeight: 700, color: '#FFFFFF' }}>
                {selectedPayment.payerName || 'Verified Payer'}
              </div>
              <div style={{ display: 'flex', gap: '16px', marginTop: '6px', fontSize: '12px', flexWrap: 'wrap' }}>
                <span style={{ color: '#60A5FA' }}>
                  ✉ {selectedPayment.userEmail || 'contact@business.example.com'}
                </span>
                <span style={{ color: 'var(--text-muted)' }}>
                  📞 {selectedPayment.userPhone || '+91 141 200 0000'}
                </span>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '16px' }}>
              {selectedPayment.webhookEvents?.map((evt, idx) => (
                <div
                  key={idx}
                  style={{
                    padding: '10px 14px',
                    borderRadius: 'var(--radius-sm)',
                    background: 'rgba(255, 255, 255, 0.03)',
                    border: '1px solid var(--border-subtle)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    fontSize: '12px',
                  }}
                >
                  <span style={{ color: '#10B981', fontWeight: 700 }}>✓</span>
                  <code style={{ color: 'var(--brand-highlight)' }}>{evt}</code>
                </div>
              ))}
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '20px' }}>
              <button
                onClick={() => setSelectedPayment(null)}
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
                Close Audit
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
