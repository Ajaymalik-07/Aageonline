/**
 * AageOnline — Admin Settlement Recovery Jobs API
 *
 * GET /api/admin/recovery-jobs
 *
 * Paginated view of settlement recovery jobs with status, attempt counter,
 * next eligible run timestamp, and sanitized failure reasons.
 */

import { NextRequest, NextResponse } from 'next/server';
import { authService } from '../../../../data-access/auth/index.ts';
import { assertPlatformAdmin } from '../../../../lib/auth/admin-guard.ts';
import { PostgresRecoveryRepository } from '../../../../lib/db/repositories/recovery-repository.ts';
import { isDatabaseConfigured } from '../../../../lib/db/client.ts';

const recoveryRepo = new PostgresRecoveryRepository();

export async function GET(req: NextRequest) {
  try {
    const user = await authService.getCurrentUser().catch(() => null);
    assertPlatformAdmin(user);

    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '20', 10);
    const status = searchParams.get('status') || 'ALL';

    if (isDatabaseConfigured()) {
      const result = await recoveryRepo.getPaginatedJobs({
        page,
        limit,
        status,
      });

      return NextResponse.json({
        data: {
          jobs: result.jobs,
          pagination: {
            page,
            limit,
            totalCount: result.totalCount,
            totalPages: Math.ceil(result.totalCount / limit),
          },
        },
      });
    }

    // In-memory fallback
    return NextResponse.json({
      data: {
        jobs: [],
        pagination: {
          page: 1,
          limit,
          totalCount: 0,
          totalPages: 0,
        },
      },
    });
  } catch (err: unknown) {
    const errorObj = err as { statusCode?: number; code?: string; message?: string };
    const statusCode = errorObj.statusCode || 500;
    return NextResponse.json(
      {
        error: {
          code: errorObj.code || 'RECOVERY_JOBS_FETCH_FAILED',
          message: errorObj.message || 'Failed to fetch recovery jobs.',
        },
      },
      { status: statusCode }
    );
  }
}
