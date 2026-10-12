/**
 * AageOnline — Business Workspace Markets API
 *
 * GET /api/business/dashboard/markets
 *
 * Returns participating markets for the authenticated business,
 * enriched with current position, eligibility, and last recorded movement.
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireBusinessMembership } from '../../../../../lib/auth/server-guard.ts';
import { getWorkspaceMarkets } from '../../../../../lib/workspace/store.ts';
import { getPositionHistoryByBusiness } from '../../../../../lib/ranking-settlement/position-history.ts';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const businessId = searchParams.get('businessId');
    if (!businessId) {
      return NextResponse.json(
        { error: { code: 'MISSING_BUSINESS_ID', message: 'businessId is required.' } },
        { status: 400 }
      );
    }

    const { user } = await requireBusinessMembership(req, businessId, 'workspace.access');

    const marketItems = await getWorkspaceMarkets(businessId, user.id);
    const history = getPositionHistoryByBusiness(businessId);

    // Enrich each market item with its latest recorded movement if available
    const enriched = marketItems.map((item) => {
      const lastHistory = history.find((h) => h.marketId === item.market.id);
      return {
        ...item,
        lastMovement: lastHistory
          ? {
              previousPosition: lastHistory.previousPosition,
              newPosition: lastHistory.newPosition,
              recordedAt: lastHistory.createdAt,
            }
          : null,
      };
    });

    return NextResponse.json({
      data: {
        markets: enriched,
      },
    });
  } catch (err: unknown) {
    const errorObj = err as { statusCode?: number; code?: string; message?: string };
    const statusCode = errorObj.statusCode || 500;
    return NextResponse.json(
      {
        error: {
          code: errorObj.code || 'MARKETS_FETCH_FAILED',
          message: errorObj.message || 'Failed to fetch markets.',
        },
      },
      { status: statusCode }
    );
  }
}
