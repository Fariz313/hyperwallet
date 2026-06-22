import { connectDb, disconnectDb } from "../src/server/db";
import { syncActiveWallets } from "../src/server/services/walletSync";

async function syncWallets(): Promise<void> {
  await connectDb();

  const results = await syncActiveWallets();

  console.log(`[phase4] Synced ${results.length} active wallet(s).`);

  for (const result of results) {
    console.log(
      `[phase4] ${result.address}: snapshots=${result.snapshotCount}, positions=${result.positionCount}, fills=${result.fillCount}, orders=${result.orderCount}`,
    );
  }

  await disconnectDb();
}

syncWallets().catch(async (error) => {
  console.error("[phase4] Failed to sync wallets", error);
  await disconnectDb();
  process.exit(1);
});
