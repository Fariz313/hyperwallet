import mongoose, { Schema, type Model } from "mongoose";
import { getHyperwalletDbConfig, getCollectionName } from "../config";

export type NotificationType =
  | "price_alert"
  | "wallet_activity"
  | "system"
  | "test";

export interface NotificationHistoryDoc extends mongoose.Document {
  title: string;
  body: string;
  type: NotificationType;
  url?: string;
  /** Reference — e.g. price alert ID, wallet address */
  ref?: string;
  isRead: boolean;
  createdAt: Date;
}

const notificationHistorySchema = new Schema<NotificationHistoryDoc>(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    body: {
      type: String,
      required: true,
      trim: true,
    },
    type: {
      type: String,
      required: true,
      enum: ["price_alert", "wallet_activity", "system", "test"],
    },
    url: {
      type: String,
      trim: true,
    },
    ref: {
      type: String,
      trim: true,
    },
    isRead: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
    collection: getCollectionName(
      getHyperwalletDbConfig(),
      "notification_history",
    ),
  },
);

notificationHistorySchema.index({ createdAt: -1 });
notificationHistorySchema.index({ type: 1, createdAt: -1 });
notificationHistorySchema.index({ isRead: 1 });

export const NotificationHistory =
  (mongoose.models.NotificationHistory as Model<NotificationHistoryDoc>) ??
  mongoose.model<NotificationHistoryDoc>(
    "NotificationHistory",
    notificationHistorySchema,
  );
