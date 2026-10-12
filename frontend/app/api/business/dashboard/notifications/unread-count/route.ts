/**
 * AageOnline — Business Notifications Unread Count API
 *
 * GET /api/business/dashboard/notifications/unread-count
 *
 * Fast unread counter for notification badges.
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireBusinessMembership } from '../../../../../../lib/auth/server-guard.ts';
import { PostgresNotificationRepository } from '../../../../../../lib/db/repositories/notification-repository.ts';

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

    const { user } = await requireBusinessMembership(req, businessId, 'workspace.access');

    const unreadCount = await notificationRepo.getUnreadCount(businessId, user.id);

    return NextResponse.json({
      data: { unreadCount },
    });
  } catch (err: unknown) {
    const errorObj = err as { statusCode?: number; code?: string; message?: string };
    const statusCode = errorObj.statusCode || 500;
    return NextResponse.json(
      {
        error: {
          code: errorObj.code || 'UNREAD_COUNT_FAILED',
          message: errorObj.message || 'Failed to get unread count.',
        },
      },
      { status: statusCode }
    );
  }
}
