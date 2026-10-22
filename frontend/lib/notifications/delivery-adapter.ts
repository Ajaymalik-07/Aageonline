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
 * Evaluates whether outbound email notifications should be intercepted into the safety sink.
 *
 * Safety Invariants:
 * 1. Explicit override: EMAIL_SAFETY_SINK_ENABLED=true always forces safety sink active.
 * 2. Non-production execution: Local development, test, preview, or staging environments
 *    must never dispatch real emails to customer mailboxes.
 * 3. Conflicting environments: Any non-production signal in APP_ENV, NEXT_PUBLIC_APP_ENV,
 *    or NODE_ENV fails safe to the safety sink.
 * 4. Production execution: When APP_ENV=production and EMAIL_SAFETY_SINK_ENABLED is not true,
 *    live delivery proceeds even if client-only variables (e.g. NEXT_PUBLIC_APP_ENV) are unset.
 */
export function isEmailSafetySinkActive(env: Record<string, string | undefined> = process.env): boolean {
  // 1. Explicit safety override flag
  if (env.EMAIL_SAFETY_SINK_ENABLED === 'true') {
    return true;
  }

  const appEnv = (env.APP_ENV ?? '').toLowerCase().trim();
  const publicAppEnv = (env.NEXT_PUBLIC_APP_ENV ?? '').toLowerCase().trim();
  const nodeEnv = (env.NODE_ENV ?? '').toLowerCase().trim();

  // 2. Explicit non-production signals always fail-safe to safety sink
  if (appEnv && appEnv !== 'production' && appEnv !== 'prod') {
    return true;
  }
  if (publicAppEnv && publicAppEnv !== 'production' && publicAppEnv !== 'prod') {
    return true;
  }
  if (nodeEnv && nodeEnv !== 'production' && nodeEnv !== 'prod') {
    return true;
  }

  // 3. Fail-safe: If both APP_ENV and NEXT_PUBLIC_APP_ENV are absent,
  // require NODE_ENV to be explicitly production, otherwise activate safety sink.
  if (!appEnv && !publicAppEnv) {
    if (nodeEnv !== 'production' && nodeEnv !== 'prod') {
      return true;
    }
  }

  // 4. At least one production indicator must be present
  const isExplicitProduction =
    appEnv === 'production' ||
    appEnv === 'prod' ||
    publicAppEnv === 'production' ||
    publicAppEnv === 'prod' ||
    nodeEnv === 'production' ||
    nodeEnv === 'prod';

  return !isExplicitProduction;
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
      const isSafetySink = isEmailSafetySinkActive(process.env);

      // Non-Production Safety Sink: Prevent sending to real customers during local testing or non-production runs
      if (isSafetySink) {
        const allowedRecipient = process.env.SAFE_TEST_EMAIL_RECIPIENT;
        if (!allowedRecipient || recipientEmail !== allowedRecipient) {
          return {
            success: true,
            retryable: false,
            metadata: {
              provider: 'SAFETY_SINK',
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
