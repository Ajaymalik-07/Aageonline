'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';

interface LeadConnector {
  id: string;
  name: string;
  type: string;
  enabled: boolean;
  status: string;
  prospectsCollected: number;
  lastRun?: string;
  note?: string;
}

interface LeadRecord {
  id: string;
  organizationName: string;
  category: string;
  location: string;
  contactPhone?: string;
  contactEmail?: string;
  source: string;
  status: 'PROSPECT' | 'REVIEWED' | 'SUPPRESSED';
  collectedAt: string;
}

export default function AdminLeadsPage() {
  const [connectors, setConnectors] = useState<LeadConnector[]>([]);
  const [leads, setLeads] = useState<LeadRecord[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadLeadData() {
      try {
        setLoading(true);
        setError(null);
        const res = await fetch('/api/leads');
        if (res.status === 401 || res.status === 403) {
          window.location.href = '/login?from=/leads';
          return;
        }
        if (!res.ok) {
          throw new Error(`Failed to load leads data: HTTP ${res.status}`);
        }
        const data = await res.json();
        setConnectors(Array.isArray(data?.connectors) ? data.connectors : []);
        setLeads(Array.isArray(data?.leads) ? data.leads : []);
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'Error fetching lead registry');
      } finally {
        setLoading(false);
      }
    }

    loadLeadData();
  }, []);

  const filtered = leads.filter((l) => {
    const q = search.toLowerCase();
    return (
      l.organizationName.toLowerCase().includes(q) ||
      l.category.toLowerCase().includes(q) ||
      l.location.toLowerCase().includes(q)
    );
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Sub-Navigation Tabs */}
      <div style={{ display: 'flex', gap: '12px', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '12px' }}>
        <Link
          href="/leads"
          style={{
            padding: '8px 16px',
            borderRadius: '6px',
            fontSize: '13px',
            fontWeight: 700,
            backgroundColor: 'rgba(234, 88, 12, 0.15)',
            color: '#FB923C',
            border: '1px solid rgba(234, 88, 12, 0.35)',
            textDecoration: 'none',
          }}
        >
          🧲 Lead Registry
        </Link>
        <Link
          href="/leads/scraper"
          style={{
            padding: '8px 16px',
            borderRadius: '6px',
            fontSize: '13px',
            fontWeight: 600,
            color: 'var(--text-muted)',
            textDecoration: 'none',
          }}
        >
          🕷️ Scraper Dashboard
        </Link>
        <Link
          href="/leads/email-automation"
          style={{
            padding: '8px 16px',
            borderRadius: '6px',
            fontSize: '13px',
            fontWeight: 600,
            color: 'var(--text-muted)',
            textDecoration: 'none',
          }}
        >
          ✉️ Email Automation (Zero)
        </Link>
      </div>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 800, margin: 0, color: '#FFFFFF', letterSpacing: '-0.02em' }}>
            Lead Acquisition &amp; Scraper Framework
          </h1>
          <p style={{ margin: '6px 0 0 0', color: 'var(--text-muted)', fontSize: '13px' }}>
            Extensible connector registry, lawful directory ingestion, and prospect suppression pipeline.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '12px' }}>
          <input
            type="text"
            placeholder="Search prospects..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="admin-input"
            style={{ width: '260px' }}
          />
        </div>
      </div>

      {/* Owner Directive Alert */}
      <div
        style={{
          padding: '16px 20px',
          borderRadius: 'var(--radius-sm)',
          backgroundColor: 'rgba(234, 88, 12, 0.1)',
          border: '1px solid rgba(234, 88, 12, 0.3)',
          display: 'flex',
          gap: '14px',
          alignItems: 'flex-start',
        }}
      >
        <span style={{ fontSize: '20px' }}>⏳</span>
        <div>
          <div style={{ fontSize: '13px', fontWeight: 700, color: '#FB923C' }}>
            Scraper Source Awaiting Owner Specification
          </div>
          <div style={{ fontSize: '12px', color: '#FED7AA', marginTop: '4px', lineHeight: 1.5 }}>
            Automated web scraping is held pending specific source instructions and compliance review by the platform owner. Active connectors are limited to lawful manual CSV directory imports.
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

      {/* Connector Registry */}
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
            Connector Registry ({connectors.length})
          </span>
          <span style={{ fontSize: '11px', color: 'var(--text-dim)' }}>
            Modular Data Ingestion Sockets
          </span>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table className="admin-table">
            <thead>
              <tr>
                <th>Connector Name</th>
                <th>Type</th>
                <th>Status</th>
                <th>Prospects Ingested</th>
                <th>Configuration Note</th>
              </tr>
            </thead>
            <tbody>
              {connectors.map((c) => (
                <tr key={c.id}>
                  <td>
                    <div style={{ fontWeight: 600, color: '#FFFFFF' }}>{c.name}</div>
                    <code style={{ fontSize: '11px', color: 'var(--text-dim)' }}>{c.id}</code>
                  </td>
                  <td>
                    <span className="badge badge-neutral">{c.type}</span>
                  </td>
                  <td>
                    <span className={`badge ${c.enabled ? 'badge-success' : 'badge-warning'}`}>
                      {c.status}
                    </span>
                  </td>
                  <td>
                    <span style={{ fontWeight: 700, color: '#FFFFFF' }}>{c.prospectsCollected}</span>
                  </td>
                  <td style={{ fontSize: '12px', color: 'var(--text-muted)', maxWidth: '300px' }}>
                    {c.note || (c.lastRun ? `Last run: ${new Date(c.lastRun).toLocaleString('en-IN')}` : 'Ready for upload')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Ingested Leads Table */}
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
            Ingested Prospects ({filtered.length})
          </span>
          <span style={{ fontSize: '11px', color: 'var(--text-dim)' }}>
            Deduplicated Directory Records
          </span>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table className="admin-table">
            <thead>
              <tr>
                <th>Organization</th>
                <th>Category</th>
                <th>Location</th>
                <th>Contact Phone</th>
                <th>Contact Email</th>
                <th>Source</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: '40px', color: 'var(--text-dim)' }}>
                    Loading lead records...
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: '40px', color: 'var(--text-dim)' }}>
                    No prospect records matching query &ldquo;{search}&rdquo;
                  </td>
                </tr>
              ) : (
                filtered.map((l) => (
                  <tr key={l.id}>
                    <td>
                      <div style={{ fontWeight: 600, color: '#FFFFFF' }}>{l.organizationName}</div>
                      <div style={{ fontSize: '11px', color: 'var(--text-dim)' }}>{l.id}</div>
                    </td>
                    <td>{l.category}</td>
                    <td>{l.location}</td>
                    <td>{l.contactPhone || '—'}</td>
                    <td>{l.contactEmail || '—'}</td>
                    <td>
                      <span className="badge badge-neutral">{l.source}</span>
                    </td>
                    <td>
                      <span className={`badge ${l.status === 'PROSPECT' ? 'badge-info' : 'badge-success'}`}>
                        {l.status}
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
