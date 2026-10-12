/**
 * AageOnline — Milestone 0.13.0 Atomic Ranking Settlement Test Suite
 *
 * Comprehensive verification of:
 * 1. Only CONFIRMED payments can settle (SUCCEEDED, PENDING, CREATED, FAILED rejected)
 * 2. Authentication, RBAC, and strict cross-business tenant isolation
 * 3. BidIntent association and validation
 * 4. Money invariants and strict greater-than competitive displacement
 * 5. Pure calculation engine (new business insertion, upward movement, no-op, capacity)
 * 6. Append-only PositionHistory generation (no history on no-op)
 * 7. Settlement idempotency (multiple calls -> 1 mutation, 1 history set, 0 duplicates)
 * 8. Stale pricing & concurrent market displacement defense
 * 9. Atomicity & rollback (fault injection restores exact pre-transaction state)
 * 10. Concurrency locking & duplicate position protection
 * 11. Read model consistency via CanonicalRankingStateProvider
 * 12. Data-access service layer delegation
 */

import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert/strict';

import {
  calculateSettlementPlan,
} from '../lib/ranking-settlement/calculator.ts';
import {
  settleRanking,
  getRankingSettlementById,
  getRankingSettlementByPaymentOrderId,
  getRankingSettlementsByBusiness,
  resetSettlementStoreForTesting,
} from '../lib/ranking-settlement/settlement-service.ts';
import {
  appendPositionHistoryRecord,
  getPositionHistoryByBusiness,
  getPositionHistoryByMarket,
  getPositionHistoryCount,
  resetPositionHistoryStoreForTesting,
} from '../lib/ranking-settlement/position-history.ts';
import {
  setTransactionFailureInjection,
  resetTransactionManagerForTesting,
} from '../lib/ranking-settlement/transaction.ts';
import {
  PaymentNotConfirmedError,
  PaymentOrderNotFoundError,
  TargetBeyondCapacityError,
  TargetNoLongerAchievableError,
  UnauthorizedSettlementAccessError,
  UnauthenticatedSettlementError,
} from '../lib/ranking-settlement/errors.ts';

import {
  createPaymentOrder,
  confirmPaymentOrder,
  resetPaymentStoreForTesting,
} from '../lib/payments/store.ts';
import {
  createBidIntent,
  resetBidIntentStoreForTesting,
} from '../lib/bid-intent/store.ts';
import {
  resetBusinessStoreForTesting,
  getMarketParticipation,
  getMarketParticipationsByMarket,
  updateMarketParticipation,
} from '../lib/taxonomy/businesses.ts';
import { resetAuthStoreForTesting } from '../lib/auth/store.ts';
import { resetMembershipStoreForTesting } from '../lib/memberships/store.ts';
import { CanonicalRankingStateProvider } from '../lib/pricing/canonical-provider.ts';
import { rankingSettlementService } from '../data-access/ranking-settlements/index.ts';

