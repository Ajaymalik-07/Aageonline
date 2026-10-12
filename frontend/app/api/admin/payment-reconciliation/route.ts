/**
 * AageOnline — Payment Reconciliation Trigger Endpoint
 *
 * POST /api/admin/payment-reconciliation
 *
 * Authenticated operational endpoint to run an on-demand payment reconciliation cycle.
 * Requires platform administrator privileges or valid worker secret.
 */

import { NextRequest, NextResponse } from 'next/server';
import { runPaymentReconciliationCycle } from '../../../../lib/payments/reconciliation-service.ts';
import { authService } from '../../../../data-access/auth/index.ts';
import { assertAdminOrWorker } from '../../../../lib/auth/admin-guard.ts';
import { recordAuditEvent } from '../../../../lib/audit/store.ts';

export async function POST(req: NextRequest) {
  try {
    const user = await authService.getCurrentUser().catch(() => null);
    const authContext = assertAdminOrWorker(req.headers, user);

    const body = await req.json().catch(() => ({}));
    const batchSize = typeof body?.batchSize === 'number' ? Math.min(100, Math.max(1, body.batchSize)) : 20;
    const olderThanMinutes = typeof body?.olderThanMinutes === 'number' ? Math.max(0, body.olderThanMinutes) : 2;

    recordAuditEvent(
      'PAYMENT_RECONCILIATION_TRIGGERED',
      'System',
      'payment-reconciliation',
      authContext.actorId,
      {
        batchSize,
        olderThanMinutes,
        isWorker: authContext.isWorker,
      }
    );

    const summary = await runPaymentReconciliationCycle({
      batchSize,
      olderThanMinutes,
      triggerSource: authContext.isWorker ? 'SCHEDULED' : 'MANUAL',
      actorUserId: authContext.actorId,
    });

    return NextResponse.json({
      data: {
        summary,
        triggeredBy: authContext.actorId,
      },
    });
  } catch (err: unknown) {
    const errorObj = err as { statusCode?: number; code?: string; message?: string };
    const statusCode = errorObj.statusCode || 500;
    return NextResponse.json(
      {
        error: {
          code: errorObj.code || 'PAYMENT_RECONCILIATION_FAILED',
          message: errorObj.message || 'An error occurred during payment reconciliation.',
        },
      },
      { status: statusCode }
    );
  }
}
