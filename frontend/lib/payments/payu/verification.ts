/**
 * AageOnline — PayU Server-Side Payment Verification Client
 * Calls PayU Verify Payment API command for authoritative reconciliation.
 */

import type { ProviderVerificationResult } from '../types.ts';
import { getPayUConfig } from './client.ts';
import { generatePayUVerifyPaymentHash } from './hash.ts';
import { mapPayUStatusToDomain } from './mapper.ts';

interface PayUVerifyTransactionDetails {
  status?: string;
  amount?: string;
  mihpayid?: string;
  error_code?: string;
  field9?: string;
  [key: string]: unknown;
}

interface PayUVerifyApiResponse {
  status: number | string;
  msg?: string;
  transaction_details?: Record<string, PayUVerifyTransactionDetails>;
}

export async function verifyPayUPayment(
  transactionId: string,
  timeoutMs: number = 5000
): Promise<ProviderVerificationResult> {
  const config = getPayUConfig();
  const hash = generatePayUVerifyPaymentHash(config.merchantKey, transactionId, config.merchantSalt);

  const formParams = new URLSearchParams();
  formParams.append('key', config.merchantKey);
  formParams.append('command', 'verify_payment');
  formParams.append('var1', transactionId);
  formParams.append('hash', hash);

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(config.verifyPaymentUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: formParams.toString(),
      signal: controller.signal,
    });

    if (!response.ok) {
      return {
        provider: 'PAYU',
        providerTransactionId: transactionId,
        status: 'FAILURE',
        amountMinor: 0,
        amountRupees: 0,
        currency: 'INR',
        rawStatus: `HTTP_${response.status}`,
      };
    }

    const data = (await response.json()) as PayUVerifyApiResponse;

    if (!data.transaction_details || !data.transaction_details[transactionId]) {
      return {
        provider: 'PAYU',
        providerTransactionId: transactionId,
        status: 'NOT_FOUND',
        amountMinor: 0,
        amountRupees: 0,
        currency: 'INR',
        rawStatus: 'TRANSACTION_NOT_FOUND',
      };
    }

    const txDetails = data.transaction_details[transactionId];
    const mapped = mapPayUStatusToDomain(txDetails.status);

    const amountRupees = txDetails.amount ? Math.round(parseFloat(txDetails.amount)) : 0;
    const amountMinor = amountRupees * 100;

    return {
      provider: 'PAYU',
      providerTransactionId: transactionId,
      providerPaymentId: txDetails.mihpayid,
      status: mapped === 'SUCCEEDED' ? 'SUCCESS' : mapped === 'FAILED' ? 'FAILURE' : 'PENDING',
      amountMinor,
      amountRupees,
      currency: 'INR',
      rawStatus: txDetails.status,
      rawResponse: txDetails,
    };
  } catch (error: unknown) {
    const isAbort = error instanceof Error && error.name === 'AbortError';
    return {
      provider: 'PAYU',
      providerTransactionId: transactionId,
      status: 'FAILURE',
      amountMinor: 0,
      amountRupees: 0,
      currency: 'INR',
      rawStatus: isAbort ? 'TIMEOUT' : 'NETWORK_ERROR',
    };
  } finally {
    clearTimeout(timer);
  }
}
