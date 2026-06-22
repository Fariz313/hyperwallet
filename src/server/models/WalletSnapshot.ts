import mongoose, { Schema, type Model } from "mongoose";
import { getHyperwalletDbConfig, getCollectionName } from "../config";

export interface WalletSnapshotMarginSummary {
  accountValue: number;
  totalMarginUsed: number;
  totalPositionSzi: number;
  openPositionCount: number;
}

export interface WalletSnapshotDoc extends mongoose.Document {
  user: string;
  accountValue: number;
  totalMarginUsed: number;
  totalPositionSzi: number;
  openPositionCount: number;
  marginSummary: WalletSnapshotMarginSummary;
  liquidationRisk?: number;
  raw?: Record<string, unknown>;
  timestamp: Date;
  createdAt: Date;
}

const walletSnapshotSchema = new Schema<WalletSnapshotDoc>(
  {
    user: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
      match: /^0x[a-f0-9]{40}$/,
    },
    accountValue: {
      type: Number,
      required: true,
      default: 0,
    },
    totalMarginUsed: {
      type: Number,
      required: true,
      default: 0,
    },
    totalPositionSzi: {
      type: Number,
      required: true,
      default: 0,
    },
    openPositionCount: {
      type: Number,
      required: true,
      default: 0,
    },
    marginSummary: {
      accountValue: {
        type: Number,
        default: 0,
      },
      totalMarginUsed: {
        type: Number,
        default: 0,
      },
      totalPositionSzi: {
        type: Number,
        default: 0,
      },
      openPositionCount: {
        type: Number,
        default: 0,
      },
    },
    liquidationRisk: Number,
    raw: Schema.Types.Mixed,
    timestamp: {
      type: Date,
      required: true,
      index: true,
    },
  },
  {
    timestamps: true,
    collection: getCollectionName(getHyperwalletDbConfig(), "wallet_snapshots"),
  },
);

walletSnapshotSchema.index({ user: 1, timestamp: -1 });
walletSnapshotSchema.index({ user: 1, accountValue: -1 });

export const WalletSnapshot =
  (mongoose.models.WalletSnapshot as Model<WalletSnapshotDoc>) ??
  mongoose.model<WalletSnapshotDoc>("WalletSnapshot", walletSnapshotSchema);
