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
  const action = searchParams.get('action') || 'metrics';

  let endpoint = '/api/admin/scraper/metrics';
  if (action === 'config') endpoint = '/api/admin/scraper/config';
  else if (action === 'jobs') endpoint = '/api/admin/scraper/jobs';
  else if (action === 'connectors') endpoint = '/api/admin/scraper/connectors';

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

  const { searchParams } = new URL(req.url);
  const action = searchParams.get('action');
  const body = await req.json().catch(() => ({}));

  let endpoint = '/api/admin/scraper/jobs';
  if (action === 'config') {
    endpoint = '/api/admin/scraper/config';
  }

  const result = await fetchFromApi(
    endpoint,
    {
      method: 'POST',
      body: JSON.stringify(body),
    },
    session.apiToken
  );

  if (!result.ok) {
    return NextResponse.json({ error: 'API_ERROR', message: result.error }, { status: result.status });
  }
  return NextResponse.json(result.data, { status: 200 });
}

export async function PUT(req: NextRequest) {
  const cookieValue = req.cookies.get(ADMIN_COOKIE_NAME)?.value;
  const session = await verifyAndParseAdminSession(cookieValue);

  if (!session) {
    return NextResponse.json({ error: 'UNAUTHORIZED', message: 'Admin session required' }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const result = await fetchFromApi(
    '/api/admin/scraper/config',
    {
      method: 'PUT',
      body: JSON.stringify(body),
    },
    session.apiToken
  );

  if (!result.ok) {
    return NextResponse.json({ error: 'API_ERROR', message: result.error }, { status: result.status });
  }
  return NextResponse.json(result.data, { status: 200 });
}
