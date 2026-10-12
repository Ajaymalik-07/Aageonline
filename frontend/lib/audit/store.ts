/**
 * AageOnline — Audit Log Store
 * Append-only security and operational audit trail.
 */

import type { AuditAction, AuditEntityType, AuditEvent } from '../../types/audit.ts';

const AUDIT_EVENTS: AuditEvent[] = [];

export function recordAuditEvent(
  action: AuditAction,
  entityType: AuditEntityType,
  entityId: string,
  actorUserId?: string,
  metadata?: Record<string, unknown>
): AuditEvent {
  const event: AuditEvent = {
    id: `audit-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`,
    actorUserId,
    action,
    entityType,
    entityId,
    metadata,
    createdAt: new Date().toISOString(),
  };

  AUDIT_EVENTS.push(event);
  return event;
}

export function getAuditEventsByEntity(entityType: AuditEntityType, entityId: string): AuditEvent[] {
  return AUDIT_EVENTS.filter((e) => e.entityType === entityType && e.entityId === entityId);
}

export function getAuditEventsByActor(actorUserId: string): AuditEvent[] {
  return AUDIT_EVENTS.filter((e) => e.actorUserId === actorUserId);
}

export function getAllAuditEvents(): AuditEvent[] {
  return [...AUDIT_EVENTS];
}

export function resetAuditStoreForTesting(): void {
  AUDIT_EVENTS.length = 0;
}
