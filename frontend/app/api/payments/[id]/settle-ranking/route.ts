import { NextRequest, NextResponse } from 'next/server';
import {
  settleRanking,
  getRankingSettlementByPaymentOrderIdAsync,
} from '../../../../../lib/ranking-settlement/settlement-service.ts';
import { RankingSettlementDomainError } from '../../../../../lib/ranking-settlement/errors.ts';
import { requireAuthenticatedUser } from '../../../../../lib/auth/server-guard.ts';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: paymentOrderId } = await params;

    const user = await requireAuthenticatedUser(req);

    const result = await settleRanking({
      paymentOrderId,
      actorUserId: user.id,
    });

    return NextResponse.json({
      data: result,
    });
  } catch (error: unknown) {
    if (error instanceof RankingSettlementDomainError) {
      return NextResponse.json(
        {
          error: {
            code: error.code,
            message: error.message,
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
          code: 'RANKING_SETTLEMENT_FAILED',
          message: err.message || 'An unexpected error occurred during ranking settlement.',
        },
      },
      { status: 500 }
    );
  }
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: paymentOrderId } = await params;
    const user = await requireAuthenticatedUser(req);

    const settlement = await getRankingSettlementByPaymentOrderIdAsync(
      paymentOrderId,
      user.id
    );

    if (!settlement) {
      return NextResponse.json(
        {
          error: {
            code: 'RANKING_SETTLEMENT_NOT_FOUND',
            message: `No ranking settlement found for payment order "${paymentOrderId}".`,
          },
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      data: { settlement },
    });
  } catch (error: unknown) {
    if (error instanceof RankingSettlementDomainError) {
      return NextResponse.json(
        {
          error: {
            code: error.code,
            message: error.message,
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
          code: 'RANKING_SETTLEMENT_QUERY_FAILED',
          message: err.message || 'An unexpected error occurred while querying ranking settlement.',
        },
      },
      { status: 500 }
    );
  }
}
