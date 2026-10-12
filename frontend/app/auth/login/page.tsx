'use client';

import React, { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

function getSafeReturnUrl(rawUrl: string | null): string {
  if (!rawUrl) return '/business/dashboard';
  const trimmed = rawUrl.trim();
  // Ensure internal path only (starts with single slash, not double slash or protocol)
  if (trimmed.startsWith('/') && !trimmed.startsWith('//') && !trimmed.includes('://')) {
    return trimmed;
  }
  return '/business/dashboard';
}

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const returnUrl = getSafeReturnUrl(searchParams.get('returnUrl'));

  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const demoAccounts = [
    { name: 'Ajay Sharma (Owner)', email: 'ajay@royalinteriors.example.com', badge: 'OWNER' },
    { name: 'Priya Verma (Admin)', email: 'priya@royalinteriors.example.com', badge: 'ADMIN' },
    { name: 'Rohit Sen (Editor)', email: 'rohit@royalinteriors.example.com', badge: 'EDITOR' },
    { name: 'Kavita Mehta (Finance)', email: 'kavita@royalinteriors.example.com', badge: 'FINANCE' },
    { name: 'Vikram Singh (Owner)', email: 'vikram@coastalspice.example.com', badge: 'OWNER' },
    { name: 'Rahul Nair (New Claimant)', email: 'rahul@prospective.example.com', badge: 'CLAIMANT' },
  ];

  const handleSignIn = async (targetEmail: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: targetEmail }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Sign in failed. Please try again.');
      }

      router.push(returnUrl);
      router.refresh();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Sign in failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        maxWidth: '480px',
        width: '100%',
        margin: '0 auto',
        backgroundColor: '#071526',
        borderRadius: 'var(--radius-xl)',
        padding: 'var(--space-8)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        boxShadow: 'var(--elevation-3)',
      }}
    >
      <div style={{ textAlign: 'center', marginBottom: 'var(--space-6)' }}>
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            color: '#EA580C',
            fontWeight: 800,
            fontSize: 'var(--font-size-sm)',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            marginBottom: 'var(--space-2)',
          }}
        >
          <span
            style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              backgroundColor: '#EA580C',
            }}
          />
          Authentication Gate
        </div>
        <h1
          style={{
            fontSize: 'var(--font-size-2xl)',
            fontWeight: 800,
            color: '#FFFFFF',
            margin: '0 0 var(--space-2) 0',
          }}
        >
          Sign In to AageOnline
        </h1>
        <p
          style={{
            fontSize: 'var(--font-size-sm)',
            color: 'rgba(255, 255, 255, 0.7)',
            margin: 0,
            lineHeight: 1.5,
          }}
        >
          Sign in to access your Business Workspace, manage memberships, or submit a business claim.
        </p>
      </div>

      {error && (
        <div
          role="alert"
          style={{
            backgroundColor: 'rgba(239, 68, 68, 0.12)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            borderRadius: 'var(--radius-md)',
            padding: '12px 16px',
            color: '#F87171',
            fontSize: 'var(--font-size-sm)',
            marginBottom: 'var(--space-4)',
          }}
        >
          {error}
        </div>
      )}

      {/* Manual Email Input */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (email.trim()) {
            handleSignIn(email.trim());
          }
        }}
        style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)', marginBottom: 'var(--space-6)' }}
      >
        <div>
          <label
            htmlFor="email-input"
            style={{
              display: 'block',
              fontSize: 'var(--font-size-xs)',
              fontWeight: 700,
              color: 'rgba(255, 255, 255, 0.9)',
              marginBottom: '6px',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
            }}
          >
            Business Email
          </label>
          <input
            id="email-input"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@company.com"
            required
            style={{
              width: '100%',
              padding: '12px 14px',
              borderRadius: 'var(--radius-md)',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              backgroundColor: '#0B1F33',
              color: '#FFFFFF',
              fontSize: 'var(--font-size-sm)',
              outline: 'none',
              boxSizing: 'border-box',
            }}
          />
        </div>

        <button
          type="submit"
          disabled={loading || !email.trim()}
          style={{
            backgroundColor: '#EA580C',
            color: '#FFFFFF',
            border: 'none',
            padding: '12px 20px',
            borderRadius: 'var(--radius-pill)',
            fontWeight: 700,
            fontSize: 'var(--font-size-sm)',
            cursor: loading ? 'not-allowed' : 'pointer',
            opacity: loading || !email.trim() ? 0.6 : 1,
            transition: 'opacity 0.15s ease',
          }}
        >
          {loading ? 'Signing in...' : 'Continue with Email →'}
        </button>
      </form>

      {/* Demo Personas for Quick Switch in Local Dev */}
      <div style={{ borderTop: '1px solid rgba(255, 255, 255, 0.1)', paddingTop: 'var(--space-6)' }}>
        <p
          style={{
            fontSize: 'var(--font-size-xs)',
            fontWeight: 700,
            color: 'rgba(255, 255, 255, 0.5)',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            marginBottom: 'var(--space-3)',
            textAlign: 'center',
          }}
        >
          Or select a pre-configured profile:
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {demoAccounts.map((acc) => (
            <button
              key={acc.email}
              type="button"
              onClick={() => handleSignIn(acc.email)}
              disabled={loading}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '10px 14px',
                borderRadius: 'var(--radius-md)',
                backgroundColor: 'rgba(255, 255, 255, 0.04)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                color: '#FFFFFF',
                fontSize: 'var(--font-size-xs)',
                cursor: 'pointer',
                textAlign: 'left',
                transition: 'background-color 0.15s ease, border-color 0.15s ease',
              }}
            >
              <div>
                <span style={{ fontWeight: 600, display: 'block' }}>{acc.name}</span>
                <span style={{ color: 'rgba(255, 255, 255, 0.6)', fontSize: '11px' }}>{acc.email}</span>
              </div>
              <span
                style={{
                  fontSize: '10px',
                  fontWeight: 800,
                  padding: '2px 8px',
                  borderRadius: '10px',
                  backgroundColor:
                    acc.badge === 'OWNER'
                      ? 'rgba(234, 88, 12, 0.2)'
                      : acc.badge === 'ADMIN'
                      ? 'rgba(59, 130, 246, 0.2)'
                      : 'rgba(255, 255, 255, 0.1)',
                  color:
                    acc.badge === 'OWNER'
                      ? '#FB923C'
                      : acc.badge === 'ADMIN'
                      ? '#60A5FA'
                      : 'rgba(255, 255, 255, 0.8)',
                }}
              >
                {acc.badge}
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <div
      style={{
        minHeight: '80vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 'var(--space-8) var(--container-gutter)',
      }}
    >
      <Suspense fallback={<div style={{ color: '#FFFFFF' }}>Loading authentication...</div>}>
        <LoginForm />
      </Suspense>
    </div>
  );
}
