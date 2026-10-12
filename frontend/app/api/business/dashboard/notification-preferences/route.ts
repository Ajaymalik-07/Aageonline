/**
 * AageOnline — Notification Preferences API
 *
 * GET /api/business/dashboard/notification-preferences
 * PUT /api/business/dashboard/notification-preferences
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireBusinessMembership } from '../../../../../lib/auth/server-guard.ts';
import { PostgresNotificationRepository } from '../../../../../lib/db/repositories/notification-repository.ts';
import { recordAuditEvent } from '../../../../../lib/audit/store.ts';

const notificationRepo = new PostgresNotificationRepository();

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const businessId = searchParams.get('businessId');
    if (!businessId) {
      return NextResponse.json(
        { error: { code: 'MISSING_BUSINESS_ID', message: 'businessId is required.' } },
        { status: 400 }
      );
    }

    const { user } = await requireBusinessMembership(req, businessId, 'workspace.access');

    const pref = await notificationRepo.getPreference(user.id, businessId);

    return NextResponse.json({ data: pref });
  } catch (err: unknown) {
    const errorObj = err as { statusCode?: number; code?: string; message?: string };
    const statusCode = errorObj.statusCode || 500;
    return NextResponse.json(
      {
        error: {
          code: errorObj.code || 'PREFERENCES_FETCH_FAILED',
          message: errorObj.message || 'Failed to get notification preferences.',
        },
      },
      { status: statusCode }
    );
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const { businessId, emailRankingDrops, inAppRankingDrops, digestWindowMinutes } = body;

    if (!businessId) {
      return NextResponse.json(
        { error: { code: 'MISSING_BUSINESS_ID', message: 'businessId is required.' } },
        { status: 400 }
      );
    }

    const { user } = await requireBusinessMembership(req, businessId, 'workspace.access');

    const existing = await notificationRepo.getPreference(user.id, businessId);
    const updated = await notificationRepo.upsertPreference({
      ...existing,
      emailRankingDrops: typeof emailRankingDrops === 'boolean' ? emailRankingDrops : existing.emailRankingDrops,
      inAppRankingDrops: typeof inAppRankingDrops === 'boolean' ? inAppRankingDrops : existing.inAppRankingDrops,
      digestWindowMinutes: typeof digestWindowMinutes === 'number' ? Math.max(0, Math.min(1440, digestWindowMinutes)) : existing.digestWindowMinutes,
      updatedAt: new Date().toISOString(),
    });

    recordAuditEvent(
      'NOTIFICATION_PREFERENCE_UPDATED',
      'NotificationPreference',
      updated.id,
      user.id,
      {
        businessId,
        emailRankingDrops: updated.emailRankingDrops,
        inAppRankingDrops: updated.inAppRankingDrops,
        digestWindowMinutes: updated.digestWindowMinutes,
      }
    );

    return NextResponse.json({ data: updated });
  } catch (err: unknown) {
    const errorObj = err as { statusCode?: number; code?: string; message?: string };
    const statusCode = errorObj.statusCode || 500;
    return NextResponse.json(
      {
        error: {
          code: errorObj.code || 'PREFERENCES_UPDATE_FAILED',
          message: errorObj.message || 'Failed to update notification preferences.',
        },
      },
      { status: statusCode }
    );
  }
}
