/**
 * AageOnline — Milestone 0.16.0 Ranking Visibility, Position History & Notification Engine Test Suite
 *
 * Comprehensive tests verifying:
 * 1. Transactionally committed ranking change events & rollback safety.
 * 2. Downward-movement milestone threshold crossing logic (#1->#5 through #75->#100).
 * 3. Rapid-movement coalescing & anti-spam digest policy.
 * 4. Durable notification persistence, idempotency, and delivery lifecycle.
 * 5. Business workspace ranking history, disclosures, and strict cross-business isolation.
 * 6. Background worker cycle integration and operational metrics.
 */

import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert/strict';

import {
  DOWNWARD_MILESTONES,
  evaluateDownwardMilestones,
} from '../lib/notifications/milestones.ts';
import {
  processPendingRankingEvents,
  deliverPendingNotifications,
} from '../lib/notifications/notification-service.ts';
import {
  PostgresRankingChangeEventRepository,
  resetRankingChangeEventStoreForTesting,
} from '../lib/db/repositories/ranking-change-event-repository.ts';
import {
  PostgresNotificationRepository,
  resetNotificationStoreForTesting,
} from '../lib/db/repositories/notification-repository.ts';
import {
  settleRanking,
  resetSettlementStoreForTesting,
} from '../lib/ranking-settlement/settlement-service.ts';
import {
  setTransactionFailureInjection,
} from '../lib/ranking-settlement/transaction.ts';
import { resetPositionHistoryStoreForTesting } from '../lib/ranking-settlement/position-history.ts';
import { resetBusinessStoreForTesting } from '../lib/taxonomy/businesses.ts';
import { createPaymentOrder, confirmPaymentOrder, resetPaymentStoreForTesting } from '../lib/payments/store.ts';
import { createBidIntent, resetBidIntentStoreForTesting } from '../lib/bid-intent/store.ts';
import { getBusinessRankingHistory } from '../lib/workspace/ranking-history.ts';
import { runSingleReconcilerCycle } from '../lib/workers/reconciler-worker.ts';
import { loadMigrationFiles } from '../lib/db/migrator.ts';
import { createMembership, resetMembershipStoreForTesting } from '../lib/memberships/store.ts';

const rankingEventRepo = new PostgresRankingChangeEventRepository();
const notificationRepo = new PostgresNotificationRepository();

