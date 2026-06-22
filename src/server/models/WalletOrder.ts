import mongoose, { Schema, type Model } from "mongoose";
import { getHyperwalletDbConfig, getCollectionName } from "../config";

export interface WalletOrderDoc extends mongoose.Document {
  user: string;
  oid: string;
  coin: string;
  side: string;
  size: number;
  limitPx?: number;
  triggerPx?: number;
  orderType: string;
  status: string;
  timestamp: Date;
  statusTimestamp?: Date;
  raw?: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

const walletOrderSchema = new Schema<WalletOrderDoc>(
  {
    user: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
      match: /^0x[a-f0-9]{40}$/,
    },
    oid: {
      type: String,
      required: true,
    },
    coin: {
      type: String,
      required: true,
      trim: true,
    },
    side: {
      type: String,
      required: true,
      trim: true,
    },
    size: {
      type: Number,
      required: true,
      default: 0,
    },
    limitPx: Number,
    triggerPx: Number,
    orderType: {
      type: String,
      required: true,
      trim: true,
    },
    status: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    timestamp: {
      type: Date,
      required: true,
      index: true,
    },
    statusTimestamp: Date,
    raw: Schema.Types.Mixed,
  },
  {
    timestamps: true,
    collection: getCollectionName(getHyperwalletDbConfig(), "wallet_orders"),
  },
);

walletOrderSchema.index({ user: 1, timestamp: -1 });
walletOrderSchema.index({ user: 1, oid: 1 }, { unique: true });
walletOrderSchema.index({ status: 1, timestamp: -1 });

export const WalletOrder =
  (mongoose.models.WalletOrder as Model<WalletOrderDoc>) ??
  mongoose.model<WalletOrderDoc>("WalletOrder", walletOrderSchema);
