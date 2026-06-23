import { json, type RequestHandler } from "@sveltejs/kit";
import { alertsService } from "../../../../server/services/alerts";

const VALID_ALERT_TYPES = [
  "fill_size",
  "new_position",
  "liquidation",
  "wallet_label",
];

/**
 * POST /api/alerts/activity
 * Creates a new wallet activity alert.
 * Body: { wallet: string; alertType: string; coin?: string; side?: "A"|"B"; threshold?: number }
 */
export const POST: RequestHandler = async ({ request }) => {
  try {
    const body = await request.json();
    const { wallet, alertType, coin, side, threshold } = body;

    if (!wallet || !alertType) {
      return json(
        { error: "Missing required fields: wallet, alertType" },
        { status: 400 },
      );
    }

    if (!VALID_ALERT_TYPES.includes(alertType)) {
      return json(
        {
          error: `Invalid alertType. Must be one of: ${VALID_ALERT_TYPES.join(", ")}`,
        },
        { status: 400 },
      );
    }

    if (!/^0x[a-fA-F0-9]{40}$/.test(wallet)) {
      return json(
        { error: "Invalid wallet address format" },
        { status: 400 },
      );
    }

    const alert = await alertsService.createWalletActivityAlert({
      wallet: String(wallet).toLowerCase(),
      alertType,
      coin: coin ? String(coin).toUpperCase() : undefined,
      side,
      threshold: threshold !== undefined ? Number(threshold) : undefined,
    });

    return json({ alert }, { status: 201 });
  } catch (error) {
    console.error("[api/alerts/activity] POST failed:", error);
    return json(
      { error: "Failed to create wallet activity alert" },
      { status: 500 },
    );
  }
};
