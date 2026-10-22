/**
 * AageOnline — Background Worker Process Supervisor & Lifecycle Engine
 *
 * Provides enterprise-grade process supervision, graceful shutdown, bounded retries,
 * exponential backoff, and heartbeat health reporting for background worker engines.
 *
 * SUPERVISION INVARIANTS:
 * 1. Process Lifecycle: Handles SIGINT / SIGTERM signals, drains in-flight work with timeout, and marks heartbeat STOPPED.
 * 2. Bounded Retries & Backoff: Temporary database outages trigger exponential backoff without infinite tight loops.
 * 3. Circuit Breaking: Exceeding max consecutive failures triggers degraded / circuit-broken state.
 * 4. Structured Safe Logging: Never logs connection secrets, auth tokens, or payment cardholder details.
 * 5. Multi-Worker Safety: Relies on PostgreSQL advisory locks and row locks rather than single-process locks.
 */

import { PostgresHeartbeatRepository, type WorkerHeartbeat } from '../db/repositories/heartbeat-repository.ts';
import { runSingleReconcilerCycle, type WorkerCycleSummary } from './reconciler-worker.ts';

export type SupervisorStatus = 'STARTING' | 'RUNNING' | 'DRAINING' | 'STOPPED' | 'CIRCUIT_BROKEN';

export interface SupervisorOptions {
  workerId?: string;
  intervalMs?: number;
  maxConsecutiveFailures?: number;
  cycleTimeoutMs?: number;
  shutdownDrainTimeoutMs?: number;
  onCycleComplete?: (summary: WorkerCycleSummary | { skipped: true; reason: string }) => void;
  onError?: (error: unknown, failureCount: number) => void;
  onStatusChange?: (status: SupervisorStatus) => void;
  cycleRunner?: (workerId: string) => Promise<WorkerCycleSummary | { skipped: true; reason: string }>;
}

export interface WorkerHealthReport {
  healthy: boolean;
  status: 'HEALTHY' | 'DEGRADED' | 'UNHEALTHY';
  workerId: string;
  workerType: string;
  supervisorStatus: SupervisorStatus;
  consecutiveFailures: number;
  uptimeSeconds: number;
  lastRunAt?: string;
  lastSuccessAt?: string;
  heartbeatAgeSeconds?: number;
  error?: string;
}

export class WorkerSupervisor {
  private readonly workerId: string;
  private readonly baseIntervalMs: number;
  private readonly maxConsecutiveFailures: number;
  private readonly cycleTimeoutMs: number;
  private readonly shutdownDrainTimeoutMs: number;
  private readonly heartbeatRepo: PostgresHeartbeatRepository;
  private readonly options: SupervisorOptions;

  private status: SupervisorStatus = 'STARTING';
  private consecutiveFailures = 0;
  private timer: NodeJS.Timeout | null = null;
  private inFlightCyclePromise: Promise<unknown> | null = null;
  private startedAt: number = Date.now();
  private lastRunAt: string | null = null;
  private lastSuccessAt: string | null = null;
  private lastError: string | null = null;

  constructor(options: SupervisorOptions = {}) {
    this.options = options;
    this.workerId = options.workerId || `reconciler-worker-${process.pid}-${Math.random().toString(36).substring(2, 6)}`;
    
    // Interval clamped between 5s and 300s
    const requestedInterval = options.intervalMs ?? 30000;
    this.baseIntervalMs = Math.max(5000, Math.min(requestedInterval, 300000));
    
    this.maxConsecutiveFailures = options.maxConsecutiveFailures ?? 5;
    this.cycleTimeoutMs = options.cycleTimeoutMs ?? 60000;
    this.shutdownDrainTimeoutMs = options.shutdownDrainTimeoutMs ?? 10000;
    this.heartbeatRepo = new PostgresHeartbeatRepository();
  }

  public getWorkerId(): string {
    return this.workerId;
  }

  public getStatus(): SupervisorStatus {
    return this.status;
  }

  public getConsecutiveFailures(): number {
    return this.consecutiveFailures;
  }

