/**
 * AageOnline — Business Notification & Preferences Repository
 *
 * Persists durable business notifications, handles delivery queueing,
 * unread counters, digesting/coalescing lookups, and user preferences.
 */

import type pg from 'pg';
import type {
  BusinessNotification,
  NotificationPreference,
  NotificationOperationalStats,
} from '../../../types/notification.ts';
import { getDbPool, isDatabaseConfigured } from '../client.ts';

const IN_MEMORY_NOTIFICATIONS: Map<string, BusinessNotification> = new Map();
const IN_MEMORY_PREFERENCES: Map<string, NotificationPreference> = new Map();

export class PostgresNotificationRepository {
  private getClient(client?: pg.PoolClient): pg.PoolClient | pg.Pool {
    return client || getDbPool();
  }

  async createNotification(
    notif: BusinessNotification,
    client?: pg.PoolClient
  ): Promise<BusinessNotification> {
    if (client || isDatabaseConfigured()) {
      try {
        const db = this.getClient(client);
        await db.query(
          `INSERT INTO business_notifications (
            id, business_id, recipient_user_id, market_id, ranking_change_event_id,
            event_type, milestone, previous_position, new_position, title, message,
            channel, status, is_read, read_at, attempts, max_attempts, next_run_at,
            locked_until, last_error, delivery_metadata, created_at, updated_at, delivered_at
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24)
          ON CONFLICT (ranking_change_event_id, recipient_user_id, channel, event_type) DO NOTHING`,
          [
            notif.id,
            notif.businessId,
            notif.recipientUserId || null,
            notif.marketId,
            notif.rankingChangeEventId || null,
            notif.eventType,
            notif.milestone || null,
            notif.previousPosition ?? null,
            notif.newPosition,
            notif.title,
            notif.message,
            notif.channel,
            notif.status,
            notif.isRead,
            notif.readAt ? new Date(notif.readAt) : null,
            notif.attempts,
            notif.maxAttempts,
            new Date(notif.nextRunAt),
            notif.lockedUntil ? new Date(notif.lockedUntil) : null,
            notif.lastError || null,
            JSON.stringify(notif.deliveryMetadata || {}),
            new Date(notif.createdAt),
            new Date(notif.updatedAt),
            notif.deliveredAt ? new Date(notif.deliveredAt) : null,
          ]
        );
      } catch {
        // Fallback to in-memory
      }
    }

    // In-memory uniqueness check
    const existingKey = `${notif.rankingChangeEventId}_${notif.recipientUserId}_${notif.channel}_${notif.eventType}`;
    const exists = Array.from(IN_MEMORY_NOTIFICATIONS.values()).some(
      (n) => `${n.rankingChangeEventId}_${n.recipientUserId}_${n.channel}_${n.eventType}` === existingKey
    );
    if (!exists) {
      IN_MEMORY_NOTIFICATIONS.set(notif.id, { ...notif });
    }

    return notif;
  }

  async getPendingDeliveries(
    limit = 50,
    client?: pg.PoolClient
  ): Promise<BusinessNotification[]> {
    if (client || isDatabaseConfigured()) {
      try {
        const db = this.getClient(client);
        const res = await db.query(
          `SELECT id, business_id AS "businessId", recipient_user_id AS "recipientUserId",
                  market_id AS "marketId", ranking_change_event_id AS "rankingChangeEventId",
                  event_type AS "eventType", milestone, previous_position AS "previousPosition",
                  new_position AS "newPosition", title, message, channel, status,
                  is_read AS "isRead", read_at AS "readAt", attempts, max_attempts AS "maxAttempts",
                  next_run_at AS "nextRunAt", locked_until AS "lockedUntil", last_error AS "lastError",
                  delivery_metadata AS "deliveryMetadata", created_at AS "createdAt",
                  updated_at AS "updatedAt", delivered_at AS "deliveredAt"
           FROM business_notifications
           WHERE status IN ('PENDING', 'RETRYABLE') AND next_run_at <= NOW()
           ORDER BY next_run_at ASC
           LIMIT $1`,
          [limit]
        );
        return res.rows.map((r) => this.mapRow(r));
      } catch {
        // Fallback to in-memory
      }
    }

    const now = Date.now();
    return Array.from(IN_MEMORY_NOTIFICATIONS.values())
      .filter(
        (n) => (n.status === 'PENDING' || n.status === 'RETRYABLE') && new Date(n.nextRunAt).getTime() <= now
      )
      .sort((a, b) => new Date(a.nextRunAt).getTime() - new Date(b.nextRunAt).getTime())
      .slice(0, limit)
      .map((n) => ({ ...n }));
  }

