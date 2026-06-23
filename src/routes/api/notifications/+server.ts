import { json, type RequestHandler } from "@sveltejs/kit";
import { pushNotificationService } from "../../../server/services/pushNotifications";

/**
 * GET /api/notifications?limit=50&offset=0
 * Returns notification history.
 */
export const GET: RequestHandler = async ({ url }) => {
  try {
    const limit = Math.min(Math.max(Number(url.searchParams.get("limit")) || 50, 1), 200);
    const offset = Math.max(Number(url.searchParams.get("offset")) || 0, 0);

    const [notifications, unreadCount] = await Promise.all([
      pushNotificationService.getNotificationHistory(limit, offset),
      pushNotificationService.getUnreadNotificationCount(),
    ]);

    return json({
      notifications,
      unreadCount,
      limit,
      offset,
    });
  } catch (error) {
    console.error("[api/notifications] GET failed:", error);
    return json(
      { error: "Failed to load notifications" },
      { status: 500 },
    );
  }
};

/**
 * PATCH /api/notifications
 * Mark notifications as read.
 * Body: { id?: string; all?: boolean }
 * - If `id` is provided, marks that single notification as read.
 * - If `all` is true, marks all unread notifications as read.
 */
export const PATCH: RequestHandler = async ({ request }) => {
  try {
    const body = await request.json();
    const { id, all } = body;

    if (all === true) {
      const count = await pushNotificationService.markAllNotificationsRead();
      return json({ markedRead: count });
    }

    if (id) {
      const marked = await pushNotificationService.markNotificationRead(id);
      return json({ markedRead: marked ? 1 : 0 });
    }

    return json(
      { error: "Provide either `id` (string) or `all` (true)" },
      { status: 400 },
    );
  } catch (error) {
    console.error("[api/notifications] PATCH failed:", error);
    return json(
      { error: "Failed to update notifications" },
      { status: 500 },
    );
  }
};
