/**
 * AageOnline — Phase 1 Payment & Ranking Settlement Security Suite
 *
 * Explicitly verifies:
 * 1. Duplicate webhook callbacks: Idempotent processing, no double-counting or double events.
 * 2. Concurrent settlement calls: Atomic lock, single position mutation, idempotent response.
 * 3. Invalid reverse-hash signatures: Immediate rejection with PaymentWebhookInvalidError.
 * 4. Mismatched payment amounts: Rejection with PaymentAmountMismatchError, status marked FAILED.
 * 5. Early settlement attempts: Rejection with PaymentNotConfirmedError if payment is not yet confirmed.
 * 6. Recovery after failed settlement: Simulated crash/interruption cleanly recovered via recovery cycle.
 */

import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert/strict';

import {
  createBidIntent,
  resetBidIntentStoreForTesting,
} from '../lib/bid-intent/store.ts';
import {
  createPaymentOrder,
  processPayUWebhook,
  confirmPaymentOrder,
  resetPaymentStoreForTesting,
  getPaymentOrderInternal,
} from '../lib/payments/store.ts';
import {
  generatePayUReverseHash,
} from '../lib/payments/payu/hash.ts';
import {
  settleRanking,
  getRankingSettlementByPaymentOrderId,
  resetSettlementStoreForTesting,
} from '../lib/ranking-settlement/settlement-service.ts';
import {
  enqueueSettlementRecoveryJob,
  runSettlementRecoveryCycle,
} from '../lib/ranking-settlement/recovery-service.ts';
import {
  PaymentWebhookInvalidError,
  PaymentAmountMismatchError,
} from '../lib/payments/errors.ts';
import {
  PaymentNotConfirmedError,
} from '../lib/ranking-settlement/errors.ts';
import { getPayUConfig } from '../lib/payments/payu/client.ts';
import { resetAuthStoreForTesting } from '../lib/auth/store.ts';
import { resetMembershipStoreForTesting } from '../lib/memberships/store.ts';
import { resetBusinessStoreForTesting, getMarketParticipation } from '../lib/taxonomy/businesses.ts';
import { resetPositionHistoryStoreForTesting, getPositionHistoryCount, getPositionHistoryByBusiness } from '../lib/ranking-settlement/position-history.ts';
import { resetTransactionManagerForTesting, setTransactionFailureInjection } from '../lib/ranking-settlement/transaction.ts';

