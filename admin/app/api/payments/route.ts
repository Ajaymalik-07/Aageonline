import { NextRequest, NextResponse } from 'next/server';
import { fetchFromApi } from '../../../lib/api-client.ts';
import { ADMIN_COOKIE_NAME, verifyAndParseAdminSession } from '../../../lib/auth.ts';

export async function GET(req: NextRequest) {
  const cookieValue = req.cookies.get(ADMIN_COOKIE_NAME)?.value;
  const session = await verifyAndParseAdminSession(cookieValue);

  if (!session) {
    return NextResponse.json({ error: 'UNAUTHORIZED', message: 'Admin session required' }, { status: 401 });
  }

  const result = await fetchFromApi('/api/admin/payments', {}, session.apiToken);
  if (!result.ok) {
    return NextResponse.json({ error: 'API_ERROR', message: result.error }, { status: result.status });
  }
  return NextResponse.json(result.data, { status: 200 });
}
