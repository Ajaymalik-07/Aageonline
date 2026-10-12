/**
 * AageOnline — PayU Webhook & Callback Verification
 * Verifies PayU reverse hash and extracts validated parameters.
 */

import type { VerifiedWebhookResult } from '../types.ts';
import { getPayUConfig } from './client.ts';
import { generatePayUReverseHash, verifyPayUHash } from './hash.ts';
import { mapPayUStatusToDomain } from './mapper.ts';

export function parseAndVerifyPayUWebhook(payload: Record<string, string>): VerifiedWebhookResult {
  const config = getPayUConfig();

  const key = payload.key || '';
  const txnid = payload.txnid || '';
  const amountStr = payload.amount || '';
  const productinfo = payload.productinfo || '';
  const firstname = payload.firstname || '';
  const email = payload.email || '';
  const status = payload.status || '';
  const receivedHash = payload.hash || '';
  const udf1 = payload.udf1 || '';
  const udf2 = payload.udf2 || '';
  const udf3 = payload.udf3 || '';
  const udf4 = payload.udf4 || '';
  const udf5 = payload.udf5 || '';
  const additionalCharges = payload.additionalCharges || '';
  const providerPaymentId = payload.mihpayid || undefined;

  // Basic required presence check
  if (!key || !txnid || !amountStr || !status || !receivedHash) {
    return {
      isValid: false,
      errorMessage: 'Missing required webhook fields (key, txnid, amount, status, or hash).',
      rawPayload: payload,
    };
  }

  // Generate expected reverse hash
  const expectedHash = generatePayUReverseHash({
    key,
    txnid,
    amount: amountStr,
    productinfo,
    firstname,
    email,
    status,
    udf1,
    udf2,
    udf3,
    udf4,
    udf5,
    additionalCharges,
    salt: config.merchantSalt,
  });

  const isHashValid = verifyPayUHash(receivedHash, expectedHash);

  if (!isHashValid) {
    return {
      isValid: false,
      errorMessage: 'PayU webhook signature verification failed (invalid reverse hash).',
      rawPayload: payload,
    };
  }

  const parsedAmountRupees = parseFloat(amountStr);
  const amountRupees = Math.round(parsedAmountRupees);
  const amountMinor = amountRupees * 100;

  const mappedStatus = mapPayUStatusToDomain(status);

  return {
    isValid: true,
    providerTransactionId: txnid,
    providerPaymentId,
    status: mappedStatus === 'SUCCEEDED' ? 'SUCCESS' : mappedStatus === 'FAILED' ? 'FAILURE' : 'PENDING',
    amountRupees,
    amountMinor,
    currency: 'INR',
    bidIntentId: udf1 || undefined,
    paymentOrderId: udf2 || undefined,
    rawPayload: payload,
  };
}
