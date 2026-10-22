/**
 * AageOnline API — Source Connector Framework Interface
 * Milestone 0.20.27: Unified Lead Scraper + Zero-Inspired Email Automation
 */

export interface ScrapedBusinessCandidate {
  businessName: string;
  normalizedName?: string;
  category: string;
  city: string;
  address?: string;
  contactPhone?: string;
  contactEmail?: string;
  website?: string;
  source: string;
  sourceUrl?: string;
  rating?: number;
  provenance?: Record<string, unknown>;
  verificationStatus?: string;
}

export interface ConnectorQuery {
  location: string;
  category: string;
  keywords?: string[];
  limit?: number;
}

export interface SourceConnector {
  id: string;
  name: string;
  type: 'GOOGLE_MAPS' | 'GOOGLE_SEARCH' | 'WEBSITE_CRAWLER' | 'CSV_IMPORT' | 'META' | 'LINKEDIN' | 'X';
  isAvailable: boolean;
  operationalStatus: 'OPERATIONAL' | 'CONFIG_REQUIRED' | 'RATE_LIMITED' | 'DISABLED';
  dataLimitations: string;
  discover(query: ConnectorQuery): Promise<ScrapedBusinessCandidate[]>;
}
