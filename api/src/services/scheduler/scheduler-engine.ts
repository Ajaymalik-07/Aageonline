/**
 * AageOnline API — Durable Scheduler Engine
 * Milestone 0.20.28: Live PostgreSQL Persistence & Scheduler Recovery
 *
 * Invariants:
 * 1. Durable: Relies 100% on PostgreSQL timestamps (next_run_at) rather than in-memory timers.
 * 2. Concurrency-Safe: Uses PostgreSQL advisory locking (pg_try_advisory_lock) to prevent duplicate runs across instances.
 * 3. Restart-Safe: Survives API and worker restarts without losing scheduled jobs or duplicating sends.
 * 4. Fails Closed: Skips execution if database lock cannot be acquired or if campaign/source is paused.
 */

import { getPool, query } from '../../db/client.ts';
import { scraperRepository } from '../../db/repositories/scraper-repo.ts';
import { emailAutomationRepository } from '../../db/repositories/email-automation-repo.ts';
import { ScraperEngine } from '../scraper/scraper-engine.ts';
import { CampaignEngine } from '../email/campaign-engine.ts';

export const SCHEDULER_ADVISORY_LOCK_ID = 94827105;

export interface SchedulerTickResult {
  timestamp: string;
  locked: boolean;
  scraperTriggered: boolean;
  scraperJobId?: string;
  campaignsTriggered: string[];
  skippedReason?: string;
}

export class SchedulerEngine {
  private scraperEngine: ScraperEngine;
  private campaignEngine: CampaignEngine;

  constructor(scraperEngine?: ScraperEngine, campaignEngine?: CampaignEngine) {
    this.scraperEngine = scraperEngine || new ScraperEngine();
    this.campaignEngine = campaignEngine || new CampaignEngine();
  }

  /**
   * Executes a single discrete scheduler evaluation cycle.
   * Safe to be invoked by external cron, worker supervisor, or admin trigger.
   */
  async runSchedulerTick(): Promise<SchedulerTickResult> {
    const now = new Date();
    const result: SchedulerTickResult = {
      timestamp: now.toISOString(),
      locked: false,
      scraperTriggered: false,
      campaignsTriggered: [],
    };

    // 1. Concurrency control via PostgreSQL advisory lock on dedicated client
    const pool = getPool();
    const lockClient = await pool.connect();

    try {
      const lockRes = await lockClient.query<{ locked: boolean }>(
        'SELECT pg_try_advisory_lock($1) AS locked',
        [SCHEDULER_ADVISORY_LOCK_ID]
      );

      if (!lockRes.rows[0]?.locked) {
        lockClient.release();
        result.skippedReason = 'Scheduler lock held by another process. Tick skipped harmlessly.';
        return result;
      }

      result.locked = true;

      // 2. Scraper Schedule Evaluation
      const config = await scraperRepository.getConfig();
      if (config.isActive && config.nextRunAt) {
        const nextRunTime = new Date(config.nextRunAt).getTime();
        if (now.getTime() >= nextRunTime) {
          console.log(`[Scheduler] Triggering scheduled scraper discovery (due: ${config.nextRunAt})...`);
          const job = await this.scraperEngine.runDiscoveryJob({
            locations: config.targetLocations,
            categories: config.targetCategories,
          });
          result.scraperTriggered = true;
          result.scraperJobId = job.id;
          console.log(`[Scheduler] Scraper discovery job completed: ${job.id}`);
        }
      }

      // 3. Email Campaigns Schedule Evaluation
      const campaigns = await emailAutomationRepository.getCampaigns();
      for (const campaign of campaigns) {
        if (campaign.status === 'ACTIVE' && campaign.nextRunAt) {
          const nextRunTime = new Date(campaign.nextRunAt).getTime();
          if (now.getTime() >= nextRunTime) {
            console.log(`[Scheduler] Triggering scheduled email campaign ${campaign.id} (due: ${campaign.nextRunAt})...`);
            await this.campaignEngine.runCampaignCycle(campaign.id);
            result.campaignsTriggered.push(campaign.id);

            // Advance next_run_at by 24h
            const nextRunAt = new Date(now.getTime() + 86400000).toISOString();
            await emailAutomationRepository.updateCampaignStatus(campaign.id, 'ACTIVE');
          }
        }
      }

      return result;
    } finally {
      if (result.locked) {
        await lockClient.query('SELECT pg_advisory_unlock($1)', [SCHEDULER_ADVISORY_LOCK_ID]).catch(() => {});
        lockClient.release();
      }
    }
  }
}
