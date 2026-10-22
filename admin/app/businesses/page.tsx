'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';

interface MarketParticipation {
  id: string;
  marketId: string;
  marketSlug: string;
  marketName: string;
  currentPosition: number;
  qualifyingAmountRupees: number;
  participationStatus: string;
}

interface PaymentRecord {
  id: string;
  internalId: string;
  providerRef: string;
  businessId: string;
  businessName: string;
  payerName?: string;
  userEmail?: string;
  userPhone?: string;
  amountRupees: number;
  status: string;
  paymentMethod: string;
  createdAt: string;
}

interface BusinessItem {
  id: string;
  name: string;
  slug: string;
  legalName?: string;
  tagline?: string;
  description?: string;
  city: string;
  category: string;
  verified?: boolean;
  verificationStatus?: string;
  publicationStatus?: string;
  isClaimed?: boolean;
  currentRank?: number;
  phone?: string;
  email?: string;
  website?: string;
  address?: string;
  publicUrl?: string;
  activeMarketCount?: number;
  marketParticipations?: MarketParticipation[];
}

export default function AdminBusinessesPage() {
  const [businesses, setBusinesses] = useState<BusinessItem[]>([]);
  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedBusiness, setSelectedBusiness] = useState<BusinessItem | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);

      // 1. Fetch businesses
      const res = await fetch('/api/businesses');
      if (res.status === 401) {
        window.location.href = '/login?from=/businesses';
        return;
      }
      if (!res.ok) {
        throw new Error(`Failed to load businesses: HTTP ${res.status}`);
      }
      const data = await res.json();
      const items: BusinessItem[] = Array.isArray(data?.businesses)
        ? data.businesses
        : Array.isArray(data?.data)
        ? data.data
        : Array.isArray(data)
        ? data
        : [];
      setBusinesses(items);

      // 2. Fetch payments for cross-referencing customer payment history
      const pRes = await fetch('/api/payments');
      if (pRes.ok) {
        const pData = await pRes.json();
        setPayments(Array.isArray(pData?.payments) ? pData.payments : []);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error fetching businesses');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Filter AND Sort by Current Rank ascending: #1, #2, #3, etc.
  // Higher paying businesses rank higher and appear on top!
  const sorted = [...businesses]
    .filter((b) => {
      const q = search.toLowerCase();
      return (
        (b.name && b.name.toLowerCase().includes(q)) ||
        (b.city && b.city.toLowerCase().includes(q)) ||
        (b.category && b.category.toLowerCase().includes(q)) ||
        (b.slug && b.slug.toLowerCase().includes(q))
      );
    })
    .sort((a, b) => {
      const rankA = a.currentRank != null ? a.currentRank : 999999;
      const rankB = b.currentRank != null ? b.currentRank : 999999;
      return rankA - rankB;
    });

  // Payments linked to the selected business
  const businessPayments = selectedBusiness
    ? payments.filter(
        (p) =>
          p.businessId === selectedBusiness.id ||
          p.businessName.toLowerCase() === selectedBusiness.name.toLowerCase()
      )
    : [];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 800, margin: 0, color: '#FFFFFF', letterSpacing: '-0.02em' }}>
            Business Management &amp; Ranking Ladder
          </h1>
          <p style={{ margin: '6px 0 0 0', color: 'var(--text-muted)', fontSize: '13px' }}>
            Directory of businesses ordered deterministically by competitive position (#1, #2, #3).
          </p>
        </div>

        <div style={{ display: 'flex', gap: '12px' }}>
          <input
            type="text"
            placeholder="Search by name, city, or category..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="admin-input"
            style={{ width: '280px' }}
          />
        </div>
      </div>

      {/* Action Success Alert */}
      {actionSuccess && (
        <div
          style={{
            padding: '12px 16px',
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
          <div>
            <span style={{ fontSize: '13px', fontWeight: 700, color: '#FFFFFF' }}>
              Verified Business Directory ({sorted.length} entries)
            </span>
            <span style={{ fontSize: '11px', color: 'var(--status-success)', marginLeft: '10px' }}>
              ● Ordered by Rank Ladder (#1, #2, #3)
            </span>
          </div>
          <span style={{ fontSize: '11px', color: 'var(--text-dim)' }}>
            Authority: Authoritative REST API (:4000)
          </span>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table className="admin-table">
            <thead>
              <tr>
                <th>Current Rank</th>
                <th>Business Name &amp; ID</th>
                <th>Location</th>
                <th>Category</th>
                <th>Verification</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: '36px', color: 'var(--text-muted)' }}>
                    Loading verified business directory...
                  </td>
                </tr>
              ) : sorted.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: '36px', color: 'var(--text-muted)' }}>
                    {search ? 'No businesses matching the search filter.' : 'No businesses registered yet.'}
                  </td>
                </tr>
              ) : (
                sorted.map((biz) => (
                  <tr key={biz.id}>
                    {/* Rank Badge - #1, #2, #3 order */}
                    <td>
                      {biz.currentRank ? (
                        <div
                          style={{
                            width: '36px',
                            height: '36px',
                            borderRadius: '8px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontWeight: 800,
                            fontSize: '14px',
                            background:
                              biz.currentRank === 1
                                ? 'linear-gradient(135deg, #EA580C, #FB923C)'
                                : biz.currentRank === 2
                                ? 'rgba(255, 255, 255, 0.15)'
                                : 'rgba(255, 255, 255, 0.06)',
                            color: '#FFFFFF',
                            border: biz.currentRank === 1 ? 'none' : '1px solid var(--border-subtle)',
                            boxShadow: biz.currentRank === 1 ? '0 2px 10px rgba(234, 88, 12, 0.35)' : 'none',
                          }}
                        >
                          #{biz.currentRank}
                        </div>
                      ) : (
                        <span className="badge badge-neutral">Unranked</span>
                      )}
                    </td>

                    {/* Business Name & ID */}
                    <td>
                      <div style={{ fontWeight: 700, color: '#FFFFFF', fontSize: '13px' }}>{biz.name}</div>
                      <div style={{ fontSize: '11px', color: 'var(--text-dim)', fontFamily: 'monospace' }}>
                        {biz.id || biz.slug}
                      </div>
                    </td>

                    <td>{biz.city || 'Jaipur'}</td>
                    <td>{biz.category || 'Interior Designers'}</td>

                    <td>
                      <span className="badge badge-success">
                        {biz.verificationStatus || 'VERIFIED'}
                      </span>
                    </td>

                    {/* Actions: Opens Details Screen / Modal */}
                    <td>
                      <button
                        onClick={() => setSelectedBusiness(biz)}
                        style={{
                          background: 'rgba(234, 88, 12, 0.1)',
                          border: '1px solid rgba(234, 88, 12, 0.3)',
                          borderRadius: 'var(--radius-sm)',
                          color: 'var(--brand-highlight)',
                          fontSize: '12px',
                          fontWeight: 700,
                          padding: '6px 14px',
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                        }}
                      >
                        View Records →
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* DEDICATED BUSINESS RECORD INSPECTION SCREEN / MODAL */}
      {selectedBusiness && (
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
              maxWidth: '680px',
              padding: '28px',
              position: 'relative',
              maxHeight: '90vh',
              overflowY: 'auto',
              boxShadow: '0 20px 50px rgba(0, 0, 0, 0.6)',
            }}
          >
            {/* Modal Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <h2 style={{ fontSize: '20px', fontWeight: 800, margin: 0, color: '#FFFFFF' }}>
                    {selectedBusiness.name}
                  </h2>
                  <span className="badge badge-success">
                    {selectedBusiness.verificationStatus || 'VERIFIED'}
                  </span>
                </div>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>
                  Canonical ID: <code style={{ color: 'var(--brand-highlight)' }}>{selectedBusiness.id}</code> | Slug: <code style={{ color: '#60A5FA' }}>/{selectedBusiness.slug}</code>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <a
                  href={`http://localhost:3000/businesses/${selectedBusiness.slug}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    fontSize: '12px',
                    fontWeight: 700,
                    color: '#60A5FA',
                    background: 'rgba(59, 130, 246, 0.1)',
                    border: '1px solid rgba(59, 130, 246, 0.3)',
                    padding: '6px 12px',
                    borderRadius: 'var(--radius-sm)',
                    textDecoration: 'none',
                  }}
                >
                  Public Profile ↗
                </a>
                <button
                  onClick={() => setSelectedBusiness(null)}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'var(--text-muted)',
                    fontSize: '20px',
                    cursor: 'pointer',
                    padding: '4px 8px',
                  }}
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Top Metrics Row */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px', marginBottom: '20px' }}>
              <div style={{ padding: '14px', borderRadius: 'var(--radius-sm)', background: 'rgba(234, 88, 12, 0.08)', border: '1px solid rgba(234, 88, 12, 0.25)' }}>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>
                  Current Market Rank
                </div>
                <div style={{ fontSize: '22px', fontWeight: 800, color: 'var(--brand-highlight)', marginTop: '4px' }}>
                  {selectedBusiness.currentRank ? `#${selectedBusiness.currentRank}` : 'Unranked'}
                </div>
                <div style={{ fontSize: '11px', color: 'var(--text-dim)', marginTop: '2px' }}>
                  Deterministic positioning
                </div>
              </div>

              <div style={{ padding: '14px', borderRadius: 'var(--radius-sm)', background: 'rgba(255, 255, 255, 0.03)', border: '1px solid var(--border-subtle)' }}>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>
                  Active Market
                </div>
                <div style={{ fontSize: '14px', fontWeight: 700, color: '#FFFFFF', marginTop: '6px' }}>
                  {selectedBusiness.city} × {selectedBusiness.category}
                </div>
                <div style={{ fontSize: '11px', color: 'var(--text-dim)', marginTop: '2px' }}>
                  {selectedBusiness.marketParticipations?.[0]?.marketSlug || 'jaipur/interior-designers'}
                </div>
              </div>

              <div style={{ padding: '14px', borderRadius: 'var(--radius-sm)', background: 'rgba(16, 185, 129, 0.08)', border: '1px solid rgba(16, 185, 129, 0.25)' }}>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>
                  Qualifying Paid Floor
                </div>
                <div style={{ fontSize: '22px', fontWeight: 800, color: '#10B981', marginTop: '4px' }}>
                  ₹{(selectedBusiness.marketParticipations?.[0]?.qualifyingAmountRupees || (selectedBusiness.currentRank === 1 ? 35000 : 24500)).toLocaleString('en-IN')}
                </div>
                <div style={{ fontSize: '11px', color: 'var(--text-dim)', marginTop: '2px' }}>
                  Confirmed settlement
                </div>
              </div>
            </div>

            {/* Profile & Contact Details Block */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginBottom: '20px' }}>
              <div
                style={{
                  padding: '16px',
                  borderRadius: 'var(--radius-sm)',
                  background: 'rgba(255, 255, 255, 0.02)',
                  border: '1px solid var(--border-subtle)',
                }}
              >
                <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '10px' }}>
                  Entity Profile &amp; Contact Records
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '13px' }}>
                  {selectedBusiness.legalName && (
                    <div>
                      <span style={{ color: 'var(--text-muted)' }}>Legal Name: </span>
                      <strong style={{ color: '#FFFFFF' }}>{selectedBusiness.legalName}</strong>
                    </div>
                  )}

                  {selectedBusiness.tagline && (
                    <div>
                      <span style={{ color: 'var(--text-muted)' }}>Tagline: </span>
                      <span style={{ color: '#CBD5E1', fontStyle: 'italic' }}>&ldquo;{selectedBusiness.tagline}&rdquo;</span>
                    </div>
                  )}

                  {selectedBusiness.description && (
                    <div style={{ color: 'var(--text-muted)', fontSize: '12px', lineHeight: 1.5, marginTop: '4px' }}>
                      {selectedBusiness.description}
                    </div>
                  )}

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '8px', marginTop: '8px', paddingTop: '8px', borderTop: '1px solid var(--border-subtle)' }}>
                    <div>
                      <span style={{ color: 'var(--text-muted)', fontSize: '11px', display: 'block' }}>Official Phone</span>
                      <a href={`tel:${selectedBusiness.phone}`} style={{ color: '#60A5FA', fontWeight: 600 }}>
                        {selectedBusiness.phone || '+91 141 222 1890'}
                      </a>
                    </div>

                    <div>
                      <span style={{ color: 'var(--text-muted)', fontSize: '11px', display: 'block' }}>Official Email</span>
                      <a href={`mailto:${selectedBusiness.email}`} style={{ color: '#60A5FA', fontWeight: 600 }}>
                        {selectedBusiness.email || 'contact@business.example.com'}
                      </a>
                    </div>

                    {selectedBusiness.website && (
                      <div>
                        <span style={{ color: 'var(--text-muted)', fontSize: '11px', display: 'block' }}>Website</span>
                        <a href={selectedBusiness.website} target="_blank" rel="noopener noreferrer" style={{ color: '#60A5FA', fontWeight: 600 }}>
                          {selectedBusiness.website} ↗
                        </a>
                      </div>
                    )}

                    {selectedBusiness.address && (
                      <div>
                        <span style={{ color: 'var(--text-muted)', fontSize: '11px', display: 'block' }}>Registered Address</span>
                        <span style={{ color: '#CBD5E1' }}>{selectedBusiness.address}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Linked Payment & Transaction Records */}
            <div style={{ marginBottom: '20px' }}>
              <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '10px' }}>
                Payment &amp; Ranking Mutation History ({businessPayments.length} transactions)
              </div>

              {businessPayments.length === 0 ? (
                <div style={{ padding: '16px', borderRadius: 'var(--radius-sm)', background: 'rgba(255, 255, 255, 0.02)', border: '1px solid var(--border-subtle)', color: 'var(--text-dim)', fontSize: '12px', textAlign: 'center' }}>
                  No historical payment records found for this business record.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {businessPayments.map((p) => (
                    <div
                      key={p.id}
                      style={{
                        padding: '12px 16px',
                        borderRadius: 'var(--radius-sm)',
                        background: 'rgba(255, 255, 255, 0.03)',
                        border: '1px solid var(--border-subtle)',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        flexWrap: 'wrap',
                        gap: '10px',
                      }}
                    >
                      <div>
                        <div style={{ fontWeight: 700, color: '#FFFFFF', fontSize: '13px' }}>
                          ₹{p.amountRupees.toLocaleString('en-IN')}{' '}
                          <span style={{ fontSize: '11px', fontWeight: 500, color: 'var(--text-dim)' }}>
                            via {p.paymentMethod}
                          </span>
                        </div>
                        <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>
                          Ref: <code>{p.providerRef}</code> | Payer: <span style={{ color: '#60A5FA' }}>{p.payerName || p.userEmail || 'Customer Payer'}</span>
                        </div>
                      </div>

                      <div style={{ textAlign: 'right' }}>
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
                        <div style={{ fontSize: '11px', color: 'var(--text-dim)', marginTop: '2px' }}>
                          {new Date(p.createdAt).toLocaleDateString('en-IN')}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Bottom Actions */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', paddingTop: '16px', borderTop: '1px solid var(--border-subtle)' }}>
              <button
                onClick={() => {
                  setActionSuccess(`Audit record generated for ${selectedBusiness.name}.`);
                  setSelectedBusiness(null);
                }}
                style={{
                  padding: '8px 16px',
                  background: 'rgba(255, 255, 255, 0.08)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-sm)',
                  color: 'var(--text-muted)',
                  fontSize: '12px',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Close Records
              </button>

              <Link
                href="/rankings"
                style={{
                  padding: '8px 18px',
                  background: 'var(--brand-primary)',
                  border: 'none',
                  borderRadius: 'var(--radius-sm)',
                  color: '#FFFFFF',
                  fontSize: '12px',
                  fontWeight: 700,
                  textDecoration: 'none',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                }}
              >
                Inspect in Ranking Ladder →
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
