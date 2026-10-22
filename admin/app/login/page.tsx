'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';

function LoginForm() {
  const searchParams = useSearchParams();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [infoMessage, setInfoMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const reason = searchParams.get('reason');
    if (reason === 'session_expired') {
      setInfoMessage('Your session has expired. Please sign in again.');
    } else if (reason === 'unauthorized') {
      setInfoMessage('Administrative authentication required to access that resource.');
    }
  }, [searchParams]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      setError('Please provide your administrative email address.');
      return;
    }
    if (!password) {
      setError('Please provide your administrative password.');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      setInfoMessage(null);

      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.trim(),
          password,
          rememberMe,
        }),
      });

      const data = await res.json();

      if (res.ok && data.authenticated) {
        const from = searchParams.get('from');
        // Validate same-origin relative redirect
        const target = from && from.startsWith('/') && !from.startsWith('//') ? from : '/';
        window.location.href = target;
      } else {
        if (res.status === 429) {
          setError('Too many failed attempts. Login throttled for 15 minutes.');
        } else {
          setError(data.message || 'Invalid administrative credentials.');
        }
      }
    } catch (err: unknown) {
      setError(
        err instanceof Error
          ? err.message
          : 'Network error connecting to the administration gateway.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#071526',
        padding: '24px',
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '440px',
          backgroundColor: '#0B1F33',
          border: '1px solid rgba(255, 255, 255, 0.09)',
          borderRadius: '16px',
          padding: '36px 32px',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.7)',
        }}
      >
        {/* Header / Brand */}
        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
            <span style={{ fontSize: '24px', fontWeight: 900, color: '#FFFFFF', letterSpacing: '-0.02em' }}>
              Aage<span style={{ color: '#FB923C' }}>Online</span>
            </span>
            <span
              style={{
                fontSize: '11px',
                fontWeight: 800,
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
                padding: '3px 8px',
                borderRadius: '9999px',
                backgroundColor: 'rgba(234, 88, 12, 0.16)',
                color: '#FB923C',
                border: '1px solid rgba(234, 88, 12, 0.3)',
              }}
            >
              Control Center
            </span>
          </div>
          <h1 style={{ fontSize: '18px', fontWeight: 700, margin: '4px 0 0 0', color: '#F1F5F9' }}>
            Administrative Sign In
          </h1>
          <p style={{ margin: '8px 0 0 0', color: '#94A3B8', fontSize: '13px', lineHeight: 1.5 }}>
            Access governance, ranking settlements, and market reconciliation.
          </p>
        </div>

        {/* Informational Message */}
        {infoMessage && (
          <div
            role="status"
            style={{
              padding: '12px 16px',
              borderRadius: '8px',
              backgroundColor: 'rgba(59, 130, 246, 0.12)',
              border: '1px solid rgba(59, 130, 246, 0.3)',
              color: '#93C5FD',
              fontSize: '13px',
              marginBottom: '20px',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
            }}
          >
            <span>ℹ️</span>
            <span>{infoMessage}</span>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div
            role="alert"
            style={{
              padding: '12px 16px',
              borderRadius: '8px',
              backgroundColor: 'rgba(239, 68, 68, 0.14)',
              border: '1px solid rgba(239, 68, 68, 0.35)',
              color: '#FCA5A5',
              fontSize: '13px',
              marginBottom: '20px',
              fontWeight: 500,
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
            }}
          >
            <span>⚠️</span>
            <span>{error}</span>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div>
            <label
              htmlFor="admin-email"
              style={{
                display: 'block',
                fontSize: '12px',
                fontWeight: 700,
                color: '#CBD5E1',
                marginBottom: '8px',
                textTransform: 'uppercase',
                letterSpacing: '0.04em',
              }}
            >
              Administrator Email
            </label>
            <input
              id="admin-email"
              type="email"
              required
              autoFocus
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@aageonline.com"
              autoComplete="email"
              className="admin-input"
              style={{
                width: '100%',
                padding: '12px 14px',
                backgroundColor: '#071526',
                border: '1px solid rgba(255, 255, 255, 0.12)',
                borderRadius: '8px',
                color: '#FFFFFF',
                fontSize: '14px',
                boxSizing: 'border-box',
              }}
            />
          </div>

          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <label
                htmlFor="admin-password"
                style={{
                  fontSize: '12px',
                  fontWeight: 700,
                  color: '#CBD5E1',
                  textTransform: 'uppercase',
                  letterSpacing: '0.04em',
                }}
              >
                Password
              </label>
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#FB923C',
                  fontSize: '12px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  padding: 0,
                }}
              >
                {showPassword ? 'Hide' : 'Show'}
              </button>
            </div>
            <div style={{ position: 'relative' }}>
              <input
                id="admin-password"
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password..."
                autoComplete="current-password"
                className="admin-input"
                style={{
                  width: '100%',
                  padding: '12px 14px',
                  backgroundColor: '#071526',
                  border: '1px solid rgba(255, 255, 255, 0.12)',
                  borderRadius: '8px',
                  color: '#FFFFFF',
                  fontSize: '14px',
                  boxSizing: 'border-box',
                }}
              />
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '13px', color: '#94A3B8' }}>
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                style={{ accentColor: '#EA580C', cursor: 'pointer' }}
              />
              Keep session active (7 days)
            </label>
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              padding: '13px 20px',
              borderRadius: '8px',
              border: 'none',
              backgroundColor: '#EA580C',
              color: '#FFFFFF',
              fontSize: '14px',
              fontWeight: 800,
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.7 : 1,
              marginTop: '4px',
              transition: 'background-color 0.15s ease',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              boxShadow: '0 4px 12px rgba(234, 88, 12, 0.3)',
            }}
          >
            {loading ? (
              <>
                <span style={{ display: 'inline-block', animation: 'spin 1s linear infinite' }}>⏳</span>
                Authenticating...
              </>
            ) : (
              'Sign In to Dashboard →'
            )}
          </button>
        </form>

        {/* Security & Bootstrap notice */}
        <div
          style={{
            marginTop: '28px',
            paddingTop: '20px',
            borderTop: '1px solid rgba(255, 255, 255, 0.08)',
            fontSize: '11px',
            color: '#64748B',
            lineHeight: 1.6,
            textAlign: 'center',
          }}
        >
          <div>Protected by cryptographic scrypt hashing &amp; signed HttpOnly sessions.</div>
          <div style={{ marginTop: '4px' }}>
            Default bootstrap credentials: <code style={{ color: '#94A3B8' }}>admin@aageonline.com</code>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AdminLoginPage() {
  return (
    <Suspense fallback={<div style={{ minHeight: '100vh', backgroundColor: '#071526' }} />}>
      <LoginForm />
    </Suspense>
  );
}
