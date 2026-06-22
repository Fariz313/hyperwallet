import { connectDb, disconnectDb } from "../src/server/db";
import { TrackedWallet } from "../src/server/models/TrackedWallet";

const sampleWallets = [
  {
    address: "0x0000000000000000000000000000000000000001",
    label: "Example wallet 1",
    tags: ["sample", "phase2"],
    isActive: true,
    syncStatus: "idle" as const,
  },
  {
    address: "0x0000000000000000000000000000000000000002",
    label: "Example wallet 2",
    tags: ["sample", "phase2"],
    isActive: true,
    syncStatus: "idle" as const,
  },
];

async function seedWallets(): Promise<void> {
  await connectDb();

  for (const wallet of sampleWallets) {
    await TrackedWallet.updateOne(
      { address: wallet.address },
      {
        $set: {
          label: wallet.label,
          tags: wallet.tags,
          isActive: wallet.isActive,
          syncStatus: wallet.syncStatus,
        },
        $setOnInsert: {
          createdAt: new Date(),
        },
      },
      { upsert: true },
    );
  }

  console.log(`[phase2] Seeded ${sampleWallets.length} tracked wallets.`);
  await disconnectDb();
}

seedWallets().catch(async (error) => {
  console.error("[phase2] Failed to seed wallets", error);
  await disconnectDb();
  process.exit(1);
});
