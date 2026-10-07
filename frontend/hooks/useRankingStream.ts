'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import type { RankingEntry } from '../types/market';
import type { FreshnessStatus } from '../types/api';
import { rankingApi } from '../lib/api/ranking';

interface UseRankingStreamOptions {
  marketId: string;
  initialRankings?: RankingEntry[];
  pollingIntervalMs?: number; // Default 30s
  enabled?: boolean;
}

export function useRankingStream({
  marketId,
  initialRankings = [],
  pollingIntervalMs = 30000,
  enabled = true,
}: UseRankingStreamOptions) {
  const [rankings, setRankings] = useState<RankingEntry[]>(initialRankings);
  const [status, setStatus] = useState<FreshnessStatus>('LIVE');
  const [lastUpdated, setLastUpdated] = useState<number>(Date.now());
  const [liveAnnouncement, setLiveAnnouncement] = useState<string>('');
  const prevRankingsRef = useRef<RankingEntry[]>(initialRankings);

  const refresh = useCallback(async () => {
    setStatus((prev) => (prev === 'ERROR' ? 'REFRESHING' : 'REFRESHING'));

    try {
      const freshRankings = await rankingApi.getRanking(marketId);

      // Detect rank changes for accessible live announcement without moving focus
      if (prevRankingsRef.current.length > 0) {
        const topChanged =
          freshRankings[0] &&
          prevRankingsRef.current[0] &&
          freshRankings[0].businessId !== prevRankingsRef.current[0].businessId;

        if (topChanged) {
          setLiveAnnouncement(
            `Position update: ${freshRankings[0].businessName} is now in position #1.`
          );
        }
      }

      prevRankingsRef.current = freshRankings;
      setRankings(freshRankings);
      setLastUpdated(Date.now());
      setStatus('LIVE');
    } catch {
      setStatus('ERROR');
    }
  }, [marketId]);

  useEffect(() => {
    if (!enabled || !marketId) return;

    const timer = setInterval(() => {
      refresh();
    }, pollingIntervalMs);

    return () => clearInterval(timer);
  }, [enabled, marketId, pollingIntervalMs, refresh]);

  return {
    rankings,
    status,
    lastUpdated,
    isStale: status === 'STALE' || status === 'ERROR',
    liveAnnouncement,
    refresh,
  };
}
