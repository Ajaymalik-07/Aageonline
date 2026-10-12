import { NextRequest, NextResponse } from 'next/server';
import { cancelBidIntentAsync } from '../../../../../lib/bid-intent/store.ts';
import { BidIntentError } from '../../../../../lib/bid-intent/errors.ts';
import { requireBusinessMembership } from '../../../../../lib/auth/server-guard.ts';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { businessId } = body;

    if (!businessId || typeof businessId !== 'string') {
      return NextResponse.json(
        {
          error: {
            code: 'INVALID_BUSINESS_ID',
            message: 'Field "businessId" is required to cancel a visibility intent.',
          },
        },
        { status: 400 }
      );
    }

    const { user } = await requireBusinessMembership(req, businessId, 'bidIntent.cancel');

    const cancelledIntent = await cancelBidIntentAsync({
      bidIntentId: id,
      actorUserId: user.id,
      businessId,
    });

    return NextResponse.json({ data: cancelledIntent });
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
