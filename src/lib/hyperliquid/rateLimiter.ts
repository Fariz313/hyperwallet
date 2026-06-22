export class HyperliquidRateLimiter {
  private readonly minIntervalMs: number;
  private lastRequestAt = 0;

  constructor(minIntervalMs = 250) {
    this.minIntervalMs = minIntervalMs;
  }

  async wait(): Promise<void> {
    const now = Date.now();
    const elapsed = now - this.lastRequestAt;
    const remaining = this.minIntervalMs - elapsed;

    if (remaining > 0) {
      await new Promise((resolve) => setTimeout(resolve, remaining));
    }

    this.lastRequestAt = Date.now();
  }
}