  async updateDeliveryStatus(
    id: string,
    status: BusinessNotification['status'],
    error?: string,
    metadata?: Record<string, unknown>,
    client?: pg.PoolClient
  ): Promise<void> {
    const nowIso = new Date().toISOString();
    if (client || isDatabaseConfigured()) {
      try {
        const db = this.getClient(client);
        await db.query(
          `UPDATE business_notifications
           SET status = $1,
               last_error = $2,
               delivery_metadata = delivery_metadata || $3::jsonb,
               delivered_at = CASE WHEN $1 = 'DELIVERED' THEN NOW() ELSE delivered_at END,
               attempts = attempts + 1,
               updated_at = NOW()
           WHERE id = $4`,
          [status, error || null, JSON.stringify(metadata || {}), id]
        );
      } catch {
        // Fallback to in-memory
      }
    }

    const notif = IN_MEMORY_NOTIFICATIONS.get(id);
    if (notif) {
      notif.status = status;
      notif.attempts += 1;
      notif.updatedAt = nowIso;
      if (error) notif.lastError = error;
      if (status === 'DELIVERED') notif.deliveredAt = nowIso;
      if (metadata) notif.deliveryMetadata = { ...notif.deliveryMetadata, ...metadata };
    }
  }

  async getNotificationsByBusiness(
    businessId: string,
    options: {
      page?: number;
      limit?: number;
      unreadOnly?: boolean;
      userId?: string;
    } = {}
  ): Promise<{ notifications: BusinessNotification[]; totalCount: number }> {
    const page = Math.max(1, options.page || 1);
    const limit = Math.min(100, Math.max(1, options.limit || 20));
    const offset = (page - 1) * limit;

    if (isDatabaseConfigured()) {
      try {
        const pool = getDbPool();
        let query = `FROM business_notifications WHERE business_id = $1`;
        const params: unknown[] = [businessId];
        let idx = 2;

        if (options.unreadOnly) {
          query += ` AND is_read = false`;
        }
        if (options.userId) {
          query += ` AND (recipient_user_id IS NULL OR recipient_user_id = $${idx})`;
          params.push(options.userId);
          idx++;
        }

        const countRes = await pool.query(`SELECT COUNT(*)::int AS count ${query}`, params);
        const totalCount = countRes.rows[0]?.count || 0;

        const dataRes = await pool.query(
          `SELECT id, business_id AS "businessId", recipient_user_id AS "recipientUserId",
                  market_id AS "marketId", ranking_change_event_id AS "rankingChangeEventId",
                  event_type AS "eventType", milestone, previous_position AS "previousPosition",
                  new_position AS "newPosition", title, message, channel, status,
                  is_read AS "isRead", read_at AS "readAt", attempts, max_attempts AS "maxAttempts",
                  next_run_at AS "nextRunAt", locked_until AS "lockedUntil", last_error AS "lastError",
                  delivery_metadata AS "deliveryMetadata", created_at AS "createdAt",
                  updated_at AS "updatedAt", delivered_at AS "deliveredAt"
           ${query}
           ORDER BY created_at DESC
           LIMIT $${idx} OFFSET $${idx + 1}`,
          [...params, limit, offset]
        );

        return {
          notifications: dataRes.rows.map((r) => this.mapRow(r)),
          totalCount,
        };
      } catch {
        // Fallback to in-memory
      }
    }

    let items = Array.from(IN_MEMORY_NOTIFICATIONS.values()).filter(
      (n) => n.businessId === businessId
    );

    if (options.unreadOnly) {
      items = items.filter((n) => !n.isRead);
    }
    if (options.userId) {
      items = items.filter((n) => !n.recipientUserId || n.recipientUserId === options.userId);
    }

    const totalCount = items.length;
    items.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    const paginated = items.slice(offset, offset + limit).map((n) => ({ ...n }));

    return { notifications: paginated, totalCount };
  }

