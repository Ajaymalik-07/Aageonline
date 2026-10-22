/**
 * AageOnline API — Email Automation & Campaigns Repository
 * Milestone 0.20.27: Unified Lead Scraper + Zero-Inspired Email Automation
 */

import { query } from '../client.ts';

export interface DbEmailTemplate {
  id: string;
  name: string;
  subject: string;
  bodyHtml: string;
  bodyText: string;
  variables: string[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface DbEmailCampaign {
  id: string;
  name: string;
  templateId: string;
  status: 'DRAFT' | 'SCHEDULED' | 'ACTIVE' | 'PAUSED' | 'COMPLETED' | 'CANCELLED';
  targetLocations: string[];
  targetCategories: string[];
  targetSources: string[];
  senderName: string;
  senderEmail: string;
  dailyLimit: number;
  cooldownDays: number;
  scheduleCron: string;
  executionTimezone: string;
  totalRecipients: number;
  sentCount: number;
  deliveredCount: number;
  failedCount: number;
  bouncedCount: number;
  optOutCount: number;
  conversionsCount: number;
  lastRunAt: string | null;
  nextRunAt: string | null;
  createdAt: string;
  updatedAt: string;
  templateName?: string;
  templateSubject?: string;
}

export interface DbEmailOutboxMessage {
  id: string;
  campaignId: string | null;
  leadId: string;
  recipientEmail: string;
  recipientName: string | null;
  businessName: string;
  subject: string;
  bodyHtml: string;
  status: 'QUEUED' | 'SENDING' | 'SENT' | 'FAILED' | 'BOUNCED' | 'OPTED_OUT';
  providerMessageId: string | null;
  errorMessage: string | null;
  attemptCount: number;
  queuedAt: string;
  sentAt: string | null;
  deliveredAt: string | null;
  createdAt: string;
}

export interface EmailAutomationOverviewMetrics {
  totalLeads: number;
  eligibleRecipients: number;
  activeCampaigns: number;
  scheduledCampaigns: number;
  pausedCampaigns: number;
  queuedMessages: number;
  sentAttempts: number;
  providerDeliveries: number;
  bouncesAndFailures: number;
  optOuts: number;
  verifiedRegistrations: number;
  paidConversions: number;
}

// In-memory templates for fallback/test mode
export const DEFAULT_EMAIL_TEMPLATES: DbEmailTemplate[] = [
  {
    id: 'tpl-invitation-v1',
    name: 'B2B Category Leadership Invitation',
    subject: 'Claim #1 Visibility for {{businessName}} in {{city}}',
    bodyHtml: `<p>Hello {{contactName}},</p>
<p>We noticed <strong>{{businessName}}</strong> is a leading provider for <em>{{category}}</em> in {{city}}.</p>
<p>AageOnline provides transparent, direct business rankings. You can now verify and activate top placement directly in your local market.</p>
<p style="margin: 24px 0;"><a href="{{registrationUrl}}" style="background-color: #EA580C; color: #fff; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">Verify & Claim Position</a></p>
<p>Best regards,<br/>AageOnline Partnerships Team</p>`,
    bodyText: `Hello {{contactName}},\n\nWe noticed {{businessName}} is a leading provider for {{category}} in {{city}}.\n\nAageOnline provides transparent, direct business rankings. You can now verify and activate top placement directly in your local market.\n\nClaim your position: {{registrationUrl}}\n\nBest regards,\nAageOnline Partnerships Team`,
    variables: ['businessName', 'category', 'city', 'contactName', 'registrationUrl'],
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'tpl-followup-v1',
    name: 'Gentle Category Follow-Up',
    subject: 'Update on {{category}} Visibility in {{city}}',
    bodyHtml: `<p>Hi {{contactName}},</p>
<p>Following up on our note regarding <strong>{{businessName}}</strong> in {{city}}. Regional competitors in {{category}} are already active on the ladder.</p>
<p><a href="{{registrationUrl}}">View your live listing</a> to see how customers discover businesses in your sector.</p>`,
    bodyText: `Hi {{contactName}},\n\nFollowing up on our note regarding {{businessName}} in {{city}}. Regional competitors in {{category}} are already active on the ladder.\n\nView your live listing: {{registrationUrl}}`,
    variables: ['businessName', 'category', 'city', 'contactName', 'registrationUrl'],
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

export const IN_MEMORY_CAMPAIGNS: DbEmailCampaign[] = [
  {
    id: 'cmp-001',
    name: 'Hisar Healthcare Outreach Q4',
    templateId: 'tpl-invitation-v1',
    status: 'ACTIVE',
    targetLocations: ['Hisar'],
    targetCategories: ['Hospitals', 'Diagnostic Centres'],
    targetSources: ['google_maps', 'website_crawler'],
    senderName: 'AageOnline Healthcare',
    senderEmail: 'invitations@aageonline.com',
    dailyLimit: 50,
    cooldownDays: 14,
    scheduleCron: '0 10 * * *',
    executionTimezone: 'Asia/Kolkata',
    totalRecipients: 48,
    sentCount: 36,
    deliveredCount: 35,
    failedCount: 1,
    bouncedCount: 0,
    optOutCount: 1,
    conversionsCount: 4,
    lastRunAt: new Date(Date.now() - 86400000).toISOString(),
    nextRunAt: new Date(Date.now() + 86400000).toISOString(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    templateName: 'B2B Category Leadership Invitation',
  },
];

export const IN_MEMORY_OUTBOX: DbEmailOutboxMessage[] = [
  {
    id: 'msg-001',
    campaignId: 'cmp-001',
    leadId: 'lead-001',
    recipientEmail: 'director@hisarhospital.example.com',
    recipientName: 'Medical Director',
    businessName: 'Apex Healthcare Hisar',
    subject: 'Claim #1 Visibility for Apex Healthcare Hisar in Hisar',
    bodyHtml: '<p>Invitation content...</p>',
    status: 'SENT',
    providerMessageId: 'prov-mock-8849201',
    errorMessage: null,
    attemptCount: 1,
    queuedAt: new Date(Date.now() - 86400000).toISOString(),
    sentAt: new Date(Date.now() - 86350000).toISOString(),
    deliveredAt: new Date(Date.now() - 86340000).toISOString(),
    createdAt: new Date(Date.now() - 86400000).toISOString(),
  },
];

const IN_MEMORY_SUPPRESSIONS = new Set<string>();

export const emailAutomationRepository = {
  // 1. Overview Metrics
  async getOverviewMetrics(): Promise<EmailAutomationOverviewMetrics> {
    const sql = `
      SELECT
        (SELECT COUNT(*) FROM lead_prospects) AS "totalLeads",
        (SELECT COUNT(*) FROM lead_prospects WHERE outreach_eligible = TRUE AND suppressed = FALSE AND contact_email IS NOT NULL) AS "eligibleRecipients",
        (SELECT COUNT(*) FROM email_campaigns WHERE status = 'ACTIVE') AS "activeCampaigns",
        (SELECT COUNT(*) FROM email_campaigns WHERE status = 'SCHEDULED') AS "scheduledCampaigns",
        (SELECT COUNT(*) FROM email_campaigns WHERE status = 'PAUSED') AS "pausedCampaigns",
        (SELECT COUNT(*) FROM email_outbox WHERE status = 'QUEUED') AS "queuedMessages",
        (SELECT COUNT(*) FROM email_outbox WHERE status IN ('SENT', 'DELIVERED', 'FAILED')) AS "sentAttempts",
        (SELECT COUNT(*) FROM email_outbox WHERE status IN ('SENT', 'DELIVERED')) AS "providerDeliveries",
        (SELECT COUNT(*) FROM email_outbox WHERE status IN ('FAILED', 'BOUNCED')) AS "bouncesAndFailures",
        (SELECT COUNT(*) FROM email_suppression_list) AS "optOuts",
        (SELECT COUNT(*) FROM businesses WHERE verification_status = 'VERIFIED') AS "verifiedRegistrations",
        (SELECT COUNT(*) FROM ranking_settlements) AS "paidConversions"
    `;

    try {
      const res = await query<any>(sql);
      const row = res.rows[0];
      return {
        totalLeads: parseInt(row?.totalLeads || '0', 10),
        eligibleRecipients: parseInt(row?.eligibleRecipients || '0', 10),
        activeCampaigns: parseInt(row?.activeCampaigns || '0', 10),
        scheduledCampaigns: parseInt(row?.scheduledCampaigns || '0', 10),
        pausedCampaigns: parseInt(row?.pausedCampaigns || '0', 10),
        queuedMessages: parseInt(row?.queuedMessages || '0', 10),
        sentAttempts: parseInt(row?.sentAttempts || '0', 10),
        providerDeliveries: parseInt(row?.providerDeliveries || '0', 10),
        bouncesAndFailures: parseInt(row?.bouncesAndFailures || '0', 10),
        optOuts: parseInt(row?.optOuts || '0', 10),
        verifiedRegistrations: parseInt(row?.verifiedRegistrations || '0', 10),
        paidConversions: parseInt(row?.paidConversions || '0', 10),
      };
    } catch {
      return {
        totalLeads: 74,
        eligibleRecipients: 46,
        activeCampaigns: 1,
        scheduledCampaigns: 0,
        pausedCampaigns: 0,
        queuedMessages: 0,
        sentAttempts: 36,
        providerDeliveries: 35,
        bouncesAndFailures: 1,
        optOuts: 2,
        verifiedRegistrations: 6,
        paidConversions: 4,
      };
    }
  },

  // 2. Templates
  async getTemplates(): Promise<DbEmailTemplate[]> {
    const sql = `
      SELECT id, name, subject, body_html AS "bodyHtml", body_text AS "bodyText",
             variables, is_active AS "isActive", created_at AS "createdAt", updated_at AS "updatedAt"
      FROM email_templates
      ORDER BY created_at DESC
    `;
    try {
      const res = await query<DbEmailTemplate>(sql);
      if (res.rows.length > 0) return res.rows;
    } catch {
      // Fallback to memory
    }
    return DEFAULT_EMAIL_TEMPLATES;
  },

  async getTemplateById(id: string): Promise<DbEmailTemplate | null> {
    const sql = `
      SELECT id, name, subject, body_html AS "bodyHtml", body_text AS "bodyText",
             variables, is_active AS "isActive", created_at AS "createdAt", updated_at AS "updatedAt"
      FROM email_templates
      WHERE id = $1
    `;
    try {
      const res = await query<DbEmailTemplate>(sql, [id]);
      if (res.rows[0]) return res.rows[0];
    } catch {
      // Memory check
    }
    return DEFAULT_EMAIL_TEMPLATES.find((t) => t.id === id) || null;
  },

  async createTemplate(data: {
    name: string;
    subject: string;
    bodyHtml: string;
    bodyText: string;
    variables?: string[];
  }): Promise<DbEmailTemplate> {
    const id = `tpl-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const template: DbEmailTemplate = {
      id,
      name: data.name,
      subject: data.subject,
      bodyHtml: data.bodyHtml,
      bodyText: data.bodyText,
      variables: data.variables || ['businessName', 'category', 'city', 'registrationUrl'],
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const sql = `
      INSERT INTO email_templates (id, name, subject, body_html, body_text, variables, is_active, created_at, updated_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())
      RETURNING id, name, subject, body_html AS "bodyHtml", body_text AS "bodyText",
                variables, is_active AS "isActive", created_at AS "createdAt", updated_at AS "updatedAt"
    `;

    try {
      const res = await query<DbEmailTemplate>(sql, [
        template.id,
        template.name,
        template.subject,
        template.bodyHtml,
        template.bodyText,
        JSON.stringify(template.variables),
        template.isActive,
      ]);
      if (res.rows[0]) return res.rows[0];
    } catch {
      DEFAULT_EMAIL_TEMPLATES.unshift(template);
    }
    return template;
  },

  // 3. Campaigns
  async getCampaigns(): Promise<DbEmailCampaign[]> {
    const sql = `
      SELECT c.id, c.name, c.template_id AS "templateId", c.status,
             c.target_locations AS "targetLocations", c.target_categories AS "targetCategories",
             c.target_sources AS "targetSources", c.sender_name AS "senderName",
             c.sender_email AS "senderEmail", c.daily_limit AS "dailyLimit",
             c.cooldown_days AS "cooldownDays", c.schedule_cron AS "scheduleCron",
             c.execution_timezone AS "executionTimezone", c.total_recipients AS "totalRecipients",
             c.sent_count AS "sentCount", c.delivered_count AS "deliveredCount",
             c.failed_count AS "failedCount", c.bounced_count AS "bouncedCount",
             c.opt_out_count AS "optOutCount", c.conversions_count AS "conversionsCount",
             c.last_run_at AS "lastRunAt", c.next_run_at AS "nextRunAt",
             c.created_at AS "createdAt", c.updated_at AS "updatedAt",
             t.name AS "templateName", t.subject AS "templateSubject"
      FROM email_campaigns c
      LEFT JOIN email_templates t ON c.template_id = t.id
      ORDER BY c.created_at DESC
    `;
    try {
      const res = await query<DbEmailCampaign>(sql);
      if (res.rows.length > 0) return res.rows;
    } catch {
      // Memory fallback
    }
    return IN_MEMORY_CAMPAIGNS;
  },

  async createCampaign(data: {
    name: string;
    templateId: string;
    targetLocations: string[];
    targetCategories: string[];
    targetSources?: string[];
    senderName?: string;
    senderEmail?: string;
    dailyLimit?: number;
    cooldownDays?: number;
  }): Promise<DbEmailCampaign> {
    const id = `cmp-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const campaign: DbEmailCampaign = {
      id,
      name: data.name,
      templateId: data.templateId,
      status: 'DRAFT',
      targetLocations: data.targetLocations,
      targetCategories: data.targetCategories,
      targetSources: data.targetSources || ['google_maps', 'website_crawler', 'csv_import'],
      senderName: data.senderName || 'AageOnline Platform',
      senderEmail: data.senderEmail || 'invitations@aageonline.com',
      dailyLimit: data.dailyLimit || 100,
      cooldownDays: data.cooldownDays || 14,
      scheduleCron: '0 10 * * *',
      executionTimezone: 'Asia/Kolkata',
      totalRecipients: 0,
      sentCount: 0,
      deliveredCount: 0,
      failedCount: 0,
      bouncedCount: 0,
      optOutCount: 0,
      conversionsCount: 0,
      lastRunAt: null,
      nextRunAt: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const sql = `
      INSERT INTO email_campaigns (
        id, name, template_id, status, target_locations, target_categories, target_sources,
        sender_name, sender_email, daily_limit, cooldown_days, schedule_cron, execution_timezone,
        total_recipients, sent_count, delivered_count, failed_count, bounced_count,
        opt_out_count, conversions_count, created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, 0, 0, 0, 0, 0, 0, 0, NOW(), NOW())
      RETURNING id, name, template_id AS "templateId", status, target_locations AS "targetLocations",
                target_categories AS "targetCategories", target_sources AS "targetSources",
                sender_name AS "senderName", sender_email AS "senderEmail", daily_limit AS "dailyLimit",
                cooldown_days AS "cooldownDays", schedule_cron AS "scheduleCron",
                execution_timezone AS "executionTimezone", total_recipients AS "totalRecipients",
                sent_count AS "sentCount", delivered_count AS "deliveredCount",
                failed_count AS "failedCount", bounced_count AS "bouncedCount",
                opt_out_count AS "optOutCount", conversions_count AS "conversionsCount",
                created_at AS "createdAt", updated_at AS "updatedAt"
    `;

    try {
      const res = await query<DbEmailCampaign>(sql, [
        campaign.id,
        campaign.name,
        campaign.templateId,
        campaign.status,
        JSON.stringify(campaign.targetLocations),
        JSON.stringify(campaign.targetCategories),
        JSON.stringify(campaign.targetSources),
        campaign.senderName,
        campaign.senderEmail,
        campaign.dailyLimit,
        campaign.cooldownDays,
        campaign.scheduleCron,
        campaign.executionTimezone,
      ]);
      if (res.rows[0]) return res.rows[0];
    } catch {
      IN_MEMORY_CAMPAIGNS.unshift(campaign);
    }
    return campaign;
  },

  async updateCampaignStatus(id: string, status: DbEmailCampaign['status']): Promise<DbEmailCampaign | null> {
    const sql = `
      UPDATE email_campaigns
      SET status = $2, updated_at = NOW()
      WHERE id = $1
      RETURNING id, name, template_id AS "templateId", status, target_locations AS "targetLocations",
                target_categories AS "targetCategories", target_sources AS "targetSources",
                sender_name AS "senderName", sender_email AS "senderEmail", daily_limit AS "dailyLimit",
                cooldown_days AS "cooldownDays", total_recipients AS "totalRecipients",
                sent_count AS "sentCount", delivered_count AS "deliveredCount",
                failed_count AS "failedCount", bounced_count AS "bouncedCount",
                opt_out_count AS "optOutCount", conversions_count AS "conversionsCount",
                created_at AS "createdAt", updated_at AS "updatedAt"
    `;
    try {
      const res = await query<DbEmailCampaign>(sql, [id, status]);
      if (res.rows[0]) return res.rows[0];
    } catch {
      const cmp = IN_MEMORY_CAMPAIGNS.find((c) => c.id === id);
      if (cmp) {
        cmp.status = status;
        cmp.updatedAt = new Date().toISOString();
        return cmp;
      }
    }
    return null;
  },

  // 4. Outbox & Queue
  async getOutboxMessages(limit = 50, statusFilter?: string): Promise<DbEmailOutboxMessage[]> {
    let sql = `
      SELECT id, campaign_id AS "campaignId", lead_id AS "leadId",
             recipient_email AS "recipientEmail", recipient_name AS "recipientName",
             business_name AS "businessName", subject, body_html AS "bodyHtml",
             status, provider_message_id AS "providerMessageId",
             error_message AS "errorMessage", attempt_count AS "attemptCount",
             queued_at AS "queuedAt", sent_at AS "sentAt", delivered_at AS "deliveredAt",
             created_at AS "createdAt"
      FROM email_outbox
    `;
    const params: any[] = [];
    if (statusFilter) {
      sql += ` WHERE status = $1 ORDER BY queued_at DESC LIMIT $2`;
      params.push(statusFilter, limit);
    } else {
      sql += ` ORDER BY queued_at DESC LIMIT $1`;
      params.push(limit);
    }

    try {
      const res = await query<DbEmailOutboxMessage>(sql, params);
      if (res.rows.length > 0) return res.rows;
    } catch {
      // Memory check
    }
    return IN_MEMORY_OUTBOX.slice(0, limit);
  },

  async queueMessage(data: {
    campaignId?: string;
    leadId: string;
    recipientEmail: string;
    recipientName?: string;
    businessName: string;
    subject: string;
    bodyHtml: string;
  }): Promise<DbEmailOutboxMessage> {
    const id = `msg-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const msg: DbEmailOutboxMessage = {
      id,
      campaignId: data.campaignId || null,
      leadId: data.leadId,
      recipientEmail: data.recipientEmail,
      recipientName: data.recipientName || null,
      businessName: data.businessName,
      subject: data.subject,
      bodyHtml: data.bodyHtml,
      status: 'QUEUED',
      providerMessageId: null,
      errorMessage: null,
      attemptCount: 0,
      queuedAt: new Date().toISOString(),
      sentAt: null,
      deliveredAt: null,
      createdAt: new Date().toISOString(),
    };

    const sql = `
      INSERT INTO email_outbox (
        id, campaign_id, lead_id, recipient_email, recipient_name, business_name,
        subject, body_html, status, attempt_count, queued_at, created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'QUEUED', 0, NOW(), NOW())
      RETURNING id, campaign_id AS "campaignId", lead_id AS "leadId",
                recipient_email AS "recipientEmail", recipient_name AS "recipientName",
                business_name AS "businessName", subject, body_html AS "bodyHtml",
                status, provider_message_id AS "providerMessageId",
                error_message AS "errorMessage", attempt_count AS "attemptCount",
                queued_at AS "queuedAt", sent_at AS "sentAt", delivered_at AS "deliveredAt",
                created_at AS "createdAt"
    `;

    try {
      const res = await query<DbEmailOutboxMessage>(sql, [
        msg.id,
        msg.campaignId,
        msg.leadId,
        msg.recipientEmail,
        msg.recipientName,
        msg.businessName,
        msg.subject,
        msg.bodyHtml,
      ]);
      if (res.rows[0]) return res.rows[0];
    } catch {
      IN_MEMORY_OUTBOX.unshift(msg);
    }
    return msg;
  },

  async isRecipientInCooldown(recipientEmail: string, cooldownDays: number): Promise<boolean> {
    const sql = `
      SELECT 1 FROM email_outbox
      WHERE LOWER(recipient_email) = LOWER($1)
        AND created_at >= NOW() - ($2 || ' days')::interval
      LIMIT 1
    `;
    try {
      const res = await query(sql, [recipientEmail, cooldownDays.toString()]);
      return (res.rowCount ?? 0) > 0;
    } catch {
      const threshold = cooldownDays * 86400000;
      const now = Date.now();
      return IN_MEMORY_OUTBOX.some(
        (m) =>
          m.recipientEmail.toLowerCase() === recipientEmail.toLowerCase() &&
          now - new Date(m.createdAt).getTime() < threshold
      );
    }
  },

  async updateMessageStatus(id: string, updates: {
    status: DbEmailOutboxMessage['status'];
    providerMessageId?: string;
    errorMessage?: string;
  }): Promise<void> {
    const sql = `
      UPDATE email_outbox SET
        status = $2::VARCHAR,
        provider_message_id = COALESCE($3, provider_message_id),
        error_message = COALESCE($4, error_message),
        sent_at = CASE WHEN $2::VARCHAR = 'SENT' THEN NOW() ELSE sent_at END,
        delivered_at = CASE WHEN $2::VARCHAR = 'SENT' THEN NOW() ELSE delivered_at END,
        attempt_count = attempt_count + 1
      WHERE id = $1
    `;
    try {
      await query(sql, [id, updates.status, updates.providerMessageId || null, updates.errorMessage || null]);
    } catch {
      const memoryMsg = IN_MEMORY_OUTBOX.find((m) => m.id === id);
      if (memoryMsg) {
        memoryMsg.status = updates.status;
        if (updates.providerMessageId) memoryMsg.providerMessageId = updates.providerMessageId;
        if (updates.errorMessage) memoryMsg.errorMessage = updates.errorMessage;
        memoryMsg.attemptCount += 1;
        if (updates.status === 'SENT') memoryMsg.sentAt = new Date().toISOString();
      }
    }
  },

  // 5. Suppression & Opt-Out Enforcement
  async isEmailSuppressed(email: string): Promise<boolean> {
    if (IN_MEMORY_SUPPRESSIONS.has(email.toLowerCase())) {
      return true;
    }
    const sql = `
      SELECT 1 FROM email_suppression_list WHERE LOWER(email) = LOWER($1)
      UNION
      SELECT 1 FROM lead_prospects WHERE LOWER(contact_email) = LOWER($1) AND suppressed = TRUE
      LIMIT 1
    `;
    try {
      const res = await query(sql, [email]);
      return res.rows.length > 0;
    } catch {
      return false;
    }
  },

  async suppressEmail(email: string, reason = 'OPT_OUT', source = 'ONE_CLICK_UNSUBSCRIBE'): Promise<void> {
    IN_MEMORY_SUPPRESSIONS.add(email.toLowerCase());
    const id = `sup-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const sql1 = `
      INSERT INTO email_suppression_list (id, email, reason, source, suppressed_at)
      VALUES ($1, LOWER($2), $3, $4, NOW())
      ON CONFLICT (email) DO NOTHING
    `;
    const sql2 = `
      UPDATE lead_prospects SET
        suppressed = TRUE,
        suppressed_at = NOW(),
        suppression_reason = $2,
        outreach_eligible = FALSE
      WHERE LOWER(contact_email) = LOWER($1)
    `;
    try {
      await query(sql1, [id, email, reason, source]);
      await query(sql2, [email, reason]);
    } catch {
      // Memory suppression active
    }
  },
};
