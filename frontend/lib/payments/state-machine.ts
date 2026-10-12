/**
 * AageOnline — Payment State Machine
 * Authoritative lifecycle invariants for PaymentOrder entities.
 *
 * States:
 *   CREATED -> PENDING -> [SUCCEEDED | FAILED | CANCELLED | EXPIRED]
 *
 * Terminal States: SUCCEEDED, CANCELLED, EXPIRED
 */

import type { PaymentOrderStatus } from '../../types/payment.ts';
import { PaymentStateConflictError } from './errors.ts';

const VALID_TRANSITIONS: Record<PaymentOrderStatus, PaymentOrderStatus[]> = {
  CREATED: ['PENDING', 'CANCELLED', 'EXPIRED'],
  PENDING: ['SUCCEEDED', 'CONFIRMED', 'FAILED', 'CANCELLED', 'EXPIRED', 'UNKNOWN'],
  SUCCEEDED: ['CONFIRMED'],
  CONFIRMED: [], // Terminal
  FAILED: ['PENDING'], // Retryable before terminal resolution
  CANCELLED: [], // Terminal
  EXPIRED: [], // Terminal
  UNKNOWN: ['PENDING', 'FAILED'], // Safe non-authoritative hold
};

const TERMINAL_STATES = new Set<PaymentOrderStatus>(['CONFIRMED', 'CANCELLED', 'EXPIRED']);

export type TransitionResult =
  | { type: 'VALID'; nextStatus: PaymentOrderStatus }
  | { type: 'DUPLICATE'; status: PaymentOrderStatus }
  | { type: 'CONTRADICTORY'; error: PaymentStateConflictError };

export function canTransition(current: PaymentOrderStatus, target: PaymentOrderStatus): boolean {
  if (current === target) return true; // Idempotent no-op
  const allowed = VALID_TRANSITIONS[current] || [];
  return allowed.includes(target);
}

export function evaluatePaymentTransition(
  current: PaymentOrderStatus,
  target: PaymentOrderStatus,
  contextMessage?: string
): TransitionResult {
  // 1. Idempotent repeat
  if (current === target) {
    return { type: 'DUPLICATE', status: current };
  }

  // 2. Terminal state protection: Cannot transition out of SUCCEEDED, CANCELLED, or EXPIRED
  if (TERMINAL_STATES.has(current)) {
    const error = new PaymentStateConflictError(
      current,
      target,
      `Order is already in terminal state "${current}" and cannot transition to "${target}". ${contextMessage || ''}`.trim()
    );
    return { type: 'CONTRADICTORY', error };
  }

  // 3. Check allowed transition matrix
  const allowed = VALID_TRANSITIONS[current] || [];
  if (!allowed.includes(target)) {
    const error = new PaymentStateConflictError(
      current,
      target,
      `Transition from "${current}" to "${target}" is not permitted. ${contextMessage || ''}`.trim()
    );
    return { type: 'CONTRADICTORY', error };
  }

  return { type: 'VALID', nextStatus: target };
}

export function isTerminalPaymentState(status: PaymentOrderStatus): boolean {
  return TERMINAL_STATES.has(status);
}
