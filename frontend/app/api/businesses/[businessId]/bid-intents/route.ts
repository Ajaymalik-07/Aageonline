import { NextRequest, NextResponse } from 'next/server';
import { getBidIntentsByBusinessAsync } from '../../../../../lib/bid-intent/store.ts';
import { BidIntentError } from '../../../../../lib/bid-intent/errors.ts';
import { requireBusinessMembership } from '../../../../../lib/auth/server-guard.ts';
import type { BidIntentStatus } from '../../../../../types/bid-intent.ts';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ businessId: string }> }
) {
  try {
    const { businessId } = await params;

    // Server-Side Authorization: Assert user session and active membership with bidIntent.view permission
    const { user } = await requireBusinessMembership(req, businessId, 'bidIntent.view');

    const { searchParams } = new URL(req.url);

    const marketId = searchParams.get('marketId') || undefined;
    const status = (searchParams.get('status') as BidIntentStatus) || undefined;
    const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!, 10) : undefined;
    const offset = searchParams.get('offset') ? parseInt(searchParams.get('offset')!, 10) : undefined;

    const { intents, total } = await getBidIntentsByBusinessAsync(
      businessId,
      user.id,
      {
        marketId,
        status,
        limit,
        offset,
      }
    );

    return NextResponse.json({
      data: intents,
      meta: {
        total,
        limit: limit || 50,
        offset: offset || 0,
      },
    });
  } catch (err: unknown) {
    if (err instanceof BidIntentError) {
      return NextResponse.json(
        {
          error: {
            code: err.code,
            message: err.message,
            details: err.details,
          },
        },
        { status: err.statusCode }
      );
    }

    if (err && typeof err === 'object' && 'statusCode' in err) {
      const authErr = err as { statusCode: number; code?: string; message?: string };
      return NextResponse.json(
        {
          error: {
            code: authErr.code || 'AUTHORIZATION_FAILED',
            message: authErr.message || 'Access denied.',
          },
        },
        { status: authErr.statusCode }
      );
    }

    return NextResponse.json(
      {
        error: {
          code: 'INTERNAL_ERROR',
          message: err instanceof Error ? err.message : 'Internal server error',
        },
      },
      { status: 500 }
    );
  }
}
