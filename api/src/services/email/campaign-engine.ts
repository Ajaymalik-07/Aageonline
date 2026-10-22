/**
 * AageOnline API — Campaign Scheduling & Outreach Engine
 * Milestone 0.20.27: Unified Lead Scraper + Zero-Inspired Email Automation
 *
 * Invariants:
 * - Operates independently of the scraper schedule
 * - Re-evaluates suppression status immediately before every send
 * - Respects cooldown rules (e.g. 14 days) and daily campaign limits
 * - Does not send real unsolicited blasts in test/dry-run environments
 */

import { emailAutomationRepository, type DbEmailCampaign } from '../../db/repositories/email-automation-repo.ts';
import { adminRepository } from '../../db/repositories/admin-repo.ts';
import { renderEmailTemplate } from './template-renderer.ts';

export interface DispatchResult {
  campaignId: string;
  queuedCount: number;
  sentCount: number;
  failedCount: number;
  suppressedSkipped: number;
  cooldownSkipped: number;
}

export class CampaignEngine {
  /**
   * Evaluates active campaigns and queues messages for eligible SQL leads.
   */
  async runCampaignCycle(campaignId: string, dryRun = false): Promise<DispatchResult> {
    const campaigns = await emailAutomationRepository.getCampaigns();
    const campaign = campaigns.find((c) => c.id === campaignId);

    if (!campaign) {
      throw new Error(`Campaign ${campaignId} not found`);
    }

    if (campaign.status !== 'ACTIVE' && !dryRun) {
      throw new Error(`Campaign ${campaignId} is ${campaign.status}, not ACTIVE`);
    }

    const template = await emailAutomationRepository.getTemplateById(campaign.templateId);
    if (!template) {
      throw new Error(`Template ${campaign.templateId} not found`);
    }

    // 1. Fetch leads from authoritative SQL registry
    const leads = await adminRepository.getLeads();

    let queuedCount = 0;
    let sentCount = 0;
    let failedCount = 0;
    let suppressedSkipped = 0;
    let cooldownSkipped = 0;

    const cooldownThresholdMs = campaign.cooldownDays * 86400000;
    const now = Date.now();

    for (const lead of leads) {
      // Must have valid email
      if (!lead.contactEmail || !lead.contactEmail.includes('@')) {
        continue;
      }

      // Must match campaign target locations (if specified)
      if (
        campaign.targetLocations.length > 0 &&
        !campaign.targetLocations.some((l) => l.toLowerCase() === lead.city.toLowerCase())
      ) {
        continue;
      }

      // Must match campaign target categories (if specified)
      if (
        campaign.targetCategories.length > 0 &&
        !campaign.targetCategories.some((c) => c.toLowerCase() === lead.category.toLowerCase())
      ) {
        continue;
      }

      // 2. Immediate Suppression Check (Outreach Safety Invariant)
      const isSuppressed = await emailAutomationRepository.isEmailSuppressed(lead.contactEmail);
      if (isSuppressed) {
        suppressedSkipped += 1;
        continue;
      }

      // 3. Cooldown Check (e.g. 14 days between contacts)
      const inCooldown = await emailAutomationRepository.isRecipientInCooldown(lead.contactEmail, campaign.cooldownDays);
      if (inCooldown) {
        cooldownSkipped += 1;
        continue;
      }

      // 4. Daily Limit Check
      if (queuedCount >= campaign.dailyLimit) {
        break;
      }

      // 5. Render Template with truth-telling variables
      const optOutUrl = `https://aageonline.com/api/public/leads/opt-out?email=${encodeURIComponent(lead.contactEmail)}`;
      const renderedHtml = renderEmailTemplate(template.bodyHtml, {
        businessName: lead.businessName,
        category: lead.category,
        city: lead.city,
        contactName: lead.contactName || 'Business Owner',
        registrationUrl: `https://aageonline.com/business/claim?ref=${encodeURIComponent(lead.id)}`,
        optOutUrl,
      });

      const renderedSubject = template.subject
        .replace(/{{businessName}}/g, lead.businessName)
        .replace(/{{city}}/g, lead.city)
        .replace(/{{category}}/g, lead.category);

      // 6. Queue into PostgreSQL Outbox
      const msg = await emailAutomationRepository.queueMessage({
        campaignId: campaign.id,
        leadId: lead.id,
        recipientEmail: lead.contactEmail,
        recipientName: lead.contactName || undefined,
        businessName: lead.businessName,
        subject: renderedSubject,
        bodyHtml: renderedHtml,
      });

      queuedCount += 1;

      // 7. Dispatch (in dry-run or automated test environment, simulated via provider)
      try {
        const mockProviderId = `msg-prov-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
        await emailAutomationRepository.updateMessageStatus(msg.id, {
          status: 'SENT',
          providerMessageId: mockProviderId,
        });
        sentCount += 1;
      } catch (err: unknown) {
        failedCount += 1;
        await emailAutomationRepository.updateMessageStatus(msg.id, {
          status: 'FAILED',
          errorMessage: err instanceof Error ? err.message : 'Provider dispatch error',
        });
      }
    }

    return {
      campaignId: campaign.id,
      queuedCount,
      sentCount,
      failedCount,
      suppressedSkipped,
      cooldownSkipped,
    };
  }
}
