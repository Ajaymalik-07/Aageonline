/**
 * AageOnline — Local In-Memory Payment Data-Access Adapter
 * Directly delegates to authoritative in-memory payment domain store.
 */

import type {
  CancelPaymentOrderInput,
  CreatePaymentOrderInput,
  PaymentOrder,
  PaymentOrderResult,
} from '../../types/payment.ts';
import {
  cancelPaymentOrder,
  createPaymentOrder,
  getPaymentOrderById,
  getPaymentOrderByBidIntentId,
  reconcilePaymentOrder,
} from '../../lib/payments/store.ts';
import type { PaymentDataSource } from './service.ts';

export class LocalPaymentDataSource implements PaymentDataSource {
  async createPaymentOrder(input: CreatePaymentOrderInput): Promise<PaymentOrderResult> {
    return createPaymentOrder(input);
  }

  async getPaymentOrderByBidIntentId(bidIntentId: string, actorUserId?: string): Promise<PaymentOrder | undefined> {
    return getPaymentOrderByBidIntentId(bidIntentId, actorUserId);
  }

  async getPaymentOrderById(id: string, actorUserId?: string): Promise<PaymentOrder> {
    return getPaymentOrderById(id, actorUserId);
  }

  async cancelPaymentOrder(input: CancelPaymentOrderInput): Promise<PaymentOrder> {
    return cancelPaymentOrder(input);
  }

  async reconcilePaymentOrder(paymentOrderId: string, actorUserId?: string): Promise<PaymentOrder> {
    return reconcilePaymentOrder(paymentOrderId, actorUserId);
  }
}
