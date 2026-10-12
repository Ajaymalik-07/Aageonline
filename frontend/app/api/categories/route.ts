import { NextRequest, NextResponse } from 'next/server';
import { categoryService } from '../../../data-access/categories/index.ts';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const slug = searchParams.get('slug')?.toLowerCase().trim();
    const search = searchParams.get('search')?.trim();

    // 1. Single category lookup by slug
    if (slug) {
      const category = await categoryService.getPublishedCategoryBySlug(slug);
      if (!category) {
        return NextResponse.json(
          { error: `Published category "${slug}" not found.` },
          { status: 404 }
        );
      }
      return NextResponse.json({ data: category });
    }

    // 2. Search query lookup
    if (search) {
      const searchResults = await categoryService.searchPublishedCategories(search);
      return NextResponse.json({
        data: searchResults,
        total: searchResults.length,
      });
    }

    // 3. Default: all published categories
    const categories = await categoryService.getPublishedCategories();
    return NextResponse.json(
      {
        data: categories,
        pagination: {
          total: categories.length,
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
      { error: 'Failed to retrieve published categories.', details: message },
      { status: 500 }
    );
  }
}
