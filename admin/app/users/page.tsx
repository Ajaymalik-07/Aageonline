'use client';

import React, { useEffect, useState } from 'react';

interface AdminUser {
  id: string;
  email: string;
  name: string;
  role: string;
  status: string;
  createdAt: string;
  lastLogin?: string;
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [newUser, setNewUser] = useState({
    name: '',
    email: '',
    role: 'MARKETPLACE_MANAGER',
    password: '',
  });

  const loadUsers = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch('/api/users');
      if (res.status === 401 || res.status === 403) {
        window.location.href = '/login?from=/users';
        return;
      }
      if (!res.ok) {
        throw new Error(`Failed to load administrators: HTTP ${res.status}`);
      }
      const data = await res.json();
      setUsers(Array.isArray(data?.users) ? data.users : []);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error fetching administrator accounts');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUser.name || !newUser.email || !newUser.password) {
      setFormError('All fields (Name, Email, Password) are required.');
      return;
    }

    try {
      setSubmitting(true);
      setFormError(null);
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newUser),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || `HTTP ${res.status}`);
      }

      setShowAddModal(false);
      setNewUser({ name: '', email: '', role: 'MARKETPLACE_MANAGER', password: '' });
      await loadUsers();
    } catch (err: unknown) {
      setFormError(err instanceof Error ? err.message : 'Failed to create administrator');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 800, margin: 0, color: '#FFFFFF', letterSpacing: '-0.02em' }}>
            Administrator Directory &amp; Role Matrix
          </h1>
          <p style={{ margin: '6px 0 0 0', color: 'var(--text-muted)', fontSize: '13px' }}>
            Privileged operator accounts, cryptographic session control, and role-based access policy.
          </p>
        </div>

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
          <span>+</span> Invite Operator
        </button>
      </div>

      {/* Public Accounts Invariant Notice */}
      <div
        style={{
          padding: '14px 18px',
          borderRadius: 'var(--radius-sm)',
          backgroundColor: 'rgba(59, 130, 246, 0.1)',
          border: '1px solid rgba(59, 130, 246, 0.3)',
          display: 'flex',
          gap: '12px',
          alignItems: 'center',
          fontSize: '12px',
          color: '#93C5FD',
        }}
      >
        <span style={{ fontSize: '18px' }}>👤</span>
        <div>
          <strong>Customer Account Boundary:</strong> Public customer accounts are intentionally excluded from V1. Businesses participate via claim token verification and direct payment gateway intent. This module governs internal staff &amp; administrator access only.
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

      {/* Admin Users Table */}
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
            Active Administrators ({users.length})
          </span>
          <span style={{ fontSize: '11px', color: 'var(--text-dim)' }}>
            Authority: Server-Side PBKDF2/Argon2 Hashed Accounts
          </span>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table className="admin-table">
            <thead>
              <tr>
                <th>Operator Name</th>
                <th>Email Identity</th>
                <th>Assigned Role</th>
                <th>Account Status</th>
                <th>Created At</th>
                <th>Last Login</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: '40px', color: 'var(--text-dim)' }}>
                    Loading administrator directory...
                  </td>
                </tr>
              ) : (
                users.map((u) => (
                  <tr key={u.id}>
                    <td>
                      <div style={{ fontWeight: 600, color: '#FFFFFF' }}>{u.name}</div>
                      <div style={{ fontSize: '11px', color: 'var(--text-dim)' }}>{u.id}</div>
                    </td>
                    <td>
                      <code style={{ fontSize: '12px', color: '#60A5FA' }}>{u.email}</code>
                    </td>
                    <td>
                      <span className={`badge ${u.role === 'SUPER_ADMIN' ? 'badge-danger' : 'badge-neutral'}`}>
                        {u.role}
                      </span>
                    </td>
                    <td>
                      <span className="badge badge-success">{u.status}</span>
                    </td>
                    <td>
                      <div style={{ fontSize: '12px', color: '#CBD5E1' }}>
                        {new Date(u.createdAt).toLocaleDateString('en-IN')}
                      </div>
                    </td>
                    <td>
                      <div style={{ fontSize: '12px', color: '#CBD5E1' }}>
                        {u.lastLogin ? new Date(u.lastLogin).toLocaleString('en-IN') : 'Never'}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Role Definitions Card */}
      <div className="admin-card" style={{ padding: '24px' }}>
        <h2 style={{ fontSize: '16px', fontWeight: 800, color: '#FFFFFF', margin: '0 0 16px 0' }}>
          Platform Permission Hierarchy
        </h2>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px' }}>
          <div style={{ padding: '16px', borderRadius: 'var(--radius-sm)', background: 'rgba(255, 255, 255, 0.02)', border: '1px solid var(--border-subtle)' }}>
            <div style={{ fontWeight: 700, color: '#EF4444', fontSize: '13px' }}>SUPER_ADMIN</div>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '6px', lineHeight: 1.4 }}>
              Unrestricted control over system configuration, user provisioning, database audits, and operational recovery.
            </div>
          </div>

          <div style={{ padding: '16px', borderRadius: 'var(--radius-sm)', background: 'rgba(255, 255, 255, 0.02)', border: '1px solid var(--border-subtle)' }}>
            <div style={{ fontWeight: 700, color: '#3B82F6', fontSize: '13px' }}>MARKETPLACE_MANAGER</div>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '6px', lineHeight: 1.4 }}>
              Manages location taxonomies, category vertical definitions, doorway verification, and discovery queue approvals.
            </div>
          </div>

          <div style={{ padding: '16px', borderRadius: 'var(--radius-sm)', background: 'rgba(255, 255, 255, 0.02)', border: '1px solid var(--border-subtle)' }}>
            <div style={{ fontWeight: 700, color: '#10B981', fontSize: '13px' }}>FINANCE_RECONCILIATION</div>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '6px', lineHeight: 1.4 }}>
              Inspects payment intents, executes reconciliation runs, verifies PayU webhooks, and reviews audit journals.
            </div>
          </div>

          <div style={{ padding: '16px', borderRadius: 'var(--radius-sm)', background: 'rgba(255, 255, 255, 0.02)', border: '1px solid var(--border-subtle)' }}>
            <div style={{ fontWeight: 700, color: '#F59E0B', fontSize: '13px' }}>SEO_CONTENT_MANAGER</div>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '6px', lineHeight: 1.4 }}>
              Edits public copy, updates editorial blog posts, oversees sitemap generation, and reviews structured schema.
            </div>
          </div>
        </div>
      </div>

      {/* Add Administrator Modal */}
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
              Invite Platform Administrator
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
                  Operator Name *
                </label>
                <input
                  type="text"
                  placeholder="e.g. Priya Sharma"
                  value={newUser.name}
                  onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                  className="admin-input"
                  required
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '6px' }}>
                  Email Address *
                </label>
                <input
                  type="email"
                  placeholder="operator@aageonline.com"
                  value={newUser.email}
                  onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                  className="admin-input"
                  required
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '6px' }}>
                  Temporary Password *
                </label>
                <input
                  type="password"
                  placeholder="••••••••••••"
                  value={newUser.password}
                  onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                  className="admin-input"
                  required
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '6px' }}>
                  Assigned Permission Role
                </label>
                <select
                  value={newUser.role}
                  onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}
                  className="admin-input"
                >
                  <option value="MARKETPLACE_MANAGER">Marketplace Manager</option>
                  <option value="FINANCE_RECONCILIATION">Finance &amp; Reconciliation</option>
                  <option value="SEO_CONTENT_MANAGER">SEO &amp; Content Manager</option>
                  <option value="AUDITOR_READONLY">Auditor (Read-Only)</option>
                  <option value="SUPER_ADMIN">Super Admin</option>
                </select>
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
                  disabled={submitting}
                  style={{
                    padding: '8px 18px',
                    background: 'var(--brand-primary)',
                    border: 'none',
                    color: '#FFFFFF',
                    borderRadius: 'var(--radius-sm)',
                    fontWeight: 700,
                    fontSize: '13px',
                    cursor: submitting ? 'not-allowed' : 'pointer',
                    opacity: submitting ? 0.7 : 1,
                  }}
                >
                  {submitting ? 'Creating...' : 'Create Account'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
