import mongoose, { Schema, type Model } from "mongoose";
import { getHyperwalletDbConfig, getCollectionName } from "../config";

export type HyperliquidSyncStatus =
  | "idle"
  | "syncing"
  | "synced"
  | "warning"
  | "error";

export interface TrackedWalletDoc extends mongoose.Document {
  address: string;
  label?: string;
  tags: string[];
  isActive: boolean;
  lastSyncedAt?: Date;
  syncStatus: HyperliquidSyncStatus;
  lastError?: string;
  createdAt: Date;
  updatedAt: Date;
}

const trackedWalletSchema = new Schema<TrackedWalletDoc>(
  {
    address: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
      match: /^0x[a-f0-9]{40}$/,
    },
    label: {
      type: String,
      trim: true,
      maxlength: 80,
    },
    tags: {
      type: [String],
      default: [],
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    lastSyncedAt: Date,
    syncStatus: {
      type: String,
      enum: ["idle", "syncing", "synced", "warning", "error"],
      default: "idle",
    },
    lastError: String,
  },
  {
    timestamps: true,
    collection: getCollectionName(getHyperwalletDbConfig(), "tracked_wallets"),
  },
);

trackedWalletSchema.index({ address: 1 }, { unique: true });
trackedWalletSchema.index({ isActive: 1, lastSyncedAt: -1 });
trackedWalletSchema.index({ syncStatus: 1 });

export const TrackedWallet =
  (mongoose.models.TrackedWallet as Model<TrackedWalletDoc>) ??
  mongoose.model<TrackedWalletDoc>("TrackedWallet", trackedWalletSchema);
