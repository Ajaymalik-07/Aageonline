/**
 * AageOnline — Remote REST API Payment Data-Access Adapter
 * Dispatches to /api/bid-intents/:id/payment-order and maps HTTP errors to domain exceptions.
 */

import type {
  CancelPaymentOrderInput,
  CreatePaymentOrderInput,
  PaymentOrder,
  PaymentOrderResult,
} from '../../types/payment.ts';
import {
  PaymentBidIntentExpiredError,
  PaymentBidIntentNotFoundError,
  PaymentDomainError,
  PaymentIdempotencyKeyReusedError,
  PaymentOrderNotFoundError,
  UnauthorizedPaymentAccessError,
  UnauthenticatedPaymentError,
} from '../../lib/payments/errors.ts';
import type { PaymentDataSource } from './service.ts';

export class ApiPaymentDataSource implements PaymentDataSource {
  private readonly baseUrl: string;

  constructor(baseUrl: string = '') {
    this.baseUrl = baseUrl;
  }

  async createPaymentOrder(input: CreatePaymentOrderInput): Promise<PaymentOrderResult> {
    const res = await fetch(`${this.baseUrl}/api/bid-intents/${input.bidIntentId}/payment-order`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Idempotency-Key': input.idempotencyKey,
      },
      body: JSON.stringify({
        customerName: input.customerName,
        customerEmail: input.customerEmail,
        customerPhone: input.customerPhone,
      }),
    });

    if (!res.ok) {
      const errorJson = await res.json().catch(() => ({}));
      const code = errorJson?.error?.code || 'PAYMENT_API_ERROR';
      const msg = errorJson?.error?.message || 'Failed to create payment order.';

      if (res.status === 401) throw new UnauthenticatedPaymentError(msg);
      if (res.status === 403) throw new UnauthorizedPaymentAccessError(msg);
      if (res.status === 404) throw new PaymentBidIntentNotFoundError(input.bidIntentId);
      if (code === 'BID_INTENT_EXPIRED') throw new PaymentBidIntentExpiredError(input.bidIntentId, 'now');
      if (code === 'IDEMPOTENCY_KEY_REUSED') throw new PaymentIdempotencyKeyReusedError(input.idempotencyKey, msg);

      throw new PaymentDomainError(msg, code, res.status);
    }

    const json = await res.json();
    return json.data;
  }

  async getPaymentOrderByBidIntentId(bidIntentId: string): Promise<PaymentOrder | undefined> {
    const res = await fetch(`${this.baseUrl}/api/bid-intents/${bidIntentId}/payment`, {
      method: 'GET',
    });

    if (res.status === 404) return undefined;
    if (!res.ok) {
      const errorJson = await res.json().catch(() => ({}));
      throw new PaymentDomainError(errorJson?.error?.message || 'Error fetching payment', 'PAYMENT_FETCH_ERROR', res.status);
    }

    const json = await res.json();
    return json.data?.paymentOrder;
  }

  async getPaymentOrderById(id: string): Promise<PaymentOrder> {
    const res = await fetch(`${this.baseUrl}/api/payments/${id}`, {
      method: 'GET',
    });

    if (!res.ok) {
      if (res.status === 404) throw new PaymentOrderNotFoundError(id);
      throw new PaymentDomainError('Failed to fetch payment order.', 'FETCH_ERROR', res.status);
    }

    const json = await res.json();
    return json.data;
  }

  async cancelPaymentOrder(input: CancelPaymentOrderInput): Promise<PaymentOrder> {
    const res = await fetch(`${this.baseUrl}/api/payments/${input.paymentOrderId}/cancel`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reason: input.reason }),
    });

    if (!res.ok) {
      const errorJson = await res.json().catch(() => ({}));
      throw new PaymentDomainError(errorJson?.error?.message || 'Failed to cancel payment.', 'CANCEL_ERROR', res.status);
    }

    const json = await res.json();
    return json.data;
  }

  async reconcilePaymentOrder(paymentOrderId: string): Promise<PaymentOrder> {
    return this.getPaymentOrderById(paymentOrderId);
  }
}
