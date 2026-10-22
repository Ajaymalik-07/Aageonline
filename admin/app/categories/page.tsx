'use client';

import React, { useEffect, useState } from 'react';

interface CategoryItem {
  id: string;
  slug: string;
  name: string;
  description: string;
  activeMarketsCount: number;
  status: string;
}

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [newCategory, setNewCategory] = useState({
    name: '',
    slug: '',
    description: '',
    status: 'PUBLISHED',
  });

  const loadCategories = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch('/api/categories');
      if (res.status === 401 || res.status === 403) {
        window.location.href = '/login?from=/categories';
        return;
      }
      if (!res.ok) {
        throw new Error(`Failed to load categories: HTTP ${res.status}`);
      }
      const data = await res.json();
      const items = Array.isArray(data?.categories) ? data.categories : Array.isArray(data) ? data : [];
      setCategories(items);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error fetching category catalog');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCategories();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCategory.name || !newCategory.slug) {
      setFormError('Please fill in required fields (Name, Slug)');
      return;
    }

    try {
      setFormSubmitting(true);
      setFormError(null);
      const res = await fetch('/api/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newCategory),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || `HTTP ${res.status}`);
      }

      setShowAddModal(false);
      setNewCategory({ name: '', slug: '', description: '', status: 'PUBLISHED' });
      await loadCategories();
    } catch (err: unknown) {
      setFormError(err instanceof Error ? err.message : 'Failed to create category');
    } finally {
      setFormSubmitting(false);
    }
  };

  const filtered = categories.filter((c) => {
    const q = search.toLowerCase();
    return (
      (c.name && c.name.toLowerCase().includes(q)) ||
      (c.slug && c.slug.toLowerCase().includes(q)) ||
      (c.description && c.description.toLowerCase().includes(q))
    );
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 800, margin: 0, color: '#FFFFFF', letterSpacing: '-0.02em' }}>
            Category Taxonomy &amp; Hierarchies
          </h1>
          <p style={{ margin: '6px 0 0 0', color: 'var(--text-muted)', fontSize: '13px' }}>
            Standardized business service classifications paired with locations to form active markets.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '12px' }}>
          <input
            type="text"
            placeholder="Search categories..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="admin-input"
            style={{ width: '260px' }}
          />
          <button
            onClick={() => setShowAddModal(true)}
            style={{
              padding: '10px 18px',
              backgroundColor: 'var(--brand-primary)',
              color: '#FFFFFF',
              border: 'none',
              borderRadius: 'var(--radius-sm)',
              fontWeight: 700,
              fontSize: '13px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <span>+</span> Add Category
          </button>
        </div>
      </div>

      {/* KPI Stats Strip */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
        <div className="admin-card" style={{ padding: '16px 20px' }}>
          <div style={{ fontSize: '11px', color: 'var(--text-dim)', fontWeight: 600, textTransform: 'uppercase' }}>
            Total Categories
          </div>
          <div style={{ fontSize: '24px', fontWeight: 800, color: '#FFFFFF', marginTop: '6px' }}>
            {categories.length}
          </div>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>
            Canonical business verticals
          </div>
        </div>

        <div className="admin-card" style={{ padding: '16px 20px' }}>
          <div style={{ fontSize: '11px', color: 'var(--text-dim)', fontWeight: 600, textTransform: 'uppercase' }}>
            Active Market Pairings
          </div>
          <div style={{ fontSize: '24px', fontWeight: 800, color: '#10B981', marginTop: '6px' }}>
            {categories.reduce((acc, c) => acc + (c.activeMarketsCount || 0), 0)}
          </div>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>
            Location + Category pairs
          </div>
        </div>

        <div className="admin-card" style={{ padding: '16px 20px' }}>
          <div style={{ fontSize: '11px', color: 'var(--text-dim)', fontWeight: 600, textTransform: 'uppercase' }}>
            Publication Rule
          </div>
          <div style={{ fontSize: '24px', fontWeight: 800, color: 'var(--brand-highlight)', marginTop: '6px' }}>
            Pairing Required
          </div>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>
            Strict single-market scoping
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

      {/* Categories Table */}
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
            Canonical Categories ({filtered.length})
          </span>
          <span style={{ fontSize: '11px', color: 'var(--text-dim)' }}>
            Strict Taxonomy Definitions
          </span>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table className="admin-table">
            <thead>
              <tr>
                <th>Category Name</th>
                <th>Canonical Slug</th>
                <th>Description</th>
                <th>Active Markets</th>
                <th>Status</th>
                <th>Public Preview</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: '40px', color: 'var(--text-dim)' }}>
                    Loading canonical categories...
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: '40px', color: 'var(--text-dim)' }}>
                    No categories matching query &ldquo;{search}&rdquo;
                  </td>
                </tr>
              ) : (
                filtered.map((cat) => (
                  <tr key={cat.id}>
                    <td>
                      <div style={{ fontWeight: 600, color: '#FFFFFF' }}>{cat.name}</div>
                      <div style={{ fontSize: '11px', color: 'var(--text-dim)' }}>{cat.id}</div>
                    </td>
                    <td>
                      <code style={{ fontSize: '12px', color: 'var(--brand-highlight)', background: 'rgba(234, 88, 12, 0.1)', padding: '2px 6px', borderRadius: '4px' }}>
                        /{cat.slug}
                      </code>
                    </td>
                    <td style={{ maxWidth: '320px', fontSize: '12px', color: 'var(--text-muted)' }}>
                      {cat.description || 'No description provided.'}
                    </td>
                    <td>
                      <span className="badge badge-info">
                        {cat.activeMarketsCount} Active
                      </span>
                    </td>
                    <td>
                      <span className={`badge ${cat.status === 'PUBLISHED' ? 'badge-success' : 'badge-neutral'}`}>
                        {cat.status}
                      </span>
                    </td>
                    <td>
                      <a
                        href={`http://localhost:3000/markets?category=${cat.slug}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          fontSize: '12px',
                          color: '#60A5FA',
                          textDecoration: 'underline',
                          fontWeight: 500,
                        }}
                      >
                        View Category ↗
                      </a>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Category Modal */}
      {showAddModal && (
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
              maxWidth: '480px',
              padding: '24px',
              position: 'relative',
            }}
          >
            <h2 style={{ fontSize: '18px', fontWeight: 800, margin: '0 0 16px 0', color: '#FFFFFF' }}>
              Add Canonical Category
            </h2>

            {formError && (
              <div
                style={{
                  padding: '10px 14px',
                  borderRadius: 'var(--radius-sm)',
                  backgroundColor: 'rgba(239, 68, 68, 0.15)',
                  border: '1px solid rgba(239, 68, 68, 0.35)',
                  color: '#F87171',
                  fontSize: '12px',
                  marginBottom: '16px',
                }}
              >
                {formError}
              </div>
            )}

            <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '6px' }}>
                  Category Name *
                </label>
                <input
                  type="text"
                  placeholder="e.g. Architects"
                  value={newCategory.name}
                  onChange={(e) => {
                    const val = e.target.value;
                    setNewCategory({
                      ...newCategory,
                      name: val,
                      slug: val.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
                    });
                  }}
                  className="admin-input"
                  required
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '6px' }}>
                  Canonical URL Slug *
                </label>
                <input
                  type="text"
                  placeholder="e.g. architects"
                  value={newCategory.slug}
                  onChange={(e) => setNewCategory({ ...newCategory, slug: e.target.value })}
                  className="admin-input"
                  required
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '6px' }}>
                  Description / Service Scope
                </label>
                <textarea
                  placeholder="Describe the services eligible under this category..."
                  value={newCategory.description}
                  onChange={(e) => setNewCategory({ ...newCategory, description: e.target.value })}
                  className="admin-input"
                  rows={3}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '8px' }}>
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
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
                  disabled={formSubmitting}
                  style={{
                    padding: '8px 18px',
                    background: 'var(--brand-primary)',
                    border: 'none',
                    color: '#FFFFFF',
                    borderRadius: 'var(--radius-sm)',
                    fontWeight: 700,
                    fontSize: '13px',
                    cursor: formSubmitting ? 'not-allowed' : 'pointer',
                    opacity: formSubmitting ? 0.7 : 1,
                  }}
                >
                  {formSubmitting ? 'Saving...' : 'Create Category'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
