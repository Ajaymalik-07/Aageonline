/**
 * AageOnline — Payment Data-Access Service & Interfaces
 * Decouples frontend workspace UI from underlying storage adapters (Local vs Remote API).
 */

import type {
  CancelPaymentOrderInput,
  CreatePaymentOrderInput,
  PaymentOrder,
  PaymentOrderResult,
} from '../../types/payment.ts';

export interface PaymentDataSource {
  createPaymentOrder(input: CreatePaymentOrderInput): Promise<PaymentOrderResult>;
  getPaymentOrderByBidIntentId(bidIntentId: string, actorUserId?: string): Promise<PaymentOrder | undefined>;
  getPaymentOrderById(id: string, actorUserId?: string): Promise<PaymentOrder>;
  cancelPaymentOrder(input: CancelPaymentOrderInput): Promise<PaymentOrder>;
  reconcilePaymentOrder(paymentOrderId: string, actorUserId?: string): Promise<PaymentOrder>;
}

export class PaymentService {
  private readonly dataSource: PaymentDataSource;

  constructor(dataSource: PaymentDataSource) {
    this.dataSource = dataSource;
  }

  async createPaymentOrder(input: CreatePaymentOrderInput): Promise<PaymentOrderResult> {
    return this.dataSource.createPaymentOrder(input);
  }

  async getPaymentOrderByBidIntentId(bidIntentId: string, actorUserId?: string): Promise<PaymentOrder | undefined> {
    return this.dataSource.getPaymentOrderByBidIntentId(bidIntentId, actorUserId);
  }

  async getPaymentOrderById(id: string, actorUserId?: string): Promise<PaymentOrder> {
    return this.dataSource.getPaymentOrderById(id, actorUserId);
  }

  async cancelPaymentOrder(input: CancelPaymentOrderInput): Promise<PaymentOrder> {
    return this.dataSource.cancelPaymentOrder(input);
  }

  async reconcilePaymentOrder(paymentOrderId: string, actorUserId?: string): Promise<PaymentOrder> {
    return this.dataSource.reconcilePaymentOrder(paymentOrderId, actorUserId);
  }
}
