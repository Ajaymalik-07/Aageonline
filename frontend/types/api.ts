export interface APIResponse<T> {
  data: T;
  meta?: {
    total?: number;
    page?: number;
    limit?: number;
    cachedAt?: string;
    serverTime?: string;
  };
}

export interface APIErrorResponse {
  error: {
    code: string;
    message: string;
    requestId?: string;
    details?: Record<string, unknown>;
  };
}

export type FreshnessStatus = 'LIVE' | 'STALE' | 'REFRESHING' | 'ERROR';

export interface DataWithFreshness<T> {
  data: T | null;
  status: FreshnessStatus;
  lastUpdated: number | null;
  error: string | null;
}

export type CacheTier = 'STATIC' | 'SEMI_DYNAMIC' | 'HIGHLY_DYNAMIC';
