/**
 * AageOnline — Discovery Request System
 * Tracks user demand for unlisted locations, categories, and markets.
 * Enforces deduplication, demand counting (requestCount++), rate limiting, and admin review state.
 */

import type {
  DiscoveryRequest,
  DiscoveryRequestType,
  DiscoveryStatus,
} from '../../types/taxonomy';
import { generateSlug, canonicalizeText } from './normalization.ts';

const DISCOVERY_REQUESTS: Map<string, DiscoveryRequest> = new Map();

// In-memory rate limiting map: ipOrClientId -> { count, expiresAt }
const RATE_LIMIT_STORE: Map<string, { count: number; expiresAt: number }> = new Map();
const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minute
const MAX_DISCOVERY_PER_WINDOW = 30; // Max 30 discovery triggers per minute per client

/**
 * Check and record a rate-limit slot. Throws error if limit exceeded.
 */
export function checkRateLimit(clientId: string): void {
  const now = Date.now();
  const existing = RATE_LIMIT_STORE.get(clientId);

  if (!existing || existing.expiresAt <= now) {
    RATE_LIMIT_STORE.set(clientId, { count: 1, expiresAt: now + RATE_LIMIT_WINDOW_MS });
    return;
  }

  if (existing.count >= MAX_DISCOVERY_PER_WINDOW) {
    throw new Error('Rate limit exceeded for discovery requests. Please try again later.');
  }

  existing.count += 1;
}

/**
 * Build a canonical deduplication key for a discovery request.
 */
function buildDeduplicationKey(
  type: DiscoveryRequestType,
  normalized: string,
  extraContext?: { cityId?: string; categoryId?: string }
): string {
  if (type === 'MARKET' && extraContext?.cityId && extraContext?.categoryId) {
    return `MARKET::${extraContext.cityId}::${extraContext.categoryId}`;
  }
  return `${type}::${generateSlug(normalized)}`;
}

export function getAllDiscoveryRequests(): DiscoveryRequest[] {
  return Array.from(DISCOVERY_REQUESTS.values());
}

export function getDiscoveryRequestsByType(type: DiscoveryRequestType): DiscoveryRequest[] {
  return Array.from(DISCOVERY_REQUESTS.values()).filter((r) => r.requestType === type);
}

export function getDiscoveryRequestsByStatus(status: DiscoveryStatus): DiscoveryRequest[] {
  return Array.from(DISCOVERY_REQUESTS.values()).filter((r) => r.status === status);
}

export function getDiscoveryRequestById(id: string): DiscoveryRequest | undefined {
  return DISCOVERY_REQUESTS.get(id);
}

export interface RecordDiscoveryInput {
  requestType: DiscoveryRequestType;
  rawInput: string;
  clientId?: string;
  countryId?: string;
  stateId?: string;
  cityId?: string;
  categoryId?: string;
  marketId?: string;
}

/**
 * Record a discovery request with deduplication and demand increment.
 */
export function recordDiscoveryRequest(input: RecordDiscoveryInput): DiscoveryRequest {
  if (input.clientId) {
    checkRateLimit(input.clientId);
  }

  const normalized = canonicalizeText(input.rawInput);
  const dedupKey = buildDeduplicationKey(input.requestType, normalized, {
    cityId: input.cityId,
    categoryId: input.categoryId,
  });

  const now = new Date().toISOString();

  // Look for existing discovery request with matching dedup key or matching normalized value
  let existing: DiscoveryRequest | undefined;
  for (const req of DISCOVERY_REQUESTS.values()) {
    if (
      req.requestType === input.requestType &&
      (req.id === dedupKey ||
        req.normalizedValue === normalized ||
        (req.cityId && req.cityId === input.cityId && req.categoryId && req.categoryId === input.categoryId))
    ) {
      existing = req;
      break;
    }
  }

  if (existing) {
    // Increment requestCount and update lastRequestedAt
    existing.requestCount += 1;
    existing.lastRequestedAt = now;
    existing.updatedAt = now;
    return existing;
  }

  // First time request: create new record
  const id = `disc-${generateSlug(input.requestType)}-${generateSlug(normalized) || Date.now()}`;
  const newRequest: DiscoveryRequest = {
    id,
    requestType: input.requestType,
    rawInput: input.rawInput.trim(),
    normalizedValue: normalized,
    countryId: input.countryId,
    stateId: input.stateId,
    cityId: input.cityId,
    categoryId: input.categoryId,
    marketId: input.marketId,
    requestCount: 1,
    firstRequestedAt: now,
    lastRequestedAt: now,
    status: 'NEEDS_REVIEW',
    createdAt: now,
    updatedAt: now,
  };

  DISCOVERY_REQUESTS.set(id, newRequest);
  return newRequest;
}

/**
 * Admin action to update status of a discovery request.
 */
export function updateDiscoveryStatus(
  id: string,
  status: DiscoveryStatus,
  options?: { notes?: string; mappedEntityId?: string }
): DiscoveryRequest {
  const existing = DISCOVERY_REQUESTS.get(id);
  if (!existing) {
    throw new Error(`Discovery request "${id}" not found.`);
  }

  const now = new Date().toISOString();
  existing.status = status;
  if (options?.notes) existing.notes = options.notes;
  if (options?.mappedEntityId) existing.mappedEntityId = options.mappedEntityId;
  existing.updatedAt = now;

  return existing;
}

/**
 * Helper to reset store for isolated unit tests.
 */
export function resetDiscoveryStoreForTesting(): void {
  DISCOVERY_REQUESTS.clear();
  RATE_LIMIT_STORE.clear();
}
