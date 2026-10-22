'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';

interface RedirectItem {
  id: string;
  sourcePath: string;
  destinationUrl: string;
  statusCode: 301 | 302;
  hits: number;
  createdAt: string;
}

export default function AdminRedirectsPage() {
  const [redirects, setRedirects] = useState<RedirectItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const [newRule, setNewRule] = useState({
    sourcePath: '',
    destinationUrl: '',
    statusCode: 301 as 301 | 302,
  });

  const loadRedirects = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch('/api/redirects');
      if (res.status === 401 || res.status === 403) {
        window.location.href = '/login?from=/redirects';
        return;
      }
      if (!res.ok) {
        throw new Error(`Failed to load redirects: HTTP ${res.status}`);
      }
      const data = await res.json();
      setRedirects(Array.isArray(data?.redirects) ? data.redirects : []);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error fetching redirects');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRedirects();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRule.sourcePath.trim() || !newRule.destinationUrl.trim()) {
      setFormError('Source path and destination URL are required.');
      return;
    }

    try {
      setSubmitting(true);
      setFormError(null);
      const res = await fetch('/api/redirects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newRule),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Failed to create redirect');
      }

      setShowAddModal(false);
      setNewRule({ sourcePath: '', destinationUrl: '', statusCode: 301 });
      await loadRedirects();
    } catch (err: unknown) {
      setFormError(err instanceof Error ? err.message : 'Error saving redirect');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string, path: string) => {
    if (!confirm(`Remove redirect rule for "${path}"?`)) return;
    try {
      const res = await fetch(`/api/redirects?id=${encodeURIComponent(id)}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete');
      await loadRedirects();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Error deleting redirect');
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Breadcrumb */}
      <div style={{ fontSize: '13px', color: '#64748B', display: 'flex', alignItems: 'center', gap: '6px' }}>
        <Link href="/" style={{ color: '#64748B', textDecoration: 'none' }}>Home</Link>
        <span>&gt;</span>
        <span style={{ color: '#64748B' }}>Growth &amp; SEO</span>
        <span>&gt;</span>
        <span style={{ color: '#EA580C', fontWeight: 600 }}>Redirects</span>
      </div>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <h1 style={{ fontSize: '26px', fontWeight: 800, margin: 0, color: '#FFFFFF', letterSpacing: '-0.02em' }}>
              URL Redirects &amp; Migration Rules
            </h1>
            <span
              style={{
                fontSize: '11px',
                fontWeight: 800,
                padding: '2px 8px',
                borderRadius: '6px',
                backgroundColor: 'rgba(59, 130, 246, 0.15)',
                color: '#60A5FA',
                border: '1px solid rgba(59, 130, 246, 0.3)',
              }}
            >
              301 / 302 ENGINE
            </span>
          </div>
          <p style={{ margin: '6px 0 0 0', color: '#94A3B8', fontSize: '13px' }}>
            Manage permanent (301) and temporary (302) HTTP redirects to preserve search engine link equity and prevent 404s.
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          style={{
            padding: '9px 20px',
            backgroundColor: '#EA580C',
            color: '#FFFFFF',
            border: 'none',
            borderRadius: '8px',
            fontWeight: 800,
            fontSize: '13px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            boxShadow: '0 2px 10px rgba(234, 88, 12, 0.3)',
          }}
        >
          <span>+</span> Add Redirect Rule
        </button>
      </div>

      {/* Error Banner */}
      {error && (
        <div style={{ padding: '12px 16px', borderRadius: '8px', backgroundColor: 'rgba(239, 68, 68, 0.15)', color: '#F87171', fontSize: '13px' }}>
          {error}
        </div>
      )}

      {/* Redirects Table */}
      <div style={{ backgroundColor: '#0F172A', border: '1px solid #1E293B', borderRadius: '12px', overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', textAlign: 'left' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #1E293B', backgroundColor: '#0B132B', color: '#94A3B8' }}>
                <th style={{ padding: '14px 18px', fontWeight: 700, fontSize: '11px', textTransform: 'uppercase' }}>SOURCE PATH</th>
                <th style={{ padding: '14px 18px', fontWeight: 700, fontSize: '11px', textTransform: 'uppercase' }}>DESTINATION TARGET</th>
                <th style={{ padding: '14px 18px', fontWeight: 700, fontSize: '11px', textTransform: 'uppercase' }}>STATUS CODE</th>
                <th style={{ padding: '14px 18px', fontWeight: 700, fontSize: '11px', textTransform: 'uppercase' }}>TOTAL HITS</th>
                <th style={{ padding: '14px 18px', fontWeight: 700, fontSize: '11px', textTransform: 'uppercase', textAlign: 'right' }}>ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={5} style={{ textAlign: 'center', padding: '40px', color: '#64748B' }}>
                    Loading redirects registry...
                  </td>
                </tr>
              ) : redirects.length === 0 ? (
                <tr>
                  <td colSpan={5} style={{ textAlign: 'center', padding: '40px', color: '#64748B' }}>
                    No redirects configured. Click &ldquo;+ Add Redirect Rule&rdquo; to create one.
                  </td>
                </tr>
              ) : (
                redirects.map((rule) => (
                  <tr key={rule.id} style={{ borderBottom: '1px solid #1E293B' }}>
                    <td style={{ padding: '14px 18px', fontWeight: 700, color: '#FFFFFF', fontFamily: 'monospace' }}>
                      {rule.sourcePath}
                    </td>
                    <td style={{ padding: '14px 18px', color: '#38BDF8', fontFamily: 'monospace' }}>
                      {rule.destinationUrl}
                    </td>
                    <td style={{ padding: '14px 18px' }}>
                      <span
                        style={{
                          padding: '3px 8px',
                          borderRadius: '6px',
                          fontSize: '11px',
                          fontWeight: 800,
                          backgroundColor: rule.statusCode === 301 ? 'rgba(16, 185, 129, 0.15)' : 'rgba(245, 158, 11, 0.15)',
                          color: rule.statusCode === 301 ? '#10B981' : '#F59E0B',
                        }}
                      >
                        {rule.statusCode} {rule.statusCode === 301 ? 'Permanent' : 'Temporary'}
                      </span>
                    </td>
                    <td style={{ padding: '14px 18px', color: '#CBD5E1', fontWeight: 600 }}>
                      {rule.hits.toLocaleString('en-IN')} visits forwarded
                    </td>
                    <td style={{ padding: '14px 18px', textAlign: 'right' }}>
                      <button
                        onClick={() => handleDelete(rule.id, rule.sourcePath)}
                        style={{
                          padding: '5px 10px',
                          backgroundColor: '#1E293B',
                          color: '#F87171',
                          border: '1px solid #334155',
                          borderRadius: '6px',
                          fontSize: '12px',
                          cursor: 'pointer',
                        }}
                      >
                        Remove
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Redirect Modal */}
      {showAddModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(7, 21, 38, 0.85)',
            backdropFilter: 'blur(6px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '16px',
          }}
        >
          <div
            style={{
              width: '100%',
              maxWidth: '520px',
              backgroundColor: '#0F172A',
              border: '1px solid #1E293B',
              borderRadius: '14px',
              padding: '24px',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h2 style={{ fontSize: '18px', fontWeight: 800, margin: 0, color: '#FFFFFF' }}>
                Add URL Redirect Rule
              </h2>
              <button onClick={() => setShowAddModal(false)} style={{ background: 'transparent', border: 'none', color: '#94A3B8', fontSize: '20px', cursor: 'pointer' }}>
                ✕
              </button>
            </div>

            {formError && (
              <div style={{ padding: '10px 14px', borderRadius: '6px', backgroundColor: 'rgba(239, 68, 68, 0.15)', color: '#F87171', fontSize: '12px', marginBottom: '16px' }}>
                {formError}
              </div>
            )}

            <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#CBD5E1', marginBottom: '6px' }}>
                  Source Path (Incoming URL) *
                </label>
                <input
                  type="text"
                  placeholder="/blog/old-article-slug"
                  value={newRule.sourcePath}
                  onChange={(e) => setNewRule({ ...newRule, sourcePath: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    backgroundColor: '#1E293B',
                    border: '1px solid #334155',
                    borderRadius: '6px',
                    color: '#FFFFFF',
                    fontSize: '13px',
                    boxSizing: 'border-box',
                    fontFamily: 'monospace',
                  }}
                  required
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#CBD5E1', marginBottom: '6px' }}>
                  Destination Target *
                </label>
                <input
                  type="text"
                  placeholder="/blog/startup-website-development-complete-guide"
                  value={newRule.destinationUrl}
                  onChange={(e) => setNewRule({ ...newRule, destinationUrl: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    backgroundColor: '#1E293B',
                    border: '1px solid #334155',
                    borderRadius: '6px',
                    color: '#FFFFFF',
                    fontSize: '13px',
                    boxSizing: 'border-box',
                    fontFamily: 'monospace',
                  }}
                  required
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#CBD5E1', marginBottom: '6px' }}>
                  HTTP Redirect Status
                </label>
                <select
                  value={newRule.statusCode}
                  onChange={(e) => setNewRule({ ...newRule, statusCode: Number(e.target.value) as 301 | 302 })}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    backgroundColor: '#1E293B',
                    border: '1px solid #334155',
                    borderRadius: '6px',
                    color: '#FFFFFF',
                    fontSize: '13px',
                    boxSizing: 'border-box',
                  }}
                >
                  <option value={301}>301 Permanent Redirect (Passes SEO link authority)</option>
                  <option value={302}>302 Temporary Redirect (Temporary promotion / maintenance)</option>
                </select>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  style={{ padding: '8px 16px', backgroundColor: '#1E293B', color: '#94A3B8', border: '1px solid #334155', borderRadius: '6px', cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  style={{ padding: '8px 20px', backgroundColor: '#EA580C', color: '#FFFFFF', border: 'none', borderRadius: '6px', fontWeight: 800, cursor: 'pointer' }}
                >
                  {submitting ? 'Saving...' : 'Save Redirect'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
