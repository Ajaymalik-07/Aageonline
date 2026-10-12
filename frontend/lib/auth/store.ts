/**
 * AageOnline — Authentication Store
 * Canonical in-memory user registry and session management.
 */

import type { AuthSession, User } from '../../types/auth.ts';
import { recordAuditEvent } from '../audit/store.ts';

const USERS_STORE: Map<string, User> = new Map();
const SESSIONS_STORE: Map<string, AuthSession> = new Map();

// Default development session holder
let activeDevSessionToken: string | null = null;

function seedCanonicalUsers(): void {
  USERS_STORE.clear();
  SESSIONS_STORE.clear();

  const now = '2026-01-01T00:00:00.000Z';

  const seedUsers: User[] = [
    {
      id: 'user-ajay',
      email: 'ajay@royalinteriors.example.com',
      displayName: 'Ajay Sharma',
      role: 'USER',
      status: 'ACTIVE',
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'user-priya',
      email: 'priya@royalinteriors.example.com',
      displayName: 'Priya Verma',
      role: 'USER',
      status: 'ACTIVE',
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'user-rohit',
      email: 'rohit@royalinteriors.example.com',
      displayName: 'Rohit Sen',
      role: 'USER',
      status: 'ACTIVE',
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'user-kavita',
      email: 'kavita@royalinteriors.example.com',
      displayName: 'Kavita Mehta',
      role: 'USER',
      status: 'ACTIVE',
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'user-vikram',
      email: 'vikram@coastalspice.example.com',
      displayName: 'Vikram Singh',
      role: 'USER',
      status: 'ACTIVE',
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'user-rahul',
      email: 'rahul@prospective.example.com',
      displayName: 'Rahul Nair',
      role: 'USER',
      status: 'ACTIVE',
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'user-admin',
      email: 'admin@aageonline.example.com',
      displayName: 'Platform Operations Admin',
      role: 'SUPERADMIN',
      status: 'ACTIVE',
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'user-suspended',
      email: 'suspended@example.com',
      displayName: 'Suspended Account',
      role: 'USER',
      status: 'SUSPENDED',
      createdAt: now,
      updatedAt: now,
    },
  ];

  for (const user of seedUsers) {
    USERS_STORE.set(user.id, user);
  }

  // Pre-seed an initial development session ONLY in non-production environments
  if (process.env.NODE_ENV !== 'production') {
    const initialSession: AuthSession = {
      token: 'sess-dev-ajay-token',
      userId: 'user-ajay',
      user: USERS_STORE.get('user-ajay')!,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      createdAt: now,
    };
    SESSIONS_STORE.set(initialSession.token, initialSession);
    activeDevSessionToken = initialSession.token;
  } else {
    activeDevSessionToken = null;
  }
}

// Seed upon load
seedCanonicalUsers();

export function getUserById(id: string): User | undefined {
  return USERS_STORE.get(id);
}

export function getUserByEmail(email: string): User | undefined {
  const norm = email.trim().toLowerCase();
  for (const u of USERS_STORE.values()) {
    if (u.email.toLowerCase() === norm) {
      return u;
    }
  }
  return undefined;
}

export function createOrGetUserByEmail(email: string, displayName?: string, role: import('../../types/auth.ts').UserRole = 'USER'): User {
  const existing = getUserByEmail(email);
  if (existing) {
    return existing;
  }
  const now = new Date().toISOString();
  const newUser: User = {
    id: `user-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    email: email.trim().toLowerCase(),
    displayName: displayName || email.split('@')[0],
    role,
    status: 'ACTIVE',
    createdAt: now,
    updatedAt: now,
  };
  USERS_STORE.set(newUser.id, newUser);
  recordAuditEvent('USER_CREATED', 'User', newUser.id, undefined, { email: newUser.email, role });
  return newUser;
}

export function updateUserRole(userId: string, role: import('../../types/auth.ts').UserRole): User {
  const user = USERS_STORE.get(userId);
  if (!user) {
    throw new Error(`User with ID "${userId}" not found.`);
  }
  user.role = role;
  user.updatedAt = new Date().toISOString();
  recordAuditEvent('USER_ROLE_UPDATED', 'User', userId, undefined, { newRole: role });
  return user;
}

export function updateUserStatus(userId: string, status: import('../../types/auth.ts').UserStatus): User {
  const user = USERS_STORE.get(userId);
  if (!user) {
    throw new Error(`User with ID "${userId}" not found.`);
  }
  user.status = status;
  user.updatedAt = new Date().toISOString();
  recordAuditEvent('USER_STATUS_UPDATED', 'User', userId, undefined, { newStatus: status });
  return user;
}

export function createSessionForUser(userId: string): AuthSession {
  const user = USERS_STORE.get(userId);
  if (!user) {
    throw new Error(`Cannot create session: User with ID "${userId}" does not exist.`);
  }
  if (user.status !== 'ACTIVE') {
    throw new Error(`Cannot create session: User account is ${user.status}.`);
  }

  const token = `sess-${Date.now()}-${Math.random().toString(36).substring(2, 10)}`;
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
  const session: AuthSession = {
    token,
    userId: user.id,
    user,
    expiresAt,
    createdAt: new Date().toISOString(),
  };

  SESSIONS_STORE.set(token, session);
  activeDevSessionToken = token;
  recordAuditEvent('USER_AUTHENTICATED', 'User', user.id, user.id);
  return session;
}

export function getSessionByToken(token: string): AuthSession | null {
  const session = SESSIONS_STORE.get(token);
  if (!session) return null;

  if (new Date(session.expiresAt) < new Date()) {
    SESSIONS_STORE.delete(token);
    if (activeDevSessionToken === token) {
      activeDevSessionToken = null;
    }
    return null;
  }

  const user = USERS_STORE.get(session.userId);
  if (!user || user.status !== 'ACTIVE') {
    SESSIONS_STORE.delete(token);
    if (activeDevSessionToken === token) {
      activeDevSessionToken = null;
    }
    return null;
  }

  return { ...session, user };
}

export function invalidateSession(token: string): void {
  SESSIONS_STORE.delete(token);
  if (activeDevSessionToken === token) {
    activeDevSessionToken = null;
  }
}

export function getActiveDevSession(): AuthSession | null {
  if (process.env.NODE_ENV === 'production') {
    return null;
  }
  if (!activeDevSessionToken) return null;
  return getSessionByToken(activeDevSessionToken);
}

export function setActiveDevUser(userId: string | null): AuthSession | null {
  if (process.env.NODE_ENV === 'production') {
    throw new Error('Development session helpers are strictly prohibited in production.');
  }
  if (!userId) {
    activeDevSessionToken = null;
    return null;
  }
  const session = createSessionForUser(userId);
  return session;
}

export function resetAuthStoreForTesting(): void {
  seedCanonicalUsers();
}
