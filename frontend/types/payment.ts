export type PaymentLifecycleStatus =
  | 'INITIATED'
  | 'PENDING'
  | 'PROCESSING'
  | 'HELD'
  | 'SUCCESS'
  | 'CONFIRMED'
  | 'FAILED'
  | 'CANCELLED'
  | 'EXPIRED';

export interface PaymentIntent {
  id: string;
  bidId: string;
  businessId: string;
  marketId: string;
  targetPosition: number;
  amountMinor: number;
  currency: 'INR';
  status: PaymentLifecycleStatus;
  idempotencyKey: string;
  provider: 'RAZORPAY' | 'STRIPE' | 'CASHFREE' | 'MOCK';
  clientSecret?: string;
  createdAt: string;
  expiresAt: string;
}

export interface TransactionRecord {
  id: string;
  businessId: string;
  businessName: string;
  marketId: string;
  marketName: string;
  amountMinor: number;
  targetPosition: number;
  provider: string;
  providerTransactionId: string;
  status: 'SUCCESS' | 'FAILED' | 'RECONCILED';
  createdAt: string;
  confirmedAt?: string;
}
