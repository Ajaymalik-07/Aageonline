/**
 * AageOnline — Taxonomy Audit Log
 * Immutable, append-only record of administrative mutations to taxonomy and discovery states.
 */

import type { AuditLogEntry, AuditAction } from '../../types/taxonomy';

const AUDIT_LOG_STORE: AuditLogEntry[] = [];

export interface LogAuditParams {
  actor: string;
  action: AuditAction;
  entityType: 'COUNTRY' | 'STATE' | 'CITY' | 'CATEGORY' | 'MARKET' | 'DISCOVERY';
  entityId: string;
  previousState?: Record<string, unknown> | null;
  newState?: Record<string, unknown> | null;
  reason?: string;
  metadata?: Record<string, unknown>;
}

/**
 * Record an administrative audit log entry.
 */
export function recordAuditLog(params: LogAuditParams): AuditLogEntry {
  const entry: AuditLogEntry = {
    id: `audit-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    actor: params.actor,
    action: params.action,
    entityType: params.entityType,
    entityId: params.entityId,
    previousState: params.previousState ? { ...params.previousState } : null,
    newState: params.newState ? { ...params.newState } : null,
    reason: params.reason,
    metadata: params.metadata ? { ...params.metadata } : undefined,
    timestamp: new Date().toISOString(),
  };

  AUDIT_LOG_STORE.push(entry);
  return entry;
}

/**
 * Query audit log entries with optional filters.
 */
export function getAuditLogs(filter?: {
  entityType?: string;
  entityId?: string;
  actor?: string;
}): AuditLogEntry[] {
  return AUDIT_LOG_STORE.filter((entry) => {
    if (filter?.entityType && entry.entityType !== filter.entityType) return false;
    if (filter?.entityId && entry.entityId !== filter.entityId) return false;
    if (filter?.actor && entry.actor !== filter.actor) return false;
    return true;
  });
}

/**
 * Reset audit logs for isolated test suites.
 */
export function resetAuditLogsForTesting(): void {
  AUDIT_LOG_STORE.length = 0;
}
