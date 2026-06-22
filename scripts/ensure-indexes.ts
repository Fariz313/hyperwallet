import { connectDb, disconnectDb } from "../src/server/db";
import * as models from "../src/server/models";

const modelNames = [
  "TrackedWallet",
  "WalletSnapshot",
  "WalletFill",
  "WalletOrder",
  "WalletPosition",
  "MarketSnapshot",
  "PriceAlert",
  "WalletActivityAlert",
  "NotificationSubscription",
] as const;

async function ensureIndexes(): Promise<void> {
  await connectDb();

  const results = [];

  for (const modelName of modelNames) {
    const model = models[modelName];
    const indexes = await model.collection.listIndexes().toArray();

    results.push({
      collection: model.collection.name,
      indexes: indexes.map((index) => index.key),
    });
  }

  console.table(results);
  await disconnectDb();
}

ensureIndexes().catch(async (error) => {
  console.error("[phase2] Failed to ensure indexes", error);
  await disconnectDb();
  process.exit(1);
});
