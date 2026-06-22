import type { Handle } from "@sveltejs/kit";
import { connectDb, disconnectDb } from "./server/db";

let connected = false;

process.once("SIGINT", () => {
  void disconnectDb().finally(() => process.exit(0));
});

process.once("SIGTERM", () => {
  void disconnectDb().finally(() => process.exit(0));
});

export const handle: Handle = async ({ event, resolve }) => {
  if (!connected) {
    await connectDb();
    connected = true;
  }

  return resolve(event);
};
