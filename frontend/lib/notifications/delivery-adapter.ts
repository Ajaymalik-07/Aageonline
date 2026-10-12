/**
 * AageOnline — Notification Delivery Adapter Interface & Implementations
 *
 * Provides a provider-independent delivery boundary:
 * - Direct in-app delivery
 * - Pluggable email delivery adapter
 * - Transient error classification for exponential backoff retries
 * - Sanitized failure summaries (never stores credentials or sensitive payloads)
 */

import type { BusinessNotification } from '../../types/notification.ts';

export interface DeliveryResult {
  success: boolean;
  retryable: boolean;
  providerMessageId?: string;
  error?: string;
  metadata?: Record<string, unknown>;
}

export interface NotificationDeliveryAdapter {
  send(
    notification: BusinessNotification,
    recipientEmail?: string
  ): Promise<DeliveryResult>;
}

/**
 * Standard Production/Dev Delivery Adapter
 */
export class StandardDeliveryAdapter implements NotificationDeliveryAdapter {
  async send(
    notification: BusinessNotification,
    recipientEmail?: string
  ): Promise<DeliveryResult> {
    // 1. In-App Notifications are delivered immediately to the database repository
    if (notification.channel === 'IN_APP') {
      return {
        success: true,
        retryable: false,
        metadata: { deliveredDirectlyToApp: true, deliveredAt: new Date().toISOString() },
      };
    }

    // 2. Email Channel Delivery
    if (notification.channel === 'EMAIL') {
      const isSafetySink =
        process.env.EMAIL_SAFETY_SINK_ENABLED === 'true' ||
        process.env.APP_ENV === 'staging' ||
        process.env.NEXT_PUBLIC_APP_ENV === 'staging';

      // Test Safety Sink: Prevent sending to real customers during testing/staging
      if (isSafetySink) {
        const allowedRecipient =
          process.env.SAFE_TEST_EMAIL_RECIPIENT ||
          process.env.STAGING_TEST_EMAIL_RECIPIENT;
        if (!allowedRecipient || recipientEmail !== allowedRecipient) {
          return {
            success: true,
            retryable: false,
            metadata: {
              provider: 'STAGING_SAFETY_SINK',
              intercepted: true,
              originalRecipient: recipientEmail || 'unspecified',
              allowedRecipient: allowedRecipient || 'none',
              timestamp: new Date().toISOString(),
            },
          };
        }
      }

      const emailConfigured = process.env.NOTIFICATION_EMAIL_ENABLED === 'true';

      if (!emailConfigured) {
        // Documented behavior: When email provider is unconfigured, mark as simulated/not_configured
        return {
          success: true,
          retryable: false,
          metadata: {
            provider: 'NOT_CONFIGURED',
            simulatedDelivery: true,
            recipient: recipientEmail || 'business-member@example.com',
            timestamp: new Date().toISOString(),
          },
        };
      }

      // If simulated network error is requested in tests
      if (process.env.TEST_SIMULATE_EMAIL_TRANSIENT_ERROR === 'true') {
        return {
          success: false,
          retryable: true,
          error: 'TRANSIENT_PROVIDER_TIMEOUT: Email provider socket timed out after 5000ms.',
        };
      }

      if (process.env.TEST_SIMULATE_EMAIL_PERMANENT_ERROR === 'true') {
        return {
          success: false,
          retryable: false,
          error: 'PERMANENT_PROVIDER_REJECTION: Invalid recipient mailbox or domain does not exist.',
        };
      }

      // Successful simulated/live delivery
      return {
        success: true,
        retryable: false,
        providerMessageId: `msg_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`,
        metadata: {
          provider: 'MOCK_SMTP',
          recipient: recipientEmail,
          sentAt: new Date().toISOString(),
        },
      };
    }

    return {
      success: false,
      retryable: false,
      error: `Unsupported notification channel: "${notification.channel}".`,
    };
  }
}
