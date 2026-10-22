/**
 * AageOnline API — Central Scraper Engine Orchestrator
 * Milestone 0.20.27: Unified Lead Scraper + Zero-Inspired Email Automation
 */

import { scraperRepository, type DbScraperJob } from '../../db/repositories/scraper-repo.ts';
import type { SourceConnector, ScrapedBusinessCandidate } from './connector-interface.ts';
import { GoogleMapsConnector } from './google-maps-connector.ts';
import { GoogleSearchConnector, MetaSocialConnector, LinkedInConnector, XSocialConnector } from './social-connectors.ts';
import { WebsiteCrawlerConnector } from './website-crawler-connector.ts';
import { CsvImportConnector } from './csv-connector.ts';
import { GeminiNormalizer } from './gemini-normalizer.ts';

export class ScraperEngine {
  private connectors: Map<string, SourceConnector> = new Map();
  private gemini: GeminiNormalizer;

  constructor() {
    this.gemini = new GeminiNormalizer();
    this.registerConnector(new GoogleMapsConnector());
    this.registerConnector(new WebsiteCrawlerConnector());
    this.registerConnector(new CsvImportConnector());
    this.registerConnector(new GoogleSearchConnector());
    this.registerConnector(new MetaSocialConnector());
    this.registerConnector(new LinkedInConnector());
    this.registerConnector(new XSocialConnector());
  }

  public registerConnector(connector: SourceConnector): void {
    this.connectors.set(connector.id, connector);
  }

  public getConnectors(): Array<{
    id: string;
    name: string;
    type: string;
    isAvailable: boolean;
    operationalStatus: string;
    dataLimitations: string;
  }> {
    return Array.from(this.connectors.values()).map((c) => ({
      id: c.id,
      name: c.name,
      type: c.type,
      isAvailable: c.isAvailable,
      operationalStatus: c.operationalStatus,
      dataLimitations: c.dataLimitations,
    }));
  }

  /**
   * Executes a scheduled or on-demand discovery job.
   */
  async runDiscoveryJob(options?: {
    source?: string;
    locations?: string[];
    categories?: string[];
  }): Promise<DbScraperJob> {
    const config = await scraperRepository.getConfig();
    const source = options?.source || 'google_maps';
    const locations = options?.locations || config.targetLocations;
    const categories = options?.categories || config.targetCategories;

    // Create job record
    const job = await scraperRepository.createJob({
      source,
      targetLocations: locations,
      targetCategories: categories,
    });

    // Mark job RUNNING
    await scraperRepository.updateJob(job.id, {
      status: 'RUNNING',
      startedAt: new Date().toISOString(),
    });

    const connector = this.connectors.get(source) || this.connectors.get('google_maps')!;
    let totalDiscovered = 0;
    let newLeadsAdded = 0;
    let existingUpdated = 0;
    let duplicatesSkipped = 0;
    let invalidRecords = 0;
    let connectorErrors = 0;
    const errorLog: Array<{ timestamp: string; message: string; connector?: string }> = [];

    try {
      if (connector.operationalStatus !== 'OPERATIONAL') {
        throw new Error(`Connector ${connector.name} is not operational: ${connector.operationalStatus} (${connector.dataLimitations})`);
      }

      // Execute discovery across location x category pairs
      for (const loc of locations) {
        for (const cat of categories) {
          try {
            const candidates = await connector.discover({
              location: loc,
              category: cat,
              limit: config.perSourceLimit,
            });

            totalDiscovered += candidates.length;

            for (const candidate of candidates) {
              if (!candidate.businessName || !candidate.city || !candidate.category) {
                invalidRecords += 1;
                continue;
              }

              // Optional Gemini AI Normalization
              let processedCandidate: ScrapedBusinessCandidate = candidate;
              if (config.geminiEnabled && this.gemini.isConfigured()) {
                const aiResult = await this.gemini.normalize(candidate);
                processedCandidate = {
                  ...candidate,
                  businessName: aiResult.normalizedName,
                  category: aiResult.category,
                  city: aiResult.city,
                  provenance: {
                    ...candidate.provenance,
                    geminiNormalized: true,
                    confidenceScore: aiResult.confidenceScore,
                  },
                };
              }

              // Deduplicate and upsert into authoritative SQL registry
              const result = await scraperRepository.upsertLead(processedCandidate, job.id);
              if (result.isNew) {
                newLeadsAdded += 1;
              } else if (result.isDuplicate) {
                duplicatesSkipped += 1;
                existingUpdated += 1;
              }
            }
          } catch (err: unknown) {
            connectorErrors += 1;
            errorLog.push({
              timestamp: new Date().toISOString(),
              connector: connector.id,
              message: err instanceof Error ? err.message : 'Unknown discovery error',
            });
          }
        }
      }

      const completed = await scraperRepository.updateJob(job.id, {
        status: 'COMPLETED',
        totalDiscovered,
        newLeadsAdded,
        existingUpdated,
        duplicatesSkipped,
        invalidRecords,
        connectorErrors,
        errorLog,
        completedAt: new Date().toISOString(),
      });

      // Update scraper config last_run_at
      await scraperRepository.updateConfig({
        lastRunAt: new Date().toISOString(),
        nextRunAt: new Date(Date.now() + config.frequencyHours * 3600000).toISOString(),
      });

      return completed || job;
    } catch (err: unknown) {
      errorLog.push({
        timestamp: new Date().toISOString(),
        connector: connector.id,
        message: err instanceof Error ? err.message : 'Fatal discovery error',
      });

      const failed = await scraperRepository.updateJob(job.id, {
        status: 'FAILED',
        connectorErrors: connectorErrors + 1,
        errorLog,
        completedAt: new Date().toISOString(),
      });

      return failed || job;
    }
  }
}
