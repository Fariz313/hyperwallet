import mongoose, { Schema, type Model } from "mongoose";
import { getHyperwalletDbConfig, getCollectionName } from "../config";

export type PriceAlertCondition = "above" | "below";

export interface PriceAlertDoc extends mongoose.Document {
  symbol: string;
  condition: PriceAlertCondition;
  price: number;
  isActive: boolean;
  lastTriggeredAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const priceAlertSchema = new Schema<PriceAlertDoc>(
  {
    symbol: {
      type: String,
      required: true,
      trim: true,
      uppercase: true,
    },
    condition: {
      type: String,
      required: true,
      enum: ["above", "below"],
    },
    price: {
      type: Number,
      required: true,
      min: 0,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    lastTriggeredAt: Date,
  },
  {
    timestamps: true,
    collection: getCollectionName(getHyperwalletDbConfig(), "price_alerts"),
  },
);

priceAlertSchema.index({ symbol: 1, condition: 1, price: 1 });
priceAlertSchema.index({ isActive: 1, lastTriggeredAt: -1 });

export const PriceAlert =
  (mongoose.models.PriceAlert as Model<PriceAlertDoc>) ??
  mongoose.model<PriceAlertDoc>("PriceAlert", priceAlertSchema);
