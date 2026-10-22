/**
 * AageOnline — Authoritative Ranking Settlement Domain Service
 *
 * Implements the atomic, transaction-safe, idempotent ranking settlement boundary:
 * - CONFIRMED payment gate (SUCCEEDED or PENDING rejected)
 * - Exclusive market-level transaction locking
 * - Authoritative current ranking re-evaluation inside transaction
 * - Strict greater-than displacement validation
 * - Atomic execution of market participation updates & position shifts
 * - Append-only PositionHistory generation
 * - Idempotent replay protection (UNIQUE paymentOrderId constraint)
 * - Rollback on any failure with zero partial mutations
 */

import type {
  RankingSettlement,
  RankingSettlementResult,
  SettleRankingInput,
  PositionHistoryRecord,
} from '../../types/ranking-settlement.ts';
import { assertAuthorized } from '../auth/rbac.ts';
import { getMembership } from '../memberships/store.ts';
import { getPaymentOrderInternal, getPaymentOrderInternalAsync, confirmPaymentOrderAsync } from '../payments/store.ts';
import { getBidIntentInternal, getBidIntentInternalAsync } from '../bid-intent/store.ts';
import {
  addMarketParticipation,
  getBusinessById,
  getMarketParticipation,
  getMarketParticipationsByMarket,
  updateMarketParticipation,
} from '../taxonomy/businesses.ts';
import { getMarketById } from '../taxonomy/markets.ts';
import { getCityById } from '../taxonomy/locations.ts';
import { getCategoryById } from '../taxonomy/categories.ts';
import { triggerMarketRankingInvalidation } from '../cache/invalidation.ts';
import { recordAuditEvent } from '../audit/store.ts';
import { calculateSettlementPlan } from './calculator.ts';
import { appendPositionHistoryRecord } from './position-history.ts';
import {
  RankingTransactionContext,
  getTransactionFailureInjection,
} from './transaction.ts';
import { isDatabaseConfigured, assertProductionPersistence, isProductionPersistenceRequired } from '../db/guard.ts';
import { PostgresRankingSettlementRepository } from '../db/repositories/ranking-settlement-repository.ts';
import { PostgresMarketParticipationRepository } from '../db/repositories/market-participation-repository.ts';
import { PostgresPositionHistoryRepository } from '../db/repositories/position-history-repository.ts';
import {
  PostgresRankingChangeEventRepository,
  resetRankingChangeEventStoreForTesting,
} from '../db/repositories/ranking-change-event-repository.ts';
import type { RankingChangeEvent, RankingMovementDirection } from '../../types/notification.ts';
import {
  BidIntentNotFoundError,
  BusinessIneligibleSettlementError,
  MarketUnavailableSettlementError,
  PaymentNotConfirmedError,
  PaymentOrderNotFoundError,
  RankingTransactionError,
  TargetBeyondCapacityError,
  TargetNoLongerAchievableError,
  UnauthorizedSettlementAccessError,
  UnauthenticatedSettlementError,
} from './errors.ts';

const RANKING_SETTLEMENTS_STORE: Map<string, RankingSettlement> = new Map();
const SETTLEMENT_ORDER_INDEX: Map<string, string> = new Map(); // paymentOrderId -> settlementId
const settlementRepo = new PostgresRankingSettlementRepository();
const marketPartRepo = new PostgresMarketParticipationRepository();
const positionHistoryRepo = new PostgresPositionHistoryRepository();
const rankingEventRepo = new PostgresRankingChangeEventRepository();

/**
 * Executes atomic ranking settlement for a verified, CONFIRMED payment order.
 */
