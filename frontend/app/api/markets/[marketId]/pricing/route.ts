import { NextRequest, NextResponse } from 'next/server';
import { defaultPricingCalculator } from '../../../../../lib/pricing/index.ts';
import { PricingError } from '../../../../../lib/pricing/errors.ts';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ marketId: string }> }
) {
  try {
    const { marketId } = await params;
    const { searchParams } = new URL(req.url);
    const targetPosRaw = searchParams.get('targetPosition');
    const businessId = searchParams.get('businessId') || undefined;

    if (!targetPosRaw) {
      return NextResponse.json(
        {
          error: {
            code: 'MISSING_TARGET_POSITION',
            message: 'Query parameter "targetPosition" is required.',
          },
        },
        { status: 400 }
      );
    }

    const trimmed = targetPosRaw.trim();
    if (!/^\d+$/.test(trimmed)) {
      return NextResponse.json(
        {
          error: {
            code: 'INVALID_TARGET_POSITION',
            message: 'Target position must be a positive whole integer without decimals.',
          },
        },
        { status: 400 }
      );
    }

    const targetPosition = parseInt(trimmed, 10);
    if (isNaN(targetPosition) || targetPosition <= 0) {
      return NextResponse.json(
        {
          error: {
            code: 'INVALID_TARGET_POSITION',
            message: 'Target position must be a positive integer greater than zero.',
          },
        },
        { status: 400 }
      );
    }

    const result = await defaultPricingCalculator.calculateRequiredQualifyingAmount({
      marketId,
      targetPosition,
      businessId,
    });

    return NextResponse.json(
      { data: result },
      {
        headers: {
          'Cache-Control': 'private, no-cache, no-store, max-age=0, must-revalidate',
        },
      }
    );
  } catch (err: unknown) {
    if (err instanceof PricingError) {
      return NextResponse.json(
        { error: { code: err.code, message: err.message } },
        { status: err.statusCode }
      );
    }

    const message = err instanceof Error ? err.message : 'Internal pricing calculation error';
    return NextResponse.json(
      { error: { code: 'INTERNAL_PRICING_ERROR', message } },
      { status: 500 }
    );
  }
}
