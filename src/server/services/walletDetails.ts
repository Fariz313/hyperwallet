import { TrackedWallet } from "../models/TrackedWallet";
import { WalletFill } from "../models/WalletFill";
import { WalletOrder } from "../models/WalletOrder";
import { WalletPosition } from "../models/WalletPosition";
import { WalletSnapshot } from "../models/WalletSnapshot";
import { normalizeAddress } from "../../lib/hyperliquid/utils";

export interface WalletDetailData {
  address: string;
  label?: string;
  tags: string[];
  isActive: boolean;
  syncStatus: string;
  lastSyncedAt?: string;
  lastError?: string;
  latestSnapshot?: {
    accountValue: number;
    totalMarginUsed: number;
    totalPositionSzi: number;
    openPositionCount: number;
    liquidationRisk?: number;
    timestamp: string;
  };
  positions: Array<{
    coin: string;
    szi: number;
    side: string;
    entryPx?: number;
    markPx?: number;
    unrealizedPnl?: number;
    leverage?: number;
    liquidationPx?: number;
    updatedAt: string;
  }>;
  recentFills: Array<{
    coin: string;
    side: string;
    size: number;
    price: number;
    hash: string;
    time: string;
    closedPnl?: number;
  }>;
  recentOrders: Array<{
    coin: string;
    side: string;
    size: number;
    limitPx?: number;
    triggerPx?: number;
    orderType: string;
    status: string;
    timestamp: string;
  }>;
}

export async function getWalletDetail(
  address: string,
): Promise<WalletDetailData> {
  const normalizedAddress = normalizeAddress(address);
  const wallet = await TrackedWallet.findOne({
    address: normalizedAddress,
  }).lean();
  const latestSnapshot = await WalletSnapshot.findOne({
    user: normalizedAddress,
  })
    .sort({ timestamp: -1 })
    .lean();
  const positions = await WalletPosition.find({ user: normalizedAddress })
    .sort({ coin: 1 })
    .lean();
  const recentFills = await WalletFill.find({ user: normalizedAddress })
    .sort({ time: -1 })
    .limit(20)
    .lean();
  const recentOrders = await WalletOrder.find({ user: normalizedAddress })
    .sort({ timestamp: -1 })
    .limit(20)
    .lean();

  if (!wallet) {
    throw new Error("Wallet not found");
  }

  return {
    address: normalizedAddress,
    label: wallet.label,
    tags: wallet.tags,
    isActive: wallet.isActive,
    syncStatus: wallet.syncStatus,
    lastSyncedAt: wallet.lastSyncedAt?.toISOString(),
    lastError: wallet.lastError,
    latestSnapshot: latestSnapshot
      ? {
          accountValue: latestSnapshot.accountValue,
          totalMarginUsed: latestSnapshot.totalMarginUsed,
          totalPositionSzi: latestSnapshot.totalPositionSzi,
          openPositionCount: latestSnapshot.openPositionCount,
          liquidationRisk: latestSnapshot.liquidationRisk,
          timestamp: latestSnapshot.timestamp.toISOString(),
        }
      : undefined,
    positions: positions.map((position) => ({
      coin: position.coin,
      szi: position.szi,
      side: position.side,
      entryPx: position.entryPx,
      markPx: position.markPx,
      unrealizedPnl: position.unrealizedPnl,
      leverage: position.leverage,
      liquidationPx: position.liquidationPx,
      updatedAt: position.updatedAt.toISOString(),
    })),
    recentFills: recentFills.map((fill) => ({
      coin: fill.coin,
      side: fill.side,
      size: fill.size,
      price: fill.price,
      hash: fill.hash,
      time: fill.time.toISOString(),
      closedPnl: fill.closedPnl,
    })),
    recentOrders: recentOrders.map((order) => ({
      coin: order.coin,
      side: order.side,
      size: order.size,
      limitPx: order.limitPx,
      triggerPx: order.triggerPx,
      orderType: order.orderType,
      status: order.status,
      timestamp: order.timestamp.toISOString(),
    })),
  };
}
