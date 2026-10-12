/**
 * AageOnline — Admin Manual Recovery Job Retry API
 *
 * POST /api/admin/recovery-jobs/[id]/retry
 *
 * Safely resets and executes a single failed/retryable settlement recovery job.
 * Protected by platform administrator authorization and logged to audit trail.
 */

import { NextRequest, NextResponse } from 'next/server';
import { authService } from '../../../../../../data-access/auth/index.ts';
import { assertPlatformAdmin } from '../../../../../../lib/auth/admin-guard.ts';
import { retrySingleRecoveryJob } from '../../../../../../lib/ranking-settlement/recovery-service.ts';
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
      'RECOVERY_JOB_MANUAL_RETRY_REQUESTED',
      'SettlementRecoveryJob',
      id,
      user.id,
      { requestedAt: new Date().toISOString() }
    );

    const result = await retrySingleRecoveryJob(id, user.id);

    return NextResponse.json({
      data: result,
    });
  } catch (err: unknown) {
    const errorObj = err as { statusCode?: number; code?: string; message?: string };
    const statusCode = errorObj.statusCode || 500;
    return NextResponse.json(
      {
        error: {
          code: errorObj.code || 'JOB_RETRY_FAILED',
          message: errorObj.message || 'Failed to retry recovery job.',
        },
      },
      { status: statusCode }
    );
  }
}
