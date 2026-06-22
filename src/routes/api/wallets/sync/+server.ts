import { json } from "@sveltejs/kit";
import type { RequestHandler } from "@sveltejs/kit";
import { syncActiveWallets } from "../../../../server/services/walletSync";

export const POST: RequestHandler = async ({ request }) => {
  const body = (await request.json().catch(() => ({}))) as {
    lookbackDays?: number;
  };

  try {
    const results = await syncActiveWallets({
      lookbackDays: body.lookbackDays,
    });

    return json({ results });
  } catch (error) {
    return json(
      {
        error:
          error instanceof Error ? error.message : "Failed to sync wallets",
      },
      { status: 500 },
    );
  }
};
