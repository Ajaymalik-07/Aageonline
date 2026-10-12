import { NextRequest, NextResponse } from 'next/server';
import { createPaymentOrder } from '../../../../../lib/payments/store.ts';
import { PaymentDomainError } from '../../../../../lib/payments/errors.ts';
import { requireAuthenticatedUser } from '../../../../../lib/auth/server-guard.ts';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuthenticatedUser(req);
    const { id: bidIntentId } = await params;

    const idempotencyKey =
      req.headers.get('idempotency-key') ||
      req.headers.get('Idempotency-Key') ||
      undefined;

    if (!idempotencyKey || idempotencyKey.trim() === '') {
      return NextResponse.json(
        {
          error: {
            code: 'IDEMPOTENCY_KEY_REQUIRED',
            message: 'Idempotency-Key header is required for creating a payment order.',
          },
        },
        { status: 400 }
      );
    }

    const body = await req.json().catch(() => ({}));
    const { customerName, customerEmail, customerPhone } = body;

    const result = await createPaymentOrder({
      bidIntentId,
      idempotencyKey,
      actorUserId: user.id,
      customerName,
      customerEmail,
      customerPhone,
    });

    return NextResponse.json({ data: result }, { status: 201 });
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
          code: 'PAYMENT_ORDER_CREATION_FAILED',
          message: err.message || 'An unexpected error occurred while creating payment order.',
        },
      },
      { status: 500 }
    );
  }
}
