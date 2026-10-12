export interface SEOMetadata {
  title: string;
  description: string;
  canonicalUrl: string;
  robots?: 'index, follow' | 'noindex, nofollow' | 'noindex, follow';
  openGraph?: {
    title: string;
    description: string;
    url: string;
    siteName: string;
    locale: string;
    type: 'website' | 'article';
    images?: Array<{
      url: string;
      width: number;
      height: number;
      alt: string;
    }>;
  };
  twitter?: {
    card: 'summary' | 'summary_large_image';
    title: string;
    description: string;
    creator?: string;
  };
}

export interface BreadcrumbItem {
  label: string;
  url: string;
  isCurrent?: boolean;
}

export interface AnswerEngineFact {
  property: string;
  value: string;
}

export interface AnswerEngineSection {
  heading: string;
  directAnswer: string;
  supportingFacts: AnswerEngineFact[];
}

export type SeoExclusionReason =
  | 'UNPUBLISHED'
  | 'EXPLICIT_NOINDEX'
  | 'INSUFFICIENT_CONTENT'
  | 'MISSING_DATA'
  | 'PRIVATE_ROUTE'
  | 'CANONICAL_CONFLICT'
  | 'INVALID_TAXONOMY';

export type SeoRouteType =
  | 'HOME'
  | 'MARKETS_INDEX'
  | 'LOCATIONS_INDEX'
  | 'CATEGORIES_INDEX'
  | 'BUSINESSES_INDEX'
  | 'LOCATION'
  | 'CATEGORY'
  | 'MARKET'
  | 'BUSINESS'
  | 'PRIVATE';

export interface SeoEligibilityCandidate {
  url: string;
  path: string;
  routeType: SeoRouteType;
  entityId?: string;
  publicationStatus?: 'PUBLISHED' | 'DRAFT' | 'REVIEW' | 'DISCOVERED' | 'ARCHIVED';
  indexabilityStatus?: 'INDEXABLE' | 'NOINDEX';
  contentStatus?: 'APPROVED' | 'REVIEW' | 'READY' | 'DRAFT' | 'MISSING';
  hasGenuineData: boolean;
  activeChildCount?: number;
  lastModified?: string;
  metadata?: Record<string, unknown>;
}

export interface SeoEligibilityResult {
  isEligible: boolean;
  canonicalUrl: string;
  routeType: SeoRouteType;
  exclusionReason?: SeoExclusionReason;
  exclusionDetail?: string;
  lastModified?: string;
  changeFrequency: 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never';
  priority: number;
}

export interface SeoAuditFinding {
  severity: 'CRITICAL' | 'WARNING' | 'INFO';
  category: 'CANONICAL' | 'METADATA' | 'CONTENT_QUALITY' | 'STRUCTURED_DATA' | 'TAXONOMY' | 'INTERNAL_LINK';
  url: string;
  message: string;
  entityId?: string;
}

export interface SeoAuditRun {
  id: string;
  runType: 'SCHEDULED' | 'MANUAL';
  totalCandidates: number;
  eligibleUrls: number;
  excludedUrls: number;
  findingsCount: number;
  exclusionsByReason: Partial<Record<SeoExclusionReason, number>> | Record<string, number>;
  findings: SeoAuditFinding[];
  sitemapChecksum?: string;
  createdAt: string;
  completedAt?: string;
}

export interface SearchConsoleStatus {
  configured: boolean;
  siteUrl?: string;
  clientEmail?: string;
  lastSitemapSubmissionAt?: string;
  submissionStatus?: 'SUBMITTED' | 'PENDING' | 'FAILED' | 'NOT_CONFIGURED';
  details?: string;
}

export interface SeoOperationalSummary {
  totalCandidates: number;
  eligibleUrls: number;
  excludedUrls: number;
  exclusionsByReason: Record<string, number>;
  criticalFindingsCount: number;
  warningFindingsCount: number;
  lastAuditAt?: string;
  sitemapLastGeneratedAt?: string;
  searchConsoleStatus: SearchConsoleStatus;
}
