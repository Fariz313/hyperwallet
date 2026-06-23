import { json, type RequestHandler } from "@sveltejs/kit";
import { pushNotificationService } from "../../../../server/services/pushNotifications";

/**
 * POST /api/notifications/subscribe
 * Subscribe to push notifications.
 * Body: { endpoint: string; keys: { p256dh: string; auth: string } }
 */
export const POST: RequestHandler = async ({ request }) => {
  try {
    const body = await request.json();
    const { endpoint, keys } = body;

    if (!endpoint || !keys?.p256dh || !keys?.auth) {
      return json(
        {
          error:
            "Missing required fields: endpoint, keys.p256dh, keys.auth",
        },
        { status: 400 },
      );
    }

    const subscription = await pushNotificationService.subscribe({
      endpoint,
      keys: { p256dh: keys.p256dh, auth: keys.auth },
    });

    return json({ subscription }, { status: 201 });
  } catch (error) {
    console.error("[api/notifications/subscribe] POST failed:", error);
    return json(
      { error: "Failed to subscribe" },
      { status: 500 },
    );
  }
};

/**
 * DELETE /api/notifications/subscribe
 * Unsubscribe from push notifications.
 * Body: { endpoint: string }
 */
export const DELETE: RequestHandler = async ({ request }) => {
  try {
    const body = await request.json();
    const { endpoint } = body;

    if (!endpoint) {
      return json(
        { error: "Missing required field: endpoint" },
        { status: 400 },
      );
    }

    const deleted = await pushNotificationService.unsubscribe(endpoint);

    return json({ deleted });
  } catch (error) {
    console.error("[api/notifications/subscribe] DELETE failed:", error);
    return json(
      { error: "Failed to unsubscribe" },
      { status: 500 },
    );
  }
};
