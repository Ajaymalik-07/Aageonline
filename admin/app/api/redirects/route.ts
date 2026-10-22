import { NextRequest, NextResponse } from 'next/server';
import { fetchFromApi } from '../../../lib/api-client.ts';
import { ADMIN_COOKIE_NAME, verifyAndParseAdminSession } from '../../../lib/auth.ts';

interface RedirectItem {
  id: string;
  sourcePath: string;
  destinationUrl: string;
  statusCode: 301 | 302;
  hits: number;
  createdAt: string;
}

const LOCAL_REDIRECTS: RedirectItem[] = [
  { id: 'redir-001', sourcePath: '/blog/startup-guide', destinationUrl: '/blog/startup-website-development-complete-guide', statusCode: 301, hits: 342, createdAt: '2026-10-01T10:00:00Z' },
  { id: 'redir-002', sourcePath: '/services/web-development', destinationUrl: '/blog/how-to-choose-a-website-development-company-in-india', statusCode: 301, hits: 189, createdAt: '2026-10-02T14:30:00Z' },
  { id: 'redir-003', sourcePath: '/pricing', destinationUrl: '/blog/how-much-does-website-development-cost-in-india-in-2026', statusCode: 302, hits: 520, createdAt: '2026-10-05T09:00:00Z' },
];

export async function GET(req: NextRequest) {
  const cookieValue = req.cookies.get(ADMIN_COOKIE_NAME)?.value;
  const session = await verifyAndParseAdminSession(cookieValue);

  if (!session) {
    return NextResponse.json({ error: 'UNAUTHORIZED', message: 'Admin session required' }, { status: 401 });
  }

  const result = await fetchFromApi('/api/admin/redirects', {}, session.apiToken);
  if (result.ok && result.data) {
    return NextResponse.json(result.data, { status: 200 });
  }

  return NextResponse.json({ redirects: LOCAL_REDIRECTS, total: LOCAL_REDIRECTS.length }, { status: 200 });
}

export async function POST(req: NextRequest) {
  const cookieValue = req.cookies.get(ADMIN_COOKIE_NAME)?.value;
  const session = await verifyAndParseAdminSession(cookieValue);

  if (!session) {
    return NextResponse.json({ error: 'UNAUTHORIZED', message: 'Admin session required' }, { status: 401 });
  }

  const body = await req.json();
  const result = await fetchFromApi('/api/admin/redirects', {
    method: 'POST',
    body: JSON.stringify(body),
  }, session.apiToken);

  if (result.ok && result.data) {
    return NextResponse.json(result.data, { status: 201 });
  }

  const newRule: RedirectItem = {
    id: `redir-${Date.now()}`,
    sourcePath: body.sourcePath || '/',
    destinationUrl: body.destinationUrl || '/',
    statusCode: body.statusCode === 302 ? 302 : 301,
    hits: 0,
    createdAt: new Date().toISOString(),
  };
  LOCAL_REDIRECTS.unshift(newRule);
  return NextResponse.json({ success: true, redirect: newRule }, { status: 201 });
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
    return NextResponse.json({ error: 'Redirect ID is required' }, { status: 400 });
  }

  await fetchFromApi(`/api/admin/redirects/${encodeURIComponent(id)}`, {
    method: 'DELETE',
  }, session.apiToken);

  const idx = LOCAL_REDIRECTS.findIndex((r) => r.id === id);
  if (idx !== -1) {
    LOCAL_REDIRECTS.splice(idx, 1);
  }

  return NextResponse.json({ success: true }, { status: 200 });
}
