/**
 * AageOnline — Payment Domain Types
 * First-class payment order, provider events, and PayU integration contracts.
 *
 * Invariant: Payment is distinct from Ranking.
 * A verified payment does NOT mutate ranking in this milestone.
 */

export type PaymentProvider = 'PAYU';

export type PaymentOrderStatus =
  | 'CREATED'
  | 'PENDING'
  | 'SUCCEEDED'
  | 'CONFIRMED'
  | 'FAILED'
  | 'CANCELLED'
  | 'EXPIRED'
  | 'UNKNOWN';

export type PaymentIntent = PaymentOrder;

export type ProviderEventProcessingStatus =
  | 'RECEIVED'
  | 'PROCESSED'
  | 'DUPLICATE'
  | 'REJECTED'
  | 'FAILED';

export interface PaymentOrder {
  id: string; // Internal collision-resistant ID (e.g. "po_...")
  bidIntentId: string;
  businessId: string;
  marketId: string;
  createdByUserId: string;
  membershipId: string;
  provider: PaymentProvider;
  providerOrderId?: string | null;
  providerTransactionId: string; // Unique transaction reference sent to PayU ("txnid")
  providerPaymentId?: string | null; // Provider's reference ID (e.g., PayU "mihpayid")
  amountMinor: number; // Exact minor units in paise (₹28,501 = 2850100)
  amountRupees: number; // Whole Indian Rupees (₹28,501)
  currency: 'INR';
  status: PaymentOrderStatus;
  idempotencyKey: string;
  failureReason?: string | null;
  createdAt: string; // ISO 8601 UTC
  updatedAt: string; // ISO 8601 UTC
  paidAt?: string | null; // ISO 8601 UTC when provider confirms
}

export interface PaymentProviderEvent {
  id: string;
  provider: PaymentProvider;
  providerEventId?: string | null;
  eventType: string;
  paymentOrderId?: string | null;
  providerTransactionId?: string | null;
  payloadHash: string; // SHA-256 fingerprint for deduplication
  receivedAt: string;
  processedAt?: string | null;
  processingStatus: ProviderEventProcessingStatus;
  metadata?: Record<string, unknown>;
}

export interface PayUCheckoutPayload {
  provider: 'PAYU';
  actionUrl: string;
  method: 'POST';
  fields: {
    key: string;
    txnid: string;
    amount: string;
    productinfo: string;
    firstname: string;
    email: string;
    phone: string;
    surl: string;
    furl: string;
    hash: string;
    udf1: string; // bidIntentId
    udf2: string; // paymentOrderId
    udf3?: string;
    udf4?: string;
    udf5?: string;
    [key: string]: string | undefined;
  };
}

export interface CreatePaymentOrderInput {
  bidIntentId: string;
  idempotencyKey: string;
  actorUserId: string;
  customerName?: string;
  customerEmail?: string;
  customerPhone?: string;
}

export interface PaymentOrderResult {
  paymentOrder: PaymentOrder;
  checkout: PayUCheckoutPayload;
}

export interface CancelPaymentOrderInput {
  paymentOrderId: string;
  actorUserId: string;
  reason?: string;
}