  async getUnreadCount(businessId: string, userId?: string): Promise<number> {
    if (isDatabaseConfigured()) {
      try {
        const pool = getDbPool();
        const res = await pool.query(
          `SELECT COUNT(*)::int AS count
           FROM business_notifications
           WHERE business_id = $1 AND is_read = false
             AND ($2::text IS NULL OR recipient_user_id IS NULL OR recipient_user_id = $2)`,
          [businessId, userId || null]
        );
        return res.rows[0]?.count || 0;
      } catch {
        // Fallback to in-memory
      }
    }

    return Array.from(IN_MEMORY_NOTIFICATIONS.values()).filter(
      (n) =>
        n.businessId === businessId &&
        !n.isRead &&
        (!userId || !n.recipientUserId || n.recipientUserId === userId)
    ).length;
  }

  async markAsRead(id: string, businessId: string, userId?: string): Promise<boolean> {
    const nowIso = new Date().toISOString();
    if (isDatabaseConfigured()) {
      try {
        const pool = getDbPool();
        const res = await pool.query(
          `UPDATE business_notifications
           SET is_read = true, read_at = NOW(), updated_at = NOW()
           WHERE id = $1 AND business_id = $2
             AND ($3::text IS NULL OR recipient_user_id IS NULL OR recipient_user_id = $3)`,
          [id, businessId, userId || null]
        );
        return (res.rowCount || 0) > 0;
      } catch {
        // Fallback to in-memory
      }
    }

    const notif = IN_MEMORY_NOTIFICATIONS.get(id);
    if (notif && notif.businessId === businessId) {
      if (userId && notif.recipientUserId && notif.recipientUserId !== userId) {
        return false;
      }
      notif.isRead = true;
      notif.readAt = nowIso;
      notif.updatedAt = nowIso;
      return true;
    }

    return false;
  }

  /**
   * Finds a recent undelivered notification for the business and market within the digest window.
   */
  async findRecentPendingNotification(
    businessId: string,
    marketId: string,
    windowMinutes = 15
  ): Promise<BusinessNotification | null> {
    const cutoff = new Date(Date.now() - windowMinutes * 60 * 1000).toISOString();

    if (isDatabaseConfigured()) {
      try {
        const pool = getDbPool();
        const res = await pool.query(
          `SELECT id, business_id AS "businessId", recipient_user_id AS "recipientUserId",
                  market_id AS "marketId", ranking_change_event_id AS "rankingChangeEventId",
                  event_type AS "eventType", milestone, previous_position AS "previousPosition",
                  new_position AS "newPosition", title, message, channel, status,
                  is_read AS "isRead", read_at AS "readAt", attempts, max_attempts AS "maxAttempts",
                  next_run_at AS "nextRunAt", locked_until AS "lockedUntil", last_error AS "lastError",
                  delivery_metadata AS "deliveryMetadata", created_at AS "createdAt",
                  updated_at AS "updatedAt", delivered_at AS "deliveredAt"
           FROM business_notifications
           WHERE business_id = $1 AND market_id = $2 AND status IN ('PENDING', 'RETRYABLE')
             AND created_at >= $3
           ORDER BY created_at DESC
           LIMIT 1`,
          [businessId, marketId, cutoff]
        );
        if (res.rows[0]) return this.mapRow(res.rows[0]);
      } catch {
        // Fallback to in-memory
      }
    }

    const found = Array.from(IN_MEMORY_NOTIFICATIONS.values()).find(
      (n) =>
        n.businessId === businessId &&
        n.marketId === marketId &&
        (n.status === 'PENDING' || n.status === 'RETRYABLE') &&
        new Date(n.createdAt).getTime() >= new Date(cutoff).getTime()
    );

    return found ? { ...found } : null;
  }

