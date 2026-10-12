/**
 * AageOnline — Milestone 0.12.0 Test Suite
 * PayU Payment Gateway Integration + Payment Order Creation + Webhook Verification + Payment State Boundary
 *
 * CRITICAL REGRESSION INVARIANT:
 * A verified PayU payment executes ZERO ranking mutations, ZERO PositionHistory records,
 * and ZERO MarketParticipation updates.
 */

import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert/strict';

import { resetBidIntentStoreForTesting, createBidIntent, cancelBidIntent } from '../lib/bid-intent/store.ts';
import { AuthorizationError } from '../lib/auth/rbac.ts';
import {
  createPaymentOrder,
  getPaymentOrderById,
  getPaymentOrderByBidIntentId,
  cancelPaymentOrder,
  processPayUWebhook,
  resetPaymentStoreForTesting,
} from '../lib/payments/store.ts';
import {
  generatePayURequestHash,
  generatePayUReverseHash,
  verifyPayUHash,
} from '../lib/payments/payu/hash.ts';
import { getPayUConfig } from '../lib/payments/payu/client.ts';
import {
  PaymentAmountMismatchError,
  PaymentBidIntentCancelledError,
  PaymentBidIntentExpiredError,
  PaymentBidIntentNotFoundError,
  PaymentIdempotencyKeyRequiredError,
  PaymentIdempotencyKeyReusedError,
  PaymentStateConflictError,
  PaymentWebhookInvalidError,
  UnauthorizedPaymentAccessError,
  UnauthenticatedPaymentError,
} from '../lib/payments/errors.ts';
import { validatePaymentAmount } from '../lib/payments/money.ts';
import { evaluatePaymentTransition } from '../lib/payments/state-machine.ts';
import { resetAuditStoreForTesting, getAuditEventsByEntity } from '../lib/audit/store.ts';
import { CanonicalRankingStateProvider } from '../lib/pricing/canonical-provider.ts';
import { paymentService } from '../data-access/payments/index.ts';

// Test Fixtures (matching canonical seeded members in memberships store)
const OWNER_USER_ID = 'user-ajay'; // OWNER of biz-royal-interiors
const ADMIN_USER_ID = 'user-priya'; // ADMIN of biz-royal-interiors
const EDITOR_USER_ID = 'user-rohit'; // EDITOR of biz-royal-interiors
const FINANCE_USER_ID = 'user-kavita'; // FINANCE of biz-royal-interiors
const UNRELATED_USER_ID = 'user-vikram'; // Belongs to biz-coastal-spice

const VALID_BIZ_ID = 'biz-royal-interiors';
const VALID_MARKET_ID = 'mkt-jaipur-interior-designers';

