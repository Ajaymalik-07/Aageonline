import { NextRequest, NextResponse } from 'next/server';
import { marketService } from '../../../data-access/markets/index.ts';
import type { MarketSortOption } from '../../../data-access/types.ts';

/**
 * GET /api/markets
 *
 * Public REST endpoint for discovering published markets.
 * Only returns markets where publicationStatus === 'PUBLISHED' && status === 'PUBLISHED'.
 *
 * Query Parameters:
 *   - page        (number, default: 1)
 *   - pageSize    (number, default: 24, max: 100)
 *   - location    (string, city slug filter)
 *   - category    (string, category slug filter)
 *   - sortBy      (enum: 'qualifying_amount_desc' | 'alphabetical' | 'recent')
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = req.nextUrl;
    const page = parseInt(searchParams.get('page') || '1', 10);
    const pageSize = parseInt(searchParams.get('pageSize') || '24', 10);
    const locationSlug = searchParams.get('location') || undefined;
    const categorySlug = searchParams.get('category') || undefined;
    const sortBy = (searchParams.get('sortBy') as MarketSortOption) || 'qualifying_amount_desc';

    const result = await marketService.getPublishedMarkets({
      page: isNaN(page) ? 1 : page,
      pageSize: isNaN(pageSize) ? 24 : Math.min(100, Math.max(1, pageSize)),
      locationSlug,
      categorySlug,
      sortBy,
    });

    return NextResponse.json(result, {
      status: 200,
      headers: {
        'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300',
      },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Internal Server Error';
    return NextResponse.json(
      {
        error: {
          code: 'SERVICE_ERROR',
          message,
        },
      },
      { status: 500 }
    );
  }
}