  /**
   * Updates an existing notification's position during rapid-movement digesting.
   */
  async coalesceNotification(
    id: string,
    newPosition: number,
    milestone: BusinessNotification['milestone'],
    title: string,
    message: string
  ): Promise<void> {
    const nowIso = new Date().toISOString();
    if (isDatabaseConfigured()) {
      try {
        const pool = getDbPool();
        await pool.query(
          `UPDATE business_notifications
           SET new_position = $1,
               milestone = $2,
               title = $3,
               message = $4,
               delivery_metadata = delivery_metadata || '{"coalesced": true}'::jsonb,
               updated_at = NOW()
           WHERE id = $5`,
          [newPosition, milestone || null, title, message, id]
        );
      } catch {
        // Fallback to in-memory
      }
    }

    const notif = IN_MEMORY_NOTIFICATIONS.get(id);
    if (notif) {
      notif.newPosition = newPosition;
      if (milestone) notif.milestone = milestone;
      notif.title = title;
      notif.message = message;
      notif.deliveryMetadata = { ...notif.deliveryMetadata, coalesced: true };
      notif.updatedAt = nowIso;
    }
  }

  async getOperationalStats(): Promise<NotificationOperationalStats> {
    if (isDatabaseConfigured()) {
      try {
        const pool = getDbPool();
        const res = await pool.query(
          `SELECT
             COUNT(*) FILTER (WHERE status = 'PENDING')::int AS "pendingDeliveries",
             COUNT(*) FILTER (WHERE status = 'RETRYABLE')::int AS "retryableDeliveries",
             COUNT(*) FILTER (WHERE status = 'FAILED')::int AS "failedDeliveries"
           FROM business_notifications`
        );
        const row = res.rows[0];
        return {
          pendingEventsCount: 0,
          pendingDeliveriesCount: row?.pendingDeliveries || 0,
          retryableDeliveriesCount: row?.retryableDeliveries || 0,
          terminalFailedCount: row?.failedDeliveries || 0,
          oldestPendingEventAgeMinutes: 0,
        };
      } catch {
        // Fallback to in-memory
      }
    }

    const notifs = Array.from(IN_MEMORY_NOTIFICATIONS.values());
    return {
      pendingEventsCount: 0,
      pendingDeliveriesCount: notifs.filter((n) => n.status === 'PENDING').length,
      retryableDeliveriesCount: notifs.filter((n) => n.status === 'RETRYABLE').length,
      terminalFailedCount: notifs.filter((n) => n.status === 'FAILED').length,
      oldestPendingEventAgeMinutes: 0,
    };
  }

  // Preferences
  async getPreference(userId: string, businessId: string): Promise<NotificationPreference> {
    const key = `${userId}_${businessId}`;
    if (isDatabaseConfigured()) {
      try {
        const pool = getDbPool();
        const res = await pool.query(
          `SELECT id, user_id AS "userId", business_id AS "businessId",
                  email_ranking_drops AS "emailRankingDrops",
                  in_app_ranking_drops AS "inAppRankingDrops",
                  digest_window_minutes AS "digestWindowMinutes",
                  created_at AS "createdAt", updated_at AS "updatedAt"
           FROM notification_preferences
           WHERE user_id = $1 AND business_id = $2`,
          [userId, businessId]
        );
        if (res.rows[0]) {
          return {
            id: String(res.rows[0].id),
            userId: String(res.rows[0].userId),
            businessId: String(res.rows[0].businessId),
            emailRankingDrops: Boolean(res.rows[0].emailRankingDrops),
            inAppRankingDrops: Boolean(res.rows[0].inAppRankingDrops),
            digestWindowMinutes: Number(res.rows[0].digestWindowMinutes),
            createdAt: res.rows[0].createdAt instanceof Date ? res.rows[0].createdAt.toISOString() : String(res.rows[0].createdAt),
            updatedAt: res.rows[0].updatedAt instanceof Date ? res.rows[0].updatedAt.toISOString() : String(res.rows[0].updatedAt),
          };
        }
      } catch {
        // Fallback
      }
    }

    const existing = IN_MEMORY_PREFERENCES.get(key);
    if (existing) return { ...existing };

    // Default preference
    const nowIso = new Date().toISOString();
    return {
      id: `pref_${key}`,
      userId,
      businessId,
      emailRankingDrops: false,
      inAppRankingDrops: true,
      digestWindowMinutes: 15,
      createdAt: nowIso,
      updatedAt: nowIso,
    };
  }

