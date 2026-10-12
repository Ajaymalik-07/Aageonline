import { NextRequest, NextResponse } from 'next/server';
import { cancelPaymentOrderAsync } from '../../../../../lib/payments/store.ts';
import { PaymentDomainError } from '../../../../../lib/payments/errors.ts';
import { requireAuthenticatedUser } from '../../../../../lib/auth/server-guard.ts';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuthenticatedUser(req);
    const { id: paymentOrderId } = await params;

    const body = await req.json().catch(() => ({}));
    const { reason } = body;

    const order = await cancelPaymentOrderAsync({
      paymentOrderId,
      actorUserId: user.id,
      reason,
    });

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
          code: 'PAYMENT_CANCEL_FAILED',
          message: err.message || 'An unexpected error occurred while cancelling payment order.',
        },
      },
      { status: 500 }
    );
  }
}
