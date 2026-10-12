/**
 * AageOnline — Admin Payment Operations API
 *
 * GET /api/admin/payments
 *
 * Paginated and searchable payment orders for administrative operators.
 * Sanitized of secrets or credentials.
 */

import { NextRequest, NextResponse } from 'next/server';
import { authService } from '../../../../data-access/auth/index.ts';
import { assertPlatformAdmin } from '../../../../lib/auth/admin-guard.ts';
import { PostgresPaymentRepository } from '../../../../lib/db/repositories/payment-repository.ts';
import { isDatabaseConfigured } from '../../../../lib/db/client.ts';
import { getAllPaymentOrdersInternal } from '../../../../lib/payments/store.ts';

const paymentRepo = new PostgresPaymentRepository();

export async function GET(req: NextRequest) {
  try {
    const user = await authService.getCurrentUser().catch(() => null);
    assertPlatformAdmin(user);

    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '20', 10);
    const status = searchParams.get('status') || 'ALL';
    const search = searchParams.get('search') || '';

    if (isDatabaseConfigured()) {
      const result = await paymentRepo.getPaginatedPaymentOrders({
        page,
        limit,
        status,
        search,
      });

      return NextResponse.json({
        data: {
          orders: result.orders,
          pagination: {
            page,
            limit,
            totalCount: result.totalCount,
            totalPages: Math.ceil(result.totalCount / limit),
          },
        },
      });
    }

    // In-memory fallback
    let all = getAllPaymentOrdersInternal();
    if (status !== 'ALL') {
      all = all.filter((o) => o.status === status);
    }
    if (search) {
      const q = search.toLowerCase();
      all = all.filter(
        (o) =>
          o.id.toLowerCase().includes(q) ||
          o.bidIntentId.toLowerCase().includes(q) ||
          o.providerTransactionId.toLowerCase().includes(q) ||
          o.businessId.toLowerCase().includes(q)
      );
    }

    const totalCount = all.length;
    const offset = (page - 1) * limit;
    const paginated = all.slice(offset, offset + limit);

    return NextResponse.json({
      data: {
        orders: paginated,
        pagination: {
          page,
          limit,
          totalCount,
          totalPages: Math.ceil(totalCount / limit),
        },
      },
    });
  } catch (err: unknown) {
    const errorObj = err as { statusCode?: number; code?: string; message?: string };
    const statusCode = errorObj.statusCode || 500;
    return NextResponse.json(
      {
        error: {
          code: errorObj.code || 'PAYMENTS_FETCH_FAILED',
          message: errorObj.message || 'Failed to fetch payment orders.',
        },
      },
      { status: statusCode }
    );
  }
}
