/**
 * AageOnline — Admin Ranking Settlements API
 *
 * GET /api/admin/settlements
 *
 * Paginated ranking settlements for administrative operators.
 */

import { NextRequest, NextResponse } from 'next/server';
import { authService } from '../../../../data-access/auth/index.ts';
import { assertPlatformAdmin } from '../../../../lib/auth/admin-guard.ts';
import { PostgresRankingSettlementRepository } from '../../../../lib/db/repositories/ranking-settlement-repository.ts';
import { isDatabaseConfigured } from '../../../../lib/db/client.ts';
import { getAllRankingSettlementsInternal } from '../../../../lib/ranking-settlement/settlement-service.ts';

const settlementRepo = new PostgresRankingSettlementRepository();

export async function GET(req: NextRequest) {
  try {
    const user = await authService.getCurrentUser().catch(() => null);
    assertPlatformAdmin(user);

    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '20', 10);
    const status = searchParams.get('status') || 'ALL';

    if (isDatabaseConfigured()) {
      const result = await settlementRepo.getPaginatedSettlements({
        page,
        limit,
        status,
      });

      return NextResponse.json({
        data: {
          settlements: result.settlements,
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
    let all = getAllRankingSettlementsInternal ? getAllRankingSettlementsInternal() : [];
    if (status !== 'ALL') {
      all = all.filter((s) => s.status === status);
    }

    const totalCount = all.length;
    const offset = (page - 1) * limit;
    const paginated = all.slice(offset, offset + limit);

    return NextResponse.json({
      data: {
        settlements: paginated,
        pagination: {
          page,
          limit,
          totalCount,
          totalPages: Math.ceil(totalCount / limit),
        },
      },
    });
  } catch (err: unknown) {
    const errorObj = err as { statusCode?: number; code?: string; message?: string };
    const statusCode = errorObj.statusCode || 500;
    return NextResponse.json(
      {
        error: {
          code: errorObj.code || 'SETTLEMENTS_FETCH_FAILED',
          message: errorObj.message || 'Failed to fetch settlements.',
        },
      },
      { status: statusCode }
    );
  }
}
