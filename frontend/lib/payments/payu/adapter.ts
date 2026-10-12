/**
 * AageOnline — PayU Payment Gateway Adapter
 * Concrete implementation of PaymentGatewayDataSource for PayU India.
 */

import type { PaymentOrder, PayUCheckoutPayload } from '../../../types/payment.ts';
import type { CustomerInfo, PaymentGatewayDataSource, ProviderVerificationResult, VerifiedWebhookResult } from '../types.ts';
import { getPayUConfig } from './client.ts';
import { generatePayURequestHash } from './hash.ts';
import { parseAndVerifyPayUWebhook } from './webhook.ts';
import { verifyPayUPayment } from './verification.ts';

export class PayUPaymentGateway implements PaymentGatewayDataSource {
  async generateCheckout(order: PaymentOrder, customer: CustomerInfo): Promise<PayUCheckoutPayload> {
    const config = getPayUConfig();
    const amountStr = `${order.amountRupees}.00`;
    const productInfo = 'AageOnline Paid Visibility';

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const callbackUrl = `${baseUrl}/api/payments/callback/payu`;

    const hash = generatePayURequestHash({
      key: config.merchantKey,
      txnid: order.providerTransactionId,
      amount: amountStr,
      productinfo: productInfo,
      firstname: customer.name || 'Business Member',
      email: customer.email || 'billing@aageonline.com',
      udf1: order.bidIntentId,
      udf2: order.id,
      salt: config.merchantSalt,
    });

    return {
      provider: 'PAYU',
      actionUrl: config.checkoutUrl,
      method: 'POST',
      fields: {
        key: config.merchantKey,
        txnid: order.providerTransactionId,
        amount: amountStr,
        productinfo: productInfo,
        firstname: customer.name || 'Business Member',
        email: customer.email || 'billing@aageonline.com',
        phone: customer.phone || '9999999999',
        surl: callbackUrl,
        furl: callbackUrl,
        hash,
        udf1: order.bidIntentId,
        udf2: order.id,
      },
    };
  }

  async verifyPayment(transactionId: string): Promise<ProviderVerificationResult> {
    return verifyPayUPayment(transactionId);
  }

  async verifyWebhook(payload: Record<string, string>): Promise<VerifiedWebhookResult> {
    return parseAndVerifyPayUWebhook(payload);
  }
}

export const defaultPayUGateway = new PayUPaymentGateway();