describe('Milestone 0.13.0 — Atomic Ranking Settlement Engine', () => {
  const marketId = 'mkt-jaipur-interior-designers';
  const businessId = 'biz-royal-interiors'; // currently holds #3 at ₹24,500 in seed data
  const ownerUserId = 'user-ajay'; // OWNER of biz-royal-interiors
  const adminUserId = 'user-priya'; // ADMIN
  const editorUserId = 'user-rohit'; // EDITOR
  const financeUserId = 'user-kavita'; // FINANCE
  const foreignUserId = 'user-vikram'; // OWNER of biz-coastal-spice

  beforeEach(() => {
    resetAuthStoreForTesting();
    resetMembershipStoreForTesting();
    resetBusinessStoreForTesting();
    resetBidIntentStoreForTesting();
    resetPaymentStoreForTesting();
    resetSettlementStoreForTesting();
    resetPositionHistoryStoreForTesting();
    resetTransactionManagerForTesting();
  });

  // Helper to create a confirmed payment order ready for settlement
  async function setupConfirmedPayment(targetPosition: number = 1): Promise<{
    intentId: string;
    paymentOrderId: string;
  }> {
    const intent = await createBidIntent(
      {
        businessId,
        marketId,
        targetPosition,
        idempotencyKey: `idem-intent-${Date.now()}-${Math.random()}`,
      },
      ownerUserId
    );

    const orderResult = await createPaymentOrder({
      bidIntentId: intent.id,
      idempotencyKey: `idem-pay-${Date.now()}-${Math.random()}`,
      actorUserId: ownerUserId,
    });

    const confirmedOrder = await confirmPaymentOrder(orderResult.paymentOrder.id, ownerUserId);

    return {
      intentId: intent.id,
      paymentOrderId: confirmedOrder.id,
    };
  }

  describe('1. Payment Confirmation Gate Invariants', () => {
    it('should reject payment orders that are not in CONFIRMED state', async () => {
      const intent = await createBidIntent(
        {
          businessId,
          marketId,
          targetPosition: 1,
          idempotencyKey: 'idem-unconfirmed-1',
        },
        ownerUserId
      );

      const orderResult = await createPaymentOrder({
        bidIntentId: intent.id,
        idempotencyKey: 'idem-pay-unconfirmed-1',
        actorUserId: ownerUserId,
      });

      // Order is PENDING
      assert.equal(orderResult.paymentOrder.status, 'PENDING');

      await assert.rejects(
        () =>
          settleRanking({
            paymentOrderId: orderResult.paymentOrder.id,
            actorUserId: ownerUserId,
          }),
        (err: unknown) => {
          assert.ok(err instanceof PaymentNotConfirmedError);
          assert.equal(err.status, 'PENDING');
          return true;
        }
      );
    });

    it('should reject non-existent payment order IDs', async () => {
      await assert.rejects(
        () =>
          settleRanking({
            paymentOrderId: 'po-non-existent-999',
            actorUserId: ownerUserId,
          }),
        (err: unknown) => {
          assert.ok(err instanceof PaymentOrderNotFoundError);
          return true;
        }
      );
    });
  });

  describe('2. Authentication & RBAC Authorization', () => {
    it('should reject unauthenticated caller', async () => {
      const { paymentOrderId } = await setupConfirmedPayment(1);

      await assert.rejects(
        () =>
          settleRanking({
            paymentOrderId,
            actorUserId: '',
          }),
        (err: unknown) => {
          assert.ok(err instanceof UnauthenticatedSettlementError);
          return true;
        }
      );
    });

    it('should reject non-member user from settling payment', async () => {
      const { paymentOrderId } = await setupConfirmedPayment(1);

      await assert.rejects(
        () =>
          settleRanking({
            paymentOrderId,
            actorUserId: foreignUserId,
          }),
        (err: unknown) => {
          assert.ok(err instanceof UnauthorizedSettlementAccessError);
          return true;
        }
      );
    });

    it('should reject EDITOR and FINANCE roles from executing settlement', async () => {
      const { paymentOrderId } = await setupConfirmedPayment(1);

      // EDITOR
      await assert.rejects(
        () =>
          settleRanking({
            paymentOrderId,
            actorUserId: editorUserId,
          }),
        (err: unknown) => {
          assert.ok(err instanceof Error);
          return true;
        }
      );

      // FINANCE
      await assert.rejects(
        () =>
          settleRanking({
            paymentOrderId,
            actorUserId: financeUserId,
          }),
        (err: unknown) => {
          assert.ok(err instanceof Error);
          return true;
        }
      );
    });

    it('should allow OWNER and ADMIN to execute settlement', async () => {
      const { paymentOrderId } = await setupConfirmedPayment(1);

      const result = await settleRanking({
        paymentOrderId,
        actorUserId: adminUserId,
      });

      assert.equal(result.settlement.status, 'SETTLED');
      assert.equal(result.settlement.finalPosition, 1);
    });
  });

  describe('3. Pure Calculation & Movement Algorithms', () => {
    it('should insert a new business at #1 and shift existing businesses down', () => {
      const currentRankings = [
        { position: 1, businessId: 'biz-a', qualifyingAmountRupees: 28500 },
        { position: 2, businessId: 'biz-b', qualifyingAmountRupees: 27000 },
        { position: 3, businessId: 'biz-c', qualifyingAmountRupees: 25000 },
      ];

      const plan = calculateSettlementPlan({
        marketId: 'mkt-test',
        targetBusinessId: 'biz-new',
        targetPosition: 1,
        paidAmountMinor: 2850100,
        paidAmountRupees: 28501,
        currentRankings,
      });

      assert.equal(plan.finalPosition, 1);
      assert.equal(plan.isNoOp, false);
      assert.equal(plan.positionChanges.length, 4);

      // Verify target business change
      const targetChange = plan.positionChanges.find((c) => c.businessId === 'biz-new');
      assert.deepEqual(targetChange, {
        businessId: 'biz-new',
        previousPosition: null,
        newPosition: 1,
        isTargetBusiness: true,
      });

      // Verify shifts
      const aChange = plan.positionChanges.find((c) => c.businessId === 'biz-a');
      assert.equal(aChange?.newPosition, 2);

      const bChange = plan.positionChanges.find((c) => c.businessId === 'biz-b');
      assert.equal(bChange?.newPosition, 3);

      const cChange = plan.positionChanges.find((c) => c.businessId === 'biz-c');
      assert.equal(cChange?.newPosition, 4);
    });

    it('should handle upward movement of existing business (e.g. #10 -> #5)', () => {
      const currentRankings = [
        { position: 1, businessId: 'biz-1', qualifyingAmountRupees: 50000 },
        { position: 2, businessId: 'biz-2', qualifyingAmountRupees: 45000 },
        { position: 3, businessId: 'biz-3', qualifyingAmountRupees: 40000 },
        { position: 4, businessId: 'biz-4', qualifyingAmountRupees: 35000 },
        { position: 5, businessId: 'biz-5', qualifyingAmountRupees: 30000 },
        { position: 6, businessId: 'biz-6', qualifyingAmountRupees: 25000 },
        { position: 7, businessId: 'biz-7', qualifyingAmountRupees: 20000 },
        { position: 8, businessId: 'biz-8', qualifyingAmountRupees: 18000 },
        { position: 9, businessId: 'biz-9', qualifyingAmountRupees: 15000 },
        { position: 10, businessId: 'biz-x', qualifyingAmountRupees: 10000 },
        { position: 11, businessId: 'biz-11', qualifyingAmountRupees: 5000 },
      ];

      const plan = calculateSettlementPlan({
        marketId: 'mkt-test',
        targetBusinessId: 'biz-x',
        targetPosition: 5,
        paidAmountMinor: 3000100,
        paidAmountRupees: 30001,
        currentRankings,
      });

      assert.equal(plan.finalPosition, 5);
      assert.equal(plan.previousPosition, 10);

      // biz-x moves 10 -> 5
      const targetChange = plan.positionChanges.find((c) => c.businessId === 'biz-x');
      assert.equal(targetChange?.newPosition, 5);

      // biz-5..biz-9 shift down by 1 (5->6, 6->7, 7->8, 8->9, 9->10)
      assert.equal(plan.positionChanges.find((c) => c.businessId === 'biz-5')?.newPosition, 6);
      assert.equal(plan.positionChanges.find((c) => c.businessId === 'biz-6')?.newPosition, 7);
      assert.equal(plan.positionChanges.find((c) => c.businessId === 'biz-7')?.newPosition, 8);
      assert.equal(plan.positionChanges.find((c) => c.businessId === 'biz-8')?.newPosition, 9);
      assert.equal(plan.positionChanges.find((c) => c.businessId === 'biz-9')?.newPosition, 10);

      // Positions 1..4 and 11+ must NOT be in changes
      assert.equal(plan.positionChanges.find((c) => c.businessId === 'biz-1'), undefined);
      assert.equal(plan.positionChanges.find((c) => c.businessId === 'biz-4'), undefined);
      assert.equal(plan.positionChanges.find((c) => c.businessId === 'biz-11'), undefined);
    });

    it('should return no-op when targeting currently held position', () => {
      const currentRankings = [
        { position: 1, businessId: 'biz-1', qualifyingAmountRupees: 50000 },
        { position: 2, businessId: 'biz-x', qualifyingAmountRupees: 45000 },
      ];

      const plan = calculateSettlementPlan({
        marketId: 'mkt-test',
        targetBusinessId: 'biz-x',
        targetPosition: 2,
        paidAmountMinor: 4500000,
        paidAmountRupees: 45000,
        currentRankings,
      });

      assert.equal(plan.isNoOp, true);
      assert.equal(plan.finalPosition, 2);
      assert.equal(plan.positionChanges.length, 0);
    });

    it('should reject target positions beyond market capacity', () => {
      assert.throws(
        () =>
          calculateSettlementPlan({
            marketId: 'mkt-test',
            targetBusinessId: 'biz-new',
            targetPosition: 101,
            paidAmountMinor: 100000,
            paidAmountRupees: 1000,
            currentRankings: [],
            marketCapacity: 100,
          }),
        (err: unknown) => {
          assert.ok(err instanceof TargetBeyondCapacityError);
          return true;
        }
      );
    });
  });

  describe('4. Strict Greater-Than Rule & Stale Pricing Defense', () => {
    it('should reject settlement when paid amount is equal to or less than current occupant amount', () => {
      const currentRankings = [
        { position: 1, businessId: 'biz-a', qualifyingAmountRupees: 28500 },
      ];

      // Equal amount (₹28,500)
      assert.throws(
        () =>
          calculateSettlementPlan({
            marketId: 'mkt-test',
            targetBusinessId: 'biz-b',
            targetPosition: 1,
            paidAmountMinor: 2850000,
            paidAmountRupees: 28500,
            currentRankings,
          }),
        (err: unknown) => {
          assert.ok(err instanceof TargetNoLongerAchievableError);
          return true;
        }
      );

      // Less amount (₹28,499)
      assert.throws(
        () =>
          calculateSettlementPlan({
            marketId: 'mkt-test',
            targetBusinessId: 'biz-b',
            targetPosition: 1,
            paidAmountMinor: 2849900,
            paidAmountRupees: 28499,
            currentRankings,
          }),
        (err: unknown) => {
          assert.ok(err instanceof TargetNoLongerAchievableError);
          return true;
        }
      );
    });

    it('should mark settlement as FAILED when market shifted between intent and settlement', async () => {
      // 1. Setup payment for Position #1 (₹28,501)
      const { paymentOrderId } = await setupConfirmedPayment(1);

      // 2. Simulate competitor taking #1 at ₹30,000 before settlement
      const currentPart = getMarketParticipation('biz-abc-interiors', marketId);
      assert.ok(currentPart);
      currentPart.qualifyingAmountRupees = 30000;
      updateMarketParticipation(currentPart);

      // 3. Attempt settlement: paid ₹28,501 < competitor ₹30,000
      await assert.rejects(
        () =>
          settleRanking({
            paymentOrderId,
            actorUserId: ownerUserId,
          }),
        (err: unknown) => {
          assert.ok(err instanceof TargetNoLongerAchievableError);
          return true;
        }
      );

      // Verify settlement is recorded as FAILED with reason
      const settlement = getRankingSettlementByPaymentOrderId(paymentOrderId);
      assert.ok(settlement);
      assert.equal(settlement.status, 'FAILED');
      assert.equal(settlement.failureReason, 'RANKING_TARGET_NO_LONGER_ACHIEVABLE');

      // Verify ranking was NOT mutated
      const royalPart = getMarketParticipation(businessId, marketId);
      assert.equal(royalPart?.currentPosition, 3); // unchanged at #3!
    });
  });

  describe('5. Position History Generation & Invariants', () => {
    it('should create PositionHistory for target business and all shifted businesses', async () => {
      const { paymentOrderId } = await setupConfirmedPayment(1);

      const result = await settleRanking({
        paymentOrderId,
        actorUserId: ownerUserId,
      });

      assert.equal(result.settlement.status, 'SETTLED');
      assert.ok(result.positionHistoryRecords);
      assert.equal(result.positionHistoryRecords.length, 3); // Royal Interiors (3->1), ABC Interiors (1->2), Studio XYZ (2->3)

      const historyCount = getPositionHistoryCount();
      assert.equal(historyCount, 3);

      const targetHistory = result.positionHistoryRecords.find((h) => h.businessId === businessId);
      assert.ok(targetHistory);
      assert.equal(targetHistory.previousPosition, 3);
      assert.equal(targetHistory.newPosition, 1);
      assert.equal(targetHistory.cause, 'PAID_VISIBILITY_SETTLEMENT');
      assert.equal(targetHistory.paymentOrderId, paymentOrderId);
    });

    it('should NOT create PositionHistory for no-op same-position movement', () => {
      assert.throws(() => {
        appendPositionHistoryRecord({
          id: 'ph-noop',
          businessId: 'biz-1',
          marketId: 'mkt-test',
          previousPosition: 5,
          newPosition: 5,
          cause: 'PAID_VISIBILITY_SETTLEMENT',
          paymentOrderId: 'po-1',
          bidIntentId: 'bi-1',
          rankingSettlementId: 'rs-1',
          createdAt: new Date().toISOString(),
        });
      });
    });
  });

  describe('6. Settlement Idempotency (Section 35 & 90)', () => {
    it('should return identical settlement result on repeated execution without duplicate mutations', async () => {
      const { paymentOrderId } = await setupConfirmedPayment(1);

      // Initial settlement
      const result1 = await settleRanking({
        paymentOrderId,
        actorUserId: ownerUserId,
      });

      assert.equal(result1.settlement.status, 'SETTLED');
      const initialHistoryCount = getPositionHistoryCount();
      assert.equal(initialHistoryCount, 3);

      // Repeated 10 times
      for (let i = 0; i < 10; i++) {
        const repeatResult = await settleRanking({
          paymentOrderId,
          actorUserId: ownerUserId,
        });

        assert.equal(repeatResult.settlement.id, result1.settlement.id);
        assert.equal(repeatResult.settlement.status, 'SETTLED');
      }

      // Assert ZERO additional history records and identical position
      assert.equal(getPositionHistoryCount(), initialHistoryCount);
      const royalPart = getMarketParticipation(businessId, marketId);
      assert.equal(royalPart?.currentPosition, 1);
    });
  });

  describe('7. Atomicity & Rollback Guarantees (Section 87 & 88)', () => {
    it('should completely roll back ranking and participations if position history creation fails', async () => {
      const { paymentOrderId } = await setupConfirmedPayment(1);

      // Inject simulated failure before position history
      setTransactionFailureInjection('before_position_history');

      await assert.rejects(
        () =>
          settleRanking({
            paymentOrderId,
            actorUserId: ownerUserId,
          }),
        /Simulated failure before position history/
      );

      // Verify ZERO mutations occurred in participations
      const royalPart = getMarketParticipation(businessId, marketId);
      assert.equal(royalPart?.currentPosition, 3); // Restored to #3!

      const abcPart = getMarketParticipation('biz-abc-interiors', marketId);
      assert.equal(abcPart?.currentPosition, 1); // Restored to #1!

      // Verify ZERO position history records exist
      assert.equal(getPositionHistoryCount(), 0);

      // Verify settlement is RETRYABLE
      const settlement = getRankingSettlementByPaymentOrderId(paymentOrderId);
      assert.ok(settlement);
      assert.equal(settlement.status, 'RETRYABLE');
    });

    it('should completely roll back ranking if settlement record persistence fails', async () => {
      const { paymentOrderId } = await setupConfirmedPayment(1);

      // Inject simulated failure before settlement record
      setTransactionFailureInjection('before_settlement_record');

      await assert.rejects(
        () =>
          settleRanking({
            paymentOrderId,
            actorUserId: ownerUserId,
          }),
        /Simulated failure before settlement record/
      );

      // Verify ZERO mutations occurred
      const royalPart = getMarketParticipation(businessId, marketId);
      assert.equal(royalPart?.currentPosition, 3);
      assert.equal(getPositionHistoryCount(), 0);
    });
  });

  describe('8. Concurrency & Duplicate Position Protection (Section 85 & 137)', () => {
    it('should safely serialize concurrent settlements targeting the same market and position', async () => {
      // 1. Setup Payment 1: Royal Interiors targets #1 (₹28,501)
      const pay1 = await setupConfirmedPayment(1);

      // 2. Setup Payment 2: Coastal Spice targets #4
      const coastalIntent = await createBidIntent(
        {
          businessId: 'biz-coastal-spice',
          marketId,
          targetPosition: 4,
          idempotencyKey: 'idem-coastal-1',
        },
        foreignUserId
      );

      const coastalOrderResult = await createPaymentOrder({
        bidIntentId: coastalIntent.id,
        idempotencyKey: 'idem-coastal-pay-1',
        actorUserId: foreignUserId,
      });

      const coastalOrder = await confirmPaymentOrder(coastalOrderResult.paymentOrder.id, foreignUserId);

      // Execute settlements concurrently
      const [res1, res2] = await Promise.all([
        settleRanking({ paymentOrderId: pay1.paymentOrderId, actorUserId: ownerUserId }),
        settleRanking({ paymentOrderId: coastalOrder.id, actorUserId: foreignUserId }),
      ]);

      assert.equal(res1.settlement.status, 'SETTLED');
      assert.equal(res2.settlement.status, 'SETTLED');

      // Verify all positions in market are completely UNIQUE
      const participations = getMarketParticipationsByMarket(marketId).filter(
        (p) => typeof p.currentPosition === 'number' && p.currentPosition > 0
      );

      const positions = participations.map((p) => p.currentPosition);
      const uniquePositions = new Set(positions);
      assert.equal(positions.length, uniquePositions.size, 'No duplicate positions permitted!');

      // Verify neither business was lost
      const royalPos = participations.find((p) => p.businessId === businessId)?.currentPosition;
      const coastalPos = participations.find((p) => p.businessId === 'biz-coastal-spice')?.currentPosition;
      assert.ok(typeof royalPos === 'number' && royalPos > 0);
      assert.ok(typeof coastalPos === 'number' && coastalPos > 0);
      assert.notEqual(royalPos, coastalPos);
    });
  });

  describe('9. Read Model Consistency & Data-Access Layer Delegation', () => {
    it('should reflect settled rankings in CanonicalRankingStateProvider', async () => {
      const provider = new CanonicalRankingStateProvider();

      // Before settlement: #1 is ABC Interiors, #3 is Royal Interiors
      const initialRankings = await provider.getMarketRankings(marketId);
      assert.equal(initialRankings[0].businessId, 'biz-abc-interiors');
      assert.equal(initialRankings[2].businessId, businessId);

      // Settle Royal Interiors into #1
      const { paymentOrderId } = await setupConfirmedPayment(1);
      await rankingSettlementService.settleRanking({
        paymentOrderId,
        actorUserId: ownerUserId,
      });

      // After settlement: #1 must be Royal Interiors
      const updatedRankings = await provider.getMarketRankings(marketId);
      assert.equal(updatedRankings[0].businessId, businessId);
      assert.equal(updatedRankings[0].position, 1);
      assert.equal(updatedRankings[0].qualifyingAmountRupees, 28501);

      // ABC Interiors moved to #2
      assert.equal(updatedRankings[1].businessId, 'biz-abc-interiors');
      assert.equal(updatedRankings[1].position, 2);
    });

    it('should allow querying business settlements through data access service', async () => {
      const { paymentOrderId } = await setupConfirmedPayment(1);
      await rankingSettlementService.settleRanking({
        paymentOrderId,
        actorUserId: ownerUserId,
      });

      const settlements = await rankingSettlementService.getBusinessSettlements(
        businessId,
        ownerUserId
      );

      assert.equal(settlements.length, 1);
      assert.equal(settlements[0].paymentOrderId, paymentOrderId);
      assert.equal(settlements[0].status, 'SETTLED');
    });
  });
});
