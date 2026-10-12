/**
 * AageOnline — Admin Payment Detail API
 *
 * GET /api/admin/payments/[id]
 *
 * Detailed record of a specific payment order, associated ranking settlement,
 * and correlated provider events.
 */

import { NextRequest, NextResponse } from 'next/server';
import { authService } from '../../../../../data-access/auth/index.ts';
import { assertPlatformAdmin } from '../../../../../lib/auth/admin-guard.ts';
import { PostgresPaymentRepository } from '../../../../../lib/db/repositories/payment-repository.ts';
import { PostgresRankingSettlementRepository } from '../../../../../lib/db/repositories/ranking-settlement-repository.ts';
import { isDatabaseConfigured } from '../../../../../lib/db/client.ts';
import { getPaymentOrderInternal } from '../../../../../lib/payments/store.ts';
import { getRankingSettlementByPaymentOrderId } from '../../../../../lib/ranking-settlement/settlement-service.ts';

const paymentRepo = new PostgresPaymentRepository();
const settlementRepo = new PostgresRankingSettlementRepository();

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await authService.getCurrentUser().catch(() => null);
    assertPlatformAdmin(user);

    const { id } = await params;

    let order = null;
    let settlement = null;

    if (isDatabaseConfigured()) {
      order = await paymentRepo.getPaymentOrderById(id);
      if (order) {
        settlement = await settlementRepo.getSettlementByPaymentOrderId(id);
      }
    } else {
      order = getPaymentOrderInternal(id) || null;
      if (order) {
        settlement = getRankingSettlementByPaymentOrderId(id) || null;
      }
    }

    if (!order) {
      return NextResponse.json(
        {
          error: {
            code: 'PAYMENT_ORDER_NOT_FOUND',
            message: `Payment order "${id}" not found.`,
          },
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      data: {
        order,
        settlement,
      },
    });
  } catch (err: unknown) {
    const errorObj = err as { statusCode?: number; code?: string; message?: string };
    const statusCode = errorObj.statusCode || 500;
    return NextResponse.json(
      {
        error: {
          code: errorObj.code || 'PAYMENT_FETCH_FAILED',
          message: errorObj.message || 'Failed to fetch payment order details.',
        },
      },
      { status: statusCode }
    );
  }
}
