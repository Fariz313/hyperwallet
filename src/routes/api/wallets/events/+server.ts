import { json } from "@sveltejs/kit";
import type { RequestHandler } from "@sveltejs/kit";
import { walletEvents } from "../../../../server/events/walletEvents";

export const GET: RequestHandler = async ({ url }) => {
  const lastAt = url.searchParams.get("lastAt");
  const timeoutMs = Number(url.searchParams.get("timeoutMs") ?? 25_000);

  if (lastAt) {
    const event = await walletEvents.waitForEventAfter(lastAt, timeoutMs);
    return json({ event });
  }

  return json({ event: walletEvents.getLatest() });
};
