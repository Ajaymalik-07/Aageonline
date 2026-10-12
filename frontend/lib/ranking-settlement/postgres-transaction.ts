/**
 * AageOnline — PostgreSQL Ranking Transaction & Concurrency Context
 *
 * Implements authoritative ACID transaction boundaries with PostgreSQL row-level locking:
 * - Acquires exclusive row-lock on target market entity (`SELECT id FROM markets WHERE id = $1 FOR UPDATE`)
 * - Guarantees strict serialization across multiple application instances
 * - Executes mutations, position history appends, and settlement finalization atomically
 * - All-or-nothing rollback on any error
 */

import type pg from 'pg';
import { getDbPool } from '../db/client.ts';

export class PostgresRankingTransactionContext {
  readonly marketId: string;
  private client: pg.PoolClient | null = null;
  private isLocked = false;
  private isCompleted = false;

  constructor(marketId: string) {
    this.marketId = marketId;
  }

  /**
   * Begins a database transaction and acquires an exclusive row lock on the market.
   */
  async begin(): Promise<pg.PoolClient> {
    if (this.isLocked || this.client) {
      throw new Error(`Transaction already active for market "${this.marketId}".`);
    }

    const pool = getDbPool();
    this.client = await pool.connect();

    try {
      await this.client.query('BEGIN');

      // Acquire exclusive market-level row lock
      const lockResult = await this.client.query(
        'SELECT id FROM markets WHERE id = $1 FOR UPDATE',
        [this.marketId]
      );

      if (lockResult.rows.length === 0) {
        throw new Error(`Target market "${this.marketId}" does not exist in database.`);
      }

      this.isLocked = true;
      return this.client;
    } catch (err) {
      if (this.client) {
        try {
          await this.client.query('ROLLBACK');
        } catch {
          // ignore rollback error on begin failure
        }
        this.client.release();
        this.client = null;
      }
      throw err;
    }
  }

  /**
   * Returns the active transaction client.
   */
  getClient(): pg.PoolClient {
    if (!this.client || !this.isLocked) {
      throw new Error(`No active transaction client for market "${this.marketId}". Call begin() first.`);
    }
    return this.client;
  }

  /**
   * Commits the transaction and releases the connection.
   */
  async commit(): Promise<void> {
    if (!this.client || !this.isLocked) {
      throw new Error(`Cannot commit: no active transaction for market "${this.marketId}".`);
    }

    try {
      await this.client.query('COMMIT');
      this.isCompleted = true;
    } finally {
      this.isLocked = false;
      this.client.release();
      this.client = null;
    }
  }

  /**
   * Rolls back the transaction and releases the connection.
   */
  async rollback(): Promise<void> {
    if (!this.client) return;

    try {
      await this.client.query('ROLLBACK');
    } catch (err) {
      console.error(`Error during transaction rollback for market "${this.marketId}":`, err);
    } finally {
      this.isLocked = false;
      this.client.release();
      this.client = null;
    }
  }

  get completed(): boolean {
    return this.isCompleted;
  }
}
