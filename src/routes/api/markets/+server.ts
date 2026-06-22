import { json } from "@sveltejs/kit";
import type { RequestHandler } from "@sveltejs/kit";
import { marketsService } from "../../../server/services/markets";

export const GET: RequestHandler = async ({ url }) => {
  try {
    const markets = await marketsService.listMarkets({
      search: url.searchParams.get("search") ?? undefined,
    });

    return json({ markets });
  } catch (error) {
    return json(
      {
        error:
          error instanceof Error ? error.message : "Failed to load markets",
      },
      { status: 500 },
    );
  }
};
