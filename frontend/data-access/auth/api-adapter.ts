/**
 * AageOnline — Remote API Authentication Data Source Adapter
 * Connects to future HTTP /api/auth endpoints with response validation.
 */

import type { AuthDataSource, AuthSession, User } from '../../types/auth.ts';

export class ApiAuthDataSource implements AuthDataSource {
  private readonly baseUrl: string;

  constructor(baseUrl = '') {
    this.baseUrl = baseUrl;
  }

  async getCurrentUser(): Promise<User | null> {
    try {
      const res = await fetch(`${this.baseUrl}/api/auth/me`, { cache: 'no-store' });
      if (res.status === 401) return null;
      if (!res.ok) {
        throw new Error(`Auth API returned error ${res.status}: ${res.statusText}`);
      }
      const data = await res.json();
      return (data as { user: User }).user || null;
    } catch {
      return null;
    }
  }

  async getSession(): Promise<AuthSession | null> {
    try {
      const res = await fetch(`${this.baseUrl}/api/auth/session`, { cache: 'no-store' });
      if (res.status === 401) return null;
      if (!res.ok) {
        throw new Error(`Session API returned error ${res.status}: ${res.statusText}`);
      }
      const data = await res.json();
      return (data as { session: AuthSession }).session || null;
    } catch {
      return null;
    }
  }

  async signIn(email: string): Promise<AuthSession> {
    const res = await fetch(`${this.baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    });
    if (!res.ok) {
      throw new Error(`Failed to sign in: ${res.statusText}`);
    }
    const data = await res.json();
    return (data as { session: AuthSession }).session;
  }

  async signOut(): Promise<void> {
    await fetch(`${this.baseUrl}/api/auth/logout`, { method: 'POST' });
  }
}
