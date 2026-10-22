'use client';

import React, { useEffect, useState } from 'react';

interface LocationItem {
  id: string;
  slug: string;
  name: string;
  state: string;
  country: string;
  activeMarketsCount: number;
  status: string;
}

export default function AdminLocationsPage() {
  const [locations, setLocations] = useState<LocationItem[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [newLocation, setNewLocation] = useState({
    name: '',
    slug: '',
    state: '',
    country: 'India',
    status: 'PUBLISHED',
  });

  const loadLocations = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch('/api/locations');
      if (res.status === 401 || res.status === 403) {
        window.location.href = '/login?from=/locations';
        return;
      }
      if (!res.ok) {
        throw new Error(`Failed to load locations: HTTP ${res.status}`);
      }
      const data = await res.json();
      const items = Array.isArray(data?.locations) ? data.locations : Array.isArray(data) ? data : [];
      setLocations(items);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error fetching location catalog');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLocations();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLocation.name || !newLocation.slug || !newLocation.state) {
      setFormError('Please fill in all required fields (Name, Slug, State)');
      return;
    }

    try {
      setFormSubmitting(true);
      setFormError(null);
      const res = await fetch('/api/locations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newLocation),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || `HTTP ${res.status}`);
      }

      setShowAddModal(false);
      setNewLocation({ name: '', slug: '', state: '', country: 'India', status: 'PUBLISHED' });
      await loadLocations();
    } catch (err: unknown) {
      setFormError(err instanceof Error ? err.message : 'Failed to create location');
    } finally {
      setFormSubmitting(false);
    }
  };

  const filtered = locations.filter((loc) => {
    const q = search.toLowerCase();
    return (
      (loc.name && loc.name.toLowerCase().includes(q)) ||
      (loc.slug && loc.slug.toLowerCase().includes(q)) ||
      (loc.state && loc.state.toLowerCase().includes(q))
    );
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 800, margin: 0, color: '#FFFFFF', letterSpacing: '-0.02em' }}>
            Location Taxonomy &amp; Doorways
          </h1>
          <p style={{ margin: '6px 0 0 0', color: 'var(--text-muted)', fontSize: '13px' }}>
            Manage verified geographic regions, canonical slugs, and doorway eligibility.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '12px' }}>
          <input
            type="text"
            placeholder="Search by city, slug, state..."
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
            <span>+</span> Add Location
          </button>
        </div>
      </div>

      {/* KPI Stats Strip */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
        <div className="admin-card" style={{ padding: '16px 20px' }}>
          <div style={{ fontSize: '11px', color: 'var(--text-dim)', fontWeight: 600, textTransform: 'uppercase' }}>
            Total Locations
          </div>
          <div style={{ fontSize: '24px', fontWeight: 800, color: '#FFFFFF', marginTop: '6px' }}>
            {locations.length}
          </div>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>
            Canonical geo-entities
          </div>
        </div>

        <div className="admin-card" style={{ padding: '16px 20px' }}>
          <div style={{ fontSize: '11px', color: 'var(--text-dim)', fontWeight: 600, textTransform: 'uppercase' }}>
            Active Markets
          </div>
          <div style={{ fontSize: '24px', fontWeight: 800, color: '#10B981', marginTop: '6px' }}>
            {locations.reduce((acc, l) => acc + (l.activeMarketsCount || 0), 0)}
          </div>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>
            Configured pairings
          </div>
        </div>

        <div className="admin-card" style={{ padding: '16px 20px' }}>
          <div style={{ fontSize: '11px', color: 'var(--text-dim)', fontWeight: 600, textTransform: 'uppercase' }}>
            Taxonomy Authority
          </div>
          <div style={{ fontSize: '24px', fontWeight: 800, color: 'var(--brand-highlight)', marginTop: '6px' }}>
            PostgreSQL / API
          </div>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>
            Zero direct DB bypass
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

      {/* Locations Table */}
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
            Configured Locations ({filtered.length})
          </span>
          <span style={{ fontSize: '11px', color: 'var(--text-dim)' }}>
            Authoritative Canonical Hierarchy
          </span>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table className="admin-table">
            <thead>
              <tr>
                <th>Location Name</th>
                <th>Canonical Slug</th>
                <th>State / Province</th>
                <th>Country</th>
                <th>Active Markets</th>
                <th>Status</th>
                <th>Public Preview</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: '40px', color: 'var(--text-dim)' }}>
                    Loading canonical locations...
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: '40px', color: 'var(--text-dim)' }}>
                    No locations matching query &ldquo;{search}&rdquo;
                  </td>
                </tr>
              ) : (
                filtered.map((loc) => (
                  <tr key={loc.id}>
                    <td>
                      <div style={{ fontWeight: 600, color: '#FFFFFF' }}>{loc.name}</div>
                      <div style={{ fontSize: '11px', color: 'var(--text-dim)' }}>{loc.id}</div>
                    </td>
                    <td>
                      <code style={{ fontSize: '12px', color: 'var(--brand-highlight)', background: 'rgba(234, 88, 12, 0.1)', padding: '2px 6px', borderRadius: '4px' }}>
                        /{loc.slug}
                      </code>
                    </td>
                    <td>{loc.state}</td>
                    <td>{loc.country}</td>
                    <td>
                      <span className="badge badge-info">
                        {loc.activeMarketsCount} Active
                      </span>
                    </td>
                    <td>
                      <span className={`badge ${loc.status === 'PUBLISHED' ? 'badge-success' : 'badge-neutral'}`}>
                        {loc.status}
                      </span>
                    </td>
                    <td>
                      <a
                        href={`http://localhost:3000/markets?city=${loc.slug}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          fontSize: '12px',
                          color: '#60A5FA',
                          textDecoration: 'underline',
                          fontWeight: 500,
                        }}
                      >
                        View Markets ↗
                      </a>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Location Modal */}
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
              Add Canonical Location
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
                  Location / City Name *
                </label>
                <input
                  type="text"
                  placeholder="e.g. Ahmedabad"
                  value={newLocation.name}
                  onChange={(e) => {
                    const val = e.target.value;
                    setNewLocation({
                      ...newLocation,
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
                  placeholder="e.g. ahmedabad"
                  value={newLocation.slug}
                  onChange={(e) => setNewLocation({ ...newLocation, slug: e.target.value })}
                  className="admin-input"
                  required
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '6px' }}>
                  State / Province *
                </label>
                <input
                  type="text"
                  placeholder="e.g. Gujarat"
                  value={newLocation.state}
                  onChange={(e) => setNewLocation({ ...newLocation, state: e.target.value })}
                  className="admin-input"
                  required
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
                  {formSubmitting ? 'Saving...' : 'Create Location'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
