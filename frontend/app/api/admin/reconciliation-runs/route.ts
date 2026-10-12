/**
 * AageOnline — Admin Reconciliation Runs API
 *
 * GET /api/admin/reconciliation-runs
 *
 * Retrieves recent durable reconciliation and recovery execution records.
 */

import { NextRequest, NextResponse } from 'next/server';
import { authService } from '../../../../data-access/auth/index.ts';
import { assertPlatformAdmin } from '../../../../lib/auth/admin-guard.ts';
import { PostgresReconciliationRunRepository } from '../../../../lib/db/repositories/reconciliation-run-repository.ts';

const runRepo = new PostgresReconciliationRunRepository();

export async function GET(req: NextRequest) {
  try {
    const user = await authService.getCurrentUser().catch(() => null);
    assertPlatformAdmin(user);

    const { searchParams } = new URL(req.url);
    const limit = parseInt(searchParams.get('limit') || '25', 10);

    const runs = await runRepo.getRecentRuns(limit);

    return NextResponse.json({
      data: {
        runs,
      },
    });
  } catch (err: unknown) {
    const errorObj = err as { statusCode?: number; code?: string; message?: string };
    const statusCode = errorObj.statusCode || 500;
    return NextResponse.json(
      {
        error: {
          code: errorObj.code || 'RUNS_FETCH_FAILED',
          message: errorObj.message || 'Failed to fetch reconciliation runs.',
        },
      },
      { status: statusCode }
    );
  }
}
