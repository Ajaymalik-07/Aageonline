/**
 * AageOnline — Notification & Ranking Change Event Types
 *
 * Defines authoritative domain types for:
 * - Transactionally committed ranking change events
 * - Downward-movement milestone thresholds
 * - Durable business notifications and delivery lifecycle
 * - User notification preferences
 */

export type RankingMovementDirection = 'UP' | 'DOWN' | 'ENTRY' | 'NO_CHANGE';

export type RankingChangeEventStatus = 'PENDING' | 'PROCESSED' | 'SKIPPED';

export interface RankingChangeEvent {
  id: string;
  rankingSettlementId: string;
  paymentOrderId?: string | null;
  businessId: string;
  marketId: string;
  previousPosition: number | null;
  newPosition: number;
  direction: RankingMovementDirection;
  isTargetBusiness: boolean;
  status: RankingChangeEventStatus;
  createdAt: string;
  processedAt?: string | null;
}

export type NotificationMilestoneKey =
  | '#1_TO_#5'
  | '#5_TO_#10'
  | '#10_TO_#20'
  | '#20_TO_#30'
  | '#30_TO_#50'
  | '#50_TO_#75'
  | '#75_TO_#100';

export interface MilestoneDefinition {
  key: NotificationMilestoneKey;
  threshold: number;
  label: string;
}

export type NotificationEventType =
  | 'RANKING_DROP_MILESTONE'
  | 'RANKING_OUTBID'
  | 'POSITION_GAINED'
  | 'SYSTEM_OPERATIONAL_ALERT';

export type NotificationChannel = 'IN_APP' | 'EMAIL';

export type NotificationDeliveryStatus =
  | 'PENDING'
  | 'PROCESSING'
  | 'DELIVERED'
  | 'FAILED'
  | 'RETRYABLE';

export interface BusinessNotification {
  id: string;
  businessId: string;
  recipientUserId?: string | null;
  marketId: string;
  rankingChangeEventId?: string | null;
  eventType: NotificationEventType;
  milestone?: NotificationMilestoneKey | null;
  previousPosition?: number | null;
  newPosition: number;
  title: string;
  message: string;
  channel: NotificationChannel;
  status: NotificationDeliveryStatus;
  isRead: boolean;
  readAt?: string | null;
  attempts: number;
  maxAttempts: number;
  nextRunAt: string;
  lockedUntil?: string | null;
  lastError?: string | null;
  deliveryMetadata: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
  deliveredAt?: string | null;
}

export interface NotificationPreference {
  id: string;
  userId: string;
  businessId: string;
  emailRankingDrops: boolean;
  inAppRankingDrops: boolean;
  digestWindowMinutes: number;
  createdAt: string;
  updatedAt: string;
}

export interface NotificationOperationalStats {
  pendingEventsCount: number;
  pendingDeliveriesCount: number;
  retryableDeliveriesCount: number;
  terminalFailedCount: number;
  oldestPendingEventAgeMinutes: number;
}
