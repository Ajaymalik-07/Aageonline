import { apiClient } from './client.ts';
import type { PaymentIntent } from '../../types/payment';

export interface CreatePaymentPayload {
  bidId: string;
  businessId: string;
  marketId: string;
  targetPosition: number;
  amountMinor: number;
  idempotencyKey: string;
}

export const paymentApi = {
  /**
   * Creates a payment intent after server re-validates the target bid.
   */
  async createPayment(payload: CreatePaymentPayload): Promise<PaymentIntent> {
    const res = await apiClient<PaymentIntent>('/payments/create', {
      method: 'POST',
      headers: {
        'Idempotency-Key': payload.idempotencyKey,
      },
      body: JSON.stringify(payload),
      cache: 'no-store',
      retries: 0,
    });
    return res.data;
  },

  /**
   * Authoritative polling endpoint to check payment and ranking mutation status.
   */
  async getPaymentStatus(paymentId: string): Promise<PaymentIntent> {
    const res = await apiClient<PaymentIntent>(`/payments/${paymentId}`, {
      cache: 'no-store',
      timeoutMs: 5000,
      retries: 1,
    });
    return res.data;
  },
};
