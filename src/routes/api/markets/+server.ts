import { json } from "@sveltejs/kit";
import type { RequestHandler } from "@sveltejs/kit";
import { marketsService } from "../../../server/services/markets";

export const GET: RequestHandler = async ({ url }) => {
  try {
    const markets = await marketsService.listMarkets({
      search: url.searchParams.get("search") ?? undefined,
      sort: url.searchParams.get("sort") ?? undefined,
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

export const PATCH: RequestHandler = async ({ request }) => {
  try {
    const body = (await request.json()) as {
      symbol: string;
      isFavorite: boolean;
    };

    if (!body.symbol || typeof body.symbol !== "string") {
      return json({ error: "symbol is required" }, { status: 400 });
    }

    const market = await marketsService.setFavorite(
      body.symbol,
      body.isFavorite === true,
    );

    return json({ market });
  } catch (error) {
    return json(
      {
        error:
          error instanceof Error ? error.message : "Failed to toggle favorite",
      },
      { status: 500 },
    );
  }
};