describe('Milestone 0.12.0 — Payment Domain & Security Boundary', () => {
  beforeEach(() => {
    resetBidIntentStoreForTesting();
    resetPaymentStoreForTesting();
    resetAuditStoreForTesting();
  });

  describe('1. Authentication & Centralized RBAC', () => {
    it('should REJECT unauthenticated payment order creation with 401', async () => {
      const intent = await createBidIntent({
        businessId: VALID_BIZ_ID,
        marketId: VALID_MARKET_ID,
        targetPosition: 1,
        idempotencyKey: 'intent-auth-1',
        actorUserId: OWNER_USER_ID,
      });

      await assert.rejects(
        async () => {
          await createPaymentOrder({
            bidIntentId: intent.id,
            idempotencyKey: 'pay-unauth-1',
            actorUserId: '',
          });
        },
        (err: unknown) => err instanceof UnauthenticatedPaymentError
      );
    });

    it('should ALLOW OWNER role to create payment order', async () => {
      const intent = await createBidIntent({
        businessId: VALID_BIZ_ID,
        marketId: VALID_MARKET_ID,
        targetPosition: 1,
        idempotencyKey: 'intent-owner-1',
        actorUserId: OWNER_USER_ID,
      });

      const result = await createPaymentOrder({
        bidIntentId: intent.id,
        idempotencyKey: 'pay-owner-1',
        actorUserId: OWNER_USER_ID,
      });

      assert.equal(result.paymentOrder.status, 'PENDING');
      assert.equal(result.paymentOrder.provider, 'PAYU');
      assert.equal(result.checkout.provider, 'PAYU');
      assert.ok(result.checkout.fields.hash);
    });

    it('should ALLOW ADMIN role to create payment order', async () => {
      const intent = await createBidIntent({
        businessId: VALID_BIZ_ID,
        marketId: VALID_MARKET_ID,
        targetPosition: 1,
        idempotencyKey: 'intent-admin-1',
        actorUserId: ADMIN_USER_ID,
      });

      const result = await createPaymentOrder({
        bidIntentId: intent.id,
        idempotencyKey: 'pay-admin-1',
        actorUserId: ADMIN_USER_ID,
      });

      assert.equal(result.paymentOrder.status, 'PENDING');
      assert.equal(result.paymentOrder.amountRupees, intent.qualifyingAmountRupees);
    });

    it('should REJECT EDITOR role with 403 UnauthorizedPaymentAccessError', async () => {
      const intent = await createBidIntent({
        businessId: VALID_BIZ_ID,
        marketId: VALID_MARKET_ID,
        targetPosition: 1,
        idempotencyKey: 'intent-editor-1',
        actorUserId: OWNER_USER_ID,
      });

      await assert.rejects(
        async () => {
          await createPaymentOrder({
            bidIntentId: intent.id,
            idempotencyKey: 'pay-editor-1',
            actorUserId: EDITOR_USER_ID,
          });
        },
        (err: unknown) => err instanceof AuthorizationError || err instanceof UnauthorizedPaymentAccessError
      );
    });

    it('should REJECT user from an unrelated business with 403', async () => {
      const intent = await createBidIntent({
        businessId: VALID_BIZ_ID,
        marketId: VALID_MARKET_ID,
        targetPosition: 1,
        idempotencyKey: 'intent-cross-1',
        actorUserId: OWNER_USER_ID,
      });

      await assert.rejects(
        async () => {
          await createPaymentOrder({
            bidIntentId: intent.id,
            idempotencyKey: 'pay-cross-1',
            actorUserId: UNRELATED_USER_ID,
          });
        },
        (err: unknown) => err instanceof UnauthorizedPaymentAccessError
      );
    });
  });

  describe('2. BidIntent Validation & Expiration Lifecycle', () => {
    it('should REJECT non-existent BidIntent with 404', async () => {
      await assert.rejects(
        async () => {
          await createPaymentOrder({
            bidIntentId: 'bi-does-not-exist',
            idempotencyKey: 'pay-missing-1',
            actorUserId: OWNER_USER_ID,
          });
        },
        (err: unknown) => err instanceof PaymentBidIntentNotFoundError
      );
    });

    it('should REJECT expired BidIntent with 409 BID_INTENT_EXPIRED', async () => {
      const intent = await createBidIntent({
        businessId: VALID_BIZ_ID,
        marketId: VALID_MARKET_ID,
        targetPosition: 1,
        idempotencyKey: 'intent-exp-1',
        actorUserId: OWNER_USER_ID,
      });

      // Advance clock by 16 minutes (> 15m TTL)
      const futureDate = new Date(Date.now() + 16 * 60 * 1000);

      await assert.rejects(
        async () => {
          await createPaymentOrder(
            {
              bidIntentId: intent.id,
              idempotencyKey: 'pay-exp-1',
              actorUserId: OWNER_USER_ID,
            },
            futureDate
          );
        },
        (err: unknown) => err instanceof PaymentBidIntentExpiredError
      );
    });

    it('should REJECT cancelled BidIntent with 409 BID_INTENT_CANCELLED', async () => {
      const intent = await createBidIntent({
        businessId: VALID_BIZ_ID,
        marketId: VALID_MARKET_ID,
        targetPosition: 1,
        idempotencyKey: 'intent-cancel-1',
        actorUserId: OWNER_USER_ID,
      });

      // Cancel intent via domain service
      cancelBidIntent({
        bidIntentId: intent.id,
        actorUserId: OWNER_USER_ID,
        businessId: VALID_BIZ_ID,
      });

      await assert.rejects(
        async () => {
          await createPaymentOrder({
            bidIntentId: intent.id,
            idempotencyKey: 'pay-cancel-1',
            actorUserId: OWNER_USER_ID,
          });
        },
        (err: unknown) => err instanceof PaymentBidIntentCancelledError
      );
    });
  });

  describe('3. Financial Invariants & Whole Rupee Enforcement', () => {
    it('should enforce positive whole Indian Rupees and reject fractions/decimals', () => {
      assert.doesNotThrow(() => validatePaymentAmount(2850100, 'INR'));
      assert.doesNotThrow(() => validatePaymentAmount(100000, 'INR'));

      // Reject non-multiples of 100 (fractions of rupees)
      assert.throws(() => validatePaymentAmount(2850150, 'INR'));
      assert.throws(() => validatePaymentAmount(100001, 'INR'));
      assert.throws(() => validatePaymentAmount(0, 'INR'));
      assert.throws(() => validatePaymentAmount(-10000, 'INR'));
      assert.throws(() => validatePaymentAmount(2850100, 'USD'));
    });

    it('should derive authoritative payment amount exclusively from BidIntent', async () => {
      const intent = await createBidIntent({
        businessId: VALID_BIZ_ID,
        marketId: VALID_MARKET_ID,
        targetPosition: 1,
        idempotencyKey: 'intent-amount-1',
        actorUserId: OWNER_USER_ID,
      });

      const result = await createPaymentOrder({
        bidIntentId: intent.id,
        idempotencyKey: 'pay-amount-1',
        actorUserId: OWNER_USER_ID,
      });

      assert.equal(result.paymentOrder.amountMinor, intent.qualifyingAmountMinor);
      assert.equal(result.paymentOrder.amountRupees, intent.qualifyingAmountRupees);
      assert.equal(result.checkout.fields.amount, `${intent.qualifyingAmountRupees}.00`);
    });
  });

  describe('4. Idempotency Boundary & Duplicate Protection', () => {
    it('should REJECT creation when Idempotency-Key is omitted', async () => {
      const intent = await createBidIntent({
        businessId: VALID_BIZ_ID,
        marketId: VALID_MARKET_ID,
        targetPosition: 1,
        idempotencyKey: 'intent-idem-1',
        actorUserId: OWNER_USER_ID,
      });

      await assert.rejects(
        async () => {
          await createPaymentOrder({
            bidIntentId: intent.id,
            idempotencyKey: '',
            actorUserId: OWNER_USER_ID,
          });
        },
        (err: unknown) => err instanceof PaymentIdempotencyKeyRequiredError
      );
    });

    it('should RETURN the existing PaymentOrder upon exact request replay', async () => {
      const intent = await createBidIntent({
        businessId: VALID_BIZ_ID,
        marketId: VALID_MARKET_ID,
        targetPosition: 1,
        idempotencyKey: 'intent-replay-1',
        actorUserId: OWNER_USER_ID,
      });

      const first = await createPaymentOrder({
        bidIntentId: intent.id,
        idempotencyKey: 'pay-replay-key-1',
        actorUserId: OWNER_USER_ID,
      });

      const second = await createPaymentOrder({
        bidIntentId: intent.id,
        idempotencyKey: 'pay-replay-key-1',
        actorUserId: OWNER_USER_ID,
      });

      assert.equal(first.paymentOrder.id, second.paymentOrder.id);
      assert.equal(first.paymentOrder.providerTransactionId, second.paymentOrder.providerTransactionId);

      // Verify only 1 PAYMENT_ORDER_CREATED audit event was emitted
      const auditEvents = getAuditEventsByEntity('PaymentOrder', first.paymentOrder.id);
      const createdEvents = auditEvents.filter((e) => e.action === 'PAYMENT_ORDER_CREATED');
      assert.equal(createdEvents.length, 1);
    });

    it('should REJECT reused key for different intent with 409', async () => {
      const intent1 = await createBidIntent({
        businessId: VALID_BIZ_ID,
        marketId: VALID_MARKET_ID,
        targetPosition: 1,
        idempotencyKey: 'intent-multi-1',
        actorUserId: OWNER_USER_ID,
      });

      const intent2 = await createBidIntent({
        businessId: VALID_BIZ_ID,
        marketId: VALID_MARKET_ID,
        targetPosition: 2,
        idempotencyKey: 'intent-multi-2',
        actorUserId: OWNER_USER_ID,
      });

      await createPaymentOrder({
        bidIntentId: intent1.id,
        idempotencyKey: 'shared-pay-key',
        actorUserId: OWNER_USER_ID,
      });

      await assert.rejects(
        async () => {
          await createPaymentOrder({
            bidIntentId: intent2.id,
            idempotencyKey: 'shared-pay-key',
            actorUserId: OWNER_USER_ID,
          });
        },
        (err: unknown) => err instanceof PaymentIdempotencyKeyReusedError
      );
    });
  });

  describe('5. PayU Cryptographic Hashing', () => {
    it('should generate official PayU request hash', () => {
      const hash = generatePayURequestHash({
        key: 'gtKFFx',
        txnid: 'txn_123456',
        amount: '28501.00',
        productinfo: 'AageOnline Paid Visibility',
        firstname: 'Ajay',
        email: 'ajay@example.com',
        salt: 'eCwWELxi',
      });

      assert.equal(typeof hash, 'string');
      assert.equal(hash.length, 128); // 512-bit hex string
    });

    it('should verify PayU reverse hash and reject invalid signature', () => {
      const validHash = generatePayUReverseHash({
        key: 'gtKFFx',
        txnid: 'txn_123456',
        amount: '28501.00',
        productinfo: 'AageOnline Paid Visibility',
        firstname: 'Ajay',
        email: 'ajay@example.com',
        status: 'success',
        salt: 'eCwWELxi',
      });

      assert.equal(verifyPayUHash(validHash, validHash), true);

      // Tampered hash rejected
      const tamperedHash = validHash.substring(0, 127) + 'a';
      assert.equal(verifyPayUHash(tamperedHash, validHash), false);
    });
  });

  describe('6. PayU Webhook Processing & State Transitions', () => {
    it('should verify successful PayU webhook and transition order to SUCCEEDED', async () => {
      const intent = await createBidIntent({
        businessId: VALID_BIZ_ID,
        marketId: VALID_MARKET_ID,
        targetPosition: 1,
        idempotencyKey: 'intent-hook-1',
        actorUserId: OWNER_USER_ID,
      });

      const { paymentOrder } = await createPaymentOrder({
        bidIntentId: intent.id,
        idempotencyKey: 'pay-hook-1',
        actorUserId: OWNER_USER_ID,
        customerName: 'Owner One',
        customerEmail: 'owner@example.com',
      });

      const config = getPayUConfig();
      const txnid = paymentOrder.providerTransactionId;
      const amountStr = `${paymentOrder.amountRupees}.00`;

      // Generate authentic PayU reverse hash for webhook
      const webhookHash = generatePayUReverseHash({
        key: config.merchantKey,
        txnid,
        amount: amountStr,
        productinfo: 'AageOnline Paid Visibility',
        firstname: 'Owner One',
        email: 'owner@example.com',
        status: 'success',
        udf1: intent.id,
        udf2: paymentOrder.id,
        salt: config.merchantSalt,
      });

      const webhookPayload: Record<string, string> = {
        key: config.merchantKey,
        txnid,
        amount: amountStr,
        productinfo: 'AageOnline Paid Visibility',
        firstname: 'Owner One',
        email: 'owner@example.com',
        status: 'success',
        hash: webhookHash,
        udf1: intent.id,
        udf2: paymentOrder.id,
        mihpayid: 'payu_mih_999888',
      };

      const result = await processPayUWebhook(webhookPayload);

      assert.equal(result.processed, true);
      assert.equal(result.status, 'SUCCEEDED');
      assert.equal(result.isDuplicate, false);

      // Verify order state
      const updatedOrder = getPaymentOrderById(paymentOrder.id, OWNER_USER_ID);
      assert.equal(updatedOrder.status, 'SUCCEEDED');
      assert.equal(updatedOrder.providerPaymentId, 'payu_mih_999888');
      assert.ok(updatedOrder.paidAt);

      // Verify PAYMENT_CONFIRMED audit event was recorded
      const events = getAuditEventsByEntity('PaymentOrder', paymentOrder.id);
      const confirmed = events.filter((e) => e.action === 'PAYMENT_CONFIRMED');
      assert.equal(confirmed.length, 1);
    });

    it('should safely handle duplicate webhook notifications idempotently', async () => {
      const intent = await createBidIntent({
        businessId: VALID_BIZ_ID,
        marketId: VALID_MARKET_ID,
        targetPosition: 1,
        idempotencyKey: 'intent-dup-1',
        actorUserId: OWNER_USER_ID,
      });

      const { paymentOrder } = await createPaymentOrder({
        bidIntentId: intent.id,
        idempotencyKey: 'pay-dup-1',
        actorUserId: OWNER_USER_ID,
      });

      const config = getPayUConfig();
      const txnid = paymentOrder.providerTransactionId;
      const amountStr = `${paymentOrder.amountRupees}.00`;

      const webhookHash = generatePayUReverseHash({
        key: config.merchantKey,
        txnid,
        amount: amountStr,
        productinfo: 'AageOnline Paid Visibility',
        firstname: 'Business Member',
        email: 'billing@aageonline.com',
        status: 'success',
        udf1: intent.id,
        udf2: paymentOrder.id,
        salt: config.merchantSalt,
      });

      const webhookPayload = {
        key: config.merchantKey,
        txnid,
        amount: amountStr,
        productinfo: 'AageOnline Paid Visibility',
        firstname: 'Business Member',
        email: 'billing@aageonline.com',
        status: 'success',
        hash: webhookHash,
        udf1: intent.id,
        udf2: paymentOrder.id,
        mihpayid: 'payu_mih_123',
      };

      // 10 duplicate webhook calls
      for (let i = 0; i < 10; i++) {
        const res = await processPayUWebhook(webhookPayload);
        assert.equal(res.processed, true);
        assert.equal(res.status, 'SUCCEEDED');
        if (i > 0) {
          assert.equal(res.isDuplicate, true);
        }
      }

      // Exactly ONE PAYMENT_CONFIRMED audit log event
      const events = getAuditEventsByEntity('PaymentOrder', paymentOrder.id);
      const confirmed = events.filter((e) => e.action === 'PAYMENT_CONFIRMED');
      assert.equal(confirmed.length, 1);
    });

    it('should REJECT webhooks with invalid cryptographic reverse-hash', async () => {
      const fakePayload = {
        key: 'gtKFFx',
        txnid: 'txn_fake_1',
        amount: '28501.00',
        status: 'success',
        productinfo: 'AageOnline Paid Visibility',
        firstname: 'Test',
        email: 'test@example.com',
        hash: 'invalid_sha512_hash_value_that_fails_verification_check_1234567890abcdef',
      };

      await assert.rejects(
        async () => {
          await processPayUWebhook(fakePayload);
        },
        (err: unknown) => err instanceof PaymentWebhookInvalidError
      );
    });

    it('should REJECT webhook if reported amount does not match expected order amount', async () => {
      const intent = await createBidIntent({
        businessId: VALID_BIZ_ID,
        marketId: VALID_MARKET_ID,
        targetPosition: 1,
        idempotencyKey: 'intent-mismatch-1',
        actorUserId: OWNER_USER_ID,
      });

      const { paymentOrder } = await createPaymentOrder({
        bidIntentId: intent.id,
        idempotencyKey: 'pay-mismatch-1',
        actorUserId: OWNER_USER_ID,
      });

      const config = getPayUConfig();
      const txnid = paymentOrder.providerTransactionId;
      // Tampered amount: 1 rupee less
      const tamperedAmountStr = `${paymentOrder.amountRupees - 1}.00`;

      const webhookHash = generatePayUReverseHash({
        key: config.merchantKey,
        txnid,
        amount: tamperedAmountStr,
        productinfo: 'AageOnline Paid Visibility',
        firstname: 'Business Member',
        email: 'billing@aageonline.com',
        status: 'success',
        salt: config.merchantSalt,
      });

      const payload = {
        key: config.merchantKey,
        txnid,
        amount: tamperedAmountStr,
        productinfo: 'AageOnline Paid Visibility',
        firstname: 'Business Member',
        email: 'billing@aageonline.com',
        status: 'success',
        hash: webhookHash,
      };

      await assert.rejects(
        async () => {
          await processPayUWebhook(payload);
        },
        (err: unknown) => err instanceof PaymentAmountMismatchError
      );
    });
  });

  describe('7. Payment State Machine Invariants', () => {
    it('should reject invalid transition from terminal state SUCCEEDED to FAILED', () => {
      const result = evaluatePaymentTransition('SUCCEEDED', 'FAILED');
      assert.equal(result.type, 'CONTRADICTORY');
      if (result.type === 'CONTRADICTORY') {
        assert.ok(result.error instanceof PaymentStateConflictError);
      }
    });

    it('should allow authorized cancellation of pending order', async () => {
      const intent = await createBidIntent({
        businessId: VALID_BIZ_ID,
        marketId: VALID_MARKET_ID,
        targetPosition: 1,
        idempotencyKey: 'intent-c-1',
        actorUserId: OWNER_USER_ID,
      });

      const { paymentOrder } = await createPaymentOrder({
        bidIntentId: intent.id,
        idempotencyKey: 'pay-c-1',
        actorUserId: OWNER_USER_ID,
      });

      const cancelled = cancelPaymentOrder({
        paymentOrderId: paymentOrder.id,
        actorUserId: OWNER_USER_ID,
        reason: 'Client changed mind',
      });

      assert.equal(cancelled.status, 'CANCELLED');
    });
  });

  describe('8. CRITICAL ZERO-MUTATION GUARANTEE', () => {
    it('should complete full payment flow with ZERO ranking and ZERO position mutations', async () => {
      // Step A: Capture Baseline Market State
      const canonicalProvider = new CanonicalRankingStateProvider();
      const rankingsBefore = JSON.stringify(await canonicalProvider.getMarketRankings(VALID_MARKET_ID));

      // Step B: Create BidIntent
      const intent = await createBidIntent({
        businessId: VALID_BIZ_ID,
        marketId: VALID_MARKET_ID,
        targetPosition: 1,
        idempotencyKey: 'intent-zero-mutation',
        actorUserId: OWNER_USER_ID,
      });

      // Step C: Create PaymentOrder
      const { paymentOrder } = await createPaymentOrder({
        bidIntentId: intent.id,
        idempotencyKey: 'pay-zero-mutation',
        actorUserId: OWNER_USER_ID,
      });

      // Step D: Simulate Confirmed PayU Webhook
      const config = getPayUConfig();
      const txnid = paymentOrder.providerTransactionId;
      const amountStr = `${paymentOrder.amountRupees}.00`;

      const webhookHash = generatePayUReverseHash({
        key: config.merchantKey,
        txnid,
        amount: amountStr,
        productinfo: 'AageOnline Paid Visibility',
        firstname: 'Business Member',
        email: 'billing@aageonline.com',
        status: 'success',
        salt: config.merchantSalt,
      });

      const hookPayload = {
        key: config.merchantKey,
        txnid,
        amount: amountStr,
        productinfo: 'AageOnline Paid Visibility',
        firstname: 'Business Member',
        email: 'billing@aageonline.com',
        status: 'success',
        hash: webhookHash,
        mihpayid: 'payu_confirmed_99999',
      };

      const webhookResult = await processPayUWebhook(hookPayload);
      assert.equal(webhookResult.status, 'SUCCEEDED');

      // Verify payment order is confirmed
      const verifiedOrder = getPaymentOrderById(paymentOrder.id, OWNER_USER_ID);
      assert.equal(verifiedOrder.status, 'SUCCEEDED');

      // Step E: Assert Byte-for-Byte Identity of Market Rankings
      const rankingsAfter = JSON.stringify(await canonicalProvider.getMarketRankings(VALID_MARKET_ID));

      assert.equal(
        rankingsBefore,
        rankingsAfter,
        'CRITICAL: Market rankings must be 100% byte-for-byte identical after payment confirmation!'
      );
    });
  });

  describe('9. Data-Access Service Layer', () => {
    it('should delegate cleanly through paymentService singleton', async () => {
      const intent = await createBidIntent({
        businessId: VALID_BIZ_ID,
        marketId: VALID_MARKET_ID,
        targetPosition: 1,
        idempotencyKey: 'intent-da-1',
        actorUserId: OWNER_USER_ID,
      });

      const res = await paymentService.createPaymentOrder({
        bidIntentId: intent.id,
        idempotencyKey: 'pay-da-key-1',
        actorUserId: OWNER_USER_ID,
      });

      assert.equal(res.paymentOrder.status, 'PENDING');

      const byIntent = await paymentService.getPaymentOrderByBidIntentId(intent.id, OWNER_USER_ID);
      assert.equal(byIntent?.id, res.paymentOrder.id);
    });
  });
});
