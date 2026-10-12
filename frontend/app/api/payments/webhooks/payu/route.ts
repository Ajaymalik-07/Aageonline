import { NextRequest, NextResponse } from 'next/server';
import { processPayUWebhook } from '../../../../../lib/payments/store.ts';
import { PaymentDomainError } from '../../../../../lib/payments/errors.ts';

export async function POST(req: NextRequest) {
  try {
    const contentType = req.headers.get('content-type') || '';
    const payload: Record<string, string> = {};

    if (contentType.includes('application/json')) {
      const json = await req.json();
      for (const [key, value] of Object.entries(json)) {
        payload[key] = String(value);
      }
    } else if (contentType.includes('application/x-www-form-urlencoded') || contentType.includes('multipart/form-data')) {
      const formData = await req.formData();
      formData.forEach((value, key) => {
        payload[key] = typeof value === 'string' ? value : value.name;
      });
    } else {
      // Fallback: parse raw text as URL search params
      const text = await req.text();
      const params = new URLSearchParams(text);
      params.forEach((value, key) => {
        payload[key] = value;
      });
    }

    const result = await processPayUWebhook(payload);

    return NextResponse.json({
      status: 'success',
      data: {
        processed: result.processed,
        orderId: result.orderId,
        paymentStatus: result.status,
        isDuplicate: result.isDuplicate,
      },
    });
  } catch (error: unknown) {
    if (error instanceof PaymentDomainError) {
      return NextResponse.json(
        {
          status: 'error',
          error: {
            code: error.code,
            message: error.message,
            details: error.details,
          },
        },
        { status: error.statusCode }
      );
    }

    const err = error as Error;
    return NextResponse.json(
      {
        status: 'error',
        error: {
          code: 'WEBHOOK_PROCESSING_FAILED',
          message: err.message || 'An error occurred during PayU webhook processing.',
        },
      },
      { status: 500 }
    );
  }
}