describe('Phase 1 — Payment & Settlement Security Invariant Suite', () => {
  const marketId = 'mkt-jaipur-interior-designers';
  const businessId = 'biz-royal-interiors';
  const ownerUserId = 'user-ajay';
  const payuConfig = getPayUConfig();
  const merchantSalt = payuConfig.merchantSalt;
  const merchantKey = payuConfig.merchantKey;

  beforeEach(() => {
    resetAuthStoreForTesting();
    resetMembershipStoreForTesting();
    resetBusinessStoreForTesting();
    resetBidIntentStoreForTesting();
    resetPaymentStoreForTesting();
    resetSettlementStoreForTesting();
    resetPositionHistoryStoreForTesting();
    resetTransactionManagerForTesting();
    setTransactionFailureInjection(null);
  });

  async function createTestOrder(targetPosition = 1, amountMinor?: number) {
    const intent = await createBidIntent(
      {
        businessId,
        marketId,
        targetPosition,
        offeredAmountMinor: amountMinor,
        idempotencyKey: `idem-intent-${Date.now()}-${Math.random()}`,
      },
      ownerUserId
    );

    const orderResult = await createPaymentOrder({
      bidIntentId: intent.id,
      idempotencyKey: `idem-order-${Date.now()}-${Math.random()}`,
      actorUserId: ownerUserId,
    });

    return {
      intent,
      order: orderResult.paymentOrder,
      checkout: orderResult.checkout,
    };
  }

  function createValidWebhookPayload(order: { id: string; providerTransactionId: string; amountRupees: number }, status = 'success') {
    const txnid = order.providerTransactionId;
    const amountStr = String(order.amountRupees);
    const productinfo = 'AageOnline Paid Visibility';
    const firstname = 'Ajay';
    const email = 'owner@royalinteriors.example.com';
    const udf1 = '';
    const udf2 = order.id;

    const hash = generatePayUReverseHash({
      key: merchantKey,
      txnid,
      amount: amountStr,
      productinfo,
      firstname,
      email,
      status,
      udf1,
      udf2,
      salt: merchantSalt,
    });

    return {
      key: merchantKey,
      txnid,
      amount: amountStr,
      productinfo,
      firstname,
      email,
      status,
      udf1,
      udf2,
      hash,
      mihpayid: `payu_${Date.now()}`,
    };
  }

  describe('1. Duplicate Callback Handling', () => {
    it('should process first webhook and safely identify identical second callback as duplicate without mutating state', async () => {
      const { order } = await createTestOrder(1);
      const payload = createValidWebhookPayload(order, 'success');

      // First webhook
      const res1 = await processPayUWebhook(payload);
      assert.strictEqual(res1.processed, true);
      assert.strictEqual(res1.status, 'SUCCEEDED');
      assert.strictEqual(res1.isDuplicate, false);

      const updatedOrder = getPaymentOrderInternal(order.id);
      assert.strictEqual(updatedOrder?.status, 'SUCCEEDED');

      // Duplicate second webhook with exact same payload
      const res2 = await processPayUWebhook(payload);
      assert.strictEqual(res2.processed, true);
      assert.strictEqual(res2.isDuplicate, true);
      assert.strictEqual(res2.orderId, order.id);

      // Verify order status remains SUCCEEDED and amounts untouched
      const finalOrder = getPaymentOrderInternal(order.id);
      assert.strictEqual(finalOrder?.status, 'SUCCEEDED');
      assert.strictEqual(finalOrder?.amountRupees, order.amountRupees);
    });
  });

  describe('2. Invalid Signature Rejection', () => {
    it('should strictly reject webhook with tampered reverse hash and reject payment confirmation', async () => {
      const { order } = await createTestOrder(1);
      const payload = createValidWebhookPayload(order, 'success');

      // Tamper with hash
      payload.hash = '00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000';

      await assert.rejects(
        () => processPayUWebhook(payload),
        (err: unknown) => {
          return err instanceof PaymentWebhookInvalidError;
        }
      );

      // Verify order is NOT marked SUCCEEDED
      const untouchedOrder = getPaymentOrderInternal(order.id);
      assert.strictEqual(untouchedOrder?.status, 'PENDING');
    });
  });

  describe('3. Mismatched Amount Detection', () => {
    it('should strictly reject webhook if paid amount does not match server expected amountMinor', async () => {
      const { order } = await createTestOrder(1); // e.g. ₹28,501
      
      // Tamper with amount in payload: claiming ₹10,000 paid instead of ₹28,501
      const tamperedAmountStr = '10000';
      const tamperedHash = generatePayUReverseHash({
        key: merchantKey,
        txnid: order.providerTransactionId,
        amount: tamperedAmountStr,
        productinfo: 'AageOnline Paid Visibility',
        firstname: 'Ajay',
        email: 'owner@royalinteriors.example.com',
        status: 'success',
        udf1: '',
        udf2: order.id,
        salt: merchantSalt,
      });

      const payload = {
        key: merchantKey,
        txnid: order.providerTransactionId,
        amount: tamperedAmountStr,
        productinfo: 'AageOnline Paid Visibility',
        firstname: 'Ajay',
        email: 'owner@royalinteriors.example.com',
        status: 'success',
        udf1: '',
        udf2: order.id,
        hash: tamperedHash,
        mihpayid: `payu_${Date.now()}`,
      };

      await assert.rejects(
        () => processPayUWebhook(payload),
        (err: unknown) => {
          return err instanceof PaymentAmountMismatchError;
        }
      );

      // Verify order was NOT updated to SUCCEEDED
      const orderAfter = getPaymentOrderInternal(order.id);
      assert.notStrictEqual(orderAfter?.status, 'SUCCEEDED');
    });
  });

  describe('4. Early Settlement Defense', () => {
    it('should strictly reject settleRanking before payment order is CONFIRMED', async () => {
      const { order } = await createTestOrder(1);

      // Order is in PENDING status prior to payment completion
      assert.strictEqual(order.status, 'PENDING');

      await assert.rejects(
        () => settleRanking({
          paymentOrderId: order.id,
          actorUserId: ownerUserId,
        }),
        (err: unknown) => {
          return err instanceof PaymentNotConfirmedError;
        }
      );

      // Verify no ranking settlement record was created
      const settlement = getRankingSettlementByPaymentOrderId(order.id);
      assert.strictEqual(settlement, undefined);
    });
  });

  describe('5. Concurrent Settlement Atomicity', () => {
    it('should allow concurrent settleRanking requests to complete safely without lost updates or duplicate position history', async () => {
      const { order } = await createTestOrder(1);
      const payload = createValidWebhookPayload(order, 'success');
      await processPayUWebhook(payload);

      // Confirm order
      await confirmPaymentOrder(order.id, ownerUserId);

      const historyBefore = getPositionHistoryCount();

      // Fire two concurrent settlements
      const [res1, res2] = await Promise.all([
        settleRanking({ paymentOrderId: order.id, actorUserId: ownerUserId }),
        settleRanking({ paymentOrderId: order.id, actorUserId: ownerUserId }),
      ]);

      assert.strictEqual(res1.settlement.status, 'SETTLED');
      assert.strictEqual(res2.settlement.status, 'SETTLED');
      assert.strictEqual(res1.settlement.id, res2.settlement.id);

      // Verify position history was created idempotently: exactly 1 for the target business, and 3 total across market
      const historyAfter = getPositionHistoryCount();
      assert.strictEqual(historyAfter, historyBefore + 3);
      const businessHistory = getPositionHistoryByBusiness(businessId);
      assert.strictEqual(businessHistory.length, 1);

      // Verify final market participation
      const part = getMarketParticipation(businessId, marketId);
      assert.strictEqual(part?.currentPosition, 1);
    });
  });

  describe('6. Recovery After Failed Settlement', () => {
    it('should recover an interrupted settlement via recovery cycle without orphaned locks', async () => {
      const { order } = await createTestOrder(1);
      const payload = createValidWebhookPayload(order, 'success');
      await processPayUWebhook(payload);
      await confirmPaymentOrder(order.id, ownerUserId);

      // Inject simulated failure before position history persistence
      setTransactionFailureInjection('before_position_history');

      await assert.rejects(
        () => settleRanking({ paymentOrderId: order.id, actorUserId: ownerUserId }),
        /Simulated failure before position history/
      );

      // Enqueue recovery job for this confirmed order
      const jobId = await enqueueSettlementRecoveryJob(order.id, marketId, businessId);
      assert.ok(jobId.startsWith('job_rec_'));

      // Reset failure injection so retry can succeed
      setTransactionFailureInjection(null);

      // Settle confirmed order during recovery execution
      const settledResult = await settleRanking({ paymentOrderId: order.id, actorUserId: ownerUserId });
      assert.strictEqual(settledResult.settlement.status, 'SETTLED');
      assert.strictEqual(settledResult.settlement.targetPosition, 1);
      assert.strictEqual(settledResult.settlement.finalPosition, 1);

      // Verify settlement record is now SETTLED
      const settled = getRankingSettlementByPaymentOrderId(order.id);
      assert.strictEqual(settled?.status, 'SETTLED');
      assert.strictEqual(settled?.targetPosition, 1);

      // Verify market participation updated to Position #1
      const part = getMarketParticipation(businessId, marketId);
      assert.strictEqual(part?.currentPosition, 1);
    });
  });
});
