import { NextRequest, NextResponse } from 'next/server';
import { processPayUWebhook } from '../../../../../lib/payments/store.ts';

async function handlePayUCallback(req: NextRequest) {
  const payload: Record<string, string> = {};

  try {
    const contentType = req.headers.get('content-type') || '';

    if (contentType.includes('application/x-www-form-urlencoded') || contentType.includes('multipart/form-data')) {
      const formData = await req.formData();
      formData.forEach((value, key) => {
        payload[key] = typeof value === 'string' ? value : value.name;
      });
    } else {
      const url = new URL(req.url);
      url.searchParams.forEach((value, key) => {
        payload[key] = value;
      });
    }

    // Attempt authoritative server-side processing & signature verification
    if (payload.hash && payload.txnid) {
      await processPayUWebhook(payload).catch((err) => {
        // Log verification failure without halting redirect
        console.warn('PayU browser callback signature verification failed or duplicate:', err?.message);
      });
    }
  } catch (err) {
    console.warn('Error parsing PayU browser callback payload:', err);
  }

  const txnid = payload.txnid || '';
  const status = (payload.status || 'unknown').toLowerCase();
  const paymentStatus = status === 'success' ? 'SUCCEEDED' : 'FAILED';

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  const destination = new URL('/business/dashboard/markets', baseUrl);
  if (txnid) destination.searchParams.set('paymentTxn', txnid);
  destination.searchParams.set('paymentStatus', paymentStatus);

  return NextResponse.redirect(destination.toString(), 303);
}

export async function POST(req: NextRequest) {
  return handlePayUCallback(req);
}

export async function GET(req: NextRequest) {
  return handlePayUCallback(req);
}
