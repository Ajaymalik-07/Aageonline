/**
 * AageOnline — Payment Gateway Provider Interface
 * Decouples Payment Domain from specific vendor implementations (PayU).
 */

import type { PaymentOrder, PayUCheckoutPayload } from '../../types/payment.ts';

export interface CustomerInfo {
  name: string;
  email: string;
  phone: string;
}

export interface ProviderVerificationResult {
  provider: 'PAYU';
  providerTransactionId: string;
  providerPaymentId?: string | null;
  status: 'SUCCESS' | 'FAILURE' | 'PENDING' | 'NOT_FOUND';
  amountMinor: number;
  amountRupees: number;
  currency: string;
  rawStatus?: string;
  rawResponse?: Record<string, unknown>;
}

export interface VerifiedWebhookResult {
  isValid: boolean;
  providerTransactionId?: string;
  providerPaymentId?: string;
  status?: 'SUCCESS' | 'FAILURE' | 'PENDING';
  amountRupees?: number;
  amountMinor?: number;
  currency?: string;
  bidIntentId?: string;
  paymentOrderId?: string;
  errorMessage?: string;
  rawPayload: Record<string, string>;
}

export interface PaymentGatewayDataSource {
  generateCheckout(order: PaymentOrder, customer: CustomerInfo): Promise<PayUCheckoutPayload>;
  verifyPayment(transactionId: string): Promise<ProviderVerificationResult>;
  verifyWebhook(payload: Record<string, string>): Promise<VerifiedWebhookResult>;
}
