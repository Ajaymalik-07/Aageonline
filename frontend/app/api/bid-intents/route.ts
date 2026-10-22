import { NextRequest, NextResponse } from 'next/server';
import { createBidIntent } from '../../../lib/bid-intent/store.ts';
import { BidIntentError } from '../../../lib/bid-intent/errors.ts';
import { requireBusinessMembership } from '../../../lib/auth/server-guard.ts';

export async function POST(req: NextRequest) {
  try {
    const idempotencyKey =
      req.headers.get('idempotency-key') ||
      req.headers.get('Idempotency-Key') ||
      undefined;

    if (!idempotencyKey || idempotencyKey.trim() === '') {
      return NextResponse.json(
        {
          error: {
            code: 'IDEMPOTENCY_KEY_REQUIRED',
            message: 'Idempotency-Key header is required for creating a visibility intent.',
          },
        },
        { status: 400 }
      );
    }

    const body = await req.json();
    const { businessId, marketId, targetPosition, clientCalculatedAmountMinor, offeredAmountMinor } = body;

    if (!businessId || typeof businessId !== 'string') {
      return NextResponse.json(
        {
          error: {
            code: 'INVALID_BUSINESS_ID',
            message: 'Field "businessId" is required.',
          },
        },
        { status: 400 }
      );
    }

    if (!marketId || typeof marketId !== 'string') {
      return NextResponse.json(
        {
          error: {
            code: 'INVALID_MARKET_ID',
            message: 'Field "marketId" is required.',
          },
        },
        { status: 400 }
      );
    }

    if (
      typeof targetPosition !== 'number' ||
      !Number.isSafeInteger(targetPosition) ||
      targetPosition <= 0
    ) {
      return NextResponse.json(
        {
          error: {
            code: 'INVALID_TARGET_POSITION',
            message: 'Target position must be a positive whole integer greater than zero.',
          },
        },
        { status: 400 }
      );
    }

    // Server-Side Authorization: Assert user session and active business membership with bidIntent.create permission
    const { user } = await requireBusinessMembership(req, businessId, 'bidIntent.create');

    const intent = await createBidIntent(
      {
        businessId,
        marketId,
        targetPosition,
        clientCalculatedAmountMinor,
        offeredAmountMinor,
        idempotencyKey,
      },
      user.id
    );

    return NextResponse.json({ data: intent }, { status: 201 });
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
