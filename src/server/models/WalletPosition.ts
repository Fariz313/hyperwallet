import mongoose, { Schema, type Model } from "mongoose";
import { getHyperwalletDbConfig, getCollectionName } from "../config";

export interface WalletPositionDoc extends mongoose.Document {
  user: string;
  coin: string;
  szi: number;
  side: string;
  entryPx?: number;
  markPx?: number;
  unrealizedPnl?: number;
  leverage?: number;
  liquidationPx?: number;
  raw?: Record<string, unknown>;
  updatedAt: Date;
  createdAt: Date;
}

const walletPositionSchema = new Schema<WalletPositionDoc>(
  {
    user: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
      match: /^0x[a-f0-9]{40}$/,
    },
    coin: {
      type: String,
      required: true,
      trim: true,
    },
    szi: {
      type: Number,
      required: true,
      default: 0,
    },
    side: {
      type: String,
      required: true,
      trim: true,
    },
    entryPx: Number,
    markPx: Number,
    unrealizedPnl: Number,
    leverage: Number,
    liquidationPx: Number,
    raw: Schema.Types.Mixed,
    updatedAt: {
      type: Date,
      required: true,
      index: true,
    },
  },
  {
    timestamps: true,
    collection: getCollectionName(getHyperwalletDbConfig(), "wallet_positions"),
  },
);

walletPositionSchema.index({ user: 1, coin: 1 }, { unique: true });
walletPositionSchema.index({ coin: 1, szi: -1 });

export const WalletPosition =
  (mongoose.models.WalletPosition as Model<WalletPositionDoc>) ??
  mongoose.model<WalletPositionDoc>("WalletPosition", walletPositionSchema);
