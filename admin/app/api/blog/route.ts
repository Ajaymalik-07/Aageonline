import { NextRequest, NextResponse } from 'next/server';
import { fetchFromApi } from '../../../lib/api-client.ts';
import { ADMIN_COOKIE_NAME, verifyAndParseAdminSession } from '../../../lib/auth.ts';
import {
  getAllPosts,
  getPostByIdOrSlug,
  createPost,
  updatePost,
  deletePost,
} from '../../../lib/blog-store.ts';

export async function GET(req: NextRequest) {
  const cookieValue = req.cookies.get(ADMIN_COOKIE_NAME)?.value;
  const session = await verifyAndParseAdminSession(cookieValue);

  if (!session) {
    return NextResponse.json({ error: 'UNAUTHORIZED', message: 'Admin session required' }, { status: 401 });
  }

  // Attempt to load from authoritative backend API (:4000)
  const result = await fetchFromApi('/api/admin/blog', {}, session.apiToken);
  if (result.ok && result.data) {
    return NextResponse.json(result.data, { status: 200 });
  }

  // Fallback to local canonical blog store
  const posts = getAllPosts();
  return NextResponse.json(
    {
      posts,
      total: posts.length,
      counts: {
        published: posts.filter((p) => p.status === 'PUBLISHED').length,
        draft: posts.filter((p) => p.status === 'DRAFT').length,
        scheduled: posts.filter((p) => p.status === 'SCHEDULED').length,
        archived: posts.filter((p) => p.status === 'ARCHIVED').length,
      },
    },
    { status: 200 }
  );
}

export async function POST(req: NextRequest) {
  const cookieValue = req.cookies.get(ADMIN_COOKIE_NAME)?.value;
  const session = await verifyAndParseAdminSession(cookieValue);

  if (!session) {
    return NextResponse.json({ error: 'UNAUTHORIZED', message: 'Admin session required' }, { status: 401 });
  }

  const body = await req.json();

  // Try backend API first
  const result = await fetchFromApi('/api/admin/blog', {
    method: 'POST',
    body: JSON.stringify(body),
  }, session.apiToken);

  if (result.ok && result.data) {
    return NextResponse.json(result.data, { status: 201 });
  }

  // Fallback to local canonical blog store
  try {
    const post = createPost(body);
    return NextResponse.json({ success: true, post }, { status: 201 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to create article';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

export async function PUT(req: NextRequest) {
  const cookieValue = req.cookies.get(ADMIN_COOKIE_NAME)?.value;
  const session = await verifyAndParseAdminSession(cookieValue);

  if (!session) {
    return NextResponse.json({ error: 'UNAUTHORIZED', message: 'Admin session required' }, { status: 401 });
  }

  const body = await req.json();
  const id = body.id;

  if (!id) {
    return NextResponse.json({ error: 'Article ID is required for updates.' }, { status: 400 });
  }

  // Try backend API first
  const result = await fetchFromApi(`/api/admin/blog/${encodeURIComponent(id)}`, {
    method: 'PUT',
    body: JSON.stringify(body),
  }, session.apiToken);

  if (result.ok && result.data) {
    return NextResponse.json(result.data, { status: 200 });
  }

  // Fallback to local canonical blog store
  try {
    const updated = updatePost(id, body);
    return NextResponse.json({ success: true, post: updated }, { status: 200 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to update article';
    return NextResponse.json({ error: message }, { status: 404 });
  }
}

export async function DELETE(req: NextRequest) {
  const cookieValue = req.cookies.get(ADMIN_COOKIE_NAME)?.value;
  const session = await verifyAndParseAdminSession(cookieValue);

  if (!session) {
    return NextResponse.json({ error: 'UNAUTHORIZED', message: 'Admin session required' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');

  if (!id) {
    return NextResponse.json({ error: 'Article ID is required to delete.' }, { status: 400 });
  }

  // Try backend API first
  const result = await fetchFromApi(`/api/admin/blog/${encodeURIComponent(id)}`, {
    method: 'DELETE',
  }, session.apiToken);

  if (result.ok) {
    return NextResponse.json({ success: true }, { status: 200 });
  }

  // Fallback to local canonical blog store
  try {
    const removed = deletePost(id);
    return NextResponse.json({ success: true, removedPost: removed }, { status: 200 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to delete article';
    return NextResponse.json({ error: message }, { status: 404 });
  }
}
