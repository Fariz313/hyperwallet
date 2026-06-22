import { json } from "@sveltejs/kit";
import type { RequestHandler } from "@sveltejs/kit";
import { marketsService } from "../../../../server/services/markets";

export const POST: RequestHandler = async ({ request }) => {
  const body = (await request.json().catch(() => ({}))) as {
    force?: boolean;
    maxAgeMs?: number;
  };

  try {
    const result = await marketsService.syncMarkets({
      maxAgeMs: body.force ? 0 : body.maxAgeMs,
    });

    return json({ result });
  } catch (error) {
    return json(
      {
        error:
          error instanceof Error ? error.message : "Failed to sync markets",
      },
      { status: 500 },
    );
  }
};
