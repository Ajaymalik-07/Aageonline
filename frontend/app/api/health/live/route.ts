import { NextRequest } from 'next/server';
import { GET as handleHealth } from '../route.ts';

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  url.searchParams.set('mode', 'liveness');
  return handleHealth(new NextRequest(url, req));
}
