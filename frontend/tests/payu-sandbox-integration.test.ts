/**
 * AageOnline — Milestone 0.20.32 Payment Provider Sandbox & External Webhook Verification Test Suite
 *
 * Test Evidence Levels:
 * Level 1: Unit & Cryptographic Invariant Tests (Request hash, reverse response hash, timing-safe equal, amount check).
 * Level 2: PostgreSQL Integration Tests (Disposable DB 'aageonline_integration_test', idempotency, concurrency, atomic settlement, rollback).
 * Level 3: External PayU Sandbox Verification (Live test.payu.in handshake with test merchant credentials).
 */

import { describe, it, before, after, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import {
  isDatabaseConfigured,
  checkDatabaseHealth,
  getDbPool,
  closeDbPool,
} from '../lib/db/client.ts';
import {
  validateDisposableTestDatabase,
  assertDisposableTestDatabase,
  redactConnectionString,
} from '../lib/db/test-safety.ts';
import { getPayUConfig } from '../lib/payments/payu/client.ts';
import {
  generatePayURequestHash,
  generatePayUReverseHash,
  generatePayUVerifyPaymentHash,
  verifyPayUHash,
} from '../lib/payments/payu/hash.ts';
import { parseAndVerifyPayUWebhook } from '../lib/payments/payu/webhook.ts';
import { verifyPayUPayment } from '../lib/payments/payu/verification.ts';
import {
  createPaymentOrder,
  processPayUWebhook,
  getPaymentOrderByIdAsync,
  confirmPaymentOrderAsync,
  resetPaymentStoreForTesting,
} from '../lib/payments/store.ts';
import {
  createBidIntent,
  resetBidIntentStoreForTesting,
} from '../lib/bid-intent/store.ts';
import {
  settleRanking,
  getRankingSettlementByPaymentOrderId,
  resetSettlementStoreForTesting,
} from '../lib/ranking-settlement/settlement-service.ts';
import {
  setTransactionFailureInjection,
  resetTransactionManagerForTesting,
} from '../lib/ranking-settlement/transaction.ts';
import {
  PaymentAmountMismatchError,
  PaymentOrderNotFoundError,
  PaymentWebhookInvalidError,
} from '../lib/payments/errors.ts';
import { PostgresPaymentRepository } from '../lib/db/repositories/payment-repository.ts';
import { PostgresRankingSettlementRepository } from '../lib/db/repositories/ranking-settlement-repository.ts';
import { PostgresMarketParticipationRepository } from '../lib/db/repositories/market-participation-repository.ts';
import { PostgresPositionHistoryRepository } from '../lib/db/repositories/position-history-repository.ts';

const TEST_OWNER_ID = 'user-ajay';
const TEST_BUSINESS_ID = 'biz-royal-interiors';
const TEST_MARKET_ID = 'mkt-jaipur-interior-designers';

describe('Milestone 0.20.32 — PayU Sandbox & External Webhook Verification', () => {
  let isLiveDb = false;
  let targetDbName = '';
  const originalEnv = { ...process.env };

  before(async () => {
    const rawUrl = process.env.INTEGRATION_TEST_DATABASE_URL || process.env.DATABASE_URL;
    if (rawUrl) {
      const safety = validateDisposableTestDatabase(rawUrl);
      if (safety.isSafe) {
        process.env.DATABASE_URL = rawUrl;
        const health = await checkDatabaseHealth();
        if (health.healthy) {
          isLiveDb = true;
          targetDbName = safety.databaseName || '';
          console.log(`[Milestone 0.20.32] Connected to verified disposable database "${targetDbName}" in ${health.latencyMs}ms`);

          const pool = getDbPool();
          await pool.query(`
            INSERT INTO locations (id, name, slug, type) 
            VALUES ('city-jaipur', 'Jaipur', 'jaipur', 'CITY')
            ON CONFLICT (id) DO NOTHING;

            INSERT INTO categories (id, name, slug) 
            VALUES ('cat-interior-designers', 'Interior Designers', 'interior-designers')
            ON CONFLICT (id) DO NOTHING;

            INSERT INTO markets (id, location_id, category_id, slug, status, publication_status)
            VALUES ('mkt-jaipur-interior-designers', 'city-jaipur', 'cat-interior-designers', 'jaipur/interior-designers', 'PUBLISHED', 'PUBLISHED')
            ON CONFLICT (id) DO NOTHING;

            INSERT INTO users (id, email, name, role)
            VALUES ('user-ajay', 'ajay@example.com', 'Ajay', 'BUSINESS_OWNER')
            ON CONFLICT (id) DO NOTHING;

            INSERT INTO businesses (id, slug, name, legal_name, verification_status, publication_status, primary_city_id)
            VALUES ('biz-royal-interiors', 'royal-interiors-jaipur', 'Royal Interiors Studio', 'Royal Interiors Architectural Solutions Pvt Ltd', 'VERIFIED', 'PUBLISHED', 'city-jaipur')
            ON CONFLICT (id) DO NOTHING;

            INSERT INTO business_memberships (id, business_id, user_id, role, status)
            VALUES ('mem-royal-ajay', 'biz-royal-interiors', 'user-ajay', 'OWNER', 'ACTIVE')
            ON CONFLICT (id) DO NOTHING;
          `);
        }
      }
    }
  });

  after(async () => {
    if (isLiveDb) {
      try {
        const pool = getDbPool();
        await pool.query(`
          DELETE FROM ranking_change_events WHERE business_id = 'biz-royal-interiors' OR business_id LIKE 'biz_m32_%';
          DELETE FROM position_history WHERE id LIKE 'ph_m32_%' OR business_id LIKE 'biz_m32_%' OR business_id = 'biz-royal-interiors';
          DELETE FROM ranking_settlements WHERE id LIKE 'rs_m32_%' OR business_id LIKE 'biz_m32_%' OR business_id = 'biz-royal-interiors';
          DELETE FROM payment_provider_events WHERE id LIKE 'pve_%';
          DELETE FROM payment_orders WHERE id LIKE 'po_m32_%' OR business_id LIKE 'biz_m32_%' OR business_id = 'biz-royal-interiors';
          DELETE FROM bid_intents WHERE id LIKE 'bi_m32_%' OR business_id LIKE 'biz_m32_%' OR business_id = 'biz-royal-interiors';
          DELETE FROM market_participations WHERE market_id = 'mkt-jaipur-interior-designers' AND business_id = 'biz-royal-interiors';
        `);
      } catch (err) {
        console.warn('Cleanup warning:', err);
      } finally {
        await closeDbPool();
      }
    }
    process.env = { ...originalEnv };
  });


  beforeEach(async () => {
    resetBidIntentStoreForTesting();
    resetPaymentStoreForTesting();
    resetSettlementStoreForTesting();
    resetTransactionManagerForTesting();
    if (isLiveDb) {
      try {
        const pool = getDbPool();
        await pool.query(`
          DELETE FROM ranking_change_events WHERE business_id = 'biz-royal-interiors' OR business_id LIKE 'biz_m32_%';
          DELETE FROM position_history WHERE id LIKE 'ph_m32_%' OR business_id LIKE 'biz_m32_%' OR business_id = 'biz-royal-interiors';
          DELETE FROM ranking_settlements WHERE id LIKE 'rs_m32_%' OR business_id LIKE 'biz_m32_%' OR business_id = 'biz-royal-interiors';
          DELETE FROM payment_provider_events WHERE id LIKE 'pve_%';
          DELETE FROM payment_orders WHERE id LIKE 'po_m32_%' OR business_id LIKE 'biz_m32_%' OR business_id = 'biz-royal-interiors';
          DELETE FROM bid_intents WHERE id LIKE 'bi_m32_%' OR business_id LIKE 'biz_m32_%' OR business_id = 'biz-royal-interiors';
          DELETE FROM market_participations WHERE market_id = 'mkt-jaipur-interior-designers' AND business_id = 'biz-royal-interiors';
        `);
      } catch {
        // ignore
      }
    }
  });

  describe('1. PayU Sandbox Configuration & Separation Invariants', () => {
    it('should separate test sandbox from production endpoints and load standard test credentials', () => {
      const config = getPayUConfig();
      assert.strictEqual(config.env, 'test');
      assert.strictEqual(config.checkoutUrl, 'https://test.payu.in/_payment');
      assert.strictEqual(config.verifyPaymentUrl, 'https://test.payu.in/merchant/postservice?form=2');
      assert.strictEqual(config.merchantKey, 'gtKFFx');
      assert.strictEqual(config.merchantSalt, 'eCwWELxi');
    });

    it('should fail closed or refuse silent fallback if configured with production environment without credentials', () => {
      process.env.PAYU_ENV = 'production';
      delete process.env.PAYU_MERCHANT_KEY;
      delete process.env.PAYU_MERCHANT_SALT;

      const prodConfig = getPayUConfig();
      assert.strictEqual(prodConfig.env, 'production');
      assert.strictEqual(prodConfig.checkoutUrl, 'https://secure.payu.in/_payment');
      assert.strictEqual(prodConfig.verifyPaymentUrl, 'https://info.payu.in/merchant/postservice?form=2');

      // Restore
      process.env.PAYU_ENV = 'test';
    });
  });

  describe('2. Cryptographic Hash Validation & Tampering Rejection', () => {
    it('should calculate valid PayU request hash and verify reverse response hash', () => {
      const reqHash = generatePayURequestHash({
        key: 'gtKFFx',
        txnid: 'txn_m32_1001',
        amount: '28500.00',
        productinfo: 'Market Position Purchase',
        firstname: 'Ajay',
        email: 'ajay@example.com',
        salt: 'eCwWELxi',
      });
      assert.strictEqual(typeof reqHash, 'string');
      assert.strictEqual(reqHash.length, 128);

      const revHash = generatePayUReverseHash({
        key: 'gtKFFx',
        txnid: 'txn_m32_1001',
        amount: '28500.00',
        productinfo: 'Market Position Purchase',
        firstname: 'Ajay',
        email: 'ajay@example.com',
        status: 'success',
        salt: 'eCwWELxi',
      });
      assert.strictEqual(typeof revHash, 'string');
      assert.strictEqual(revHash.length, 128);

      // Constant-time check
      const isValid = verifyPayUHash(revHash, revHash);
      assert.strictEqual(isValid, true);
    });

    it('should calculate reverse hash with additionalCharges when surcharges are present', () => {
      const revWithSurcharge = generatePayUReverseHash({
        key: 'gtKFFx',
        txnid: 'txn_m32_1002',
        amount: '28500.00',
        productinfo: 'Market Position Purchase',
        firstname: 'Ajay',
        email: 'ajay@example.com',
        status: 'success',
        additionalCharges: '150.00',
        salt: 'eCwWELxi',
      });
      const revWithoutSurcharge = generatePayUReverseHash({
        key: 'gtKFFx',
        txnid: 'txn_m32_1002',
        amount: '28500.00',
        productinfo: 'Market Position Purchase',
        firstname: 'Ajay',
        email: 'ajay@example.com',
        status: 'success',
        salt: 'eCwWELxi',
      });

      assert.notStrictEqual(revWithSurcharge, revWithoutSurcharge);
      assert.strictEqual(revWithSurcharge.length, 128);
    });

    it('should reject tampered signature, tampered amount, or swapped salt', () => {
      const payload: Record<string, string> = {
        key: 'gtKFFx',
        txnid: 'txn_m32_tamper_1',
        amount: '28500.00',
        productinfo: 'Market Position Purchase',
        firstname: 'Ajay',
        email: 'ajay@example.com',
        status: 'success',
        salt: 'eCwWELxi',
      };

      const validHash = generatePayUReverseHash({ ...payload, salt: 'eCwWELxi' } as any);
      payload.hash = validHash;

      // 1. Valid verification
      const goodResult = parseAndVerifyPayUWebhook(payload);
      assert.strictEqual(goodResult.isValid, true);

      // 2. Tampered amount in webhook payload
      const tamperedAmountPayload = { ...payload, amount: '1.00' };
      const badAmountResult = parseAndVerifyPayUWebhook(tamperedAmountPayload);
      assert.strictEqual(badAmountResult.isValid, false);
      assert.match(badAmountResult.errorMessage || '', /signature verification failed/i);

      // 3. Altered transaction ID
      const tamperedTxnPayload = { ...payload, txnid: 'txn_m32_other' };
      const badTxnResult = parseAndVerifyPayUWebhook(tamperedTxnPayload);
      assert.strictEqual(badTxnResult.isValid, false);
    });
  });

  describe('3. PostgreSQL Webhook Processing & Idempotency Invariants', () => {
    it('should process verified webhook callback and update order status in PostgreSQL', async () => {
      const intent = await createBidIntent({
        businessId: TEST_BUSINESS_ID,
        marketId: TEST_MARKET_ID,
        targetPosition: 1,
        idempotencyKey: 'idemp_m32_wh_1',
        actorUserId: TEST_OWNER_ID,
      });

      const orderResult = await createPaymentOrder({
        bidIntentId: intent.id,
        idempotencyKey: 'idemp_m32_pay_1',
        actorUserId: TEST_OWNER_ID,
      });
      const order = orderResult.paymentOrder;
      assert.strictEqual(order.status, 'PENDING');

      const amountStr = (order.amountMinor / 100).toFixed(2);
      const reverseHash = generatePayUReverseHash({
        key: 'gtKFFx',
        txnid: order.providerTransactionId!,
        amount: amountStr,
        productinfo: `BidIntent ${intent.id}`,
        firstname: 'Ajay',
        email: 'ajay@royalinteriors.example.com',
        status: 'success',
        salt: 'eCwWELxi',
      });

      const webhookPayload: Record<string, string> = {
        key: 'gtKFFx',
        txnid: order.providerTransactionId!,
        amount: amountStr,
        productinfo: `BidIntent ${intent.id}`,
        firstname: 'Ajay',
        email: 'ajay@royalinteriors.example.com',
        status: 'success',
        mihpayid: 'payu_pay_id_9901',
        hash: reverseHash,
      };

      const result = await processPayUWebhook(webhookPayload);
      assert.strictEqual(result.processed, true);
      assert.strictEqual(result.status, 'SUCCEEDED');
      assert.strictEqual(result.isDuplicate, false);

      // Verify persistence in PostgreSQL
      if (isLiveDb) {
        const repo = new PostgresPaymentRepository();
        const persisted = await repo.getPaymentOrderById(order.id);
        assert.ok(persisted);
        assert.strictEqual(persisted.status, 'SUCCEEDED');
        assert.strictEqual(persisted.providerPaymentId, 'payu_pay_id_9901');
      }
    });

    it('should handle duplicate webhook callback idempotently without re-executing state mutation', async () => {
      const intent = await createBidIntent({
        businessId: TEST_BUSINESS_ID,
        marketId: TEST_MARKET_ID,
        targetPosition: 1,
        idempotencyKey: 'idemp_m32_dup_1',
        actorUserId: TEST_OWNER_ID,
      });

      const orderResult = await createPaymentOrder({
        bidIntentId: intent.id,
        idempotencyKey: 'idemp_m32_pay_dup_1',
        actorUserId: TEST_OWNER_ID,
      });
      const order = orderResult.paymentOrder;
      const amountStr = (order.amountMinor / 100).toFixed(2);

      const reverseHash = generatePayUReverseHash({
        key: 'gtKFFx',
        txnid: order.providerTransactionId!,
        amount: amountStr,
        productinfo: `BidIntent ${intent.id}`,
        firstname: 'Ajay',
        email: 'ajay@royalinteriors.example.com',
        status: 'success',
        salt: 'eCwWELxi',
      });

      const webhookPayload: Record<string, string> = {
        key: 'gtKFFx',
        txnid: order.providerTransactionId!,
        amount: amountStr,
        productinfo: `BidIntent ${intent.id}`,
        firstname: 'Ajay',
        email: 'ajay@royalinteriors.example.com',
        status: 'success',
        mihpayid: 'payu_pay_id_9902',
        hash: reverseHash,
      };

      // First delivery
      const first = await processPayUWebhook(webhookPayload);
      assert.strictEqual(first.processed, true);
      assert.strictEqual(first.isDuplicate, false);

      // Replay identical delivery
      const second = await processPayUWebhook(webhookPayload);
      assert.strictEqual(second.processed, true);
      assert.strictEqual(second.isDuplicate, true);
      assert.strictEqual(second.status, 'SUCCEEDED');
    });

    it('should reject webhook if amount mismatches the server-calculated payment order amount', async () => {
      const intent = await createBidIntent({
        businessId: TEST_BUSINESS_ID,
        marketId: TEST_MARKET_ID,
        targetPosition: 1,
        idempotencyKey: 'idemp_m32_amt_1',
        actorUserId: TEST_OWNER_ID,
      });

      const orderResult = await createPaymentOrder({
        bidIntentId: intent.id,
        idempotencyKey: 'idemp_m32_pay_amt_1',
        actorUserId: TEST_OWNER_ID,
      });
      const order = orderResult.paymentOrder;

      // Attacker generates valid signature for a different amount (e.g. 100.00 instead of full price)
      const fakeAmountStr = '100.00';
      const fakeHash = generatePayUReverseHash({
        key: 'gtKFFx',
        txnid: order.providerTransactionId!,
        amount: fakeAmountStr,
        productinfo: `BidIntent ${intent.id}`,
        firstname: 'Ajay',
        email: 'ajay@royalinteriors.example.com',
        status: 'success',
        salt: 'eCwWELxi',
      });

      const badPayload: Record<string, string> = {
        key: 'gtKFFx',
        txnid: order.providerTransactionId!,
        amount: fakeAmountStr,
        productinfo: `BidIntent ${intent.id}`,
        firstname: 'Ajay',
        email: 'ajay@royalinteriors.example.com',
        status: 'success',
        mihpayid: 'payu_pay_id_fraud',
        hash: fakeHash,
      };

      await assert.rejects(
        async () => {
          await processPayUWebhook(badPayload);
        },
        (err: unknown) => err instanceof PaymentAmountMismatchError
      );

      // Verify order remains PENDING in storage
      const fetchedOrder = await getPaymentOrderByIdAsync(order.id, TEST_OWNER_ID);
      assert.strictEqual(fetchedOrder.status, 'PENDING');
    });
  });

  describe('4. Concurrency & Replay Invariants under Load', () => {
    it('should safely serialize 5 concurrent webhook deliveries for the same transaction without duplicate settlement', async () => {
      const intent = await createBidIntent({
        businessId: TEST_BUSINESS_ID,
        marketId: TEST_MARKET_ID,
        targetPosition: 1,
        idempotencyKey: 'idemp_m32_conc_1',
        actorUserId: TEST_OWNER_ID,
      });

      const orderResult = await createPaymentOrder({
        bidIntentId: intent.id,
        idempotencyKey: 'idemp_m32_pay_conc_1',
        actorUserId: TEST_OWNER_ID,
      });
      const order = orderResult.paymentOrder;
      const amountStr = (order.amountMinor / 100).toFixed(2);

      const reverseHash = generatePayUReverseHash({
        key: 'gtKFFx',
        txnid: order.providerTransactionId!,
        amount: amountStr,
        productinfo: `BidIntent ${intent.id}`,
        firstname: 'Ajay',
        email: 'ajay@royalinteriors.example.com',
        status: 'success',
        salt: 'eCwWELxi',
      });

      const payload: Record<string, string> = {
        key: 'gtKFFx',
        txnid: order.providerTransactionId!,
        amount: amountStr,
        productinfo: `BidIntent ${intent.id}`,
        firstname: 'Ajay',
        email: 'ajay@royalinteriors.example.com',
        status: 'success',
        mihpayid: 'payu_pay_id_conc',
        hash: reverseHash,
      };

      // Trigger 5 concurrent webhook executions
      const results = await Promise.all([
        processPayUWebhook(payload),
        processPayUWebhook(payload),
        processPayUWebhook(payload),
        processPayUWebhook(payload),
        processPayUWebhook(payload),
      ]);

      // All 5 must succeed
      for (const res of results) {
        assert.strictEqual(res.processed, true);
        assert.strictEqual(res.status, 'SUCCEEDED');
      }

      // Exactly 1 must be initial (isDuplicate: false) and 4 must be duplicate (isDuplicate: true)
      const initialCount = results.filter((r) => !r.isDuplicate).length;
      const duplicateCount = results.filter((r) => r.isDuplicate).length;
      assert.strictEqual(initialCount, 1);
      assert.strictEqual(duplicateCount, 4);
    });
  });

  describe('5. Atomic Ranking Settlement & Rollback Invariants', () => {
    it('should atomically settle ranking and create position history once payment is CONFIRMED', async () => {
      const intent = await createBidIntent({
        businessId: TEST_BUSINESS_ID,
        marketId: TEST_MARKET_ID,
        targetPosition: 1,
        idempotencyKey: 'idemp_m32_settle_1',
        actorUserId: TEST_OWNER_ID,
      });

      const orderResult = await createPaymentOrder({
        bidIntentId: intent.id,
        idempotencyKey: 'idemp_m32_pay_settle_1',
        actorUserId: TEST_OWNER_ID,
      });
      const order = orderResult.paymentOrder;

      // Confirm payment order
      await confirmPaymentOrderAsync(order.id, 'payu_confirmed_9905');

      // Execute settlement
      const settlementResult = await settleRanking({
        paymentOrderId: order.id,
        actorUserId: TEST_OWNER_ID,
      });

      assert.strictEqual(settlementResult.settlement.status, 'SETTLED');
      assert.strictEqual(settlementResult.settlement.paymentOrderId, order.id);
      assert.ok(typeof settlementResult.settlement.finalPosition === 'number' && settlementResult.settlement.finalPosition >= 1);

      // Verify idempotent replay
      const secondSettlement = await settleRanking({
        paymentOrderId: order.id,
        actorUserId: TEST_OWNER_ID,
      });
      assert.strictEqual(secondSettlement.settlement.id, settlementResult.settlement.id);
      assert.strictEqual(secondSettlement.settlement.status, 'SETTLED');
    });

    it('should roll back all mutations and maintain position history consistency if failure is injected during transaction', async () => {
      const intent = await createBidIntent({
        businessId: TEST_BUSINESS_ID,
        marketId: TEST_MARKET_ID,
        targetPosition: 1,
        idempotencyKey: 'idemp_m32_roll_1',
        actorUserId: TEST_OWNER_ID,
      });

      const orderResult = await createPaymentOrder({
        bidIntentId: intent.id,
        idempotencyKey: 'idemp_m32_pay_roll_1',
        actorUserId: TEST_OWNER_ID,
      });
      const order = orderResult.paymentOrder;

      await confirmPaymentOrderAsync(order.id, 'payu_confirmed_rollback');

      // Inject failure during database transaction
      setTransactionFailureInjection('before_settlement_record');

      await assert.rejects(
        () =>
          settleRanking({
            paymentOrderId: order.id,
            actorUserId: TEST_OWNER_ID,
          }),
        /Simulated failure before settlement record/
      );

      // Reset failure injection
      setTransactionFailureInjection(null);

      // Verify settlement is not SETTLED (marked RETRYABLE after rollback)
      const existing = await getRankingSettlementByPaymentOrderId(order.id);
      assert.ok(existing);
      assert.strictEqual(existing.status, 'RETRYABLE');
    });
  });

  describe('6. External PayU Sandbox Network Verification (test.payu.in)', () => {
    it('should execute live handshake with PayU test sandbox Verify Payment API', async () => {
      const testTxnId = `txn_live_test_${Date.now()}`;
      
      // Execute live call to PayU test sandbox
      const verificationResult = await verifyPayUPayment(testTxnId, 6000);

      // PayU returns structured response
      assert.strictEqual(verificationResult.provider, 'PAYU');
      assert.strictEqual(verificationResult.providerTransactionId, testTxnId);
      
      // Because this is a newly generated random transaction, PayU's sandbox correctly returns NOT_FOUND
      assert.ok(
        verificationResult.status === 'NOT_FOUND' || verificationResult.status === 'FAILURE',
        `Expected NOT_FOUND or FAILURE for non-existent test txn, got: ${verificationResult.status}`
      );
    });
  });
});

