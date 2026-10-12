/**
 * AageOnline — Admin Provider Events API
 *
 * GET /api/admin/provider-events
 *
 * Paginated view of persisted webhook/provider events with validation outcomes
 * and processing status.
 */

import { NextRequest, NextResponse } from 'next/server';
import { authService } from '../../../../data-access/auth/index.ts';
import { assertPlatformAdmin } from '../../../../lib/auth/admin-guard.ts';
import { PostgresPaymentRepository } from '../../../../lib/db/repositories/payment-repository.ts';
import { isDatabaseConfigured } from '../../../../lib/db/client.ts';

const paymentRepo = new PostgresPaymentRepository();

export async function GET(req: NextRequest) {
  try {
    const user = await authService.getCurrentUser().catch(() => null);
    assertPlatformAdmin(user);

    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '20', 10);
    const status = searchParams.get('status') || 'ALL';

    if (isDatabaseConfigured()) {
      const result = await paymentRepo.getPaginatedProviderEvents({
        page,
        limit,
        status,
      });

      return NextResponse.json({
        data: {
          events: result.events,
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
    return NextResponse.json({
      data: {
        events: [],
        pagination: {
          page: 1,
          limit,
          totalCount: 0,
          totalPages: 0,
        },
      },
    });
  } catch (err: unknown) {
    const errorObj = err as { statusCode?: number; code?: string; message?: string };
    const statusCode = errorObj.statusCode || 500;
    return NextResponse.json(
      {
        error: {
          code: errorObj.code || 'PROVIDER_EVENTS_FETCH_FAILED',
          message: errorObj.message || 'Failed to fetch provider events.',
        },
      },
      { status: statusCode }
    );
  }
}