  private setStatus(newStatus: SupervisorStatus): void {
    if (this.status !== newStatus) {
      this.status = newStatus;
      if (this.options.onStatusChange) {
        this.options.onStatusChange(newStatus);
      }
    }
  }

  /**
   * Starts the supervisor loop.
   */
  public start(): void {
    if (this.status === 'RUNNING' || this.status === 'DRAINING') {
      return;
    }

    this.startedAt = Date.now();
    this.setStatus('RUNNING');
    console.log(
      JSON.stringify({
        level: 'info',
        component: 'WorkerSupervisor',
        event: 'STARTUP',
        workerId: this.workerId,
        intervalMs: this.baseIntervalMs,
        maxConsecutiveFailures: this.maxConsecutiveFailures,
        timestamp: new Date().toISOString(),
      })
    );

    // Initial immediate cycle
    this.scheduleNext(0);
  }

  private scheduleNext(delayMs: number): void {
    if (this.status !== 'RUNNING' && this.status !== 'CIRCUIT_BROKEN') {
      return;
    }

    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }

    this.timer = setTimeout(() => {
      this.executeCycle();
    }, delayMs);

    if (this.timer && typeof this.timer.unref === 'function') {
      this.timer.unref();
    }
  }

  /**
   * Executes a single supervised cycle with timeout protection and bounded exponential backoff.
   */
  public async executeCycle(): Promise<void> {
    if (this.status !== 'RUNNING' && this.status !== 'CIRCUIT_BROKEN') {
      return;
    }

    this.lastRunAt = new Date().toISOString();
    let currentDelay = this.baseIntervalMs;

    let cycleTimer: NodeJS.Timeout | null = null;
    try {
      // Execute cycle with cycleTimeoutMs race
      const cycleRunnerFn = this.options.cycleRunner || runSingleReconcilerCycle;
      const cyclePromise = cycleRunnerFn(this.workerId);
      this.inFlightCyclePromise = cyclePromise;

      const timeoutPromise = new Promise<never>((_, reject) => {
        cycleTimer = setTimeout(() => {
          reject(new Error(`Worker cycle exceeded execution timeout (${this.cycleTimeoutMs}ms)`));
        }, this.cycleTimeoutMs);
      });

      const summary = await Promise.race([cyclePromise, timeoutPromise]);

      // Cycle Succeeded
      this.consecutiveFailures = 0;
      this.lastSuccessAt = new Date().toISOString();
      this.lastError = null;
      this.setStatus('RUNNING');

      if (this.options.onCycleComplete) {
        this.options.onCycleComplete(summary);
      }
    } catch (err) {
      this.consecutiveFailures++;
      const errorMessage = err instanceof Error ? err.message : String(err);
      this.lastError = errorMessage;

      console.error(
        JSON.stringify({
          level: 'error',
          component: 'WorkerSupervisor',
          event: 'CYCLE_ERROR',
          workerId: this.workerId,
          consecutiveFailures: this.consecutiveFailures,
          maxConsecutiveFailures: this.maxConsecutiveFailures,
          error: errorMessage,
          timestamp: new Date().toISOString(),
        })
      );

      if (this.options.onError) {
        this.options.onError(err, this.consecutiveFailures);
      }

      // Check circuit breaker
      if (this.consecutiveFailures >= this.maxConsecutiveFailures) {
        this.setStatus('CIRCUIT_BROKEN');
        console.warn(
          JSON.stringify({
            level: 'warn',
            component: 'WorkerSupervisor',
            event: 'CIRCUIT_BREAKER_TRIPPED',
            workerId: this.workerId,
            consecutiveFailures: this.consecutiveFailures,
            timestamp: new Date().toISOString(),
          })
        );
      }

      // Exponential backoff: baseInterval * (1.5 ^ failures), capped at 5 minutes
      const backoffMultiplier = Math.pow(1.5, Math.min(this.consecutiveFailures, 8));
      currentDelay = Math.min(this.baseIntervalMs * backoffMultiplier, 300000);
    } finally {
      if (cycleTimer) {
        clearTimeout(cycleTimer);
        cycleTimer = null;
      }
      this.inFlightCyclePromise = null;
      if (this.status === 'RUNNING' || this.status === 'CIRCUIT_BROKEN') {
        this.scheduleNext(currentDelay);
      }
    }
  }

  /**
   * Gracefully stops the worker, allowing in-flight cycles to drain within a bounded timeout.
   */
  public async stop(): Promise<void> {
    if (this.status === 'STOPPED') {
      return;
    }

    this.setStatus('DRAINING');
    console.log(
      JSON.stringify({
        level: 'info',
        component: 'WorkerSupervisor',
        event: 'SHUTDOWN_INITIATED',
        workerId: this.workerId,
        drainTimeoutMs: this.shutdownDrainTimeoutMs,
        timestamp: new Date().toISOString(),
      })
    );

    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }

    // Await in-flight cycle drain if active
    if (this.inFlightCyclePromise) {
      let drainTimer: NodeJS.Timeout | null = null;
      try {
        const drainTimeout = new Promise<void>((resolve) => {
          drainTimer = setTimeout(() => {
            console.warn(
              JSON.stringify({
                level: 'warn',
                component: 'WorkerSupervisor',
                event: 'DRAIN_TIMEOUT_EXCEEDED',
                workerId: this.workerId,
                timestamp: new Date().toISOString(),
              })
            );
            resolve();
          }, this.shutdownDrainTimeoutMs);
        });

        await Promise.race([this.inFlightCyclePromise, drainTimeout]);
      } catch (drainErr) {
        console.warn('Error occurred while draining in-flight cycle:', drainErr);
      } finally {
        if (drainTimer) {
          clearTimeout(drainTimer);
          drainTimer = null;
        }
        this.inFlightCyclePromise = null;
      }
    }

    // Record terminal STOPPED heartbeat
    try {
      await this.heartbeatRepo.recordHeartbeat(
        this.workerId,
        'reconciler-worker',
        {
          status: 'STOPPED',
          stoppedAt: new Date().toISOString(),
          lastRunAt: this.lastRunAt,
          lastSuccessAt: this.lastSuccessAt,
        },
        'STOPPED'
      );
    } catch (hbErr) {
      console.warn('Could not record terminal heartbeat:', hbErr);
    }

    this.setStatus('STOPPED');
    console.log(
      JSON.stringify({
        level: 'info',
        component: 'WorkerSupervisor',
        event: 'SHUTDOWN_COMPLETE',
        workerId: this.workerId,
        timestamp: new Date().toISOString(),
      })
    );
  }

  /**
   * Performs an operational health check on this worker instance.
   */
  public async getHealthReport(): Promise<WorkerHealthReport> {
    const uptimeSeconds = Math.floor((Date.now() - this.startedAt) / 1000);
    let heartbeatAgeSeconds: number | undefined;

    if (this.lastRunAt) {
      heartbeatAgeSeconds = Math.floor((Date.now() - new Date(this.lastRunAt).getTime()) / 1000);
    }

    let isHealthy = true;
    let status: 'HEALTHY' | 'DEGRADED' | 'UNHEALTHY' = 'HEALTHY';

    if (this.status === 'CIRCUIT_BROKEN' || this.consecutiveFailures >= this.maxConsecutiveFailures) {
      isHealthy = false;
      status = 'UNHEALTHY';
    } else if (this.consecutiveFailures > 0 || (heartbeatAgeSeconds && heartbeatAgeSeconds > 120)) {
      status = 'DEGRADED';
    }

    if (this.status === 'STOPPED') {
      isHealthy = false;
      status = 'UNHEALTHY';
    }

    return {
      healthy: isHealthy,
      status,
      workerId: this.workerId,
      workerType: 'reconciler-worker',
      supervisorStatus: this.status,
      consecutiveFailures: this.consecutiveFailures,
      uptimeSeconds,
      lastRunAt: this.lastRunAt || undefined,
      lastSuccessAt: this.lastSuccessAt || undefined,
      heartbeatAgeSeconds,
      error: this.lastError || undefined,
    };
  }
}
