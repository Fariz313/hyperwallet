import type { HyperliquidMeta } from "./types";
import { normalizeSymbol } from "./utils";

export interface HyperliquidMarketMeta {
  name: string;
  szDecimals: number;
  maxLeverage: number;
  onlyIsolated?: boolean;
}

export interface HyperliquidAssetCtx {
  name: string;
  dayNtlVlm?: string;
  funding?: string;
  mark?: string;
  openInterest?: string;
  prevDayPrice?: string;
  [key: string]: unknown;
}

export interface HyperliquidMarketSnapshotResponse {
  universe: HyperliquidMarketMeta[];
  vaults?: unknown[];
  [key: string]: unknown;
}

export interface HyperliquidAssetCtxResponse {
  assetCtxs: HyperliquidAssetCtx[];
  [key: string]: unknown;
}

export interface MarketSnapshotInput {
  symbol: string;
  name?: string;
  mid?: number;
  mark?: number;
  prevDayPrice?: number;
  dayNtlVlm?: number;
  funding?: number;
  openInterest?: number;
  category?: string;
  assetClass?: string;
  isFavorite: boolean;
  raw?: Record<string, unknown>;
  timestamp: Date;
}

export interface MarketListItem {
  symbol: string;
  name?: string;
  mid?: number;
  mark?: number;
  prevDayPrice?: number;
  change24h?: number;
  dayNtlVlm?: number;
  funding?: number;
  openInterest?: number;
  category?: string;
  assetClass?: string;
  isFavorite: boolean;
  timestamp: string;
}

function toNumber(value: unknown): number | undefined {
  if (value === null || value === undefined) {
    return undefined;
  }

  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : undefined;
}

function getAssetCtxByName(
  assetCtxs: HyperliquidAssetCtx[] | undefined,
  name: string,
): HyperliquidAssetCtx | undefined {
  return assetCtxs?.find((assetCtx) => assetCtx.name === name);
}

export function mapMetaAndAssetCtxsToMarketInputs(
  meta: HyperliquidMeta | undefined,
  assetCtxs: HyperliquidAssetCtx[] | undefined,
  now: Date,
): MarketSnapshotInput[] {
  const universe = meta?.universe ?? [];

  return universe
    .filter((asset) => asset.name && asset.szDecimals !== undefined)
    .map((asset) => {
      const context = getAssetCtxByName(assetCtxs, asset.name);

      return {
        symbol: normalizeSymbol(asset.name),
        name: asset.name,
        mid: toNumber(context?.["mid"] ?? context?.["mark"]),
        mark: toNumber(context?.["mark"]),
        prevDayPrice: toNumber(context?.prevDayPrice),
        dayNtlVlm: toNumber(context?.dayNtlVlm),
        funding: toNumber(context?.funding),
        openInterest: toNumber(context?.openInterest),
        category: "perp",
        assetClass: "crypto",
        isFavorite: false,
        raw: {
          ...asset,
          ...(context ?? {}),
        } as Record<string, unknown>,
        timestamp: now,
      };
    });
}

export function mapMarketSnapshotDocToListItem(doc: {
  symbol: string;
  name?: string;
  mid?: number;
  mark?: number;
  prevDayPrice?: number;
  dayNtlVlm?: number;
  funding?: number;
  openInterest?: number;
  category?: string;
  assetClass?: string;
  isFavorite: boolean;
  timestamp: Date;
}): MarketListItem {
  return {
    symbol: doc.symbol,
    name: doc.name,
    mid: doc.mid,
    mark: doc.mark,
    prevDayPrice: doc.prevDayPrice,
    change24h:
      doc.mid != null && doc.prevDayPrice != null && doc.prevDayPrice > 0
        ? (doc.mid - doc.prevDayPrice) / doc.prevDayPrice
        : undefined,
    dayNtlVlm: doc.dayNtlVlm,
    funding: doc.funding,
    openInterest: doc.openInterest,
    category: doc.category,
    assetClass: doc.assetClass,
    isFavorite: doc.isFavorite,
    timestamp: doc.timestamp.toISOString(),
  };
}
