import { NextRequest, NextResponse } from 'next/server';
import { fetchFromApi } from '../../../lib/api-client.ts';
import { ADMIN_COOKIE_NAME, verifyAndParseAdminSession } from '../../../lib/auth.ts';

async function getSession(req: NextRequest) {
  const cookieValue = req.cookies.get(ADMIN_COOKIE_NAME)?.value;
  return await verifyAndParseAdminSession(cookieValue);
}

export async function GET(req: NextRequest) {
  const session = await getSession(req);
  if (!session) {
    return NextResponse.json(
      { error: 'UNAUTHORIZED', message: 'Admin authentication required' },
      { status: 401 }
    );
  }

  const result = await fetchFromApi('/api/admin/operations', {}, session.apiToken);
  if (!result.ok) {
    return NextResponse.json(
      { error: 'API_ERROR', message: result.error },
      { status: result.status }
    );
  }

  return NextResponse.json(result.data, { status: 200 });
}

export async function POST(req: NextRequest) {
  const session = await getSession(req);
  if (!session) {
    return NextResponse.json(
      { error: 'UNAUTHORIZED', message: 'Admin authentication required' },
      { status: 401 }
    );
  }

  try {
    const body = await req.json();
    const result = await fetchFromApi(
      '/api/admin/operations',
      {
        method: 'POST',
        body: JSON.stringify(body),
      },
      session.apiToken
    );

    if (!result.ok) {
      return NextResponse.json(
        { error: 'API_ERROR', message: result.error },
        { status: result.status }
      );
    }

    return NextResponse.json(result.data, { status: 200 });
  } catch (err: unknown) {
    return NextResponse.json(
      { error: 'BAD_REQUEST', message: 'Failed to process operation request' },
      { status: 400 }
    );
  }
}
