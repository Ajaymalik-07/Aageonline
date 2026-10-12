import { NextRequest, NextResponse } from 'next/server';
import { recordDiscoveryRequest, getAllDiscoveryRequests } from '../../../lib/taxonomy/discovery';
import type { DiscoveryRequestType } from '../../../types/taxonomy';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { rawInput, requestType, cityId, categoryId } = body;

    if (!rawInput || typeof rawInput !== 'string' || rawInput.trim().length === 0) {
      return NextResponse.json(
        { error: 'Invalid input: "rawInput" is required.' },
        { status: 400 }
      );
    }

    if (
      !requestType ||
      !['CATEGORY', 'STATE', 'CITY', 'MARKET'].includes(requestType)
    ) {
      return NextResponse.json(
        { error: 'Invalid "requestType". Must be CATEGORY, STATE, CITY, or MARKET.' },
        { status: 400 }
      );
    }

    // Client identifier for rate limiting (IP or fallback header)
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0].trim() || 'public-client';

    const discovery = recordDiscoveryRequest({
      rawInput,
      requestType: requestType as DiscoveryRequestType,
      cityId,
      categoryId,
      clientId: ip,
    });

    return NextResponse.json({
      success: true,
      discovery: {
        id: discovery.id,
        requestType: discovery.requestType,
        normalizedValue: discovery.normalizedValue,
        requestCount: discovery.requestCount,
        status: discovery.status,
      },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Internal error';
    const status = message.includes('Rate limit exceeded') ? 429 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}

export async function GET() {
  const requests = getAllDiscoveryRequests();
  return NextResponse.json({
    total: requests.length,
    requests,
  });
}
