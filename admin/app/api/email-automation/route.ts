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
  const action = searchParams.get('action') || 'overview';

  let endpoint = '/api/admin/email-automation/overview';
  if (action === 'campaigns') {
    endpoint = '/api/admin/email-automation/campaigns';
  } else if (action === 'templates') {
    endpoint = '/api/admin/email-automation/templates';
  } else if (action === 'messages') {
    const campaignId = searchParams.get('campaignId') || '';
    const status = searchParams.get('status') || '';
    const query = new URLSearchParams();
    if (campaignId) query.set('campaignId', campaignId);
    if (status) query.set('status', status);
    endpoint = `/api/admin/email-automation/messages?${query.toString()}`;
  }

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

  let endpoint = '';
  if (action === 'campaigns') {
    endpoint = '/api/admin/email-automation/campaigns';
  } else if (action === 'templates') {
    endpoint = '/api/admin/email-automation/templates';
  } else if (action === 'campaign_status') {
    const id = searchParams.get('id');
    endpoint = `/api/admin/email-automation/campaigns/${id}/status`;
  } else if (action === 'campaign_run') {
    const id = searchParams.get('id');
    endpoint = `/api/admin/email-automation/campaigns/${id}/run`;
  } else if (action === 'test_send') {
    endpoint = '/api/admin/email-automation/messages/test-send';
  } else if (action === 'suppress') {
    endpoint = '/api/admin/email-automation/suppress';
  } else {
    return NextResponse.json({ error: 'BAD_REQUEST', message: 'Unknown action' }, { status: 400 });
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
