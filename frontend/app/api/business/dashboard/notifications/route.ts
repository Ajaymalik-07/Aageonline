/**
 * AageOnline — Business Notifications API
 *
 * GET /api/business/dashboard/notifications
 *
 * Paginated in-app notifications for the authenticated business.
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireBusinessMembership } from '../../../../../lib/auth/server-guard.ts';
import { PostgresNotificationRepository } from '../../../../../lib/db/repositories/notification-repository.ts';

const notificationRepo = new PostgresNotificationRepository();

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const businessId = searchParams.get('businessId');
    if (!businessId) {
      return NextResponse.json(
        { error: { code: 'MISSING_BUSINESS_ID', message: 'businessId parameter is required.' } },
        { status: 400 }
      );
    }

    // Server-Side Authorization: Assert user session and active business membership
    const { user } = await requireBusinessMembership(req, businessId, 'workspace.access');

    const unreadOnly = searchParams.get('unreadOnly') === 'true';
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '20', 10);

    const result = await notificationRepo.getNotificationsByBusiness(businessId, {
      page,
      limit,
      unreadOnly,
      userId: user.id,
    });

    return NextResponse.json({
      data: {
        notifications: result.notifications,
        pagination: {
          page,
          limit,
          totalCount: result.totalCount,
          totalPages: Math.ceil(result.totalCount / limit),
        },
      },
    });
  } catch (err: unknown) {
    const errorObj = err as { statusCode?: number; code?: string; message?: string };
    const statusCode = errorObj.statusCode || 500;
    return NextResponse.json(
      {
        error: {
          code: errorObj.code || 'NOTIFICATIONS_FETCH_FAILED',
          message: errorObj.message || 'Failed to load notifications.',
        },
      },
      { status: statusCode }
    );
  }
}
