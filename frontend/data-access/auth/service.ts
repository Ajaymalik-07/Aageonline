/**
 * AageOnline — Authentication Service Contract
 * Provider-agnostic service for resolving user and session state.
 */

import type { AuthDataSource, AuthSession, User } from '../../types/auth.ts';

export class AuthService {
  private readonly dataSource: AuthDataSource;

  constructor(dataSource: AuthDataSource) {
    this.dataSource = dataSource;
  }

  async getCurrentUser(): Promise<User | null> {
    return this.dataSource.getCurrentUser();
  }

  async getSession(): Promise<AuthSession | null> {
    return this.dataSource.getSession();
  }

  async signIn(email: string): Promise<AuthSession> {
    return this.dataSource.signIn(email);
  }

  async signOut(): Promise<void> {
    return this.dataSource.signOut();
  }
}
