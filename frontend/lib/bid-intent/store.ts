/**
 * AageOnline — Authoritative Bid Intent Domain Store
 *
 * Implements:
 * - Scoped idempotency boundaries
 * - Server-side authoritative pricing re-evaluation
 * - Stale pricing change detection
 * - Centralized RBAC authorization
 * - Immutable pricing snapshotting
 * - Expiration lifecycle management
 * - Zero financial and ranking mutations
 */

import type {
  BidIntent,
  BidIntentFilter,
  CancelBidIntentInput,
  CreateBidIntentInput,
  PricingSnapshot,
} from '../../types/bid-intent.ts';
import { BID_INTENT_TTL_MINUTES } from '../../types/bid-intent.ts';
import { assertAuthorized, can } from '../auth/rbac.ts';
import { getMembership } from '../memberships/store.ts';
import { defaultPricingCalculator } from '../pricing/index.ts';
import { getMarketById } from '../taxonomy/markets.ts';
import { getBusinessById } from '../taxonomy/businesses.ts';
import { recordAuditEvent } from '../audit/store.ts';
import {
  BidIntentExpiredError,
  BidIntentNotCancellableError,
  BidIntentNotFoundError,
  ForbiddenBusinessAccessError,
  IdempotencyKeyRequiredError,
  IdempotencyKeyReusedError,
  MarketNotFoundError,
  MarketUnavailableError,
  PricingChangedError,
  UnauthenticatedError,
} from './errors.ts';
import {
  assertProductionPersistence,
  isDatabaseConfigured,
  isProductionPersistenceRequired,
} from '../db/guard.ts';
import { PostgresBidIntentRepository } from '../db/repositories/bid-intent-repository.ts';

interface IdempotencyRecord {
  actorUserId: string;
  businessId: string;
  marketId: string;
  targetPosition: number;
  bidIntentId: string;
  createdAt: string;
}

const BID_INTENTS_STORE: Map<string, BidIntent> = new Map();
const IDEMPOTENCY_STORE: Map<string, IdempotencyRecord> = new Map();
const bidIntentRepo = new PostgresBidIntentRepository();

function idempotencyScopeKey(actorUserId: string, businessId: string, idempotencyKey: string): string {
  return `${actorUserId}:::${businessId}:::${idempotencyKey.trim()}`;
}

/**
 * Checks and lazily updates expiration state for a BidIntent.
 */
function evaluateExpiration(intent: BidIntent, now: Date = new Date()): BidIntent {
  if (intent.status === 'PENDING_PAYMENT') {
    const expiryTime = new Date(intent.expiresAt);
    if (now >= expiryTime) {
      intent.status = 'EXPIRED';
      intent.updatedAt = now.toISOString();
    }
  }
  return intent;
}

/**
 * Creates an immutable, idempotent BidIntent.
 * Authoritatively re-evaluates market pricing at creation time.
 */
