/**
 * AageOnline — Ranking Settlement Transaction & Concurrency Manager
 *
 * Implements strict transaction atomicity and market-level concurrency locking:
 * - Market-level row locking boundary (simulating PostgreSQL `SELECT ... FOR UPDATE`)
 * - Deep snapshot isolation for in-memory stores
 * - Guaranteed all-or-nothing atomicity (rollback restores exact pre-transaction state)
 * - Fault injection hooks for rigorous rollback verification testing
 */

import type pg from 'pg';
import { getDbPool, isDatabaseConfigured } from '../db/client.ts';
import {
  cloneMarketParticipationsStore,
  restoreMarketParticipationsStore,
} from '../taxonomy/businesses.ts';
import {
  clonePositionHistoryStore,
  restorePositionHistoryStore,
} from './position-history.ts';
import type { RankingSettlement } from '../../types/ranking-settlement.ts';

const ACTIVE_MARKET_LOCKS = new Set<string>();

// Failure injection hook for atomicity tests
let failureInjectionPoint: 'before_position_history' | 'before_settlement_record' | null = null;

export function setTransactionFailureInjection(
  point: 'before_position_history' | 'before_settlement_record' | null
): void {
  failureInjectionPoint = point;
}

export function getTransactionFailureInjection(): 'before_position_history' | 'before_settlement_record' | null {
  return failureInjectionPoint;
}

export interface TransactionSnapshots {
  marketParticipations: ReturnType<typeof cloneMarketParticipationsStore>;
  positionHistory: ReturnType<typeof clonePositionHistoryStore>;
  settlementsSnapshot?: Map<string, RankingSettlement>;
}

export class RankingTransactionContext {
  readonly marketId: string;
  private isLocked: boolean = false;
  private isCompleted: boolean = false;
  private snapshots: TransactionSnapshots | null = null;
  private client: pg.PoolClient | null = null;

  constructor(marketId: string) {
    this.marketId = marketId;
  }

  /**
   * Returns the underlying PostgreSQL transaction client if connected.
   */
  getClient(): pg.PoolClient | undefined {
    return this.client || undefined;
  }

  /**
   * Acquires an exclusive lock on the target market.
   * In PostgreSQL production: executes BEGIN, SELECT pg_advisory_xact_lock(...),
   * and SELECT id FROM markets WHERE id = $1 FOR UPDATE.
   * In local memory: validates and sets market lock with deep store snapshot isolation.
   */
  async begin(): Promise<void> {
    if (ACTIVE_MARKET_LOCKS.has(this.marketId)) {
      // Small retry loop to simulate concurrency queueing
      for (let attempt = 0; attempt < 50; attempt++) {
        await new Promise((resolve) => setTimeout(resolve, 10));
        if (!ACTIVE_MARKET_LOCKS.has(this.marketId)) {
          break;
        }
      }
      if (ACTIVE_MARKET_LOCKS.has(this.marketId)) {
        throw new Error(
          `Market concurrency conflict: Market "${this.marketId}" is currently locked by another settlement transaction.`
        );
      }
    }

    ACTIVE_MARKET_LOCKS.add(this.marketId);
    this.isLocked = true;

    // Capture pre-transaction store snapshots for atomic rollback
    this.snapshots = {
      marketParticipations: cloneMarketParticipationsStore(),
      positionHistory: clonePositionHistoryStore(),
    };

    // If database is configured, acquire real PostgreSQL connection, BEGIN, and row/advisory locks
    if (isDatabaseConfigured()) {
      try {
        const pool = getDbPool();
        this.client = await pool.connect();
        await this.client.query('BEGIN');
        // Market-level concurrency locking:
        // 1. Transactional advisory lock scoped to this market ID
        await this.client.query('SELECT pg_advisory_xact_lock(hashtext($1))', [this.marketId]);
        // 2. Row-level lock if markets table has this market
        await this.client.query('SELECT id FROM markets WHERE id = $1 FOR UPDATE', [this.marketId]);
      } catch (err) {
        if (this.client) {
          try {
            await this.client.query('ROLLBACK');
          } catch {
            // ignore
          }
          this.client.release();
          this.client = null;
        }
        ACTIVE_MARKET_LOCKS.delete(this.marketId);
        this.isLocked = false;
        throw err;
      }
    }
  }

  /**
   * Commits the transaction and releases all held locks.
   */
  async commit(): Promise<void> {
    if (!this.isLocked) {
      throw new Error(`Cannot commit transaction: lock not held for market "${this.marketId}".`);
    }

    if (this.client) {
      try {
        await this.client.query('COMMIT');
      } finally {
        this.client.release();
        this.client = null;
      }
    }

    this.isCompleted = true;
    this.releaseLock();
  }

  /**
   * Rolls back all mutations, restoring stores to their exact pre-transaction state.
   */
  async rollback(): Promise<void> {
    if (this.client) {
      try {
        await this.client.query('ROLLBACK');
      } catch (rbErr) {
        console.error('Error rolling back PostgreSQL ranking settlement transaction:', rbErr);
      } finally {
        this.client.release();
        this.client = null;
      }
    }

    if (this.snapshots) {
      restoreMarketParticipationsStore(this.snapshots.marketParticipations);
      restorePositionHistoryStore(this.snapshots.positionHistory);
    }
    this.isCompleted = true;
    this.releaseLock();
  }

  private releaseLock(): void {
    if (this.isLocked) {
      ACTIVE_MARKET_LOCKS.delete(this.marketId);
      this.isLocked = false;
    }
  }
}

/**
 * Resets all transaction locks for test cleanup.
 */
export function resetTransactionManagerForTesting(): void {
  ACTIVE_MARKET_LOCKS.clear();
  failureInjectionPoint = null;
}
