import { NextRequest, NextResponse } from 'next/server';
import { getBidIntentByIdAsync } from '../../../../lib/bid-intent/store.ts';
import { BidIntentError } from '../../../../lib/bid-intent/errors.ts';
import { requireAuthenticatedUser } from '../../../../lib/auth/server-guard.ts';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuthenticatedUser(req);
    const { id } = await params;
    const intent = await getBidIntentByIdAsync(id, user.id);

    return NextResponse.json({ data: intent });
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
