import { NextRequest, NextResponse } from 'next/server';
import { fetchFromApi } from '../../../lib/api-client.ts';
import { ADMIN_COOKIE_NAME, verifyAndParseAdminSession } from '../../../lib/auth.ts';

export async function GET(req: NextRequest) {
  const cookieValue = req.cookies.get(ADMIN_COOKIE_NAME)?.value;
  const session = await verifyAndParseAdminSession(cookieValue);

  if (!session) {
    return NextResponse.json({ error: 'UNAUTHORIZED', message: 'Admin session required' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const type = searchParams.get('type');
  const endpoint = type === 'templates' ? '/api/admin/mail/templates' : '/api/admin/mail/config';

  const result = await fetchFromApi(endpoint, {}, session.apiToken);
  if (!result.ok) {
    return NextResponse.json({ error: 'API_ERROR', message: result.error }, { status: result.status });
  }
  return NextResponse.json(result.data, { status: 200 });
}

export async function POST(req: NextRequest) {
  const cookieValue = req.cookies.get(ADMIN_COOKIE_NAME)?.value;
  const session = await verifyAndParseAdminSession(cookieValue);

  if (!session) {
    return NextResponse.json({ error: 'UNAUTHORIZED', message: 'Admin session required' }, { status: 401 });
  }

  const body = await req.json();
  const result = await fetchFromApi('/api/admin/mail/test-send', {
    method: 'POST',
    body: JSON.stringify(body),
  }, session.apiToken);

  if (!result.ok) {
    return NextResponse.json({ error: 'API_ERROR', message: result.error }, { status: result.status });
  }
  return NextResponse.json(result.data, { status: 200 });
}