  async upsertPreference(pref: NotificationPreference): Promise<NotificationPreference> {
    const key = `${pref.userId}_${pref.businessId}`;
    if (isDatabaseConfigured()) {
      try {
        const pool = getDbPool();
        await pool.query(
          `INSERT INTO notification_preferences (
            id, user_id, business_id, email_ranking_drops, in_app_ranking_drops,
            digest_window_minutes, created_at, updated_at
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
          ON CONFLICT (user_id, business_id) DO UPDATE SET
            email_ranking_drops = EXCLUDED.email_ranking_drops,
            in_app_ranking_drops = EXCLUDED.in_app_ranking_drops,
            digest_window_minutes = EXCLUDED.digest_window_minutes,
            updated_at = NOW()`,
          [
            pref.id,
            pref.userId,
            pref.businessId,
            pref.emailRankingDrops,
            pref.inAppRankingDrops,
            pref.digestWindowMinutes,
            new Date(pref.createdAt),
            new Date(pref.updatedAt),
          ]
        );
      } catch {
        // Fallback
      }
    }

    IN_MEMORY_PREFERENCES.set(key, { ...pref });
    return pref;
  }

  private mapRow(row: Record<string, unknown>): BusinessNotification {
    return {
      id: String(row.id),
      businessId: String(row.businessId),
      recipientUserId: row.recipientUserId ? String(row.recipientUserId) : null,
      marketId: String(row.marketId),
      rankingChangeEventId: row.rankingChangeEventId ? String(row.rankingChangeEventId) : null,
      eventType: row.eventType as BusinessNotification['eventType'],
      milestone: row.milestone ? (row.milestone as BusinessNotification['milestone']) : null,
      previousPosition: typeof row.previousPosition === 'number' ? row.previousPosition : null,
      newPosition: Number(row.newPosition),
      title: String(row.title),
      message: String(row.message),
      channel: row.channel as BusinessNotification['channel'],
      status: row.status as BusinessNotification['status'],
      isRead: Boolean(row.isRead),
      readAt: row.readAt ? (row.readAt instanceof Date ? row.readAt.toISOString() : String(row.readAt)) : null,
      attempts: Number(row.attempts || 0),
      maxAttempts: Number(row.maxAttempts || 5),
      nextRunAt: row.nextRunAt instanceof Date ? row.nextRunAt.toISOString() : String(row.nextRunAt),
      lockedUntil: row.lockedUntil ? (row.lockedUntil instanceof Date ? row.lockedUntil.toISOString() : String(row.lockedUntil)) : null,
      lastError: row.lastError ? String(row.lastError) : null,
      deliveryMetadata: (row.deliveryMetadata as Record<string, unknown>) || {},
      createdAt: row.createdAt instanceof Date ? row.createdAt.toISOString() : String(row.createdAt),
      updatedAt: row.updatedAt instanceof Date ? row.updatedAt.toISOString() : String(row.updatedAt),
      deliveredAt: row.deliveredAt ? (row.deliveredAt instanceof Date ? row.deliveredAt.toISOString() : String(row.deliveredAt)) : null,
    };
  }
}

export function resetNotificationStoreForTesting(): void {
  IN_MEMORY_NOTIFICATIONS.clear();
  IN_MEMORY_PREFERENCES.clear();
}
