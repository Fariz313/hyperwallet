import mongoose, { Schema, type Model } from "mongoose";
import { getHyperwalletDbConfig, getCollectionName } from "../config";

export interface MarketSnapshotDoc extends mongoose.Document {
  symbol: string;
  name?: string;
  mid?: number;
  mark?: number;
  dayNtlVlm?: number;
  funding?: number;
  openInterest?: number;
  category?: string;
  assetClass?: string;
  isFavorite: boolean;
  raw?: Record<string, unknown>;
  timestamp: Date;
  createdAt: Date;
}

const marketSnapshotSchema = new Schema<MarketSnapshotDoc>(
  {
    symbol: {
      type: String,
      required: true,
      trim: true,
      uppercase: true,
    },
    name: String,
    mid: Number,
    mark: Number,
    dayNtlVlm: Number,
    funding: Number,
    openInterest: Number,
    category: String,
    assetClass: String,
    isFavorite: {
      type: Boolean,
      default: false,
    },
    raw: Schema.Types.Mixed,
    timestamp: {
      type: Date,
      required: true,
      index: true,
    },
  },
  {
    timestamps: true,
    collection: getCollectionName(getHyperwalletDbConfig(), "market_snapshots"),
  },
);

marketSnapshotSchema.index({ symbol: 1, timestamp: -1 });
marketSnapshotSchema.index({ isFavorite: 1, symbol: 1 });
marketSnapshotSchema.index({ dayNtlVlm: -1 });

export const MarketSnapshot =
  (mongoose.models.MarketSnapshot as Model<MarketSnapshotDoc>) ??
  mongoose.model<MarketSnapshotDoc>("MarketSnapshot", marketSnapshotSchema);
