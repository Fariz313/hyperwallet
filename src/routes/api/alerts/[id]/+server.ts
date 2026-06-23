import { json, type RequestHandler } from "@sveltejs/kit";
import { alertsService } from "../../../../server/services/alerts";

/**
 * DELETE /api/alerts/:id
 * Deletes a price or wallet activity alert by ID.
 * Query param: type=price|activity (default: price)
 */
export const DELETE: RequestHandler = async ({ params, url }) => {
  try {
    const id = params.id;
    if (!id) {
      return json({ error: "Missing alert ID" }, { status: 400 });
    }

    const type = url.searchParams.get("type") ?? "price";
    let deleted = false;

    if (type === "price") {
      deleted = await alertsService.deletePriceAlert(id);
    } else if (type === "activity") {
      deleted = await alertsService.deleteWalletActivityAlert(id);
    } else {
      return json(
        { error: 'Invalid type. Must be "price" or "activity"' },
        { status: 400 },
      );
    }

    if (!deleted) {
      return json({ error: "Alert not found" }, { status: 404 });
    }

    return json({ deleted: true });
  } catch (error) {
    console.error("[api/alerts/:id] DELETE failed:", error);
    return json(
      { error: "Failed to delete alert" },
      { status: 500 },
    );
  }
};

/**
 * PATCH /api/alerts/:id
 * Toggles the active state of an alert.
 * Body: { isActive: boolean; type?: "price"|"activity" }
 */
export const PATCH: RequestHandler = async ({ params, request }) => {
  try {
    const id = params.id;
    if (!id) {
      return json({ error: "Missing alert ID" }, { status: 400 });
    }

    const body = await request.json();
    const { isActive, type: alertType } = body;

    if (isActive === undefined || isActive === null) {
      return json(
        { error: "Missing required field: isActive" },
        { status: 400 },
      );
    }

    const type = alertType ?? "price";
    let updated = null;

    if (type === "price") {
      updated = await alertsService.togglePriceAlert(id, Boolean(isActive));
    } else if (type === "activity") {
      updated = await alertsService.toggleWalletActivityAlert(
        id,
        Boolean(isActive),
      );
    } else {
      return json(
        { error: 'Invalid type. Must be "price" or "activity"' },
        { status: 400 },
      );
    }

    if (!updated) {
      return json({ error: "Alert not found" }, { status: 404 });
    }

    return json({ alert: updated });
  } catch (error) {
    console.error("[api/alerts/:id] PATCH failed:", error);
    return json(
      { error: "Failed to update alert" },
      { status: 500 },
    );
  }
};
