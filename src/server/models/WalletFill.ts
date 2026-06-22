import mongoose, { Schema, type Model } from "mongoose";
import { getHyperwalletDbConfig, getCollectionName } from "../config";

export interface WalletFillDoc extends mongoose.Document {
  user: string;
  tid: string;
  coin: string;
  side: string;
  size: number;
  price: number;
  fee: number;
  feeToken: string;
  hash: string;
  time: Date;
  closedPnl?: number;
  liquidation?: boolean;
  raw?: Record<string, unknown>;
  createdAt: Date;
}

const walletFillSchema = new Schema<WalletFillDoc>(
  {
    user: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
      match: /^0x[a-f0-9]{40}$/,
    },
    tid: {
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
    price: {
      type: Number,
      required: true,
      default: 0,
    },
    fee: {
      type: Number,
      required: true,
      default: 0,
    },
    feeToken: {
      type: String,
      required: true,
      default: "",
    },
    hash: {
      type: String,
      required: true,
      trim: true,
    },
    time: {
      type: Date,
      required: true,
      index: true,
    },
    closedPnl: Number,
    liquidation: Boolean,
    raw: Schema.Types.Mixed,
  },
  {
    timestamps: true,
    collection: getCollectionName(getHyperwalletDbConfig(), "wallet_fills"),
  },
);

walletFillSchema.index({ user: 1, time: -1 });
walletFillSchema.index({ user: 1, tid: 1 }, { unique: true });
walletFillSchema.index({ coin: 1, time: -1 });

export const WalletFill =
  (mongoose.models.WalletFill as Model<WalletFillDoc>) ??
  mongoose.model<WalletFillDoc>("WalletFill", walletFillSchema);
