import type { AnyBulkWriteOperation } from "mongoose";
import { TrackedWallet } from "../models/TrackedWallet";
import { WalletFill } from "../models/WalletFill";
import { WalletOrder } from "../models/WalletOrder";
import { WalletPosition } from "../models/WalletPosition";
import { WalletSnapshot } from "../models/WalletSnapshot";
import { HyperliquidClient } from "../../lib/hyperliquid/client";
import { normalizeAddress } from "../../lib/hyperliquid/utils";
import type {
  HyperliquidClearinghouseState,
  HyperliquidFill,
  HyperliquidHistoricalOrder,
} from "../../lib/hyperliquid/types";
import { walletEvents } from "../events/walletEvents";

export interface SyncWalletOptions {
  client?: HyperliquidClient;
  lookbackDays?: number;
  emitEvents?: boolean;
}

export interface SyncWalletResult {
  address: string;
  syncedAt: string;
  snapshotCount: number;
  positionCount: number;
  fillCount: number;
  orderCount: number;
}

interface HyperliquidAssetPosition {
  type: string;
  position: {
    coin: string;
    szi: string;
    entryPx: string | null;
    liquidationPx: string | null;
    leverage: {
      value: number;
    };
    positionValue: string;
    unrealizedPnl: string;
  };
}

function toNumber(
  value: string | number | null | undefined,
): number | undefined {
  if (value === null || value === undefined) {
    return undefined;
  }

  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : undefined;
}

function getLookbackStartTime(days: number): number {
  return Date.now() - days * 24 * 60 * 60 * 1000;
}

async function upsertSnapshot(
  user: string,
  state: HyperliquidClearinghouseState,
  now: Date,
): Promise<void> {
  const summary = state.marginSummary ?? state.crossMarginSummary;
  const accountValue = toNumber(summary.accountValue) ?? 0;
  const totalMarginUsed = toNumber(summary.totalMarginUsed) ?? 0;
  const totalPositionSzi = toNumber(summary.totalNtlPos) ?? 0;
  const openPositionCount = state.assetPositions.length;
  const liquidationRisk =
    accountValue > 0 ? totalMarginUsed / accountValue : undefined;

  await WalletSnapshot.create({
    user,
    accountValue,
    totalMarginUsed,
    totalPositionSzi,
    openPositionCount,
    marginSummary: {
      accountValue,
      totalMarginUsed,
      totalPositionSzi,
      openPositionCount,
    },
    liquidationRisk,
    raw: state as unknown as Record<string, unknown>,
    timestamp: now,
  });
}

async function upsertPositions(
  user: string,
  state: HyperliquidClearinghouseState,
  now: Date,
): Promise<number> {
  const before = new Date();
  const currentCoins: string[] = [];

  for (const item of state.assetPositions as HyperliquidAssetPosition[]) {
    const position = item.position;
    currentCoins.push(position.coin);

    await WalletPosition.updateOne(
      { user, coin: position.coin },
      {
        $set: {
          user,
          coin: position.coin,
          szi: toNumber(position.szi) ?? 0,
          side: item.type,
          entryPx: toNumber(position.entryPx),
          markPx: undefined,
          unrealizedPnl: toNumber(position.unrealizedPnl),
          leverage: position.leverage.value,
          liquidationPx: toNumber(position.liquidationPx),
          raw: item,
          updatedAt: now,
        },
        $setOnInsert: {
          createdAt: now,
        },
      },
      { upsert: true, runValidators: true },
    );
  }

  const stale = await WalletPosition.deleteMany({
    user,
    coin: { $nin: currentCoins },
    updatedAt: { $lt: before },
  });

  return currentCoins.length + stale.deletedCount;
}

async function upsertFills(
  user: string,
  fills: HyperliquidFill[],
  now: Date,
): Promise<number> {
  if (fills.length === 0) {
    return 0;
  }

  const operations: AnyBulkWriteOperation[] = fills.map((fill) => ({
    updateOne: {
      filter: { user, tid: fill.hash },
      update: {
        $set: {
          user,
          tid: fill.hash,
          coin: fill.coin ?? "UNKNOWN",
          side: fill.dir,
          size: toNumber(fill.sz) ?? 0,
          price: toNumber(fill.px) ?? 0,
          fee: 0,
          feeToken: "",
          hash: fill.hash,
          time: new Date(fill.time),
          closedPnl: toNumber(fill.closedPnl),
          liquidation: false,
          raw: fill as unknown as Record<string, unknown>,
        },
      },
      upsert: true,
    },
  }));

  const result = await WalletFill.bulkWrite(operations);
  return result.upsertedCount + result.modifiedCount + result.matchedCount;
}

