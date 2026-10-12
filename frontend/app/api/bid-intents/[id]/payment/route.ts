import { NextRequest, NextResponse } from 'next/server';
import { getPaymentOrderByBidIntentIdAsync } from '../../../../../lib/payments/store.ts';
import { PaymentDomainError } from '../../../../../lib/payments/errors.ts';
import { requireAuthenticatedUser } from '../../../../../lib/auth/server-guard.ts';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuthenticatedUser(req);
    const { id: bidIntentId } = await params;

    const order = await getPaymentOrderByBidIntentIdAsync(bidIntentId, user.id);

    if (!order) {
      return NextResponse.json(
        {
          error: {
            code: 'PAYMENT_ORDER_NOT_FOUND',
            message: `No payment order found for BidIntent "${bidIntentId}".`,
          },
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      data: {
        paymentOrder: order,
      },
    });
  } catch (error: unknown) {
    if (error instanceof PaymentDomainError) {
      return NextResponse.json(
        {
          error: {
            code: error.code,
            message: error.message,
            details: error.details,
          },
        },
        { status: error.statusCode }
      );
    }

    if (error && typeof error === 'object' && 'statusCode' in error) {
      const authErr = error as { statusCode: number; code?: string; message?: string };
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

    const err = error as Error;
    return NextResponse.json(
      {
        error: {
          code: 'PAYMENT_FETCH_FAILED',
          message: err.message || 'An unexpected error occurred while fetching payment order.',
        },
      },
      { status: 500 }
    );
  }
}
