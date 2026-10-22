/**
 * AageOnline — Authentication Domain Types
 * Provider-independent authentication contracts.
 */

export type UserStatus = 'ACTIVE' | 'SUSPENDED' | 'DELETED';
export type UserRole = 'USER' | 'ADMIN' | 'SUPERADMIN';

export interface User {
  id: string;
  email?: string;
  phone?: string;
  displayName?: string;
  avatarUrl?: string;
  role?: UserRole;
  status: UserStatus;
  createdAt: string;
  updatedAt: string;
}

export interface AuthSession {
  token: string;
  userId: string;
  user: User;
  expiresAt: string;
  createdAt: string;
}

export interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
  session: AuthSession | null;
}

export interface AuthCredentials {
  email: string;
  password?: string;
}

export interface AuthDataSource {
  getCurrentUser(): Promise<User | null>;
  getSession(): Promise<AuthSession | null>;
  signIn(email: string): Promise<AuthSession>;
  signOut(): Promise<void>;
}
