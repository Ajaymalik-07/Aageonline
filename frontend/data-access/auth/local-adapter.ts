/**
 * AageOnline — Local Authentication Data Source Adapter
 * Development adapter backed by in-memory user and session stores.
 *
 * NOTE: This is a development adapter and does not provide production crypto/OAuth guarantees.
 */

import type { AuthDataSource, AuthSession, User } from '../../types/auth.ts';
import {
  createOrGetUserByEmail,
  createSessionForUser,
  getActiveDevSession,
  getSessionByToken,
  getUserByEmail,
  invalidateSession,
  setActiveDevUser,
} from '../../lib/auth/store.ts';

export class LocalAuthDataSource implements AuthDataSource {
  async getCurrentUser(): Promise<User | null> {
    if (process.env.NODE_ENV === 'production') {
      return null;
    }
    const session = getActiveDevSession();
    return session ? session.user : null;
  }

  async getSession(): Promise<AuthSession | null> {
    if (process.env.NODE_ENV === 'production') {
      return null;
    }
    return getActiveDevSession();
  }

  async signIn(email: string): Promise<AuthSession> {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('LocalAuthDataSource is strictly prohibited in production environment.');
    }
    const existing = getUserByEmail(email);
    let user = existing;
    if (!user) {
      user = createOrGetUserByEmail(email);
    }
    const session = createSessionForUser(user.id);
    return session;
  }

  async signOut(): Promise<void> {
    const session = getActiveDevSession();
    if (session) {
      invalidateSession(session.token);
    }
    if (process.env.NODE_ENV !== 'production') {
      setActiveDevUser(null);
    }
  }
}
