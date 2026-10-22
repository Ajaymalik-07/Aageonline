'use client';

import React, { useEffect, useState } from 'react';

interface ContentItem {
  id: string;
  key: string;
  title: string;
  section: string;
  headline?: string;
  tagline?: string;
  ctaText?: string;
  paidVisibility?: string;
  nonRefundable?: string;
  status: string;
  updatedAt: string;
  updatedBy: string;
  items?: Array<{ q: string; a: string }>;
}

export default function AdminContentPage() {
  const [contentList, setContentList] = useState<ContentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingItem, setEditingItem] = useState<ContentItem | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState<string | null>(null);

  const loadContent = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch('/api/content');
      if (res.status === 401 || res.status === 403) {
        window.location.href = '/login?from=/content';
        return;
      }
      if (!res.ok) {
        throw new Error(`Failed to load content: HTTP ${res.status}`);
      }
      const data = await res.json();
      const items = Array.isArray(data?.items)
        ? data.items
        : Array.isArray(data?.content)
        ? data.content
        : Array.isArray(data)
        ? data
        : [];
      setContentList(items);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error fetching CMS content');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadContent();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem) return;

    try {
      setSaving(true);
      setSaveSuccess(null);
      const res = await fetch('/api/content', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingItem),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || `HTTP ${res.status}`);
      }

      setSaveSuccess(`Section "${editingItem.title}" updated successfully.`);
      setEditingItem(null);
      await loadContent();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to update content');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 800, margin: 0, color: '#FFFFFF', letterSpacing: '-0.02em' }}>
            Website Content &amp; Copy Management
          </h1>
          <p style={{ margin: '6px 0 0 0', color: 'var(--text-muted)', fontSize: '13px' }}>
            Authoritative public headlines, statutory disclosures, and FAQ copy.
          </p>
        </div>

        <a
          href="http://localhost:3000"
          target="_blank"
          rel="noopener noreferrer"
          style={{
            padding: '10px 18px',
            backgroundColor: 'rgba(255, 255, 255, 0.08)',
            color: '#FFFFFF',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-sm)',
            fontWeight: 600,
            fontSize: '13px',
            textDecoration: 'none',
          }}
        >
          View Public Site ↗
        </a>
      </div>

      {/* Success Banner */}
      {saveSuccess && (
        <div
          style={{
            padding: '14px 18px',
            borderRadius: 'var(--radius-sm)',
            backgroundColor: 'rgba(16, 185, 129, 0.15)',
            border: '1px solid rgba(16, 185, 129, 0.35)',
            color: '#34D399',
            fontSize: '13px',
          }}
        >
          {saveSuccess}
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

      {/* Content Cards Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px' }}>
        {loading ? (
          <div className="admin-card" style={{ padding: '30px', textAlign: 'center', color: 'var(--text-dim)', gridColumn: '1 / -1' }}>
            Loading editable content modules...
          </div>
        ) : contentList.length === 0 ? (
          <div className="admin-card" style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)', gridColumn: '1 / -1' }}>
            <div style={{ fontSize: '16px', fontWeight: 600, color: '#FFFFFF', marginBottom: '8px' }}>No Content Blocks Found</div>
            <p style={{ fontSize: '13px', margin: 0, color: 'var(--text-dim)' }}>
              No website content modules are currently registered.
            </p>
          </div>
        ) : (
          contentList.map((item) => (
            <div key={item.id} className="admin-card" style={{ display: 'flex', flexDirection: 'column' }}>
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
                  <div style={{ fontSize: '14px', fontWeight: 700, color: '#FFFFFF' }}>{item.title}</div>
                  <div style={{ fontSize: '11px', color: 'var(--text-dim)', marginTop: '2px' }}>{item.section}</div>
                </div>
                <span className={`badge ${item.status === 'PUBLISHED' ? 'badge-success' : 'badge-neutral'}`}>
                  {item.status}
                </span>
              </div>

              <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px', flex: 1 }}>
                {item.headline && (
                  <div>
                    <div style={{ fontSize: '11px', color: 'var(--text-dim)', textTransform: 'uppercase', fontWeight: 600 }}>Headline</div>
                    <div style={{ fontSize: '13px', color: '#FFFFFF', fontWeight: 600, marginTop: '4px' }}>{item.headline}</div>
                  </div>
                )}

                {item.tagline && (
                  <div>
                    <div style={{ fontSize: '11px', color: 'var(--text-dim)', textTransform: 'uppercase', fontWeight: 600 }}>Tagline / Lead</div>
                    <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px', lineHeight: 1.5 }}>{item.tagline}</div>
                  </div>
                )}

                {item.ctaText && (
                  <div>
                    <div style={{ fontSize: '11px', color: 'var(--text-dim)', textTransform: 'uppercase', fontWeight: 600 }}>CTA Button Text</div>
                    <code style={{ fontSize: '12px', color: 'var(--brand-highlight)', marginTop: '4px', display: 'inline-block' }}>{item.ctaText}</code>
                  </div>
                )}

                {item.paidVisibility && (
                  <div>
                    <div style={{ fontSize: '11px', color: 'var(--text-dim)', textTransform: 'uppercase', fontWeight: 600 }}>Paid Visibility Disclosure</div>
                    <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px', lineHeight: 1.5 }}>{item.paidVisibility}</div>
                  </div>
                )}

                {item.items && (
                  <div>
                    <div style={{ fontSize: '11px', color: 'var(--text-dim)', textTransform: 'uppercase', fontWeight: 600 }}>Configured FAQ Items</div>
                    <div style={{ fontSize: '12px', color: 'var(--brand-highlight)', marginTop: '4px' }}>{item.items.length} questions published</div>
                  </div>
                )}

                <div style={{ marginTop: 'auto', paddingTop: '12px', borderTop: '1px solid var(--border-subtle)', fontSize: '11px', color: 'var(--text-dim)' }}>
                  Last edited: {new Date(item.updatedAt).toLocaleString('en-IN')} by {item.updatedBy}
                </div>
              </div>

              <div style={{ padding: '12px 20px', background: 'rgba(255, 255, 255, 0.02)', borderTop: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'flex-end' }}>
                <button
                  onClick={() => setEditingItem({ ...item })}
                  style={{
                    padding: '8px 14px',
                    background: 'var(--brand-primary)',
                    color: '#FFFFFF',
                    border: 'none',
                    borderRadius: 'var(--radius-sm)',
                    fontWeight: 700,
                    fontSize: '12px',
                    cursor: 'pointer',
                  }}
                >
                  Edit Copy
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Edit Content Modal */}
      {editingItem && (
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
            <h2 style={{ fontSize: '18px', fontWeight: 800, margin: '0 0 16px 0', color: '#FFFFFF' }}>
              Edit Section Copy: {editingItem.title}
            </h2>

            <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {editingItem.headline !== undefined && (
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '6px' }}>
                    Headline
                  </label>
                  <input
                    type="text"
                    value={editingItem.headline}
                    onChange={(e) => setEditingItem({ ...editingItem, headline: e.target.value })}
                    className="admin-input"
                  />
                </div>
              )}

              {editingItem.tagline !== undefined && (
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '6px' }}>
                    Tagline / Subheading
                  </label>
                  <textarea
                    value={editingItem.tagline}
                    onChange={(e) => setEditingItem({ ...editingItem, tagline: e.target.value })}
                    className="admin-input"
                    rows={3}
                  />
                </div>
              )}

              {editingItem.ctaText !== undefined && (
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '6px' }}>
                    CTA Button Text
                  </label>
                  <input
                    type="text"
                    value={editingItem.ctaText}
                    onChange={(e) => setEditingItem({ ...editingItem, ctaText: e.target.value })}
                    className="admin-input"
                  />
                </div>
              )}

              {editingItem.paidVisibility !== undefined && (
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '6px' }}>
                    Paid Visibility Disclosure
                  </label>
                  <textarea
                    value={editingItem.paidVisibility}
                    onChange={(e) => setEditingItem({ ...editingItem, paidVisibility: e.target.value })}
                    className="admin-input"
                    rows={3}
                  />
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '8px' }}>
                <button
                  type="button"
                  onClick={() => setEditingItem(null)}
                  style={{
                    padding: '8px 16px',
                    background: 'transparent',
                    border: '1px solid var(--border-subtle)',
                    color: 'var(--text-muted)',
                    borderRadius: 'var(--radius-sm)',
                    fontSize: '13px',
                    cursor: 'pointer',
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  style={{
                    padding: '8px 18px',
                    background: 'var(--brand-primary)',
                    border: 'none',
                    color: '#FFFFFF',
                    borderRadius: 'var(--radius-sm)',
                    fontWeight: 700,
                    fontSize: '13px',
                    cursor: saving ? 'not-allowed' : 'pointer',
                    opacity: saving ? 0.7 : 1,
                  }}
                >
                  {saving ? 'Publishing...' : 'Save & Publish Copy'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
