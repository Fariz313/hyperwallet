import mongoose, { Schema, type Model } from "mongoose";
import { getHyperwalletDbConfig, getCollectionName } from "../config";

export interface NotificationSubscriptionDoc extends mongoose.Document {
  endpoint: string;
  p256dh: string;
  auth: string;
  vapidPublicKey?: string;
  userId?: string;
  createdAt: Date;
  updatedAt: Date;
}

const notificationSubscriptionSchema = new Schema<NotificationSubscriptionDoc>(
  {
    endpoint: {
      type: String,
      required: true,
      trim: true,
    },
    p256dh: {
      type: String,
      required: true,
      trim: true,
    },
    auth: {
      type: String,
      required: true,
      trim: true,
    },
    vapidPublicKey: String,
    userId: String,
  },
  {
    timestamps: true,
    collection: getCollectionName(
      getHyperwalletDbConfig(),
      "notification_subscriptions",
    ),
  },
);

notificationSubscriptionSchema.index({ endpoint: 1 }, { unique: true });
notificationSubscriptionSchema.index({ userId: 1 });

export const NotificationSubscription =
  (mongoose.models
    .NotificationSubscription as Model<NotificationSubscriptionDoc>) ??
  mongoose.model<NotificationSubscriptionDoc>(
    "NotificationSubscription",
    notificationSubscriptionSchema,
  );
