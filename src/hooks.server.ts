import type { Handle } from "@sveltejs/kit";
import { connectDb, disconnectDb } from "./server/db";
import { TrackerWorker } from "./server/workers/trackerWorker";
import { AlertWorker } from "./server/workers/alertWorker";
import { configurePush } from "./server/services/pushNotifications";

let connected = false;
let trackerWorker: TrackerWorker | null = null;
let alertWorker: AlertWorker | null = null;

// Configure VAPID push notification keys from environment
function setupPushConfig(): void {
  const publicKey = process.env.VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  const email = process.env.PUSH_EMAIL ?? "admin@hyperwallet.local";

  if (publicKey && privateKey) {
    configurePush({ publicKey, privateKey, email });
    console.log("[hooks] Push notifications configured");
  } else {
    console.log(
      "[hooks] Push notifications not configured (set VAPID_PUBLIC_KEY and VAPID_PRIVATE_KEY in .env)",
    );
  }
}

process.once("SIGINT", () => {
  trackerWorker?.stop();
  alertWorker?.stop();
  void disconnectDb().finally(() => process.exit(0));
});

process.once("SIGTERM" as NodeJS.Signals, () => {
  trackerWorker?.stop();
  alertWorker?.stop();
  void disconnectDb().finally(() => process.exit(0));
});

export const handle: Handle = async ({ event, resolve }) => {
  if (!connected) {
    await connectDb();
    connected = true;

    // Configure push notifications
    setupPushConfig();

    // Start background wallet tracker worker (30s interval)
    trackerWorker = new TrackerWorker({ intervalMs: 30_000 });

    // Start background alert evaluation worker (60s interval)
    alertWorker = new AlertWorker({ intervalMs: 60_000 });

    console.log("[hooks] DB connected, tracker and alert workers started");
  }

  return resolve(event);
};
