/**
 * AageOnline — PayU Provider Response Mapper
 * Maps external PayU fields and statuses cleanly to internal domain models.
 */

import type { PaymentOrderStatus } from '../../../types/payment.ts';

export function mapPayUStatusToDomain(payuStatus?: string): PaymentOrderStatus {
  if (!payuStatus) return 'UNKNOWN';

  const clean = payuStatus.trim().toLowerCase();
  switch (clean) {
    case 'success':
      return 'SUCCEEDED';
    case 'failure':
    case 'failed':
      return 'FAILED';
    case 'pending':
    case 'in progress':
      return 'PENDING';
    case 'cancelled':
    case 'usercancelled':
      return 'CANCELLED';
    default:
      return 'UNKNOWN';
  }
}
