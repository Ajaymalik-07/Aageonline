import { NextRequest, NextResponse } from 'next/server';
import { locationService } from '../../../data-access/locations/index.ts';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const slug = searchParams.get('slug')?.toLowerCase().trim();
    const state = searchParams.get('state')?.toLowerCase().trim();
    const search = searchParams.get('search')?.trim();

    // 1. Single location lookup by slug
    if (slug) {
      const location = await locationService.getPublishedLocationBySlug(slug);
      if (!location) {
        return NextResponse.json(
          { error: `Published location "${slug}" not found.` },
          { status: 404 }
        );
      }
      return NextResponse.json({ data: location });
    }

    // 2. Search query lookup
    if (search) {
      const searchResults = await locationService.searchPublishedLocations(search);
      return NextResponse.json({
        data: searchResults,
        total: searchResults.length,
      });
    }

    // 3. Filter by state
    if (state) {
      const stateLocations = await locationService.getPublishedLocationsByState(state);
      return NextResponse.json({
        data: stateLocations,
        pagination: {
          total: stateLocations.length,
        },
      });
    }

    // 4. Default: all published locations
    const locations = await locationService.getPublishedLocations();
    return NextResponse.json(
      {
        data: locations,
        pagination: {
          total: locations.length,
        },
      },
      {
        headers: {
          'Cache-Control': 'public, max-age=300, s-maxage=300, stale-while-revalidate=600',
        },
      }
    );
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Internal server error';
    return NextResponse.json(
      { error: 'Failed to retrieve published locations.', details: message },
      { status: 500 }
    );
  }
}
