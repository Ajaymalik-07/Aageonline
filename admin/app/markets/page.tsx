'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';

interface MarketItem {
  id: string;
  slug: string;
  name: string;
  city: string;
  category: string;
  basePriceRupees: number;
  activeCount?: number;
  status: string;
}

export default function AdminMarketsPage() {
  const [markets, setMarkets] = useState<MarketItem[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadMarkets() {
      try {
        setLoading(true);
        setError(null);
        const res = await fetch('/api/markets');
        if (res.status === 401) {
          window.location.href = '/login?from=/markets';
          return;
        }
        if (!res.ok) {
          throw new Error(`Failed to load markets: HTTP ${res.status}`);
        }
        const data = await res.json();
        const items = Array.isArray(data?.markets)
          ? data.markets
          : Array.isArray(data)
          ? data
          : [];
        setMarkets(items);
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'Error fetching market catalog');
      } finally {
        setLoading(false);
      }
    }

    loadMarkets();
  }, []);

  const filtered = markets.filter((m) => {
    const q = search.toLowerCase();
    return (
      (m.name && m.name.toLowerCase().includes(q)) ||
      (m.city && m.city.toLowerCase().includes(q)) ||
      (m.category && m.category.toLowerCase().includes(q)) ||
      (m.slug && m.slug.toLowerCase().includes(q))
    );
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 800, margin: 0, color: '#FFFFFF', letterSpacing: '-0.02em' }}>
            Markets &amp; Atomic Rankings
          </h1>
          <p style={{ margin: '6px 0 0 0', color: 'var(--text-muted)', fontSize: '13px' }}>
            Authoritative visibility markets defined strictly by a unique Location + Category pair.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '12px' }}>
          <input
            type="text"
            placeholder="Search by city, category, or slug..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="admin-input"
            style={{ width: '280px' }}
          />
        </div>
      </div>

      {/* Rules Notice */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: '16px',
        }}
      >
        <div
          style={{
            padding: '14px 18px',
            borderRadius: 'var(--radius-sm)',
            backgroundColor: 'rgba(234, 88, 12, 0.08)',
            border: '1px solid rgba(234, 88, 12, 0.25)',
          }}
        >
          <div style={{ fontSize: '12px', fontWeight: 700, color: '#FB923C', textTransform: 'uppercase' }}>
            Atomic Concurrency
          </div>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>
            Rank mutations lock the market row inside a strict PostgreSQL transaction.
          </div>
        </div>

        <div
          style={{
            padding: '14px 18px',
            borderRadius: 'var(--radius-sm)',
            backgroundColor: 'rgba(59, 130, 246, 0.08)',
            border: '1px solid rgba(59, 130, 246, 0.25)',
          }}
        >
          <div style={{ fontSize: '12px', fontWeight: 700, color: '#60A5FA', textTransform: 'uppercase' }}>
            Payment Finality
          </div>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>
            Overtaken positions do not refund previous payments. Each rank step is distinct.
          </div>
        </div>

        <div
          style={{
            padding: '14px 18px',
            borderRadius: 'var(--radius-sm)',
            backgroundColor: 'rgba(16, 185, 129, 0.08)',
            border: '1px solid rgba(16, 185, 129, 0.25)',
          }}
        >
          <div style={{ fontSize: '12px', fontWeight: 700, color: '#34D399', textTransform: 'uppercase' }}>
            V1 Constraints
          </div>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>
            Zero wallets, zero credits, zero auto-bidding bots permitted in the system.
          </div>
        </div>
      </div>

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
            Market Catalog ({filtered.length} active)
          </span>
          <span style={{ fontSize: '11px', color: 'var(--text-dim)' }}>
            Strict uniqueness constraint on (location_slug, category_slug)
          </span>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table className="admin-table">
            <thead>
              <tr>
                <th>Market Name</th>
                <th>Slug</th>
                <th>Location</th>
                <th>Category</th>
                <th>Base Bid (₹)</th>
                <th>Positions</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={8} style={{ textAlign: 'center', padding: '36px', color: 'var(--text-muted)' }}>
                    Loading market catalog...
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ textAlign: 'center', padding: '36px', color: 'var(--text-muted)' }}>
                    {search ? 'No markets matching search criteria.' : 'No markets defined.'}
                  </td>
                </tr>
              ) : (
                filtered.map((m) => (
                  <tr key={m.id || m.slug}>
                    <td>
                      <div style={{ fontWeight: 700, color: '#FFFFFF' }}>
                        {m.name || `${m.city} × ${m.category}`}
                      </div>
                    </td>
                    <td>
                      <code style={{ fontSize: '12px', color: 'var(--brand-highlight)' }}>
                        {m.slug}
                      </code>
                    </td>
                    <td>{m.city}</td>
                    <td>{m.category}</td>
                    <td style={{ fontFamily: 'monospace', fontWeight: 600 }}>
                      ₹{m.basePriceRupees?.toLocaleString('en-IN') || '25,000'}
                    </td>
                    <td>
                      <span className="badge badge-neutral">Top 3</span>
                    </td>
                    <td>
                      <span className="badge badge-success">ACTIVE</span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                        <a
                          href={`http://localhost:3000/${m.slug}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{
                            fontSize: '11px',
                            color: '#60A5FA',
                            textDecoration: 'underline',
                            fontWeight: 600,
                          }}
                        >
                          Public Page ↗
                        </a>
                        <Link
                          href="/rankings"
                          style={{
                            fontSize: '11px',
                            color: 'var(--brand-highlight)',
                            fontWeight: 600,
                          }}
                        >
                          Ladder →
                        </Link>
                      </div>
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
