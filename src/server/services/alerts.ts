import { PriceAlert, type PriceAlertDoc } from "../models/PriceAlert";
import {
  WalletActivityAlert,
  type WalletActivityAlertDoc,
  type WalletActivityAlertType,
} from "../models/WalletActivityAlert";
import { MarketSnapshot } from "../models/MarketSnapshot";
import { WalletSnapshot } from "../models/WalletSnapshot";
import type { MarketListItem } from "../../lib/hyperliquid/markets";
import { mapMarketSnapshotDocToListItem } from "../../lib/hyperliquid/markets";

// ── Type exports ────────────────────────────────────────────────

export interface CreatePriceAlertInput {
  symbol: string;
  condition: "above" | "below";
  price: number;
}

export interface CreateWalletActivityAlertInput {
  wallet: string;
  alertType: WalletActivityAlertType;
  coin?: string;
  side?: "A" | "B";
  threshold?: number;
}

export interface AlertEvaluationResult {
  triggered: number;
  sent: number;
  details: string[];
}

// ── Price Alert CRUD ────────────────────────────────────────────

export async function listPriceAlerts(): Promise<PriceAlertDoc[]> {
  return PriceAlert.find().sort({ createdAt: -1 }).lean();
}

export async function createPriceAlert(
  input: CreatePriceAlertInput,
): Promise<PriceAlertDoc> {
  const alert = await PriceAlert.create({
    symbol: input.symbol.toUpperCase(),
    condition: input.condition,
    price: input.price,
  });
  return alert.toObject();
}

export async function deletePriceAlert(id: string): Promise<boolean> {
  const result = await PriceAlert.findByIdAndDelete(id);
  return result !== null;
}

export async function togglePriceAlert(
  id: string,
  isActive: boolean,
): Promise<PriceAlertDoc | null> {
  return PriceAlert.findByIdAndUpdate(
    id,
    { $set: { isActive } },
    { new: true },
  ).lean();
}

// ── Wallet Activity Alert CRUD ──────────────────────────────────

export async function listWalletActivityAlerts(): Promise<WalletActivityAlertDoc[]> {
  return WalletActivityAlert.find().sort({ createdAt: -1 }).lean();
}

export async function createWalletActivityAlert(
  input: CreateWalletActivityAlertInput,
): Promise<WalletActivityAlertDoc> {
  const alert = await WalletActivityAlert.create({
    wallet: input.wallet.toLowerCase(),
    alertType: input.alertType,
    coin: input.coin,
    side: input.side,
    threshold: input.threshold,
  });
  return alert.toObject();
}

export async function deleteWalletActivityAlert(
  id: string,
): Promise<boolean> {
  const result = await WalletActivityAlert.findByIdAndDelete(id);
  return result !== null;
}

export async function toggleWalletActivityAlert(
  id: string,
  isActive: boolean,
): Promise<WalletActivityAlertDoc | null> {
  return WalletActivityAlert.findByIdAndUpdate(
    id,
    { $set: { isActive } },
    { new: true },
  ).lean();
}

// ── Alert Evaluation Engine ─────────────────────────────────────

/**
 * Evaluate all active price alerts against the latest market snapshots.
 * Returns the number of alerts that triggered.
 */