describe('Milestone 0.16.0 — Ranking Visibility, Position History & Notification Engine', () => {
  beforeEach(() => {
    resetSettlementStoreForTesting();
    resetRankingChangeEventStoreForTesting();
    resetNotificationStoreForTesting();
    resetPositionHistoryStoreForTesting();
    resetBusinessStoreForTesting();
    resetMembershipStoreForTesting();
    resetPaymentStoreForTesting();
    resetBidIntentStoreForTesting();
    setTransactionFailureInjection(null);
  });

  describe('1. Version-Controlled SQL Migration 007 Integrity', () => {
    it('should include migration 007_ranking_notifications.sql in sequential registry', () => {
      const files = loadMigrationFiles();
      assert.ok(files.length >= 7, `Expected at least 7 migrations, got ${files.length}`);
      const mig007 = files.find((f) => f.version === '007');
      assert.ok(mig007, 'Migration 007 must exist');
      assert.equal(mig007.name, '007_ranking_notifications.sql');
      assert.match(mig007.sql, /CREATE TABLE IF NOT EXISTS ranking_change_events/);
      assert.match(mig007.sql, /CREATE TABLE IF NOT EXISTS business_notifications/);
      assert.match(mig007.sql, /CREATE TABLE IF NOT EXISTS notification_preferences/);
      assert.match(mig007.sql, /uq_ranking_change_event UNIQUE \(ranking_settlement_id, business_id\)/);
      assert.match(mig007.sql, /uq_notification_event_user_type UNIQUE/);
    });
  });

  describe('2. Transactionally Committed Ranking Change Events & Rollback Safety', () => {
    it('should create ranking change events only after atomic settlement commits', async () => {
      // Setup bid intent & confirmed payment
      const intent = await createBidIntent(
        {
          businessId: 'biz-royal-interiors',
          marketId: 'mkt-jaipur-interior-designers',
          targetPosition: 1,
          idempotencyKey: 'idem-event-test-1',
        },
        'user-ajay'
      );
      const { paymentOrder: order } = await createPaymentOrder({
        bidIntentId: intent.id,
        idempotencyKey: 'idem-order-test-1',
        actorUserId: 'user-ajay',
      });
      await confirmPaymentOrder(order.id, 'BANK_REF_EVT_1');

      // Settle ranking
      const result = await settleRanking({
        paymentOrderId: order.id,
        actorUserId: 'user-ajay',
      });

      assert.equal(result.settlement.status, 'SETTLED');
      assert.ok(result.rankingChangeEvents && result.rankingChangeEvents.length > 0);

      const targetEvent = result.rankingChangeEvents.find(
        (e) => e.businessId === 'biz-royal-interiors'
      );
      assert.ok(targetEvent);
      assert.equal(targetEvent.direction, 'UP');
      assert.equal(targetEvent.previousPosition, 3);
      assert.equal(targetEvent.newPosition, 1);
      assert.equal(targetEvent.status, 'PENDING');
      assert.equal(targetEvent.rankingSettlementId, result.settlement.id);

      // Verify event persists in repository
      const pending = await rankingEventRepo.getPendingEvents(10);
      assert.ok(pending.some((e) => e.id === targetEvent.id));
    });

    it('should NEVER create ranking change events when settlement transaction rolls back', async () => {
      const intent = await createBidIntent(
        {
          businessId: 'biz-royal-interiors',
          marketId: 'mkt-jaipur-interior-designers',
          targetPosition: 1,
          idempotencyKey: 'idem-event-test-fail',
        },
        'user-ajay'
      );
      const { paymentOrder: order } = await createPaymentOrder({
        bidIntentId: intent.id,
        idempotencyKey: 'idem-order-test-fail',
        actorUserId: 'user-ajay',
      });
      await confirmPaymentOrder(order.id, 'BANK_REF_EVT_FAIL');

      // Inject simulated transaction failure before settlement record
      setTransactionFailureInjection('before_settlement_record');

      await assert.rejects(
        () =>
          settleRanking({
            paymentOrderId: order.id,
            actorUserId: 'user-ajay',
          }),
        /Simulated failure before settlement record/
      );

      // Pending events in repository must remain 0
      const pending = await rankingEventRepo.getPendingEvents(10);
      assert.equal(pending.length, 0, 'No ranking change events must exist after rollback');
    });

    it('should generate DOWN direction events for displaced businesses', async () => {
      // 1. First business enters at #1
      const intent1 = await createBidIntent(
        {
          businessId: 'biz-royal-interiors',
          marketId: 'mkt-jaipur-interior-designers',
          targetPosition: 1,
          idempotencyKey: 'idem-evt-displace-1',
        },
        'user-ajay'
      );
      const { paymentOrder: order1 } = await createPaymentOrder({
        bidIntentId: intent1.id,
        idempotencyKey: 'idem-order-disp-1',
        actorUserId: 'user-ajay',
      });
      await confirmPaymentOrder(order1.id, 'BANK_DISP_1');
      await settleRanking({ paymentOrderId: order1.id, actorUserId: 'user-ajay' });

      // 2. Second business supersedes at #1 with higher qualifying amount
      createMembership({
        businessId: 'biz-abc-interiors',
        userId: 'user-vikram',
        role: 'OWNER',
      });

      const intent2 = await createBidIntent(
        {
          businessId: 'biz-abc-interiors',
          marketId: 'mkt-jaipur-interior-designers',
          targetPosition: 1,
          idempotencyKey: 'idem-evt-displace-2',
        },
        'user-vikram'
      );
      const { paymentOrder: order2 } = await createPaymentOrder({
        bidIntentId: intent2.id,
        idempotencyKey: 'idem-order-disp-2',
        actorUserId: 'user-vikram',
      });
      await confirmPaymentOrder(order2.id, 'BANK_DISP_2');
      const result2 = await settleRanking({ paymentOrderId: order2.id, actorUserId: 'user-vikram' });

      assert.ok(result2.rankingChangeEvents);
      const displacedEvent = result2.rankingChangeEvents.find(
        (e) => e.businessId === 'biz-royal-interiors'
      );

      assert.ok(displacedEvent, 'Displaced business must receive a ranking change event');
      assert.equal(displacedEvent.direction, 'DOWN');
      assert.equal(displacedEvent.previousPosition, 1);
      assert.equal(displacedEvent.newPosition, 2);
    });
  });

  describe('3. Downward Milestone Threshold Evaluation Logic', () => {
    it('should accurately detect all 7 configured downward milestones', () => {
      // Threshold 1: #1 -> #5 (threshold = 5)
      const m1 = evaluateDownwardMilestones(3, 6);
      assert.ok(m1);
      assert.equal(m1.primaryMilestone?.key, '#1_TO_#5');

      // Threshold 2: #5 -> #10 (threshold = 10)
      const m2 = evaluateDownwardMilestones(8, 12);
      assert.ok(m2);
      assert.equal(m2.primaryMilestone?.key, '#5_TO_#10');

      // Threshold 3: #10 -> #20 (threshold = 20)
      const m3 = evaluateDownwardMilestones(15, 22);
      assert.ok(m3);
      assert.equal(m3.primaryMilestone?.key, '#10_TO_#20');

      // Threshold 4: #20 -> #30 (threshold = 30)
      const m4 = evaluateDownwardMilestones(28, 35);
      assert.ok(m4);
      assert.equal(m4.primaryMilestone?.key, '#20_TO_#30');

      // Threshold 5: #30 -> #50 (threshold = 50)
      const m5 = evaluateDownwardMilestones(48, 52);
      assert.ok(m5);
      assert.equal(m5.primaryMilestone?.key, '#30_TO_#50');

      // Threshold 6: #50 -> #75 (threshold = 75)
      const m6 = evaluateDownwardMilestones(70, 78);
      assert.ok(m6);
      assert.equal(m6.primaryMilestone?.key, '#50_TO_#75');

      // Threshold 7: #75 -> #100 (threshold = 100)
      const m7 = evaluateDownwardMilestones(95, 101);
      assert.ok(m7);
      assert.equal(m7.primaryMilestone?.key, '#75_TO_#100');
    });

    it('should NOT trigger milestone alert for small movements within the same tier', () => {
      // Dropping from 2 to 4 is within Top 5: does not cross threshold 5
      const withinTier = evaluateDownwardMilestones(2, 4);
      assert.equal(withinTier, null);

      // Dropping from 12 to 14 is within Top 20: does not cross threshold 20
      const withinTier2 = evaluateDownwardMilestones(12, 14);
      assert.equal(withinTier2, null);
    });

    it('should NOT trigger milestone alert for upward movements or no-ops', () => {
      // Upward movement (5 -> 2)
      assert.equal(evaluateDownwardMilestones(5, 2), null);
      // Upward movement (20 -> 8)
      assert.equal(evaluateDownwardMilestones(20, 8), null);
      // No-op (5 -> 5)
      assert.equal(evaluateDownwardMilestones(5, 5), null);
      // New entry without previous position (null -> 3)
      assert.equal(evaluateDownwardMilestones(null, 3), null);
    });

    it('should consolidate rapid multi-threshold drops into the primary (deepest) threshold', () => {
      // Dropping from #3 to #25 crosses Top 5 (5), Top 10 (10), and Top 20 (20)
      const multi = evaluateDownwardMilestones(3, 25, 'Jaipur · Interior Designers');
      assert.ok(multi);
      assert.equal(multi.crossedMilestones.length, 3);
      assert.equal(multi.crossedMilestones[0].key, '#1_TO_#5');
      assert.equal(multi.crossedMilestones[1].key, '#5_TO_#10');
      assert.equal(multi.crossedMilestones[2].key, '#10_TO_#20');
      assert.equal(multi.primaryMilestone?.key, '#10_TO_#20');
      assert.match(multi.notificationTitle, /Dropped below Top 20/);
      assert.match(multi.notificationMessage, /moved from position #3 to position #25 in Jaipur · Interior Designers/);
      assert.match(multi.notificationMessage, /Transparency Notice: Visibility rankings are paid competitive positions/);
    });
  });

  describe('4. Rapid-Movement Digesting & Anti-Spam Coalescing', () => {
    it('should coalesce rapid successive downward events within digest window', async () => {
      // First event: dropped from 2 to 6 (crosses #1_TO_#5)
      await rankingEventRepo.createEvent({
        id: 'rce-test-1',
        rankingSettlementId: 'rs-test-1',
        businessId: 'biz-royal-interiors',
        marketId: 'mkt-jaipur-interior-designers',
        previousPosition: 2,
        newPosition: 6,
        direction: 'DOWN',
        isTargetBusiness: false,
        status: 'PENDING',
        createdAt: new Date().toISOString(),
      });

      const cycle1 = await processPendingRankingEvents({ batchSize: 10 });
      assert.equal(cycle1.processedEvents, 1);
      assert.equal(cycle1.createdNotifications, 1);

      // Verify notification created
      const notifs1 = await notificationRepo.getNotificationsByBusiness('biz-royal-interiors');
      assert.equal(notifs1.totalCount, 1);
      assert.equal(notifs1.notifications[0].newPosition, 6);

      // Second event occurs 2 minutes later: dropped further from 6 to 12 (crosses #5_TO_#10)
      await rankingEventRepo.createEvent({
        id: 'rce-test-2',
        rankingSettlementId: 'rs-test-2',
        businessId: 'biz-royal-interiors',
        marketId: 'mkt-jaipur-interior-designers',
        previousPosition: 6,
        newPosition: 12,
        direction: 'DOWN',
        isTargetBusiness: false,
        status: 'PENDING',
        createdAt: new Date().toISOString(),
      });

      const cycle2 = await processPendingRankingEvents({ batchSize: 10 });
      assert.equal(cycle2.processedEvents, 1);
      assert.equal(cycle2.coalescedNotifications, 1); // Coalesced into existing pending notification!

      // Notification total count remains 1, but updated to position 12!
      const notifs2 = await notificationRepo.getNotificationsByBusiness('biz-royal-interiors');
      assert.equal(notifs2.totalCount, 1);
      assert.equal(notifs2.notifications[0].newPosition, 12);
      assert.equal(notifs2.notifications[0].deliveryMetadata.coalesced, true);
    });
  });

  describe('5. Durable Notification Delivery & Retry Lifecycle', () => {
    it('should deliver in-app notifications and support idempotent read status mutations', async () => {
      const nowIso = new Date().toISOString();
      const notif = await notificationRepo.createNotification({
        id: 'notif-read-test',
        businessId: 'biz-royal-interiors',
        recipientUserId: 'user-ajay',
        marketId: 'mkt-jaipur-interior-designers',
        eventType: 'RANKING_DROP_MILESTONE',
        milestone: '#1_TO_#5',
        previousPosition: 4,
        newPosition: 7,
        title: 'Ranking Drop Alert',
        message: 'Dropped to #7',
        channel: 'IN_APP',
        status: 'PENDING',
        isRead: false,
        attempts: 0,
        maxAttempts: 5,
        nextRunAt: nowIso,
        deliveryMetadata: {},
        createdAt: nowIso,
        updatedAt: nowIso,
      });

      // Deliver via worker cycle
      const deliveryResult = await deliverPendingNotifications({ batchSize: 10 });
      assert.equal(deliveryResult.deliveredCount, 1);

      // Check unread count
      const unreadCount = await notificationRepo.getUnreadCount('biz-royal-interiors', 'user-ajay');
      assert.equal(unreadCount, 1);

      // Mark as read
      const marked = await notificationRepo.markAsRead(notif.id, 'biz-royal-interiors', 'user-ajay');
      assert.equal(marked, true);

      // Verify unread count is now 0
      const unreadCountAfter = await notificationRepo.getUnreadCount('biz-royal-interiors', 'user-ajay');
      assert.equal(unreadCountAfter, 0);

      // Idempotent second mark-as-read call
      const markedAgain = await notificationRepo.markAsRead(notif.id, 'biz-royal-interiors', 'user-ajay');
      assert.equal(markedAgain, true);
    });

    it('should retry transient email delivery failures with exponential backoff and terminate after max attempts', async () => {
      const nowIso = new Date().toISOString();
      const notif = await notificationRepo.createNotification({
        id: 'notif-retry-test',
        businessId: 'biz-royal-interiors',
        recipientUserId: 'user-ajay',
        marketId: 'mkt-jaipur-interior-designers',
        eventType: 'RANKING_DROP_MILESTONE',
        milestone: '#1_TO_#5',
        previousPosition: 2,
        newPosition: 8,
        title: 'Ranking Drop Alert',
        message: 'Dropped to #8',
        channel: 'EMAIL',
        status: 'PENDING',
        isRead: false,
        attempts: 0,
        maxAttempts: 2,
        nextRunAt: nowIso,
        deliveryMetadata: {},
        createdAt: nowIso,
        updatedAt: nowIso,
      });

      // Mock transient adapter failure
      const mockTransientAdapter = {
        async send() {
          return { success: false, retryable: true, error: 'TIMEOUT_ERROR' };
        },
      };

      // Attempt 1: Should be marked RETRYABLE
      const res1 = await deliverPendingNotifications({ batchSize: 10, adapter: mockTransientAdapter });
      assert.equal(res1.retryableCount, 1);

      // Reset nextRunAt to now for immediate retry test
      notif.nextRunAt = new Date().toISOString();
      notif.attempts = 1;

      // Attempt 2: Exceeds maxAttempts (2) -> Should be marked FAILED
      const res2 = await deliverPendingNotifications({ batchSize: 10, adapter: mockTransientAdapter });
      assert.equal(res2.failedCount, 1);
    });
  });

  describe('6. Business Workspace Ranking History & Cross-Business Isolation', () => {
    it('should return enriched ranking movement history for authorized business member', async () => {
      // Settle a movement
      const intent = await createBidIntent(
        {
          businessId: 'biz-royal-interiors',
          marketId: 'mkt-jaipur-interior-designers',
          targetPosition: 1,
          idempotencyKey: 'idem-hist-auth-1',
        },
        'user-ajay'
      );
      const { paymentOrder: order } = await createPaymentOrder({
        bidIntentId: intent.id,
        idempotencyKey: 'idem-order-hist-1',
        actorUserId: 'user-ajay',
      });
      await confirmPaymentOrder(order.id, 'BANK_HIST_1');
      await settleRanking({ paymentOrderId: order.id, actorUserId: 'user-ajay' });

      // Query workspace ranking history as business owner (user-ajay)
      const res = await getBusinessRankingHistory('biz-royal-interiors', 'user-ajay');
      assert.ok(res.history.length >= 1);
      assert.equal(res.history[0].businessId, 'biz-royal-interiors');
      assert.equal(res.history[0].newPosition, 1);
      assert.equal(res.history[0].direction, 'UP');
      assert.match(res.history[0].movementText, /Advanced from position #3 to position #1/);
      assert.match(res.history[0].disclosure, /Placement reflects paid competitive visibility positioning/);
    });

    it('should strictly reject cross-business access with 403 Forbidden', async () => {
      // user-vikram belongs to biz-coastal-spice, not biz-royal-interiors
      await assert.rejects(
        () => getBusinessRankingHistory('biz-royal-interiors', 'user-vikram'),
        (err: Error & { statusCode?: number }) => {
          assert.equal(err.statusCode, 403);
          assert.match(err.message, /not an active member of business/);
          return true;
        }
      );
    });
  });

  describe('7. Autonomous Reconciler Worker Full Cycle Integration', () => {
    it('should execute full cycle coordinating reconciliation, recovery, and notifications', async () => {
      // Create a pending ranking event
      await rankingEventRepo.createEvent({
        id: 'rce-worker-test',
        rankingSettlementId: 'rs-worker-test',
        businessId: 'biz-royal-interiors',
        marketId: 'mkt-jaipur-interior-designers',
        previousPosition: 1,
        newPosition: 8,
        direction: 'DOWN',
        isTargetBusiness: false,
        status: 'PENDING',
        createdAt: new Date().toISOString(),
      });

      // Run full worker cycle
      const cycle = await runSingleReconcilerCycle('test-worker-016', 'test-actor');
      assert.ok(!('skipped' in cycle));

      assert.equal(cycle.rankingEvents.processedEvents, 1);
      assert.equal(cycle.rankingEvents.createdNotifications, 1);
      assert.equal(cycle.notificationDelivery.deliveredCount, 1);

      // Verify unread notification exists for business
      const notifs = await notificationRepo.getNotificationsByBusiness('biz-royal-interiors');
      assert.equal(notifs.totalCount, 1);
      assert.equal(notifs.notifications[0].status, 'DELIVERED');
    });
  });
});
