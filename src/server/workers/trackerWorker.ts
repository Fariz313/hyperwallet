import { syncActiveWallets } from "../services/walletSync";

export interface TrackerWorkerOptions {
  /** Interval between sync rounds in milliseconds (default: 30_000) */
  intervalMs?: number;
  /** Whether to start immediately on init (default: true) */
  autoStart?: boolean;
}

export interface TrackerWorkerStats {
  running: boolean;
  startedAt: string | null;
  lastRunAt: string | null;
  lastRunDuration: number | null;
  totalRuns: number;
  totalErrors: number;
  intervalMs: number;
}

/**
 * Background worker that periodically syncs all active tracked wallets
 * from the Hyperliquid public API.
 *
 * The worker runs in the SvelteKit server process and uses the existing
 * syncActiveWallets service. It emits wallet events through the event bus
 * so that SSE/polling consumers receive live updates.
 */
export class TrackerWorker {
  private timer: ReturnType<typeof setInterval> | null = null;
  private running = false;
  private startedAt: string | null = null;
  private lastRunAt: string | null = null;
  private lastRunDuration: number | null = null;
  private totalRuns = 0;
  private totalErrors = 0;
  private intervalMs: number;
  private active = false;

  constructor(options: TrackerWorkerOptions = {}) {
    this.intervalMs = options.intervalMs ?? 30_000;

    if (options.autoStart !== false) {
      this.start();
    }
  }

  get stats(): TrackerWorkerStats {
    return {
      running: this.active,
      startedAt: this.startedAt,
      lastRunAt: this.lastRunAt,
      lastRunDuration: this.lastRunDuration,
      totalRuns: this.totalRuns,
      totalErrors: this.totalErrors,
      intervalMs: this.intervalMs,
    };
  }

  start(): void {
    if (this.active) return;

    this.active = true;
    this.startedAt = new Date().toISOString();
    console.log(
      `[trackerWorker] Starting background wallet sync every ${this.intervalMs}ms`,
    );

    // Run immediately on start, then on the interval
    void this.runOnce();

    this.timer = setInterval(() => {
      void this.runOnce();
    }, this.intervalMs);

    // Allow the process to exit even if the timer is active
    if (this.timer && typeof this.timer === "object" && "unref" in this.timer) {
      (this.timer as ReturnType<typeof setInterval>).unref();
    }
  }

  stop(): void {
    this.active = false;

    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }

    console.log("[trackerWorker] Stopped background wallet sync");
  }

  isRunning(): boolean {
    return this.active;
  }

  private async runOnce(): Promise<void> {
    if (this.running) return;

    this.running = true;
    const runStart = Date.now();

    try {
      const results = await syncActiveWallets();

      this.totalRuns++;
      this.lastRunAt = new Date().toISOString();
      this.lastRunDuration = Date.now() - runStart;

      if (results.length > 0) {
        console.log(
          `[trackerWorker] Synced ${results.length} wallet(s) in ${this.lastRunDuration}ms`,
        );
      }
    } catch (error) {
      this.totalErrors++;
      console.error(
        "[trackerWorker] Sync round failed:",
        error instanceof Error ? error.message : String(error),
      );
    } finally {
      this.running = false;
    }
  }
}
