/**
 * AageOnline — Notification & Ranking Event Processing Service
 *
 * Implements:
 * 1. Ranking event processing & downward-movement milestone evaluation
 * 2. Rapid-movement digesting/coalescing within configurable window
 * 3. Notification delivery queue management with bounded exponential retries
 * 4. Audit logging of all notification creations and deliveries
 */

import type {
  BusinessNotification,
  RankingChangeEvent,
} from '../../types/notification.ts';
import { PostgresRankingChangeEventRepository } from '../db/repositories/ranking-change-event-repository.ts';
import { PostgresNotificationRepository } from '../db/repositories/notification-repository.ts';
import { evaluateDownwardMilestones } from './milestones.ts';
import {
  StandardDeliveryAdapter,
  type NotificationDeliveryAdapter,
} from './delivery-adapter.ts';
import { getMarketById } from '../taxonomy/markets.ts';
import { getCityById } from '../taxonomy/locations.ts';
import { getCategoryById } from '../taxonomy/categories.ts';
import { getMembershipsByBusiness } from '../memberships/store.ts';
import { getUserById } from '../auth/store.ts';
import { recordAuditEvent } from '../audit/store.ts';

const rankingEventRepo = new PostgresRankingChangeEventRepository();
const notificationRepo = new PostgresNotificationRepository();
const defaultAdapter = new StandardDeliveryAdapter();

export interface ProcessEventsResult {
  processedEvents: number;
  createdNotifications: number;
  coalescedNotifications: number;
}

export interface DeliverNotificationsResult {
  deliveredCount: number;
  retryableCount: number;
  failedCount: number;
}

/**
 * Discovers and processes pending ranking change events into durable business notifications.
 */
export async function processPendingRankingEvents(
  options: { batchSize?: number } = {}
): Promise<ProcessEventsResult> {
  const batchSize = Math.min(100, Math.max(1, options.batchSize || 25));
  const pendingEvents = await rankingEventRepo.getPendingEvents(batchSize);

  let createdNotifications = 0;
  let coalescedNotifications = 0;

  for (const event of pendingEvents) {
    // Only downward ranking changes are eligible for milestone drop notifications
    if (event.direction === 'DOWN' && event.previousPosition !== null) {
      // 1. Resolve human-readable market name
      const market = getMarketById(event.marketId);
      let marketName: string | undefined;
      if (market) {
        const city = getCityById(market.cityId);
        const cat = getCategoryById(market.categoryId);
        marketName = city && cat ? `${city.name} · ${cat.name}` : market.slug;
      }

      // 2. Evaluate downward milestone crossings
      const evalResult = evaluateDownwardMilestones(
        event.previousPosition,
        event.newPosition,
        marketName
      );

      if (evalResult && evalResult.primaryMilestone) {
        // 3. Digesting / Coalescing Check for in-app workspace notification
        const existingPending = await notificationRepo.findRecentPendingNotification(
          event.businessId,
          event.marketId,
          15
        );

        if (existingPending) {
          // Rapid movement detected: coalesce into the existing pending notification
          await notificationRepo.coalesceNotification(
            existingPending.id,
            event.newPosition,
            evalResult.primaryMilestone.key,
            evalResult.notificationTitle,
            evalResult.notificationMessage
          );
          coalescedNotifications++;
        } else {
          // Create new in-app notification for the business workspace
          const nowIso = new Date().toISOString();
          const inAppNotif: BusinessNotification = {
            id: `notif_app_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`,
            businessId: event.businessId,
            recipientUserId: null,
            marketId: event.marketId,
            rankingChangeEventId: event.id,
            eventType: 'RANKING_DROP_MILESTONE',
            milestone: evalResult.primaryMilestone.key,
            previousPosition: event.previousPosition,
            newPosition: event.newPosition,
            title: evalResult.notificationTitle,
            message: evalResult.notificationMessage,
            channel: 'IN_APP',
            status: 'PENDING',
            isRead: false,
            attempts: 0,
            maxAttempts: 5,
            nextRunAt: nowIso,
            deliveryMetadata: {
              milestonesCrossed: evalResult.crossedMilestones.map((m) => m.key),
            },
            createdAt: nowIso,
            updatedAt: nowIso,
          };

          await notificationRepo.createNotification(inAppNotif);
          createdNotifications++;

          recordAuditEvent(
            'NOTIFICATION_CREATED',
            'BusinessNotification',
            inAppNotif.id,
            undefined,
            {
              businessId: event.businessId,
              marketId: event.marketId,
              channel: 'IN_APP',
              milestone: inAppNotif.milestone,
              newPosition: inAppNotif.newPosition,
            }
          );
        }

        // 4. Resolve active members who have explicitly opted into email alerts
        const memberships = getMembershipsByBusiness(event.businessId).filter(
          (m) => m.status === 'ACTIVE'
        );

        for (const membership of memberships) {
          const pref = await notificationRepo.getPreference(membership.userId, event.businessId);

          if (pref.emailRankingDrops) {
            const nowIso = new Date().toISOString();
            const emailNotif: BusinessNotification = {
              id: `notif_eml_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`,
              businessId: event.businessId,
              recipientUserId: membership.userId,
              marketId: event.marketId,
              rankingChangeEventId: event.id,
              eventType: 'RANKING_DROP_MILESTONE',
              milestone: evalResult.primaryMilestone.key,
              previousPosition: event.previousPosition,
              newPosition: event.newPosition,
              title: evalResult.notificationTitle,
              message: evalResult.notificationMessage,
              channel: 'EMAIL',
              status: 'PENDING',
              isRead: false,
              attempts: 0,
              maxAttempts: 5,
              nextRunAt: nowIso,
              deliveryMetadata: {
                milestonesCrossed: evalResult.crossedMilestones.map((m) => m.key),
              },
              createdAt: nowIso,
              updatedAt: nowIso,
            };

            await notificationRepo.createNotification(emailNotif);
            createdNotifications++;

            recordAuditEvent(
              'NOTIFICATION_CREATED',
              'BusinessNotification',
              emailNotif.id,
              membership.userId,
              {
                businessId: event.businessId,
                marketId: event.marketId,
                channel: 'EMAIL',
                milestone: emailNotif.milestone,
              }
            );
          }
        }
      }
    }

    // 6. Mark event processed
    await rankingEventRepo.markEventProcessed(event.id);
  }

  return {
    processedEvents: pendingEvents.length,
    createdNotifications,
    coalescedNotifications,
  };
}

