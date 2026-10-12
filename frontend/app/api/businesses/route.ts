import { NextRequest, NextResponse } from 'next/server';
import { businessService } from '../../../data-access/businesses/index.ts';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const slug = searchParams.get('slug')?.toLowerCase().trim();
    const search = searchParams.get('search')?.trim();
    const category = searchParams.get('category')?.toLowerCase().trim();
    const location = searchParams.get('location')?.toLowerCase().trim();
    const verification = searchParams.get('verification')?.trim();
    const page = parseInt(searchParams.get('page') || '1', 10);
    const pageSize = parseInt(searchParams.get('pageSize') || '12', 10);

    // 1. Single business profile lookup by slug
    if (slug) {
      const business = await businessService.getPublishedBusinessBySlug(slug);
      if (!business) {
        return NextResponse.json(
          { error: `Published business "${slug}" not found.` },
          { status: 404 }
        );
      }
      return NextResponse.json({ data: business });
    }

    // 2. Direct search query
    if (search) {
      const results = await businessService.searchPublishedBusinesses(search);
      return NextResponse.json({
        data: results,
        total: results.length,
      });
    }

    // 3. Paginated list with optional filters
    const paginated = await businessService.getPublishedBusinesses({
      page: isNaN(page) ? 1 : page,
      pageSize: isNaN(pageSize) ? 12 : pageSize,
      categorySlug: category,
      locationSlug: location,
      verificationStatus: verification,
    });

    return NextResponse.json(paginated);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Internal server error';
    return NextResponse.json(
      { error: 'Failed to retrieve published businesses.', details: message },
      { status: 500 }
    );
  }
}
