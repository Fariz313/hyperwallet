import { json, type RequestHandler } from "@sveltejs/kit";
import { alertsService } from "../../../server/services/alerts";

/**
 * GET /api/alerts?type=price|activity
 * Returns all price alerts and/or wallet activity alerts.
 */
export const GET: RequestHandler = async ({ url }) => {
  const type = url.searchParams.get("type");

  try {
    const [priceAlerts, walletAlerts] = await Promise.all([
      type === "activity"
        ? Promise.resolve([])
        : alertsService.listPriceAlerts(),
      type === "price"
        ? Promise.resolve([])
        : alertsService.listWalletActivityAlerts(),
    ]);

    return json({
      priceAlerts,
      walletAlerts,
    });
  } catch (error) {
    console.error("[api/alerts] GET failed:", error);
    return json(
      { error: "Failed to load alerts" },
      { status: 500 },
    );
  }
};

/**
 * POST /api/alerts/price
 * Creates a new price alert.
 * Body: { symbol: string; condition: "above" | "below"; price: number }
 */
export const POST: RequestHandler = async ({ request }) => {
  try {
    const body = await request.json();
    const { symbol, condition, price } = body;

    if (!symbol || !condition || price === undefined || price === null) {
      return json(
        { error: "Missing required fields: symbol, condition, price" },
        { status: 400 },
      );
    }

    if (condition !== "above" && condition !== "below") {
      return json(
        { error: 'Condition must be "above" or "below"' },
        { status: 400 },
      );
    }

    if (typeof price !== "number" || price <= 0) {
      return json(
        { error: "Price must be a positive number" },
        { status: 400 },
      );
    }

    const alert = await alertsService.createPriceAlert({
      symbol: String(symbol).toUpperCase(),
      condition,
      price,
    });

    return json({ alert }, { status: 201 });
  } catch (error) {
    console.error("[api/alerts] POST failed:", error);
    return json(
      { error: "Failed to create price alert" },
      { status: 500 },
    );
  }
};
