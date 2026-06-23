import { json, type RequestHandler } from "@sveltejs/kit";
import { pushNotificationService } from "../../../../server/services/pushNotifications";

/**
 * GET /api/notifications/vapid-key
 * Returns the VAPID public key for push notification subscription.
 */
export const GET: RequestHandler = async () => {
  const publicKey = pushNotificationService.getVapidPublicKey();

  if (!publicKey) {
    return json(
      { error: "Push notifications not configured" },
      { status: 501 },
    );
  }

  return json({ publicKey });
};
