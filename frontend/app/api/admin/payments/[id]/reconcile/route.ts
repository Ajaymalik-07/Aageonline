/**
 * AageOnline — Admin Manual Payment Reconciliation API
 *
 * POST /api/admin/payments/[id]/reconcile
 *
 * Re-verifies a single payment order with PayU on-demand and applies state transitions.
 * Protected by platform administrator authorization and logged to audit trail.
 */

import { NextRequest, NextResponse } from 'next/server';
import { authService } from '../../../../../../data-access/auth/index.ts';
import { assertPlatformAdmin } from '../../../../../../lib/auth/admin-guard.ts';
import { reconcileSinglePaymentOrder } from '../../../../../../lib/payments/reconciliation-service.ts';
import { recordAuditEvent } from '../../../../../../lib/audit/store.ts';

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await authService.getCurrentUser().catch(() => null);
    assertPlatformAdmin(user);

    const { id } = await params;

    recordAuditEvent(
      'PAYMENT_MANUAL_RECONCILE_REQUESTED',
      'PaymentOrder',
      id,
      user.id,
      { requestedAt: new Date().toISOString() }
    );

    const result = await reconcileSinglePaymentOrder(id, user.id);

    return NextResponse.json({
      data: result,
    });
  } catch (err: unknown) {
    const errorObj = err as { statusCode?: number; code?: string; message?: string };
    const statusCode = errorObj.statusCode || 500;
    return NextResponse.json(
      {
        error: {
          code: errorObj.code || 'PAYMENT_RECONCILE_FAILED',
          message: errorObj.message || 'Failed to reconcile payment order.',
        },
      },
      { status: statusCode }
    );
  }
}
