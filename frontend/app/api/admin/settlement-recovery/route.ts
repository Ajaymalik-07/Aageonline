/**
 * AageOnline — Settlement Recovery Trigger Endpoint
 *
 * POST /api/admin/settlement-recovery
 *
 * Authenticated operational endpoint to run an on-demand settlement recovery cycle.
 * Requires platform administrator privileges or valid worker secret.
 */

import { NextRequest, NextResponse } from 'next/server';
import { runSettlementRecoveryCycle } from '../../../../lib/ranking-settlement/recovery-service.ts';
import { authService } from '../../../../data-access/auth/index.ts';
import { assertAdminOrWorker } from '../../../../lib/auth/admin-guard.ts';
import { recordAuditEvent } from '../../../../lib/audit/store.ts';

export async function POST(req: NextRequest) {
  try {
    const user = await authService.getCurrentUser().catch(() => null);
    const authContext = assertAdminOrWorker(req.headers, user);

    const body = await req.json().catch(() => ({}));
    const batchSize = typeof body?.batchSize === 'number' ? Math.min(100, Math.max(1, body.batchSize)) : 20;

    recordAuditEvent(
      'SETTLEMENT_RECOVERY_TRIGGERED',
      'System',
      'settlement-recovery',
      authContext.actorId,
      {
        batchSize,
        isWorker: authContext.isWorker,
      }
    );

    const summary = await runSettlementRecoveryCycle(
      batchSize,
      authContext.actorId,
      authContext.isWorker ? 'SCHEDULED' : 'MANUAL'
    );

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
          code: errorObj.code || 'SETTLEMENT_RECOVERY_FAILED',
          message: errorObj.message || 'An error occurred during settlement recovery.',
        },
      },
      { status: statusCode }
    );
  }
}
