/**
 * AageOnline — Business Ranking History API
 *
 * GET /api/business/dashboard/ranking-history
 *
 * Paginated, authorized position history for the authenticated business.
 * Prevents cross-business data leakage.
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireBusinessMembership } from '../../../../../lib/auth/server-guard.ts';
import { getBusinessRankingHistory } from '../../../../../lib/workspace/ranking-history.ts';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const businessId = searchParams.get('businessId');
    if (!businessId) {
      return NextResponse.json(
        { error: { code: 'MISSING_BUSINESS_ID', message: 'businessId parameter is required.' } },
        { status: 400 }
      );
    }

    const { user } = await requireBusinessMembership(req, businessId, 'workspace.access');

    const marketId = searchParams.get('marketId') || undefined;
    const direction = (searchParams.get('direction') as 'UP' | 'DOWN' | 'ENTRY' | 'ALL') || undefined;
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '20', 10);

    const result = await getBusinessRankingHistory(businessId, user.id, {
      marketId,
      direction,
      page,
      limit,
    });

    return NextResponse.json({ data: result });
  } catch (err: unknown) {
    const errorObj = err as { statusCode?: number; code?: string; message?: string };
    const statusCode = errorObj.statusCode || 500;
    return NextResponse.json(
      {
        error: {
          code: errorObj.code || 'RANKING_HISTORY_FAILED',
          message: errorObj.message || 'Failed to load ranking history.',
        },
      },
      { status: statusCode }
    );
  }
}
