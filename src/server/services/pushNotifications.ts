import webPush, { type PushSubscription, type SendResult } from "web-push";
import {
  NotificationSubscription,
  type NotificationSubscriptionDoc,
} from "../models/NotificationSubscription";
import {
  NotificationHistory,
  type NotificationHistoryDoc,
  type NotificationType,
} from "../models/NotificationHistory";

// ── Configuration ───────────────────────────────────────────────

export interface PushConfig {
  publicKey: string;
  privateKey: string;
  email: string;
}

let config: PushConfig | null = null;

export function configurePush(cfg: PushConfig): void {
  config = cfg;
  webPush.setVapidDetails(
    `mailto:${cfg.email}`,
    cfg.publicKey,
    cfg.privateKey,
  );
}

export function getVapidPublicKey(): string | null {
  return config?.publicKey ?? null;
}

export function isPushConfigured(): boolean {
  return config !== null;
}

// ── Subscription Management ─────────────────────────────────────

export async function subscribe(
  subscription: PushSubscription,
): Promise<NotificationSubscriptionDoc> {
  // Use upsert to avoid duplicates for the same endpoint
  const doc = await NotificationSubscription.findOneAndUpdate(
    { endpoint: subscription.endpoint },
    {
      $set: {
        p256dh: subscription.keys.p256dh,
        auth: subscription.keys.auth,
        endpoint: subscription.endpoint,
        vapidPublicKey: config?.publicKey,
      },
    },
    { upsert: true, new: true },
  ).lean();

  return doc;
}

export async function unsubscribe(
  endpoint: string,
): Promise<boolean> {
  const result = await NotificationSubscription.deleteOne({
    endpoint,
  });
  return result.deletedCount > 0;
}

export async function listSubscriptions(): Promise<
  NotificationSubscriptionDoc[]
> {
  return NotificationSubscription.find().lean();
}

// ── Send Notifications ──────────────────────────────────────────

export interface NotificationPayload {
  title: string;
  body: string;
  url?: string;
  type?: NotificationType;
}

export interface SendNotificationResult {
  sent: number;
  failed: number;
  errors: string[];
}

/**
 * Send a push notification to all subscribed clients.
 * Also persists the notification to the notification history collection.
 */
export async function sendPushNotification(
  payload: NotificationPayload,
): Promise<SendNotificationResult> {
  const result: SendNotificationResult = { sent: 0, failed: 0, errors: [] };

  if (!config) {
    result.errors.push("Push notifications not configured (missing VAPID keys)");
    return result;
  }

  // Persist to notification history
  await NotificationHistory.create({
    title: payload.title,
    body: payload.body,
    type: payload.type ?? "system",
    url: payload.url ?? "/",
  });

  // Send to all active subscriptions
  const subscriptions = await listSubscriptions();
  if (subscriptions.length === 0) return result;

  const pushPayload = JSON.stringify({
    title: payload.title,
    body: payload.body,
    url: payload.url ?? "/",
    type: payload.type ?? "system",
    createdAt: new Date().toISOString(),
  });

  const sendPromises = subscriptions.map(async (sub) => {
    try {
      await webPush.sendNotification(
        {
          endpoint: sub.endpoint,
          keys: { p256dh: sub.p256dh, auth: sub.auth },
        },
        pushPayload,
      );
      result.sent++;
    } catch (error: any) {
      // If subscription is expired/invalid, remove it
      if (
        error.statusCode === 410 ||
        error.statusCode === 404
      ) {
        await NotificationSubscription.deleteOne({
          endpoint: sub.endpoint,
        });
      }
      result.failed++;
      result.errors.push(
        `Failed to send to ${sub.endpoint.slice(0, 50)}...: ${error.message ?? String(error)}`,
      );
    }
  });

  await Promise.allSettled(sendPromises);
  return result;
}

/**
 * Send a notification triggered by a price alert or wallet activity alert.
 * Also marks the alert's lastTriggeredAt.
 */
export async function sendAlertNotification(
  payload: NotificationPayload,
): Promise<SendNotificationResult> {
  return sendPushNotification({
    ...payload,
    type: payload.type ?? "price_alert",
  });
}

// ── Notification History ────────────────────────────────────────

export async function getNotificationHistory(
  limit = 50,
  offset = 0,
): Promise<NotificationHistoryDoc[]> {
  return NotificationHistory.find()
    .sort({ createdAt: -1 })
    .skip(offset)
    .limit(limit)
    .lean();
}

export async function markNotificationRead(
  id: string,
): Promise<boolean> {
  const result = await NotificationHistory.findByIdAndUpdate(id, {
    $set: { isRead: true },
  });
  return result !== null;
}

export async function markAllNotificationsRead(): Promise<number> {
  const result = await NotificationHistory.updateMany(
    { isRead: false },
    { $set: { isRead: true } },
  );
  return result.modifiedCount;
}

export async function getUnreadNotificationCount(): Promise<number> {
  return NotificationHistory.countDocuments({ isRead: false });
}

// ── Exported singleton ──────────────────────────────────────────

export const pushNotificationService = {
  configurePush,
  getVapidPublicKey,
  isPushConfigured,
  subscribe,
  unsubscribe,
  sendPushNotification,
  sendAlertNotification,
  getNotificationHistory,
  markNotificationRead,
  markAllNotificationsRead,
  getUnreadNotificationCount,
};
