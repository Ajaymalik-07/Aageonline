import { NextRequest, NextResponse } from 'next/server';
import {
  searchPublishedMarkets,
  filterPublishedMarkets,
  getPublishedMarkets,
  getPublishedMarketCount,
} from '../../../../lib/taxonomy/market-directory';

/**
 * GET /api/markets/search
 *
 * Query params:
 *   q          - free-text search string
 *   location   - filter by city slug
 *   category   - filter by category slug
 *   limit      - max results (default 20)
 *   offset     - pagination offset (default 0)
 */
export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const q = searchParams.get('q')?.trim() ?? '';
  const location = searchParams.get('location')?.trim().toLowerCase() ?? '';
  const category = searchParams.get('category')?.trim().toLowerCase() ?? '';
  const limit = Math.min(parseInt(searchParams.get('limit') ?? '20', 10), 50);
  const offset = Math.max(parseInt(searchParams.get('offset') ?? '0', 10), 0);

  // Search mode
  if (q) {
    const results = searchPublishedMarkets(q);
    return NextResponse.json({ query: q, results });
  }

  // Filter mode (location and/or category)
  if (location || category) {
    const markets = filterPublishedMarkets({
      locationSlug: location || undefined,
      categorySlug: category || undefined,
    });
    const sliced = markets.slice(offset, offset + limit);
    return NextResponse.json({
      total: markets.length,
      offset,
      limit,
      markets: sliced,
    });
  }

  // Directory listing (all published, paginated)
  const total = getPublishedMarketCount();
  const markets = getPublishedMarkets({ limit, offset });
  return NextResponse.json({ total, offset, limit, markets });
}
