import type { Handle } from "@sveltejs/kit";
import { connectDb, disconnectDb } from "./server/db";
import { TrackerWorker } from "./server/workers/trackerWorker";

let connected = false;
let trackerWorker: TrackerWorker | null = null;

process.once("SIGINT", () => {
  trackerWorker?.stop();
  void disconnectDb().finally(() => process.exit(0));
});

process.once("SIGTERM" as NodeJS.Signals, () => {
  trackerWorker?.stop();
  void disconnectDb().finally(() => process.exit(0));
});

export const handle: Handle = async ({ event, resolve }) => {
  if (!connected) {
    await connectDb();
    connected = true;

    // Start background wallet tracker worker (30s interval)
    trackerWorker = new TrackerWorker({ intervalMs: 30_000 });
    console.log("[hooks] DB connected, tracker worker started");
  }

  return resolve(event);
};
