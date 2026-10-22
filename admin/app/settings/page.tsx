'use client';

import React, { useEffect, useState } from 'react';

interface UserProfile {
  id: string;
  email: string;
  name: string;
  role: string;
}

export default function AdminSettingsPage() {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadUser() {
      try {
        setLoading(true);
        const res = await fetch('/api/auth');
        if (res.status === 401) {
          window.location.href = '/login?from=/settings';
          return;
        }
        if (res.ok) {
          const data = await res.json();
          setUser(data.user);
        }
      } catch {
        // Silently handled
      } finally {
        setLoading(false);
      }
    }

    loadUser();
  }, []);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Header */}
      <div>
        <h1 style={{ fontSize: '24px', fontWeight: 800, margin: 0, color: '#FFFFFF', letterSpacing: '-0.02em' }}>
          Platform Settings &amp; Security Governance
        </h1>
        <p style={{ margin: '6px 0 0 0', color: 'var(--text-muted)', fontSize: '13px' }}>
          Administrative session management, cryptographic controls, and platform identity configuration.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '20px' }}>
        {/* Profile Card */}
        <div className="admin-card" style={{ padding: '24px' }}>
          <h2 style={{ fontSize: '16px', fontWeight: 700, margin: '0 0 16px 0', color: '#FFFFFF' }}>
            Current Administrator Profile
          </h2>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div>
              <div style={{ fontSize: '11px', color: 'var(--text-dim)', textTransform: 'uppercase', fontWeight: 700 }}>
                Display Name
              </div>
              <div style={{ fontSize: '14px', fontWeight: 600, color: '#FFFFFF', marginTop: '2px' }}>
                {loading ? 'Loading...' : user?.name || 'Platform Administrator'}
              </div>
            </div>

            <div>
              <div style={{ fontSize: '11px', color: 'var(--text-dim)', textTransform: 'uppercase', fontWeight: 700 }}>
                Administrative Email
              </div>
              <div style={{ fontSize: '14px', fontWeight: 600, color: '#FFFFFF', marginTop: '2px' }}>
                {loading ? 'Loading...' : user?.email || 'admin@aageonline.com'}
              </div>
            </div>

            <div>
              <div style={{ fontSize: '11px', color: 'var(--text-dim)', textTransform: 'uppercase', fontWeight: 700 }}>
                Role &amp; Permissions
              </div>
              <div style={{ marginTop: '4px' }}>
                <span className="badge badge-warning" style={{ fontWeight: 800 }}>
                  {user?.role || 'SUPER_ADMIN'}
                </span>
              </div>
            </div>

            <div>
              <div style={{ fontSize: '11px', color: 'var(--text-dim)', textTransform: 'uppercase', fontWeight: 700 }}>
                Session Cookie Policy
              </div>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>
                HttpOnly, SameSite=Strict, Web Crypto HMAC-SHA256 signature
              </div>
            </div>
          </div>
        </div>

        {/* Security Controls */}
        <div className="admin-card" style={{ padding: '24px' }}>
          <h2 style={{ fontSize: '16px', fontWeight: 700, margin: '0 0 16px 0', color: '#FFFFFF' }}>
            Cryptographic Security Controls
          </h2>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div
              style={{
                padding: '12px',
                borderRadius: 'var(--radius-sm)',
                backgroundColor: 'rgba(255, 255, 255, 0.03)',
                border: '1px solid var(--border-subtle)',
              }}
            >
              <div style={{ fontSize: '12px', fontWeight: 700, color: '#10B981' }}>
                NIST scrypt Password Hashing
              </div>
              <div style={{ fontSize: '11px', color: 'var(--text-dim)', marginTop: '3px' }}>
                Standard 16-byte random salt, 64-byte derived key, CPU/memory cost hardened against GPU cracking.
              </div>
            </div>

            <div
              style={{
                padding: '12px',
                borderRadius: 'var(--radius-sm)',
                backgroundColor: 'rgba(255, 255, 255, 0.03)',
                border: '1px solid var(--border-subtle)',
              }}
            >
              <div style={{ fontSize: '12px', fontWeight: 700, color: '#60A5FA' }}>
                Constant-Time Verification
              </div>
              <div style={{ fontSize: '11px', color: 'var(--text-dim)', marginTop: '3px' }}>
                Protected against timing side-channel attacks via <code>crypto.timingSafeEqual</code>.
              </div>
            </div>

            <div
              style={{
                padding: '12px',
                borderRadius: 'var(--radius-sm)',
                backgroundColor: 'rgba(255, 255, 255, 0.03)',
                border: '1px solid var(--border-subtle)',
              }}
            >
              <div style={{ fontSize: '12px', fontWeight: 700, color: '#FB923C' }}>
                Brute-Force Login Throttling
              </div>
              <div style={{ fontSize: '11px', color: 'var(--text-dim)', marginTop: '3px' }}>
                Rate limiter restricts to maximum 5 failed attempts per 15-minute window per IP/email.
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Account Management & Bootstrap Instructions */}
      <div className="admin-card" style={{ padding: '24px' }}>
        <h2 style={{ fontSize: '16px', fontWeight: 700, margin: '0 0 12px 0', color: '#FFFFFF' }}>
          Administrative Account Bootstrap CLI
        </h2>
        <p style={{ fontSize: '13px', color: 'var(--text-muted)', margin: '0 0 16px 0', lineHeight: 1.5 }}>
          In accordance with security guidelines, there is no public registration endpoint. Additional administrator accounts
          or credential rotation must be performed via the server-side CLI bootstrap utility:
        </p>

        <pre
          style={{
            backgroundColor: '#071526',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-sm)',
            padding: '14px 18px',
            fontSize: '12px',
            color: '#38BDF8',
            fontFamily: 'monospace',
            overflowX: 'auto',
            margin: 0,
          }}
        >
          {`# Create or rotate administrator credentials directly on the API server:
cd api/
npm run admin:bootstrap -- admin@aageonline.com "YourStrongPassword123!" "Admin Name" SUPER_ADMIN`}
        </pre>
      </div>
    </div>
  );
}