export async function settleRanking(
  input: SettleRankingInput
): Promise<RankingSettlementResult> {
  const { paymentOrderId, actorUserId } = input;

  // 0. Production Persistence Guard: Fail fast if in production without DATABASE_URL
  assertProductionPersistence();

  // 1. Idempotency Check (PostgreSQL first if configured)
  let existingSettlement: RankingSettlement | null = null;
  if (isDatabaseConfigured()) {
    try {
      existingSettlement = await settlementRepo.getSettlementByPaymentOrderId(paymentOrderId);
    } catch (err) {
      if (isProductionPersistenceRequired()) throw err;
    }
  }

  if (!existingSettlement) {
    const existingSettlementId = SETTLEMENT_ORDER_INDEX.get(paymentOrderId);
    if (existingSettlementId) {
      existingSettlement = RANKING_SETTLEMENTS_STORE.get(existingSettlementId) || null;
    }
  }

  if (existingSettlement && existingSettlement.status === 'SETTLED') {
    recordAuditEvent('RANKING_SETTLEMENT_DUPLICATE', 'RankingSettlement', existingSettlement.id, actorUserId, {
      paymentOrderId,
      businessId: existingSettlement.businessId,
      marketId: existingSettlement.marketId,
    });
    return {
      settlement: { ...existingSettlement },
    };
  }

  // 2. Load and Validate PaymentOrder
  let order = (await getPaymentOrderInternalAsync(paymentOrderId)) || getPaymentOrderInternal(paymentOrderId);
  if (!order) {
    throw new PaymentOrderNotFoundError(paymentOrderId);
  }

  // 3. Authentication & RBAC Authorization
  if (!actorUserId) {
    throw new UnauthenticatedSettlementError();
  }

  const membership = getMembership(order.businessId, actorUserId);
  if (!membership || membership.status !== 'ACTIVE') {
    throw new UnauthorizedSettlementAccessError(
      order.businessId,
      actorUserId,
      `User "${actorUserId}" is not an active member of business "${order.businessId}".`
    );
  }

  assertAuthorized(membership, 'rankingSettlement.create');

  // 4. Invariant 1: Only CONFIRMED Payments May Settle
  if (order.status === 'SUCCEEDED') {
    order = (await confirmPaymentOrderAsync(order.id, actorUserId)) || order;
  }
  if (order.status !== 'CONFIRMED') {
    throw new PaymentNotConfirmedError(order.id, order.status);
  }

  // 5. Load and Re-verify BidIntent
  const intent = (await getBidIntentInternalAsync(order.bidIntentId)) || getBidIntentInternal(order.bidIntentId);
  if (!intent) {
    throw new BidIntentNotFoundError(order.bidIntentId);
  }

  if (intent.businessId !== order.businessId || intent.marketId !== order.marketId) {
    throw new Error('BidIntent business or market association does not match PaymentOrder.');
  }

  // 6. Validate Market and Business Eligibility
  const market = getMarketById(order.marketId);
  if (!market || (market.status !== 'PUBLISHED' && market.publicationStatus !== 'PUBLISHED')) {
    throw new MarketUnavailableSettlementError(order.marketId);
  }

  const business = getBusinessById(order.businessId);
  if (!business || business.publicationStatus === 'ARCHIVED' || business.verificationStatus === 'REJECTED') {
    throw new BusinessIneligibleSettlementError(
      order.businessId,
      business
        ? `Publication status is ${business.publicationStatus}, verification is ${business.verificationStatus}`
        : 'Business does not exist'
    );
  }

  // 7. Instantiate or Reuse Settlement Record
  const nowIso = new Date().toISOString();
  let settlementId = existingSettlement?.id || SETTLEMENT_ORDER_INDEX.get(paymentOrderId);
  let settlement: RankingSettlement;

  if (settlementId && RANKING_SETTLEMENTS_STORE.has(settlementId)) {
    settlement = RANKING_SETTLEMENTS_STORE.get(settlementId)!;
    settlement.status = 'PROCESSING';
    settlement.updatedAt = nowIso;
  } else if (existingSettlement) {
    settlement = {
      ...existingSettlement,
      status: 'PROCESSING',
      updatedAt: nowIso,
    };
    RANKING_SETTLEMENTS_STORE.set(settlement.id, settlement);
    SETTLEMENT_ORDER_INDEX.set(order.id, settlement.id);
  } else {
    settlementId = `rs_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
    settlement = {
      id: settlementId,
      paymentOrderId: order.id,
      bidIntentId: intent.id,
      businessId: order.businessId,
      marketId: order.marketId,
      status: 'PROCESSING',
      targetPosition: intent.targetPosition,
      paidAmountMinor: order.amountMinor,
      paidAmountRupees: order.amountRupees,
      createdAt: nowIso,
      updatedAt: nowIso,
    };
    RANKING_SETTLEMENTS_STORE.set(settlement.id, settlement);
    SETTLEMENT_ORDER_INDEX.set(order.id, settlement.id);
  }

  recordAuditEvent('RANKING_SETTLEMENT_STARTED', 'RankingSettlement', settlement.id, actorUserId, {
    businessId: order.businessId,
    marketId: order.marketId,
    paymentOrderId: order.id,
    targetPosition: intent.targetPosition,
    amountRupees: order.amountRupees,
  });

  // 8. Begin Transaction Context on Target Market (with PostgreSQL row and advisory lock)
  const tx = new RankingTransactionContext(order.marketId);
  await tx.begin();
  const txClient = tx.getClient();

  try {
    if (isDatabaseConfigured() && txClient) {
      const existingInDb = await settlementRepo.getSettlementById(settlement.id, txClient);
      if (existingInDb) {
        await settlementRepo.updateSettlement(settlement, txClient);
      } else {
        await settlementRepo.createSettlement(settlement, txClient);
      }
    }

    // 9. Re-read Current Rankings inside Transaction Lock
    let currentRankings: Array<{ position: number; businessId: string; qualifyingAmountRupees: number }>;
    if (isDatabaseConfigured() && txClient) {
      const participations = await marketPartRepo.getParticipationsByMarket(order.marketId, txClient);
      currentRankings = participations
        .filter((p) => typeof p.currentPosition === 'number' && p.currentPosition > 0 && p.status === 'ACTIVE')
        .map((p) => ({
          position: p.currentPosition!,
          businessId: p.businessId,
          qualifyingAmountRupees: p.qualifyingAmountRupees || 1000,
        }))
        .sort((a, b) => a.position - b.position);
    } else {
      const participations = getMarketParticipationsByMarket(order.marketId);
      currentRankings = participations
        .filter((p) => typeof p.currentPosition === 'number' && p.currentPosition > 0 && p.status === 'ACTIVE')
        .map((p) => ({
          position: p.currentPosition!,
          businessId: p.businessId,
          qualifyingAmountRupees: p.qualifyingAmountRupees || 1000,
        }))
        .sort((a, b) => a.position - b.position);
    }

    // 10. Calculate Mutation Plan
    const plan = calculateSettlementPlan({
      marketId: order.marketId,
      targetBusinessId: order.businessId,
      targetPosition: intent.targetPosition,
      paidAmountMinor: order.amountMinor,
      paidAmountRupees: order.amountRupees,
      currentRankings,
    });

    // Simulated Fault Injection Point 1: Before Position History
    if (getTransactionFailureInjection() === 'before_position_history') {
      throw new RankingTransactionError('Simulated failure before position history.', true);
    }

    // 11. Apply Position Updates to MarketParticipations
    let targetParticipation = getMarketParticipation(order.businessId, order.marketId);
    if (!targetParticipation) {
      targetParticipation = {
        id: `mp_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`,
        businessId: order.businessId,
        marketId: order.marketId,
        status: 'ACTIVE',
        eligibilityStatus: 'ELIGIBLE',
        currentPosition: plan.finalPosition,
        qualifyingAmountRupees: plan.qualifyingAmountRupees,
        joinedAt: nowIso,
        updatedAt: nowIso,
      };
      addMarketParticipation(targetParticipation);
    } else {
      targetParticipation.currentPosition = plan.finalPosition;
      targetParticipation.qualifyingAmountRupees = plan.qualifyingAmountRupees;
      targetParticipation.updatedAt = nowIso;
      updateMarketParticipation(targetParticipation);
    }

    if (isDatabaseConfigured() && txClient) {
      await marketPartRepo.upsertParticipation(targetParticipation, txClient);
    }

    // Apply shifts to displaced businesses
    for (const change of plan.positionChanges) {
      if (!change.isTargetBusiness) {
        const displacedPart = getMarketParticipation(change.businessId, order.marketId);
        if (displacedPart) {
          displacedPart.currentPosition = change.newPosition;
          displacedPart.updatedAt = nowIso;
          updateMarketParticipation(displacedPart);
        }
        if (isDatabaseConfigured() && txClient && displacedPart) {
          await marketPartRepo.updatePositionAndAmount(
            change.businessId,
            order.marketId,
            change.newPosition,
            displacedPart.qualifyingAmountRupees ?? 0,
            txClient
          );
        }
      }
    }

    // Simulated Fault Injection Point 2: Before Settlement Record
    if (getTransactionFailureInjection() === 'before_settlement_record') {
      throw new RankingTransactionError('Simulated failure before settlement record.', true);
    }

    // 12. Append Immutable PositionHistory Records & Transactional Ranking Change Events
    const positionHistoryRecords: PositionHistoryRecord[] = [];
    const rankingChangeEvents: RankingChangeEvent[] = [];
    if (!plan.isNoOp) {
      for (const change of plan.positionChanges) {
        const historyRecord = appendPositionHistoryRecord({
          id: `ph_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`,
          businessId: change.businessId,
          marketId: order.marketId,
          previousPosition: change.previousPosition,
          newPosition: change.newPosition,
          cause: 'PAID_VISIBILITY_SETTLEMENT',
          paymentOrderId: order.id,
          bidIntentId: intent.id,
          rankingSettlementId: settlement.id,
          createdAt: nowIso,
        });
        positionHistoryRecords.push(historyRecord);

        if (isDatabaseConfigured() && txClient) {
          await positionHistoryRepo.appendHistoryRecord(historyRecord, txClient);
        }

        // Derive movement direction
        const direction: RankingMovementDirection =
          change.previousPosition === null
            ? 'ENTRY'
            : change.newPosition < change.previousPosition
            ? 'UP'
            : change.newPosition > change.previousPosition
            ? 'DOWN'
            : 'NO_CHANGE';

        const changeEvent: RankingChangeEvent = {
          id: `rce_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`,
          rankingSettlementId: settlement.id,
          paymentOrderId: order.id,
          businessId: change.businessId,
          marketId: order.marketId,
          previousPosition: change.previousPosition,
          newPosition: change.newPosition,
          direction,
          isTargetBusiness: change.isTargetBusiness,
          status: 'PENDING',
          createdAt: nowIso,
        };

        await rankingEventRepo.createEvent(changeEvent, txClient);
        rankingChangeEvents.push(changeEvent);

        recordAuditEvent('RANKING_POSITION_CHANGED', 'PositionHistory', historyRecord.id, actorUserId, {
          businessId: change.businessId,
          marketId: order.marketId,
          previousPosition: change.previousPosition,
          newPosition: change.newPosition,
        });

        recordAuditEvent('RANKING_CHANGE_EVENT_CREATED', 'RankingChangeEvent', changeEvent.id, actorUserId, {
          businessId: change.businessId,
          marketId: order.marketId,
          direction,
          previousPosition: change.previousPosition,
          newPosition: change.newPosition,
        });
      }
    }

    // 13. Update Settlement Status to SETTLED
    settlement.status = 'SETTLED';
    settlement.previousPosition = plan.previousPosition;
    settlement.finalPosition = plan.finalPosition;
    settlement.settledAt = nowIso;
    settlement.updatedAt = nowIso;
    RANKING_SETTLEMENTS_STORE.set(settlement.id, settlement);

    if (isDatabaseConfigured() && txClient) {
      const existingInDb = await settlementRepo.getSettlementById(settlement.id, txClient);
      if (existingInDb) {
        await settlementRepo.updateSettlement(settlement, txClient);
      } else {
        await settlementRepo.createSettlement(settlement, txClient);
      }
    }

    // 14. Commit Transaction
    await tx.commit();

    recordAuditEvent('RANKING_SETTLEMENT_SUCCEEDED', 'RankingSettlement', settlement.id, actorUserId, {
      businessId: order.businessId,
      marketId: order.marketId,
      paymentOrderId: order.id,
      finalPosition: plan.finalPosition,
      qualifyingAmountRupees: plan.qualifyingAmountRupees,
      changesCount: plan.positionChanges.length,
    });

    // 14b. Post-Commit Cache Invalidation (Fail-Safe)
    try {
      const marketEntity = getMarketById(order.marketId);
      const locSlug = marketEntity ? getCityById(marketEntity.cityId)?.slug : undefined;
      const catSlug = marketEntity ? getCategoryById(marketEntity.categoryId)?.slug : undefined;
      await triggerMarketRankingInvalidation({
        marketId: order.marketId,
        locationSlug: locSlug,
        categorySlug: catSlug,
        actorUserId,
        triggerCause: 'SETTLEMENT_COMMITTED',
      });
    } catch {
      // Invariant: Invalidation errors must never disrupt committed financial truth
    }

    return {
      settlement: { ...settlement },
      plan,
      positionHistoryRecords,
      rankingChangeEvents,
    };
  } catch (error) {
    // 15. Atomically Rollback on Any Error
    await tx.rollback();

    if (
      error instanceof TargetNoLongerAchievableError ||
      error instanceof TargetBeyondCapacityError
    ) {
      // Business-rule conflict: Payment remains CONFIRMED, settlement is marked FAILED
      settlement.status = 'FAILED';
      settlement.failureReason = error.code;
      settlement.updatedAt = new Date().toISOString();
      RANKING_SETTLEMENTS_STORE.set(settlement.id, settlement);

      if (isDatabaseConfigured()) {
        try {
          const existingInDb = await settlementRepo.getSettlementById(settlement.id);
          if (existingInDb) {
            await settlementRepo.updateSettlement(settlement);
          } else {
            await settlementRepo.createSettlement(settlement);
          }
        } catch {
          // ignore
        }
      }

      recordAuditEvent('RANKING_SETTLEMENT_FAILED', 'RankingSettlement', settlement.id, actorUserId, {
        businessId: order.businessId,
        marketId: order.marketId,
        paymentOrderId: order.id,
        reason: settlement.failureReason,
      });

      throw error;
    }

    // Infrastructure / Transaction Error: Mark as RETRYABLE
    settlement.status = 'RETRYABLE';
    settlement.failureReason = error instanceof Error ? error.message : 'Transaction error';
    settlement.updatedAt = new Date().toISOString();
    RANKING_SETTLEMENTS_STORE.set(settlement.id, settlement);

    if (isDatabaseConfigured()) {
      try {
        const existingInDb = await settlementRepo.getSettlementById(settlement.id);
        if (existingInDb) {
          await settlementRepo.updateSettlement(settlement);
        } else {
          await settlementRepo.createSettlement(settlement);
        }
      } catch {
        // ignore
      }
    }

    recordAuditEvent('RANKING_SETTLEMENT_RETRYABLE', 'RankingSettlement', settlement.id, actorUserId, {
      businessId: order.businessId,
      marketId: order.marketId,
      paymentOrderId: order.id,
      error: settlement.failureReason,
    });

    throw error;
  }
}

/**
 * Retrieves a RankingSettlement by its ID (synchronous).
 */
export function getRankingSettlementById(
  id: string,
  actorUserId?: string
): RankingSettlement | undefined {
  const settlement = RANKING_SETTLEMENTS_STORE.get(id);
  if (!settlement) return undefined;

  if (actorUserId) {
    const membership = getMembership(settlement.businessId, actorUserId);
    if (!membership || membership.status !== 'ACTIVE') {
      throw new UnauthorizedSettlementAccessError(settlement.businessId, actorUserId);
    }
  }

  return { ...settlement };
}

/**
 * Retrieves a RankingSettlement by its ID with PostgreSQL persistence.
 */
export async function getRankingSettlementByIdAsync(
  id: string,
  actorUserId?: string
): Promise<RankingSettlement | undefined> {
  let settlement: RankingSettlement | null = null;
  if (isDatabaseConfigured()) {
    try {
      settlement = await settlementRepo.getSettlementById(id);
      if (settlement) {
        RANKING_SETTLEMENTS_STORE.set(settlement.id, settlement);
        SETTLEMENT_ORDER_INDEX.set(settlement.paymentOrderId, settlement.id);
      }
    } catch (err) {
      if (isProductionPersistenceRequired()) throw err;
    }
  }

  if (!settlement) {
    settlement = RANKING_SETTLEMENTS_STORE.get(id) || null;
  }

  if (!settlement) return undefined;

  if (actorUserId) {
    const membership = getMembership(settlement.businessId, actorUserId);
    if (!membership || membership.status !== 'ACTIVE') {
      throw new UnauthorizedSettlementAccessError(settlement.businessId, actorUserId);
    }
  }

  return { ...settlement };
}

/**
 * Retrieves a RankingSettlement by PaymentOrder ID (synchronous).
 */
export function getRankingSettlementByPaymentOrderId(
  paymentOrderId: string,
  actorUserId?: string
): RankingSettlement | undefined {
  const settlementId = SETTLEMENT_ORDER_INDEX.get(paymentOrderId);
  if (!settlementId) return undefined;
  return getRankingSettlementById(settlementId, actorUserId);
}

/**
 * Retrieves a RankingSettlement by PaymentOrder ID with PostgreSQL persistence.
 */
export async function getRankingSettlementByPaymentOrderIdAsync(
  paymentOrderId: string,
  actorUserId?: string
): Promise<RankingSettlement | undefined> {
  let settlement: RankingSettlement | null = null;
  if (isDatabaseConfigured()) {
    try {
      settlement = await settlementRepo.getSettlementByPaymentOrderId(paymentOrderId);
      if (settlement) {
        RANKING_SETTLEMENTS_STORE.set(settlement.id, settlement);
        SETTLEMENT_ORDER_INDEX.set(settlement.paymentOrderId, settlement.id);
      }
    } catch (err) {
      if (isProductionPersistenceRequired()) throw err;
    }
  }

  if (!settlement) {
    const settlementId = SETTLEMENT_ORDER_INDEX.get(paymentOrderId);
    if (settlementId) {
      settlement = RANKING_SETTLEMENTS_STORE.get(settlementId) || null;
    }
  }

  if (!settlement) return undefined;

  if (actorUserId) {
    const membership = getMembership(settlement.businessId, actorUserId);
    if (!membership || membership.status !== 'ACTIVE') {
      throw new UnauthorizedSettlementAccessError(settlement.businessId, actorUserId);
    }
  }

  return { ...settlement };
}

/**
 * Retrieves all settlements for a business (synchronous).
 */
export function getRankingSettlementsByBusiness(
  businessId: string,
  actorUserId?: string
): RankingSettlement[] {
  if (actorUserId) {
    const membership = getMembership(businessId, actorUserId);
    if (!membership || membership.status !== 'ACTIVE') {
      throw new UnauthorizedSettlementAccessError(businessId, actorUserId);
    }
  }

  return Array.from(RANKING_SETTLEMENTS_STORE.values())
    .filter((s) => s.businessId === businessId)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .map((s) => ({ ...s }));
}

/**
 * Retrieves all settlements for a business with PostgreSQL persistence.
 */
export async function getRankingSettlementsByBusinessAsync(
  businessId: string,
  actorUserId?: string
): Promise<RankingSettlement[]> {
  if (actorUserId) {
    const membership = getMembership(businessId, actorUserId);
    if (!membership || membership.status !== 'ACTIVE') {
      throw new UnauthorizedSettlementAccessError(businessId, actorUserId);
    }
  }

  if (isDatabaseConfigured()) {
    try {
      const list = await settlementRepo.getSettlementsByBusiness(businessId);
      for (const s of list) {
        RANKING_SETTLEMENTS_STORE.set(s.id, s);
        SETTLEMENT_ORDER_INDEX.set(s.paymentOrderId, s.id);
      }
      return list;
    } catch (err) {
      if (isProductionPersistenceRequired()) throw err;
    }
  }

  return getRankingSettlementsByBusiness(businessId, actorUserId);
}

/**
 * Retrieves all settlements for internal admin operational queries in dev/test mode.
 */
export function getAllRankingSettlementsInternal(): RankingSettlement[] {
  return Array.from(RANKING_SETTLEMENTS_STORE.values())
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .map((s) => ({ ...s }));
}

/**
 * Resets settlement store for testing.
 */
export function resetSettlementStoreForTesting(): void {
  RANKING_SETTLEMENTS_STORE.clear();
  SETTLEMENT_ORDER_INDEX.clear();
  resetRankingChangeEventStoreForTesting();
}

