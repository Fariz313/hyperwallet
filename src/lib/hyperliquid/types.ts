export type HyperliquidNetwork = "mainnet" | "testnet";

export interface HyperliquidConfig {
  baseUrl: string;
  network: HyperliquidNetwork;
  requestTimeoutMs: number;
  maxRetries: number;
  retryDelayMs: number;
}

export interface HyperliquidRequest<TBody = unknown> {
  method: "post";
  body: TBody;
}

export interface HyperliquidErrorContext {
  action: string;
  endpoint: string;
  status?: number;
  attempts: number;
}

export class HyperliquidApiError extends Error {
  readonly context: HyperliquidErrorContext;
  readonly status?: number;
  readonly attempts: number;

  constructor(message: string, context: HyperliquidErrorContext) {
    super(message);
    this.name = "HyperliquidApiError";
    this.context = context;
    this.status = context.status;
    this.attempts = context.attempts;
  }
}

export interface HyperliquidResponseEnvelope<T> {
  data: T;
  raw: unknown;
  fetchedAt: string;
}

export interface HyperliquidMetaResponse {
  universe: Array<{
    name: string;
    szDecimals: number;
    maxLeverage: number;
    onlyIsolated?: boolean;
  }>;
}

export interface HyperliquidClearinghouseState {
  assetPositions: Array<{
    type: string;
    position: {
      coin: string;
      entryPx: string | null;
      leverage: {
        type: "cross" | "isolated";
        value: number;
        rawUsd: string;
      };
      liquidationPx: string | null;
      marginUsed: string;
      maxLeverage: number;
      positionValue: string;
      returnOnEquity: string;
      szi: string;
      unrealizedPnl: string;
    };
  }>;
  crossMaintenanceMarginUsed: string;
  crossMarginSummary: {
    accountValue: string;
    totalMarginUsed: string;
    totalNtlPos: string;
    totalRawUsd: string;
  };
  marginSummary: {
    accountValue: string;
    totalMarginUsed: string;
    totalNtlPos: string;
    totalRawUsd: string;
  };
  time: number;
  withdrawableValue: string | null;
}

export interface HyperliquidFill {
  coin?: string;
  closedPnl: string;
  crossed: boolean;
  dir: string;
  hash: string;
  oid: number;
  px: string;
  side: string;
  startPosition: string;
  sz: string;
  time: number;
  user: string;
}

export interface HyperliquidHistoricalOrder {
  oid: number;
  coin: string;
  side: string;
  limitPx: string;
  sz: string;
  avgPx: string;
  lastSz: string;
  triggerCondition: string;
  isTrigger: boolean;
  triggerPx: string | null;
  tif: string;
  orderType: string;
  reduceOnly: boolean;
  timestamp: number;
  origSz: string;
  status: string;
  user: string;
}

export interface HyperliquidMeta {
  universe: Array<{
    name: string;
    szDecimals: number;
    maxLeverage: number;
    onlyIsolated?: boolean;
  }>;
}