export async function evaluatePriceAlerts(): Promise<AlertEvaluationResult> {
  const result: AlertEvaluationResult = { triggered: 0, sent: 0, details: [] };

  const activeAlerts = await PriceAlert.find({ isActive: true }).lean();
  if (activeAlerts.length === 0) return result;

  // Fetch the latest market snapshot for each unique symbol
  const symbols = [...new Set(activeAlerts.map((a) => a.symbol))];

  const latestMarkets = await MarketSnapshot.find({
    symbol: { $in: symbols },
  })
    .sort({ timestamp: -1 })
    .limit(symbols.length * 2) // safe margin
    .lean();

  // Since sort + limit may not give exactly one per symbol, deduplicate
  const marketBySymbol = new Map<string, MarketListItem>();
  for (const doc of latestMarkets) {
    if (!marketBySymbol.has(doc.symbol)) {
      marketBySymbol.set(doc.symbol, mapMarketSnapshotDocToListItem(doc));
    }
  }

  for (const alert of activeAlerts) {
    const market = marketBySymbol.get(alert.symbol);
    if (!market || market.mid === undefined || market.mid === null) continue;

    const currentPrice = market.mid;
    let triggered = false;

    if (alert.condition === "above" && currentPrice >= alert.price) {
      triggered = true;
    } else if (alert.condition === "below" && currentPrice <= alert.price) {
      triggered = true;
    }

    if (triggered) {
      result.triggered++;
      result.details.push(
        `${alert.symbol} ${alert.condition} $${alert.price} (current: $${currentPrice})`,
      );

      // Mark alert as triggered (update lastTriggeredAt)
      await PriceAlert.findByIdAndUpdate(alert._id, {
        $set: { lastTriggeredAt: new Date() },
      });
    }
  }

  return result;
}

/**
 * Evaluate all active wallet activity alerts against the latest wallet snapshots.
 * Currently supports basic threshold checks and new position detection.
 */
export async function evaluateWalletActivityAlerts(): Promise<AlertEvaluationResult> {
  const result: AlertEvaluationResult = { triggered: 0, sent: 0, details: [] };

  const activeAlerts = await WalletActivityAlert.find({
    isActive: true,
  }).lean();
  if (activeAlerts.length === 0) return result;

  for (const alert of activeAlerts) {
    // Get the latest snapshot for this wallet
    const latestSnapshot = await WalletSnapshot.findOne({
      wallet: alert.wallet,
    })
      .sort({ timestamp: -1 })
      .lean();

    if (!latestSnapshot) continue;

    let triggered = false;
    let detail = "";

    const rawPositions = (latestSnapshot.raw as any)?.positions ?? [];

    switch (alert.alertType) {
      case "new_position": {
        const positions = rawPositions;
        const positionCount = Array.isArray(positions) ? positions.length : 0;
        if (alert.coin) {
          const hasCoin = Array.isArray(positions)
            ? positions.some(
                (p: any) =>
                  p.coin?.toUpperCase() === alert.coin!.toUpperCase(),
              )
            : false;
          if (hasCoin) {
            triggered = true;
            detail = `Wallet ${alert.wallet.slice(0, 10)}... opened position in ${alert.coin}`;
          }
        } else if (positionCount > 0) {
          triggered = true;
          detail = `Wallet ${alert.wallet.slice(0, 10)}... has ${positionCount} position(s)`;
        }
        break;
      }

      case "fill_size": {
        const fills = (latestSnapshot as any).recentFills ?? [];
        const fillCount = Array.isArray(fills) ? fills.length : 0;
        const threshold = alert.threshold ?? 1;
        if (fillCount >= threshold) {
          triggered = true;
          detail = `Wallet ${alert.wallet.slice(0, 10)}... has ${fillCount} fill(s) (threshold: ${threshold})`;
        }
        break;
      }

      case "liquidation": {
        const positions = rawPositions;
        if (
          Array.isArray(positions) &&
          positions.some(
            (p: any) => p.liquidationPx !== undefined && p.liquidationPx !== null,
          )
        ) {
          triggered = true;
          detail = `Wallet ${alert.wallet.slice(0, 10)}... has position(s) near liquidation`;
        }
        break;
      }

      default:
        break;
    }

    if (triggered) {
      result.triggered++;
      result.details.push(detail);

      await WalletActivityAlert.findByIdAndUpdate(alert._id, {
        $set: { lastTriggeredAt: new Date() },
      });
    }
  }

  return result;
}

// ── Exported singleton ──────────────────────────────────────────

export const alertsService = {
  listPriceAlerts,
  createPriceAlert,
  deletePriceAlert,
  togglePriceAlert,
  listWalletActivityAlerts,
  createWalletActivityAlert,
  deleteWalletActivityAlert,
  toggleWalletActivityAlert,
  evaluatePriceAlerts,
  evaluateWalletActivityAlerts,
};
