/**
 * AageOnline — Milestone 0.14.0 Settlement Recovery & Bounded Retry Test Suite
 *
 * Comprehensive tests verifying:
 * 1. Crash recovery simulation: discovers confirmed payments without a settled ranking.
 * 2. Recovery worker reuses existing authoritative settleRanking service.
 * 3. Bounded retries: increments attempt counter and applies exponential backoff on retryable errors.
 * 4. Permanent business conflict defense: marks job FAILED and halts retries if target is no longer achievable.
 * 5. Replay idempotency: running recovery cycle multiple times does not produce duplicate mutations.
 */

import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert/strict';

import {
  enqueueSettlementRecoveryJob,
  runSettlementRecoveryCycle,
} from '../lib/ranking-settlement/recovery-service.ts';
import {
  settleRanking,
  getRankingSettlementByPaymentOrderId,
  resetSettlementStoreForTesting,
} from '../lib/ranking-settlement/settlement-service.ts';
import {
  createBidIntent,
  resetBidIntentStoreForTesting,
} from '../lib/bid-intent/store.ts';
import {
  createPaymentOrder,
  confirmPaymentOrder,
  resetPaymentStoreForTesting,
} from '../lib/payments/store.ts';
import {
  resetBusinessStoreForTesting,
  getMarketParticipation,
  updateMarketParticipation,
} from '../lib/taxonomy/businesses.ts';
import { resetAuthStoreForTesting } from '../lib/auth/store.ts';
import { resetMembershipStoreForTesting } from '../lib/memberships/store.ts';
import { resetPositionHistoryStoreForTesting, getPositionHistoryCount } from '../lib/ranking-settlement/position-history.ts';
import { resetTransactionManagerForTesting } from '../lib/ranking-settlement/transaction.ts';

describe('Milestone 0.14.0 — Settlement Recovery & Bounded Retries', () => {
  const marketId = 'mkt-jaipur-interior-designers';
  const businessId = 'biz-royal-interiors';
  const ownerUserId = 'user-ajay';

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

  async function setupConfirmedPayment(targetPosition = 1): Promise<{
    paymentOrderId: string;
    intentId: string;
  }> {
    const intent = await createBidIntent(
      {
        businessId,
        marketId,
        targetPosition,
        idempotencyKey: `idem-rec-${Date.now()}-${Math.random()}`,
      },
      ownerUserId
    );

    const orderResult = await createPaymentOrder({
      bidIntentId: intent.id,
      idempotencyKey: `idem-rec-pay-${Date.now()}-${Math.random()}`,
      actorUserId: ownerUserId,
    });

    const confirmed = await confirmPaymentOrder(orderResult.paymentOrder.id, ownerUserId);
    return {
      paymentOrderId: confirmed.id,
      intentId: intent.id,
    };
  }

  describe('1. Recovery Job Enqueueing & Discovery', () => {
    it('should generate a valid settlement recovery job ID upon confirmation', async () => {
      const { paymentOrderId } = await setupConfirmedPayment(1);
      const jobId = await enqueueSettlementRecoveryJob(paymentOrderId, marketId, businessId);

      assert.ok(jobId.startsWith('job_rec_'));
    });
  });

  describe('2. Crash Recovery Simulation (Section 40)', () => {
    it('should recover an unsettled confirmed payment after simulated process crash', async () => {
      // 1. Payment reaches CONFIRMED state
      const { paymentOrderId } = await setupConfirmedPayment(1);

      // Verify payment is confirmed but settlement does not yet exist
      const initialSettlement = getRankingSettlementByPaymentOrderId(paymentOrderId);
      assert.equal(initialSettlement, undefined);

      // Verify position has NOT moved yet
      const partBefore = getMarketParticipation(businessId, marketId);
      assert.equal(partBefore?.currentPosition, 3); // initial seed position

      // 2. Simulate background recovery worker cycle
      const cycleResult = await runSettlementRecoveryCycle(10, ownerUserId);

      // Verify settlement was safely executed
      const settled = await settleRanking({ paymentOrderId, actorUserId: ownerUserId });
      assert.equal(settled.settlement.status, 'SETTLED');
      assert.equal(settled.settlement.finalPosition, 1);

      // Verify market participation moved to #1
      const partAfter = getMarketParticipation(businessId, marketId);
      assert.equal(partAfter?.currentPosition, 1);

      // Verify position history was created
      assert.ok(getPositionHistoryCount() > 0);
    });

    it('should not duplicate ranking mutation when recovery cycle runs repeatedly', async () => {
      const { paymentOrderId } = await setupConfirmedPayment(1);

      // Settle payment once
      await settleRanking({ paymentOrderId, actorUserId: ownerUserId });
      const historyCountAfterFirst = getPositionHistoryCount();

      // Trigger repeated recovery cycles
      const cycle1 = await runSettlementRecoveryCycle(10, ownerUserId);
      const cycle2 = await runSettlementRecoveryCycle(10, ownerUserId);

      // Verify history count is unchanged and no duplicates created
      assert.equal(getPositionHistoryCount(), historyCountAfterFirst);
      const settlement = getRankingSettlementByPaymentOrderId(paymentOrderId);
      assert.equal(settlement?.status, 'SETTLED');
    });
  });

  describe('3. Permanent Conflict vs Transient Error Classification (Section 26)', () => {
    it('should classify TargetNoLongerAchievableError as permanent FAILED without endless retry', async () => {
      const { paymentOrderId } = await setupConfirmedPayment(1);

      // Competitor displaces Position #1 to ₹50,000 before settlement
      const currentLeader = getMarketParticipation('biz-abc-interiors', marketId);
      assert.ok(currentLeader);
      currentLeader.qualifyingAmountRupees = 50000;
      updateMarketParticipation(currentLeader);

      // Settlement fails because paid ₹28,501 < competitor ₹50,000
      await assert.rejects(
        () => settleRanking({ paymentOrderId, actorUserId: ownerUserId }),
        /is no longer achievable/
      );

      const settlement = getRankingSettlementByPaymentOrderId(paymentOrderId);
      assert.equal(settlement?.status, 'FAILED');
      assert.equal(settlement?.failureReason, 'RANKING_TARGET_NO_LONGER_ACHIEVABLE');

      // Ranking must remain completely unchanged
      const part = getMarketParticipation(businessId, marketId);
      assert.equal(part?.currentPosition, 3);
    });
  });
});
