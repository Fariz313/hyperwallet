import { getHyperliquidConfig } from "./config";
import { HyperliquidRateLimiter } from "./rateLimiter";
import type {
  HyperliquidConfig,
  HyperliquidErrorContext,
  HyperliquidFill,
  HyperliquidHistoricalOrder,
  HyperliquidMeta,
  HyperliquidRequest,
  HyperliquidResponseEnvelope,
} from "./types";

const defaultLimiter = new HyperliquidRateLimiter(250);

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function isRetryableStatus(status: number): boolean {
  return (
    status === 429 ||
    status === 500 ||
    status === 502 ||
    status === 503 ||
    status === 504
  );
}

function createError(message: string, context: HyperliquidErrorContext): Error {
  const details = context.status ? `HTTP ${context.status}` : "network error";
  return new Error(`${message} (${context.action}, ${details})`);
}

export class HyperliquidClient {
  private readonly config: HyperliquidConfig;
  private readonly limiter: HyperliquidRateLimiter;

  constructor(
    config: HyperliquidConfig = getHyperliquidConfig(),
    limiter = defaultLimiter,
  ) {
    this.config = config;
    this.limiter = limiter;
  }

  async request<T>(
    body: HyperliquidRequest["body"],
    action: string,
  ): Promise<HyperliquidResponseEnvelope<T>> {
    let lastError: unknown = null;

    for (let attempt = 1; attempt <= this.config.maxRetries + 1; attempt += 1) {
      await this.limiter.wait();

      try {
        const controller = new AbortController();
        const timeout = setTimeout(
          () => controller.abort(),
          this.config.requestTimeoutMs,
        );

        const response = await fetch(this.config.baseUrl, {
          method: "POST",
          headers: {
            "content-type": "application/json",
          },
          body: JSON.stringify(body),
          signal: controller.signal,
        });

        clearTimeout(timeout);

        const raw = (await response.json().catch(() => null)) as unknown;

        if (!response.ok) {
          const context = {
            action,
            endpoint: this.config.baseUrl,
            status: response.status,
            attempts: attempt,
          };

          if (
            isRetryableStatus(response.status) &&
            attempt <= this.config.maxRetries
          ) {
            lastError = createError("Hyperliquid API request failed", context);
            await sleep(this.config.retryDelayMs * attempt);
            continue;
          }

          throw createError("Hyperliquid API request failed", context);
        }

        return {
          data: raw as T,
          raw,
          fetchedAt: new Date().toISOString(),
        };
      } catch (error) {
        clearTimeout(
          (error as { timeout?: ReturnType<typeof setTimeout> }).timeout ?? 0,
        );
        lastError = error;

        if (
          error instanceof DOMException &&
          error.name === "AbortError" &&
          attempt <= this.config.maxRetries
        ) {
          await sleep(this.config.retryDelayMs * attempt);
          continue;
        }

        if (
          error instanceof Error &&
          error.name === "TypeError" &&
          attempt <= this.config.maxRetries
        ) {
          await sleep(this.config.retryDelayMs * attempt);
          continue;
        }

        break;
      }
    }

    throw lastError instanceof Error
      ? lastError
      : new Error("Hyperliquid API request failed");
  }

  async getMeta(): Promise<HyperliquidMeta> {
    const response = await this.request<HyperliquidMeta>(
      { method: "post", body: { type: "meta" } },
      "getMeta",
    );
    return response.data;
  }

  async getClearinghouseState(user: string): Promise<unknown> {
    const response = await this.request(
      {
        method: "post",
        body: { type: "clearinghouseState", user },
      },
      "getClearinghouseState",
    );

    return response.data;
  }

  async getUserFills(
    user: string,
    startTime: number,
  ): Promise<HyperliquidFill[]> {
    const response = await this.request<HyperliquidFill[]>(
      {
        method: "post",
        body: { type: "userFillsByTime", user, startTime },
      },
      "getUserFills",
    );

    return response.data;
  }

  async getHistoricalOrders(
    user: string,
    startTime: number,
  ): Promise<HyperliquidHistoricalOrder[]> {
    const response = await this.request(
      {
        method: "post",
        body: { type: "historicalOrders", user, startTime },
      },
      "getHistoricalOrders",
    );

    return response.data as HyperliquidHistoricalOrder[];
  }
}
