import type { HyperliquidConfig } from "./types";

export function getHyperliquidConfig(): HyperliquidConfig {
  return {
    baseUrl: process.env.HYPERLIQUID_API_URL ?? "https://api.hyperliquid.xyz",
    network:
      process.env.HYPERLIQUID_NETWORK === "testnet" ? "testnet" : "mainnet",
    requestTimeoutMs: Number(
      process.env.HYPERLIQUID_REQUEST_TIMEOUT_MS ?? 15_000,
    ),
    maxRetries: Number(process.env.HYPERLIQUID_MAX_RETRIES ?? 2),
    retryDelayMs: Number(process.env.HYPERLIQUID_RETRY_DELAY_MS ?? 750),
  };
}
