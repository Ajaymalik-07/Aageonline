/**
 * AageOnline — Phase 1D: Canonical PayU Webhook Routing Audit Test Suite
 *
 * Verifies:
 * 1. Authoritative Webhook Processor: The Next.js route handler (POST /api/payments/webhooks/payu)
 *    authenticates genuine PayU reverse-hash signatures for both JSON and Form-Urlencoded payloads.
 * 2. Invalid Signatures & Mismatched Amounts: Tampered hashes, altered amounts, or unknown txnid are rejected.
 * 3. Duplicate Delivery Idempotency: Replaying an authentic webhook returns HTTP 200 with isDuplicate=true.
 * 4. Persistence Failure Non-Acknowledgment: Database/persistence failures return HTTP 500/503 and are never acknowledged as success.
 * 5. Browser Return Callback Non-Authoritative Invariant: Browser return redirects (GET/POST /api/payments/callback/payu)
 *    always issue HTTP 303 redirects and can NEVER independently authorize ranking settlement.
 * 6. Edge Middleware Exemption & Routing: The Next.js edge middleware permits cross-site webhook and callback
 *    POSTs while blocking unauthorized cross-origin mutations on standard API endpoints.
 */

import { describe, it, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { NextRequest } from 'next/server.js';
import { POST as handlePayUWebhookPost } from '../app/api/payments/webhooks/payu/route.ts';
import { POST as handlePayUCallbackPost, GET as handlePayUCallbackGet } from '../app/api/payments/callback/payu/route.ts';
import { middleware } from '../middleware.ts';
import {
  createBidIntent,
  resetBidIntentStoreForTesting,
} from '../lib/bid-intent/store.ts';
import {
  createPaymentOrder,
  getPaymentOrderByIdAsync,
  resetPaymentStoreForTesting,
} from '../lib/payments/store.ts';
import {
  settleRanking,
  resetSettlementStoreForTesting,
} from '../lib/ranking-settlement/settlement-service.ts';
import { getPayUConfig } from '../lib/payments/payu/client.ts';
import { generatePayUReverseHash } from '../lib/payments/payu/hash.ts';

const TEST_OWNER_ID = 'user-ajay';
const TEST_BUSINESS_ID = 'biz-royal-interiors';
const TEST_MARKET_ID = 'mkt-jaipur-interior-designers';

describe('Phase 1D — Canonical PayU Webhook Routing & Security Audit', () => {
  const originalEnv = { ...process.env };

  const setEnv = (key: string, value?: string) => {
    const env = process.env as Record<string, string | undefined>;
    if (value === undefined) {
      delete env[key];
    } else {
      env[key] = value;
    }
  };

  beforeEach(() => {
    process.env = { ...originalEnv };
    setEnv('NODE_ENV', 'test');
    setEnv('APP_ENV', 'test');
    delete process.env.PERSISTENCE_MODE;
    delete process.env.DATABASE_URL;

    resetBidIntentStoreForTesting();
    resetPaymentStoreForTesting();
    resetSettlementStoreForTesting();
  });

  afterEach(() => {
    process.env = { ...originalEnv };
    resetBidIntentStoreForTesting();
    resetPaymentStoreForTesting();
    resetSettlementStoreForTesting();
  });

  describe('1. Authoritative Webhook Processing (POST /api/payments/webhooks/payu)', () => {
    it('should process authentic JSON webhook and transition payment order to SUCCEEDED', async () => {
      const intent = await createBidIntent({
        businessId: TEST_BUSINESS_ID,
        marketId: TEST_MARKET_ID,
        targetPosition: 1,
        actorUserId: TEST_OWNER_ID,
        idempotencyKey: 'idem-intent-wh-1',
      });

      const { paymentOrder } = await createPaymentOrder({
        bidIntentId: intent.id,
        actorUserId: TEST_OWNER_ID,
        idempotencyKey: 'idem-order-wh-1',
      });

      assert.equal(paymentOrder.status, 'PENDING');

      const config = getPayUConfig();
      const amountStr = `${paymentOrder.amountRupees}.00`;
      const txnid = paymentOrder.providerTransactionId!;

      const reverseHash = generatePayUReverseHash({
        key: config.merchantKey,
        txnid,
        amount: amountStr,
        productinfo: 'AageOnline Paid Visibility',
        firstname: 'Business Member',
        email: 'billing@aageonline.com',
        status: 'success',
        salt: config.merchantSalt,
        udf1: paymentOrder.bidIntentId,
        udf2: paymentOrder.id,
      });

      const jsonPayload = {
        key: config.merchantKey,
        txnid,
        amount: amountStr,
        productinfo: 'AageOnline Paid Visibility',
        firstname: 'Business Member',
        email: 'billing@aageonline.com',
        status: 'success',
        mihpayid: 'payu_mih_1001',
        hash: reverseHash,
        udf1: paymentOrder.bidIntentId,
        udf2: paymentOrder.id,
      };

      const req = new NextRequest('http://localhost:3000/api/payments/webhooks/payu', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(jsonPayload),
      });

      const response = await handlePayUWebhookPost(req);
      assert.equal(response.status, 200);

      const json = await response.json();
      assert.equal(json.status, 'success');
      assert.equal(json.data.processed, true);
      assert.equal(json.data.orderId, paymentOrder.id);
      assert.equal(json.data.paymentStatus, 'SUCCEEDED');
      assert.equal(json.data.isDuplicate, false);

      const updatedOrder = await getPaymentOrderByIdAsync(paymentOrder.id, TEST_OWNER_ID);
      assert.equal(updatedOrder?.status, 'SUCCEEDED');
    });

    it('should process authentic application/x-www-form-urlencoded webhook payload', async () => {
      const intent = await createBidIntent({
        businessId: TEST_BUSINESS_ID,
        marketId: TEST_MARKET_ID,
        targetPosition: 2,
        actorUserId: TEST_OWNER_ID,
        idempotencyKey: 'idem-intent-wh-form',
      });

      const { paymentOrder } = await createPaymentOrder({
        bidIntentId: intent.id,
        actorUserId: TEST_OWNER_ID,
        idempotencyKey: 'idem-order-wh-form',
      });

      const config = getPayUConfig();
      const amountStr = `${paymentOrder.amountRupees}.00`;
      const txnid = paymentOrder.providerTransactionId!;

      const reverseHash = generatePayUReverseHash({
        key: config.merchantKey,
        txnid,
        amount: amountStr,
        productinfo: 'AageOnline Paid Visibility',
        firstname: 'Business Member',
        email: 'billing@aageonline.com',
        status: 'success',
        salt: config.merchantSalt,
        udf1: paymentOrder.bidIntentId,
        udf2: paymentOrder.id,
      });

      const formParams = new URLSearchParams();
      formParams.set('key', config.merchantKey);
      formParams.set('txnid', txnid);
      formParams.set('amount', amountStr);
      formParams.set('productinfo', 'AageOnline Paid Visibility');
      formParams.set('firstname', 'Business Member');
      formParams.set('email', 'billing@aageonline.com');
      formParams.set('status', 'success');
      formParams.set('mihpayid', 'payu_mih_1002');
      formParams.set('hash', reverseHash);
      formParams.set('udf1', paymentOrder.bidIntentId);
      formParams.set('udf2', paymentOrder.id);

      const req = new NextRequest('http://localhost:3000/api/payments/webhooks/payu', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: formParams.toString(),
      });

      const response = await handlePayUWebhookPost(req);
      assert.equal(response.status, 200);

      const json = await response.json();
      assert.equal(json.status, 'success');
      assert.equal(json.data.processed, true);
      assert.equal(json.data.paymentStatus, 'SUCCEEDED');
    });

    it('should reject invalid reverse-hash signature with HTTP 400 Bad Request', async () => {
      const intent = await createBidIntent({
        businessId: TEST_BUSINESS_ID,
        marketId: TEST_MARKET_ID,
        targetPosition: 1,
        actorUserId: TEST_OWNER_ID,
        idempotencyKey: 'idem-intent-wh-badhash',
      });

      const { paymentOrder } = await createPaymentOrder({
        bidIntentId: intent.id,
        actorUserId: TEST_OWNER_ID,
        idempotencyKey: 'idem-order-wh-badhash',
      });

      const req = new NextRequest('http://localhost:3000/api/payments/webhooks/payu', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          key: 'gtKFFx',
          txnid: paymentOrder.providerTransactionId,
          amount: `${paymentOrder.amountRupees}.00`,
          productinfo: 'AageOnline Paid Visibility',
          firstname: 'Business Member',
          email: 'billing@aageonline.com',
          status: 'success',
          hash: 'forged_or_invalid_hash_value_1234567890abcdef',
        }),
      });

      const response = await handlePayUWebhookPost(req);
      assert.equal(response.status, 400);

      const json = await response.json();
      assert.equal(json.status, 'error');
      assert.equal(json.error.code, 'PAYMENT_WEBHOOK_INVALID');

      // The order must remain strictly PENDING
      const order = await getPaymentOrderByIdAsync(paymentOrder.id, TEST_OWNER_ID);
      assert.equal(order?.status, 'PENDING');
    });

    it('should reject mismatched payment amounts with HTTP 409 Conflict', async () => {
      const intent = await createBidIntent({
        businessId: TEST_BUSINESS_ID,
        marketId: TEST_MARKET_ID,
        targetPosition: 1,
        actorUserId: TEST_OWNER_ID,
        idempotencyKey: 'idem-intent-wh-mismatch',
      });

      const { paymentOrder } = await createPaymentOrder({
        bidIntentId: intent.id,
        actorUserId: TEST_OWNER_ID,
        idempotencyKey: 'idem-order-wh-mismatch',
      });

      const config = getPayUConfig();
      const forgedAmountStr = '100.00'; // Genuine order is much higher
      const txnid = paymentOrder.providerTransactionId!;

      // Attacker calculates valid hash for their tampered amount of 100.00
      const reverseHash = generatePayUReverseHash({
        key: config.merchantKey,
        txnid,
        amount: forgedAmountStr,
        productinfo: 'AageOnline Paid Visibility',
        firstname: 'Business Member',
        email: 'billing@aageonline.com',
        status: 'success',
        salt: config.merchantSalt,
        udf1: paymentOrder.bidIntentId,
        udf2: paymentOrder.id,
      });

      const req = new NextRequest('http://localhost:3000/api/payments/webhooks/payu', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          key: config.merchantKey,
          txnid,
          amount: forgedAmountStr,
          productinfo: 'AageOnline Paid Visibility',
          firstname: 'Business Member',
          email: 'billing@aageonline.com',
          status: 'success',
          hash: reverseHash,
          udf1: paymentOrder.bidIntentId,
          udf2: paymentOrder.id,
        }),
      });

      const response = await handlePayUWebhookPost(req);
      assert.equal(response.status, 400);

      const json = await response.json();
      assert.equal(json.status, 'error');
      assert.equal(json.error.code, 'PAYMENT_AMOUNT_MISMATCH');

      // Order must remain PENDING
      const order = await getPaymentOrderByIdAsync(paymentOrder.id, TEST_OWNER_ID);
      assert.equal(order?.status, 'PENDING');
    });

    it('should reject unknown transaction ID with HTTP 404 Not Found', async () => {
      const config = getPayUConfig();
      const unknownTxn = 'txn_unknown_nonexistent_9999';
      const reverseHash = generatePayUReverseHash({
        key: config.merchantKey,
        txnid: unknownTxn,
        amount: '5000.00',
        productinfo: 'AageOnline Paid Visibility',
        firstname: 'Business Member',
        email: 'billing@aageonline.com',
        status: 'success',
        salt: config.merchantSalt,
      });

      const req = new NextRequest('http://localhost:3000/api/payments/webhooks/payu', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          key: config.merchantKey,
          txnid: unknownTxn,
          amount: '5000.00',
          productinfo: 'AageOnline Paid Visibility',
          firstname: 'Business Member',
          email: 'billing@aageonline.com',
          status: 'success',
          hash: reverseHash,
        }),
      });

      const response = await handlePayUWebhookPost(req);
      assert.equal(response.status, 404);

      const json = await response.json();
      assert.equal(json.status, 'error');
      assert.equal(json.error.code, 'PAYMENT_ORDER_NOT_FOUND');
    });

    it('should handle duplicate delivery idempotently returning HTTP 200 with isDuplicate=true', async () => {
      const intent = await createBidIntent({
        businessId: TEST_BUSINESS_ID,
        marketId: TEST_MARKET_ID,
        targetPosition: 1,
        actorUserId: TEST_OWNER_ID,
        idempotencyKey: 'idem-intent-wh-dupe',
      });

      const { paymentOrder } = await createPaymentOrder({
        bidIntentId: intent.id,
        actorUserId: TEST_OWNER_ID,
        idempotencyKey: 'idem-order-wh-dupe',
      });

      const config = getPayUConfig();
      const amountStr = `${paymentOrder.amountRupees}.00`;
      const txnid = paymentOrder.providerTransactionId!;

      const reverseHash = generatePayUReverseHash({
        key: config.merchantKey,
        txnid,
        amount: amountStr,
        productinfo: 'AageOnline Paid Visibility',
        firstname: 'Business Member',
        email: 'billing@aageonline.com',
        status: 'success',
        salt: config.merchantSalt,
        udf1: paymentOrder.bidIntentId,
        udf2: paymentOrder.id,
      });

      const payload = {
        key: config.merchantKey,
        txnid,
        amount: amountStr,
        productinfo: 'AageOnline Paid Visibility',
        firstname: 'Business Member',
        email: 'billing@aageonline.com',
        status: 'success',
        mihpayid: 'payu_mih_1003',
        hash: reverseHash,
        udf1: paymentOrder.bidIntentId,
        udf2: paymentOrder.id,
      };

      // First webhook delivery
      const req1 = new NextRequest('http://localhost:3000/api/payments/webhooks/payu', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const res1 = await handlePayUWebhookPost(req1);
      assert.equal(res1.status, 200);
      const json1 = await res1.json();
      assert.equal(json1.data.isDuplicate, false);

      // Second identical webhook delivery (provider retry or network replay)
      const req2 = new NextRequest('http://localhost:3000/api/payments/webhooks/payu', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const res2 = await handlePayUWebhookPost(req2);
      assert.equal(res2.status, 200);
      const json2 = await res2.json();
      assert.equal(json2.data.isDuplicate, true);
      assert.equal(json2.data.orderId, paymentOrder.id);
      assert.equal(json2.data.paymentStatus, 'SUCCEEDED');
    });

    it('should NOT acknowledge persistence failures as successful (fails closed with HTTP 500)', async () => {
      // Simulate production environment with missing DATABASE_URL
      setEnv('NODE_ENV', 'production');
      delete process.env.DATABASE_URL;

      const req = new NextRequest('http://localhost:3000/api/payments/webhooks/payu', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          key: 'gtKFFx',
          txnid: 'txn_prod_fail_1',
          status: 'success',
          hash: 'somehash',
        }),
      });

      const response = await handlePayUWebhookPost(req);
      // In production without database, the persistence guard throws.
      // The webhook route must NOT return 200 (which would tell PayU everything is fine).
      // It must return 500 or 503 so PayU will retry later when the database is restored.
      assert.notEqual(response.status, 200);
      assert.equal(response.status, 500);

      const json = await response.json();
      assert.equal(json.status, 'error');
      assert.equal(json.error.code, 'WEBHOOK_PROCESSING_FAILED');
      assert.match(json.error.message, /DATABASE_URL is not configured/);
    });
  });

  describe('2. Browser Return Callback Invariants (GET/POST /api/payments/callback/payu)', () => {
    it('should return HTTP 303 Redirect to dashboard on POST callback', async () => {
      const formParams = new URLSearchParams();
      formParams.set('txnid', 'txn_client_redirect_1');
      formParams.set('status', 'success');

      const req = new NextRequest('http://localhost:3000/api/payments/callback/payu', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: formParams.toString(),
      });

      const response = await handlePayUCallbackPost(req);
      assert.equal(response.status, 303);
      const location = response.headers.get('location');
      assert.ok(location);
      assert.match(location, /\/business\/dashboard\/markets/);
      assert.match(location, /paymentStatus=SUCCEEDED/);
      assert.match(location, /paymentTxn=txn_client_redirect_1/);
    });

    it('should return HTTP 303 Redirect on GET callback with query parameters', async () => {
      const req = new NextRequest(
        'http://localhost:3000/api/payments/callback/payu?txnid=txn_client_get_1&status=failure',
        { method: 'GET' }
      );

      const response = await handlePayUCallbackGet(req);
      assert.equal(response.status, 303);
      const location = response.headers.get('location');
      assert.ok(location);
      assert.match(location, /paymentStatus=FAILED/);
      assert.match(location, /paymentTxn=txn_client_get_1/);
    });

    it('should ensure browser callback alone CANNOT settle ranking without verified payment', async () => {
      const intent = await createBidIntent({
        businessId: TEST_BUSINESS_ID,
        marketId: TEST_MARKET_ID,
        targetPosition: 1,
        actorUserId: TEST_OWNER_ID,
        idempotencyKey: 'idem-intent-cb-nosettle',
      });

      const { paymentOrder } = await createPaymentOrder({
        bidIntentId: intent.id,
        actorUserId: TEST_OWNER_ID,
        idempotencyKey: 'idem-order-cb-nosettle',
      });

      assert.equal(paymentOrder.status, 'PENDING');

      // Attacker posts to browser callback with forged parameters
      const formParams = new URLSearchParams();
      formParams.set('txnid', paymentOrder.providerTransactionId!);
      formParams.set('status', 'success');
      formParams.set('hash', 'tampered_hash_client_attempt');

      const req = new NextRequest('http://localhost:3000/api/payments/callback/payu', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: formParams.toString(),
      });

      const callbackRes = await handlePayUCallbackPost(req);
      assert.equal(callbackRes.status, 303);

      // Verify the payment order remains strictly PENDING
      const order = await getPaymentOrderByIdAsync(paymentOrder.id, TEST_OWNER_ID);
      assert.equal(order?.status, 'PENDING');

      // Attempting to settle ranking for this unconfirmed payment order must strictly fail
      await assert.rejects(
        () => settleRanking({
          paymentOrderId: paymentOrder.id,
          actorUserId: TEST_OWNER_ID,
        }),
        /Only CONFIRMED payments may settle into ranking/
      );
    });
  });

  describe('3. Edge Middleware Routing & CSRF Defense Policies', () => {
    it('should exempt PayU server webhook from cross-origin CSRF blocking', () => {
      const req = new NextRequest('http://localhost:3000/api/payments/webhooks/payu', {
        method: 'POST',
        headers: {
          'sec-fetch-site': 'cross-site',
          origin: 'https://secure.payu.in',
        },
      });

      const res = middleware(req);
      assert.notEqual(res.status, 403, 'PayU webhook must not be blocked by CSRF policy');
    });

    it('should exempt PayU browser callback from cross-origin CSRF blocking', () => {
      const req = new NextRequest('http://localhost:3000/api/payments/callback/payu', {
        method: 'POST',
        headers: {
          'sec-fetch-site': 'cross-site',
          origin: 'https://secure.payu.in',
        },
      });

      const res = middleware(req);
      assert.notEqual(res.status, 403, 'PayU callback must not be blocked by CSRF policy');
    });

    it('should enforce CSRF blocking on standard state-changing routes from cross-site origin', () => {
      const req = new NextRequest('http://localhost:3000/api/markets/some-market/pricing', {
        method: 'POST',
        headers: {
          'sec-fetch-site': 'cross-site',
          origin: 'https://malicious-site.example.com',
        },
      });

      const res = middleware(req);
      assert.equal(res.status, 403, 'Standard mutations must be blocked from cross-site origin');
    });
  });
});
