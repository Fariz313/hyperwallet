import { json, type RequestHandler } from "@sveltejs/kit";
import { alertsService } from "../../../../server/services/alerts";

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
    console.error("[api/alerts/price] POST failed:", error);
    return json(
      { error: "Failed to create price alert" },
      { status: 500 },
    );
  }
};