async function upsertOrders(
  user: string,
  orders: HyperliquidHistoricalOrder[],
  now: Date,
): Promise<number> {
  if (orders.length === 0) {
    return 0;
  }

  const operations: AnyBulkWriteOperation[] = orders.map((order) => ({
    updateOne: {
      filter: { user, oid: String(order.oid) },
      update: {
        $set: {
          user,
          oid: String(order.oid),
          coin: order.coin,
          side: order.side,
          size: toNumber(order.origSz ?? order.sz) ?? 0,
          limitPx: toNumber(order.limitPx),
          triggerPx: toNumber(order.triggerPx),
          orderType: order.orderType,
          status: order.status,
          timestamp: new Date(order.timestamp),
          statusTimestamp: new Date(order.timestamp),
          raw: order as unknown as Record<string, unknown>,
          updatedAt: now,
        },
        $setOnInsert: {
          createdAt: now,
        },
      },
      upsert: true,
      runValidators: true,
    },
  }));

  const result = await WalletOrder.bulkWrite(operations);
  return result.upsertedCount + result.modifiedCount + result.matchedCount;
}

export async function syncWallet(
  address: string,
  options: SyncWalletOptions = {},
): Promise<SyncWalletResult> {
  const normalizedAddress = normalizeAddress(address);
  const client = options.client ?? new HyperliquidClient();
  const lookbackDays =
    options.lookbackDays ??
    Number(process.env.HYPERWALLET_SYNC_LOOKBACK_DAYS ?? 7);
  const now = new Date();
  const startTime = getLookbackStartTime(lookbackDays);

  const [state, fills, orders] = await Promise.all([
    client.getClearinghouseState(
      normalizedAddress,
    ) as Promise<HyperliquidClearinghouseState>,
    client.getUserFills(normalizedAddress, startTime) as Promise<
      HyperliquidFill[]
    >,
    client.getHistoricalOrders(normalizedAddress, startTime) as Promise<
      HyperliquidHistoricalOrder[]
    >,
  ]);

  await upsertSnapshot(normalizedAddress, state, now);
  const positionCount = await upsertPositions(normalizedAddress, state, now);
  const fillCount = await upsertFills(normalizedAddress, fills, now);
  const orderCount = await upsertOrders(normalizedAddress, orders, now);

  await TrackedWallet.updateOne(
    { address: normalizedAddress },
    {
      $set: {
        lastSyncedAt: now,
        syncStatus: "synced",
        lastError: undefined,
      },
    },
    { runValidators: true },
  );

  const result: SyncWalletResult = {
    address: normalizedAddress,
    syncedAt: now.toISOString(),
    snapshotCount: 1,
    positionCount,
    fillCount,
    orderCount,
  };

  if (options.emitEvents !== false) {
    walletEvents.emitWalletSynced(result);
  }

  return result;
}

export async function syncActiveWallets(
  options: Omit<SyncWalletOptions, "emitEvents"> = {},
): Promise<SyncWalletResult[]> {
  const wallets = await TrackedWallet.find({ isActive: true })
    .sort({ lastSyncedAt: 1 })
    .lean();
  const results: SyncWalletResult[] = [];

  for (const wallet of wallets) {
    try {
      results.push(
        await syncWallet(wallet.address, { ...options, emitEvents: true }),
      );
    } catch (error) {
      await TrackedWallet.updateOne(
        { address: wallet.address },
        {
          $set: {
            syncStatus: "error",
            lastError: error instanceof Error ? error.message : String(error),
            lastSyncedAt: new Date(),
          },
        },
      );

      walletEvents.emitWalletError({
        address: wallet.address,
        error: error instanceof Error ? error.message : String(error),
        at: new Date().toISOString(),
      });
    }
  }

  return results;
}
