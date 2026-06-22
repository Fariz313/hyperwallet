import mongoose, { Schema, type Model } from "mongoose";
import { getHyperwalletDbConfig, getCollectionName } from "../config";

export type WalletActivityAlertType =
  | "fill_size"
  | "new_position"
  | "liquidation"
  | "wallet_label";

export interface WalletActivityAlertDoc extends mongoose.Document {
  wallet: string;
  alertType: WalletActivityAlertType;
  coin?: string;
  side?: "A" | "B";
  threshold?: number;
  isActive: boolean;
  lastTriggeredAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const walletActivityAlertSchema = new Schema<WalletActivityAlertDoc>(
  {
    wallet: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
      match: /^0x[a-f0-9]{40}$/,
    },
    alertType: {
      type: String,
      required: true,
      enum: ["fill_size", "new_position", "liquidation", "wallet_label"],
    },
    coin: {
      type: String,
      trim: true,
    },
    side: {
      type: String,
      enum: ["A", "B"],
    },
    threshold: Number,
    isActive: {
      type: Boolean,
      default: true,
    },
    lastTriggeredAt: Date,
  },
  {
    timestamps: true,
    collection: getCollectionName(
      getHyperwalletDbConfig(),
      "wallet_activity_alerts",
    ),
  },
);

walletActivityAlertSchema.index({ wallet: 1, alertType: 1, isActive: 1 });
walletActivityAlertSchema.index({ alertType: 1, lastTriggeredAt: -1 });

export const WalletActivityAlert =
  (mongoose.models.WalletActivityAlert as Model<WalletActivityAlertDoc>) ??
  mongoose.model<WalletActivityAlertDoc>(
    "WalletActivityAlert",
    walletActivityAlertSchema,
  );
