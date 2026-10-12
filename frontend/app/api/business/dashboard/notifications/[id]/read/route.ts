/**
 * AageOnline — Mark Notification Read API
 *
 * POST /api/business/dashboard/notifications/[id]/read
 *
 * Idempotent mark-as-read mutation.
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireBusinessMembership } from '../../../../../../../lib/auth/server-guard.ts';
import { PostgresNotificationRepository } from '../../../../../../../lib/db/repositories/notification-repository.ts';
import { recordAuditEvent } from '../../../../../../../lib/audit/store.ts';

const notificationRepo = new PostgresNotificationRepository();

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json().catch(() => ({}));
    const businessId = body.businessId || req.nextUrl.searchParams.get('businessId');

    if (!businessId) {
      return NextResponse.json(
        { error: { code: 'MISSING_BUSINESS_ID', message: 'businessId is required.' } },
        { status: 400 }
      );
    }

    const { user } = await requireBusinessMembership(req, businessId, 'workspace.access');

    const updated = await notificationRepo.markAsRead(id, businessId, user.id);

    if (updated) {
      recordAuditEvent('NOTIFICATION_MARKED_READ', 'BusinessNotification', id, user.id, {
        businessId,
      });
    }

    return NextResponse.json({
      data: { success: true, updated },
    });
  } catch (err: unknown) {
    const errorObj = err as { statusCode?: number; code?: string; message?: string };
    const statusCode = errorObj.statusCode || 500;
    return NextResponse.json(
      {
        error: {
          code: errorObj.code || 'MARK_READ_FAILED',
          message: errorObj.message || 'Failed to mark notification as read.',
        },
      },
      { status: statusCode }
    );
  }
}
