import { alertsService } from "../services/alerts";
import { pushNotificationService } from "../services/pushNotifications";

export interface AlertWorkerOptions {
  /** Interval between evaluation rounds in milliseconds (default: 60_000) */
  intervalMs?: number;
  /** Whether to start immediately on init (default: true) */
  autoStart?: boolean;
}

export interface AlertWorkerStats {
  running: boolean;
  startedAt: string | null;
  lastRunAt: string | null;
  lastRunDuration: number | null;
  totalRuns: number;
  totalErrors: number;
  totalTriggered: number;
  totalSent: number;
  intervalMs: number;
}

/**
 * Background worker that periodically evaluates active price and wallet
 * activity alerts against the latest market and wallet data.
 *
 * Runs in the SvelteKit server process alongside the TrackerWorker.
 * When alerts trigger, it sends PWA push notifications to all subscribers.
 */
export class AlertWorker {
  private timer: ReturnType<typeof setInterval> | null = null;
  private running = false;
  private startedAt: string | null = null;
  private lastRunAt: string | null = null;
  private lastRunDuration: number | null = null;
  private totalRuns = 0;
  private totalErrors = 0;
  private totalTriggered = 0;
  private totalSent = 0;
  private intervalMs: number;
  private active = false;

  constructor(options: AlertWorkerOptions = {}) {
    this.intervalMs = options.intervalMs ?? 60_000;

    if (options.autoStart !== false) {
      this.start();
    }
  }

  get stats(): AlertWorkerStats {
    return {
      running: this.active,
      startedAt: this.startedAt,
      lastRunAt: this.lastRunAt,
      lastRunDuration: this.lastRunDuration,
      totalRuns: this.totalRuns,
      totalErrors: this.totalErrors,
      totalTriggered: this.totalTriggered,
      totalSent: this.totalSent,
      intervalMs: this.intervalMs,
    };
  }

  start(): void {
    if (this.active) return;

    this.active = true;
    this.startedAt = new Date().toISOString();
    console.log(
      `[alertWorker] Starting alert evaluation every ${this.intervalMs}ms`,
    );

    void this.runOnce();
    this.timer = setInterval(() => {
      void this.runOnce();
    }, this.intervalMs);

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

    console.log("[alertWorker] Stopped alert evaluation");
  }

  isRunning(): boolean {
    return this.active;
  }

  /**
   * Run one evaluation round immediately and return the results.
   * Useful for the API endpoint to trigger on-demand evaluation.
   */
  async runOnce(): Promise<{
    price: { triggered: number; details: string[] };
    wallet: { triggered: number; details: string[] };
    sent: number;
  }> {
    if (this.running) {
      return {
        price: { triggered: 0, details: [] },
        wallet: { triggered: 0, details: [] },
        sent: 0,
      };
    }

    this.running = true;
    const runStart = Date.now();

    try {
      // Evaluate price alerts
      const priceResult = await alertsService.evaluatePriceAlerts();

      // Evaluate wallet activity alerts
      const walletResult = await alertsService.evaluateWalletActivityAlerts();

      this.totalRuns++;
      this.totalTriggered += priceResult.triggered + walletResult.triggered;

      // Send push notifications for triggered alerts
      let sent = 0;
      if (
        pushNotificationService.isPushConfigured() &&
        (priceResult.triggered > 0 || walletResult.triggered > 0)
      ) {
        // Send one bundled notification per type
        if (priceResult.triggered > 0) {
          const sendResult = await pushNotificationService.sendAlertNotification(
            {
              title: `Price Alert${priceResult.triggered > 1 ? "s" : ""} Triggered`,
              body: priceResult.details.slice(0, 3).join("; "),
              url: "/alerts",
              type: "price_alert",
            },
          );
          sent += sendResult.sent;
        }

        if (walletResult.triggered > 0) {
          const sendResult =
            await pushNotificationService.sendAlertNotification({
              title: `Wallet Activity Alert${walletResult.triggered > 1 ? "s" : ""} Triggered`,
              body: walletResult.details.slice(0, 3).join("; "),
              url: "/alerts",
              type: "wallet_activity",
            });
          sent += sendResult.sent;
        }
      }

      this.totalSent += sent;
      this.lastRunAt = new Date().toISOString();
      this.lastRunDuration = Date.now() - runStart;

      if (priceResult.triggered > 0 || walletResult.triggered > 0) {
        console.log(
          `[alertWorker] Evaluated: ${priceResult.triggered} price, ${walletResult.triggered} wallet triggered, ${sent} notification(s) sent in ${this.lastRunDuration}ms`,
        );
      }

      return {
        price: {
          triggered: priceResult.triggered,
          details: priceResult.details,
        },
        wallet: {
          triggered: walletResult.triggered,
          details: walletResult.details,
        },
        sent,
      };
    } catch (error) {
      this.totalErrors++;
      console.error(
        "[alertWorker] Evaluation round failed:",
        error instanceof Error ? error.message : String(error),
      );
      return {
        price: { triggered: 0, details: [] },
        wallet: { triggered: 0, details: [] },
        sent: 0,
      };
    } finally {
      this.running = false;
    }
  }
}