/**
 * Delivers queued notifications with bounded retry and error classification.
 */
export async function deliverPendingNotifications(
  options: {
    batchSize?: number;
    adapter?: NotificationDeliveryAdapter;
  } = {}
): Promise<DeliverNotificationsResult> {
  const batchSize = Math.min(100, Math.max(1, options.batchSize || 25));
  const adapter = options.adapter || defaultAdapter;

  const pendingNotifs = await notificationRepo.getPendingDeliveries(batchSize);

  let deliveredCount = 0;
  let retryableCount = 0;
  let failedCount = 0;

  for (const notif of pendingNotifs) {
    let recipientEmail: string | undefined;
    if (notif.recipientUserId) {
      const user = getUserById(notif.recipientUserId);
      recipientEmail = user?.email;
    }

    try {
      const res = await adapter.send(notif, recipientEmail);

      if (res.success) {
        await notificationRepo.updateDeliveryStatus(notif.id, 'DELIVERED', undefined, res.metadata);
        deliveredCount++;

        recordAuditEvent(
          'NOTIFICATION_DELIVERED',
          'BusinessNotification',
          notif.id,
          notif.recipientUserId || undefined,
          {
            businessId: notif.businessId,
            channel: notif.channel,
            providerMessageId: res.providerMessageId,
          }
        );
      } else if (res.retryable && notif.attempts + 1 < notif.maxAttempts) {
        // Bounded exponential backoff with jitter
        const backoffMs = Math.pow(2, notif.attempts) * 30 * 1000 + Math.floor(Math.random() * 5000);
        const nextRunAt = new Date(Date.now() + backoffMs).toISOString();

        await notificationRepo.updateDeliveryStatus(notif.id, 'RETRYABLE', res.error, {
          nextRunAt,
          attempt: notif.attempts + 1,
        });
        retryableCount++;
      } else {
        // Permanent failure
        await notificationRepo.updateDeliveryStatus(notif.id, 'FAILED', res.error);
        failedCount++;

        recordAuditEvent(
          'NOTIFICATION_DELIVERY_FAILED',
          'BusinessNotification',
          notif.id,
          notif.recipientUserId || undefined,
          {
            businessId: notif.businessId,
            channel: notif.channel,
            error: res.error,
          }
        );
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Unknown delivery error';
      await notificationRepo.updateDeliveryStatus(notif.id, 'FAILED', errorMsg);
      failedCount++;
    }
  }

  return {
    deliveredCount,
    retryableCount,
    failedCount,
  };
}
