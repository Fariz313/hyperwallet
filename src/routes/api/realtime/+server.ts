import type { RequestHandler } from "@sveltejs/kit";
import { walletEvents } from "../../../server/events/walletEvents";

/**
 * Server-Sent Events endpoint for real-time wallet sync events.
 *
 * Events:
 *   event: wallet:synced
 *   data: {"address":"0x...","syncedAt":"...","snapshotCount":1,"positionCount":2,"fillCount":5,"orderCount":3}
 *
 *   event: wallet:error
 *   data: {"address":"0x...","error":"...","at":"..."}
 *
 * The client should reconnect automatically. The connection is kept open
 * for up to 30 seconds of inactivity before closing.
 */
export const GET: RequestHandler = async ({ request }) => {
  // Verify it's an EventSource request if possible
  const accept = request.headers.get("accept") ?? "";
  const isEventSource = accept.includes("text/event-stream");

  const stream = new ReadableStream({
    start(controller) {
      // Send initial comment to confirm connection
      controller.enqueue(": connected\n\n");

      // Send latest event immediately if available
      const latest = walletEvents.getLatest();
      if (latest) {
        controller.enqueue(
          `event: ${latest.type}\ndata: ${JSON.stringify(latest.payload)}\n\n`,
        );
      }

      // Subscribe to future events
      const unsubscribe = walletEvents.subscribe((event) => {
        try {
          controller.enqueue(
            `event: ${event.type}\ndata: ${JSON.stringify(event.payload)}\n\n`,
          );
        } catch {
          // Stream may have closed; unsubscribe gracefully
          unsubscribe();
        }
      });

      // Keep-alive ping every 15 seconds to prevent proxy timeouts
      const keepAlive = setInterval(() => {
        try {
          controller.enqueue(": keepalive\n\n");
        } catch {
          clearInterval(keepAlive);
          unsubscribe();
        }
      }, 15_000);

      // Auto-close after 5 minutes of inactivity (browser reconnects anyway)
      const closeTimeout = setTimeout(() => {
        clearInterval(keepAlive);
        unsubscribe();

        try {
          controller.close();
        } catch {
          // Already closed
        }
      }, 300_000);

      // Clean up on client disconnect
      request.signal.addEventListener("abort", () => {
        clearInterval(keepAlive);
        clearTimeout(closeTimeout);
        unsubscribe();

        try {
          controller.close();
        } catch {
          // Already closed
        }
      });
    },
  });

  return new Response(stream, {
    headers: {
      "content-type": "text/event-stream",
      "cache-control": "no-cache, no-store, must-revalidate",
      connection: "keep-alive",
      "x-accel-buffering": "no",
    },
  });
};