export async function createBidIntent(
  input: CreateBidIntentInput & { actorUserId?: string },
  actorUserId?: string
): Promise<BidIntent> {
  assertProductionPersistence();

  const effectiveActor = actorUserId || input.actorUserId;
  // 1. Authentication requirement
  if (!effectiveActor) {
    throw new UnauthenticatedError();
  }

  // 2. Validate Idempotency-Key
  if (!input.idempotencyKey || typeof input.idempotencyKey !== 'string' || input.idempotencyKey.trim() === '') {
    throw new IdempotencyKeyRequiredError();
  }
  const scopeKey = idempotencyScopeKey(effectiveActor, input.businessId, input.idempotencyKey);

  // 3. Check for existing idempotent request (PostgreSQL first if configured)
  if (isDatabaseConfigured()) {
    try {
      const existingDbIntent = await bidIntentRepo.findIdempotentIntent(
        effectiveActor,
        input.businessId,
        input.idempotencyKey
      );
      if (existingDbIntent) {
        const matchesPayload =
          existingDbIntent.marketId === input.marketId &&
          existingDbIntent.targetPosition === input.targetPosition &&
          existingDbIntent.businessId === input.businessId;

        if (!matchesPayload) {
          throw new IdempotencyKeyReusedError(
            `Idempotency-Key "${input.idempotencyKey}" has already been used with a different target position or market.`
          );
        }

        BID_INTENTS_STORE.set(existingDbIntent.id, existingDbIntent);
        return evaluateExpiration({ ...existingDbIntent });
      }
    } catch (err) {
      if (isProductionPersistenceRequired() || err instanceof IdempotencyKeyReusedError) {
        throw err;
      }
    }
  }

  const existingIdempotency = IDEMPOTENCY_STORE.get(scopeKey);
  if (existingIdempotency) {
    // Assert payload match (material consistency)
    const matchesPayload =
      existingIdempotency.marketId === input.marketId &&
      existingIdempotency.targetPosition === input.targetPosition &&
      existingIdempotency.businessId === input.businessId;

    if (!matchesPayload) {
      throw new IdempotencyKeyReusedError(
        `Idempotency-Key "${input.idempotencyKey}" has already been used with a different target position or market.`
      );
    }

    const existingIntent = BID_INTENTS_STORE.get(existingIdempotency.bidIntentId);
    if (existingIntent) {
      // Return existing intent with zero duplicate mutations or audits
      return evaluateExpiration({ ...existingIntent });
    }
  }

  // 4. Authorization & Membership Check via Centralized RBAC
  const membership = getMembership(input.businessId, effectiveActor);
  if (!membership || membership.status !== 'ACTIVE') {
    throw new ForbiddenBusinessAccessError(
      `User "${effectiveActor}" is not an active member of business "${input.businessId}".`
    );
  }

  // Centralized RBAC: OWNER & ADMIN are allowed, EDITOR & FINANCE denied
  assertAuthorized(membership, 'bidIntent.create');

  // 5. Authoritative Business & Market Validation
  const business = getBusinessById(input.businessId);
  if (!business) {
    throw new ForbiddenBusinessAccessError(`Business "${input.businessId}" does not exist.`);
  }

  const market = getMarketById(input.marketId);
  if (!market) {
    throw new MarketNotFoundError(input.marketId);
  }

  const isMarketAvailable =
    market.status === 'PUBLISHED' ||
    market.publicationStatus === 'PUBLISHED';

  if (!isMarketAvailable) {
    throw new MarketUnavailableError(input.marketId, market.status || market.publicationStatus);
  }

  // 6. Authoritative Pricing Re-evaluation at Intent Creation Time
  // Never trust client-submitted amount. Recompute directly via PricingCalculator.
  const pricingResult = await defaultPricingCalculator.calculateRequiredQualifyingAmount({
    marketId: input.marketId,
    targetPosition: input.targetPosition,
    businessId: input.businessId,
  });

  // 7. Stale Pricing Detection
  // If the client sent their previously rendered calculation reference, verify it has not changed.
  if (
    input.clientCalculatedAmountMinor !== undefined &&
    input.clientCalculatedAmountMinor !== pricingResult.requiredQualifyingAmountMinor
  ) {
    throw new PricingChangedError(
      input.clientCalculatedAmountMinor,
      pricingResult.requiredQualifyingAmountMinor,
      pricingResult.requiredQualifyingAmountRupees
    );
  }

  // 8. Resolve Effective Qualifying Amount (Supports Manual Offers >= Required Minimum)
  let effectiveQualifyingAmountMinor = pricingResult.requiredQualifyingAmountMinor;
  if (input.offeredAmountMinor !== undefined) {
    if (input.offeredAmountMinor < pricingResult.requiredQualifyingAmountMinor) {
      throw new Error(
        `Offered amount of ₹${Math.floor(input.offeredAmountMinor / 100).toLocaleString(
          'en-IN'
        )} is below the minimum required qualifying amount of ₹${pricingResult.requiredQualifyingAmountRupees.toLocaleString(
          'en-IN'
        )} to claim Position #${input.targetPosition}.`
      );
    }
    effectiveQualifyingAmountMinor = input.offeredAmountMinor;
  }
  const effectiveQualifyingAmountRupees = Math.floor(effectiveQualifyingAmountMinor / 100);

  // 9. Construct Immutable Pricing Snapshot
  const pricingSnapshot: PricingSnapshot = {
    marketId: pricingResult.marketId,
    marketSlug: pricingResult.marketSlug,
    targetPosition: pricingResult.targetPosition,
    relevantCurrentQualifyingAmountMinor: pricingResult.relevantCurrentQualifyingAmountMinor,
    relevantCurrentQualifyingAmountRupees: pricingResult.relevantCurrentQualifyingAmountRupees,
    requiredQualifyingAmountMinor: pricingResult.requiredQualifyingAmountMinor,
    requiredQualifyingAmountRupees: pricingResult.requiredQualifyingAmountRupees,
    calculationMode: pricingResult.calculationMode,
    reason: pricingResult.reason,
    calculatedAt: pricingResult.calculatedAt,
    disclaimer: pricingResult.disclaimer,
  };

  // 10. Server Timestamp & Expiration Authority (15 minutes default TTL)
  const now = new Date();
  const createdAt = now.toISOString();
  const expiresAt = new Date(now.getTime() + BID_INTENT_TTL_MINUTES * 60 * 1000).toISOString();

  // 11. Instantiate Immutable BidIntent
  const bidIntentId = `bi_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
  const intent: BidIntent = {
    id: bidIntentId,
    businessId: input.businessId,
    marketId: input.marketId,
    createdByUserId: effectiveActor,
    membershipId: membership.id,
    targetPosition: pricingResult.targetPosition,
    qualifyingAmountMinor: effectiveQualifyingAmountMinor,
    qualifyingAmountRupees: effectiveQualifyingAmountRupees,
    currency: 'INR',
    pricingSnapshot,
    status: 'PENDING_PAYMENT',
    idempotencyKey: input.idempotencyKey,
    expiresAt,
    createdAt,
    updatedAt: createdAt,
  };

  // 11. Durable Persistence in PostgreSQL
  if (isDatabaseConfigured()) {
    try {
      await bidIntentRepo.createBidIntent(intent);
    } catch (err) {
      if (isProductionPersistenceRequired()) {
        throw err;
      }
    }
  }

  // Commit to In-Memory Stores
  BID_INTENTS_STORE.set(intent.id, intent);
  IDEMPOTENCY_STORE.set(scopeKey, {
    actorUserId: effectiveActor,
    businessId: input.businessId,
    marketId: input.marketId,
    targetPosition: input.targetPosition,
    bidIntentId: intent.id,
    createdAt,
  });

  // 12. Security & Operational Audit Log
  recordAuditEvent('BID_INTENT_CREATED', 'BidIntent', intent.id, effectiveActor, {
    businessId: input.businessId,
    marketId: input.marketId,
    targetPosition: intent.targetPosition,
    qualifyingAmountMinor: intent.qualifyingAmountMinor,
    qualifyingAmountRupees: intent.qualifyingAmountRupees,
    expiresAt,
  });

  return { ...intent };
}

/**
 * Retrieves a BidIntent by ID with object-level authorization (synchronous for legacy/tests).
 */
export function getBidIntentById(
  id: string,
  actorUserId?: string,
  clockNow?: Date
): BidIntent {
  if (!actorUserId) {
    throw new UnauthenticatedError();
  }

  const intent = BID_INTENTS_STORE.get(id);
  if (!intent) {
    throw new BidIntentNotFoundError(id);
  }

  // Object-level authorization check: actor must have membership in the intent's business
  const membership = getMembership(intent.businessId, actorUserId);
  if (!membership || membership.status !== 'ACTIVE') {
    throw new ForbiddenBusinessAccessError('User does not have access to this business intent.');
  }

  assertAuthorized(membership, 'bidIntent.view');

  return evaluateExpiration({ ...intent }, clockNow);
}

/**
 * Retrieves a BidIntent by ID with object-level authorization (durable async for production).
 */
export async function getBidIntentByIdAsync(
  id: string,
  actorUserId?: string,
  clockNow?: Date
): Promise<BidIntent> {
  if (!actorUserId) {
    throw new UnauthenticatedError();
  }

  let intent: BidIntent | null = null;
  if (isDatabaseConfigured()) {
    try {
      intent = await bidIntentRepo.getBidIntentById(id);
      if (intent) {
        BID_INTENTS_STORE.set(intent.id, intent);
      }
    } catch (err) {
      if (isProductionPersistenceRequired()) {
        throw err;
      }
    }
  }

  if (!intent) {
    const memIntent = BID_INTENTS_STORE.get(id);
    if (memIntent) {
      intent = { ...memIntent };
    }
  }

  if (!intent) {
    throw new BidIntentNotFoundError(id);
  }

  const membership = getMembership(intent.businessId, actorUserId);
  if (!membership || membership.status !== 'ACTIVE') {
    throw new ForbiddenBusinessAccessError('User does not have access to this business intent.');
  }

  assertAuthorized(membership, 'bidIntent.view');

  return evaluateExpiration({ ...intent }, clockNow);
}

/**
 * Retrieves a BidIntent by ID for internal server reconciliation and webhooks (synchronous).
 */
export function getBidIntentInternal(id: string, clockNow?: Date): BidIntent | undefined {
  const intent = BID_INTENTS_STORE.get(id);
  if (!intent) return undefined;
  return evaluateExpiration({ ...intent }, clockNow);
}

/**
 * Retrieves a BidIntent by ID with PostgreSQL persistence for internal server workflows.
 */
export async function getBidIntentInternalAsync(id: string, clockNow?: Date): Promise<BidIntent | null> {
  if (isDatabaseConfigured()) {
    try {
      const intent = await bidIntentRepo.getBidIntentById(id);
      if (intent) {
        BID_INTENTS_STORE.set(intent.id, intent);
        return evaluateExpiration({ ...intent }, clockNow);
      }
    } catch (err) {
      if (isProductionPersistenceRequired()) {
        throw err;
      }
    }
  }

  const mem = BID_INTENTS_STORE.get(id);
  return mem ? evaluateExpiration({ ...mem }, clockNow) : null;
}

/**
 * Cancels a pending BidIntent (synchronous for legacy/tests).
 */
export function cancelBidIntent(
  input: CancelBidIntentInput,
  clockNow?: Date
): BidIntent {
  if (!input.actorUserId) {
    throw new UnauthenticatedError();
  }

  const intent = BID_INTENTS_STORE.get(input.bidIntentId);
  if (!intent) {
    throw new BidIntentNotFoundError(input.bidIntentId);
  }

  if (intent.businessId !== input.businessId) {
    throw new ForbiddenBusinessAccessError('BidIntent does not belong to specified business.');
  }

  const membership = getMembership(intent.businessId, input.actorUserId);
  if (!membership || membership.status !== 'ACTIVE') {
    throw new ForbiddenBusinessAccessError('User does not have access to manage this business intent.');
  }

  assertAuthorized(membership, 'bidIntent.cancel');

  evaluateExpiration(intent, clockNow);

  if (intent.status === 'EXPIRED') {
    throw new BidIntentExpiredError(intent.id);
  }

  if (intent.status !== 'PENDING_PAYMENT') {
    throw new BidIntentNotCancellableError(intent.id, intent.status);
  }

  const nowStr = (clockNow || new Date()).toISOString();
  intent.status = 'CANCELLED';
  intent.updatedAt = nowStr;

  if (isDatabaseConfigured()) {
    bidIntentRepo.updateBidIntentStatus(intent.id, 'CANCELLED').catch((err) => {
      console.error('Failed to asynchronously update bid intent status in PostgreSQL:', err);
    });
  }

  recordAuditEvent('BID_INTENT_CANCELLED', 'BidIntent', intent.id, input.actorUserId, {
    businessId: intent.businessId,
    marketId: intent.marketId,
    targetPosition: intent.targetPosition,
  });

  return { ...intent };
}

/**
 * Cancels a pending BidIntent with durable PostgreSQL persistence.
 */
export async function cancelBidIntentAsync(
  input: CancelBidIntentInput,
  clockNow?: Date
): Promise<BidIntent> {
  if (!input.actorUserId) {
    throw new UnauthenticatedError();
  }

  let intent: BidIntent | null = null;
  if (isDatabaseConfigured()) {
    try {
      intent = await bidIntentRepo.getBidIntentById(input.bidIntentId);
      if (intent) {
        BID_INTENTS_STORE.set(intent.id, intent);
      }
    } catch (err) {
      if (isProductionPersistenceRequired()) {
        throw err;
      }
    }
  }

  if (!intent) {
    intent = BID_INTENTS_STORE.get(input.bidIntentId) || null;
  }

  if (!intent) {
    throw new BidIntentNotFoundError(input.bidIntentId);
  }

  if (intent.businessId !== input.businessId) {
    throw new ForbiddenBusinessAccessError('BidIntent does not belong to specified business.');
  }

  const membership = getMembership(intent.businessId, input.actorUserId);
  if (!membership || membership.status !== 'ACTIVE') {
    throw new ForbiddenBusinessAccessError('User does not have access to manage this business intent.');
  }

  assertAuthorized(membership, 'bidIntent.cancel');

  evaluateExpiration(intent, clockNow);

  if (intent.status === 'EXPIRED') {
    throw new BidIntentExpiredError(intent.id);
  }

  if (intent.status !== 'PENDING_PAYMENT') {
    throw new BidIntentNotCancellableError(intent.id, intent.status);
  }

  const nowStr = (clockNow || new Date()).toISOString();
  intent.status = 'CANCELLED';
  intent.updatedAt = nowStr;

  if (isDatabaseConfigured()) {
    try {
      await bidIntentRepo.updateBidIntentStatus(intent.id, 'CANCELLED');
    } catch (err) {
      if (isProductionPersistenceRequired()) {
        throw err;
      }
    }
  }

  BID_INTENTS_STORE.set(intent.id, intent);

  recordAuditEvent('BID_INTENT_CANCELLED', 'BidIntent', intent.id, input.actorUserId, {
    businessId: intent.businessId,
    marketId: intent.marketId,
    targetPosition: intent.targetPosition,
  });

  return { ...intent };
}

/**
 * Lists BidIntents scoped to a specific business with authorization (synchronous).
 */
export function getBidIntentsByBusiness(
  businessId: string,
  actorUserId?: string,
  filter?: Omit<BidIntentFilter, 'businessId'>,
  clockNow?: Date
): { intents: BidIntent[]; total: number } {
  if (!actorUserId) {
    throw new UnauthenticatedError();
  }

  const membership = getMembership(businessId, actorUserId);
  if (!membership || membership.status !== 'ACTIVE') {
    throw new ForbiddenBusinessAccessError('User is not authorized for this business.');
  }

  assertAuthorized(membership, 'bidIntent.view');

  let list = Array.from(BID_INTENTS_STORE.values())
    .filter((b) => b.businessId === businessId)
    .map((b) => evaluateExpiration({ ...b }, clockNow));

  if (filter?.marketId) {
    list = list.filter((b) => b.marketId === filter.marketId);
  }

  if (filter?.status) {
    list = list.filter((b) => b.status === filter.status);
  }

  list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const total = list.length;
  const offset = filter?.offset || 0;
  const limit = filter?.limit || 50;
  const paged = list.slice(offset, offset + limit);

  return { intents: paged, total };
}

/**
 * Lists BidIntents scoped to a specific business with durable PostgreSQL persistence.
 */
export async function getBidIntentsByBusinessAsync(
  businessId: string,
  actorUserId?: string,
  filter?: Omit<BidIntentFilter, 'businessId'>,
  clockNow?: Date
): Promise<{ intents: BidIntent[]; total: number }> {
  if (!actorUserId) {
    throw new UnauthenticatedError();
  }

  const membership = getMembership(businessId, actorUserId);
  if (!membership || membership.status !== 'ACTIVE') {
    throw new ForbiddenBusinessAccessError('User is not authorized for this business.');
  }

  assertAuthorized(membership, 'bidIntent.view');

  if (isDatabaseConfigured()) {
    try {
      const res = await bidIntentRepo.getBidIntentsByBusiness(businessId, filter);
      for (const intent of res.intents) {
        BID_INTENTS_STORE.set(intent.id, intent);
        evaluateExpiration(intent, clockNow);
      }
      return res;
    } catch (err) {
      if (isProductionPersistenceRequired()) {
        throw err;
      }
    }
  }

  return getBidIntentsByBusiness(businessId, actorUserId, filter, clockNow);
}

/**
 * Resets in-memory stores for unit testing.
 */
export function resetBidIntentStoreForTesting(): void {
  BID_INTENTS_STORE.clear();
  IDEMPOTENCY_STORE.clear();
}
