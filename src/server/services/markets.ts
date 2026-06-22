import { MarketSnapshot } from "../models/MarketSnapshot";
import { HyperliquidClient } from "../../lib/hyperliquid/client";
import type {
  HyperliquidAssetCtx,
  HyperliquidMarketSnapshotResponse,
  MarketListItem,
  MarketSnapshotInput,
} from "../../lib/hyperliquid/markets";
import {
  mapMarketSnapshotDocToListItem,
  mapMetaAndAssetCtxsToMarketInputs,
} from "../../lib/hyperliquid/markets";
import { normalizeSymbol } from "../../lib/hyperliquid/utils";

export interface SyncMarketsOptions {
  client?: HyperliquidClient;
  maxAgeMs?: number;
}

export interface SyncMarketsResult {
  marketCount: number;
  syncedAt: string;
  stale: boolean;
}

function getAssetCtxs(
  metaAndAssetCtxs: unknown,
): HyperliquidAssetCtx[] | undefined {
  if (!metaAndAssetCtxs || typeof metaAndAssetCtxs !== "object") {
    return undefined;
  }

  const assetCtxs = (
    metaAndAssetCtxs as {
      assetCtxs?: HyperliquidAssetCtx[];
    }
  ).assetCtxs;

  return Array.isArray(assetCtxs) ? assetCtxs : undefined;
}

function marketInputToDoc(input: MarketSnapshotInput) {
  return {
    symbol: input.symbol,
    name: input.name,
    mid: input.mid,
    mark: input.mark,
    dayNtlVlm: input.dayNtlVlm,
    funding: input.funding,
    openInterest: input.openInterest,
    category: input.category,
    assetClass: input.assetClass,
    isFavorite: input.isFavorite,
    raw: input.raw,
    timestamp: input.timestamp,
  };
}

export class MarketsService {
  async syncMarkets(
    options: SyncMarketsOptions = {},
  ): Promise<SyncMarketsResult> {
    const client = options.client ?? new HyperliquidClient();
    const maxAgeMs = options.maxAgeMs ?? 10_000;
    const now = new Date();
    const latest = await MarketSnapshot.findOne({})
      .sort({ timestamp: -1 })
      .lean();
    const stale =
      !latest || now.getTime() - latest.timestamp.getTime() > maxAgeMs;

    if (!stale) {
      return {
        marketCount: await MarketSnapshot.countDocuments(),
        syncedAt: latest.timestamp.toISOString(),
        stale: false,
      };
    }

    const metaAndAssetCtxs =
      await client.request<HyperliquidMarketSnapshotResponse>(
        { method: "post", body: { type: "metaAndAssetCtxs" } },
        "getMetaAndAssetCtxs",
      );
    const inputs = mapMetaAndAssetCtxsToMarketInputs(
      metaAndAssetCtxs.data,
      getAssetCtxs(metaAndAssetCtxs.data),
      now,
    );
    const operations = inputs.map((input) => ({
      updateOne: {
        filter: { symbol: input.symbol },
        update: {
          $set: marketInputToDoc(input),
          $setOnInsert: { createdAt: input.timestamp },
        },
        upsert: true,
        runValidators: true,
      },
    }));

    if (operations.length > 0) {
      await MarketSnapshot.bulkWrite(operations);
    }

    return {
      marketCount: inputs.length,
      syncedAt: now.toISOString(),
      stale: true,
    };
  }

  async listMarkets(
    options: { search?: string } = {},
  ): Promise<MarketListItem[]> {
    const query = options.search
      ? { symbol: { $regex: normalizeSymbol(options.search), $options: "i" } }
      : {};
    const markets = await MarketSnapshot.find(query)
      .sort({
        isFavorite: -1,
        dayNtlVlm: -1,
        symbol: 1,
      })
      .lean();

    return markets.map(mapMarketSnapshotDocToListItem);
  }

  async setFavorite(
    symbol: string,
    isFavorite: boolean,
  ): Promise<MarketListItem> {
    const market = await MarketSnapshot.findOneAndUpdate(
      { symbol: normalizeSymbol(symbol) },
      {
        $set: { isFavorite },
      },
      { new: true, upsert: true, runValidators: true },
    ).lean();

    return mapMarketSnapshotDocToListItem(market);
  }
}

export const marketsService = new MarketsService();
