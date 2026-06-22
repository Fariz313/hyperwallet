import { json } from "@sveltejs/kit";
import type { RequestHandler } from "@sveltejs/kit";
import { syncWallet } from "../../../../../server/services/walletSync";

function getAddress(params: { address?: string }): string {
  if (!params.address) {
    throw new Error("Wallet address is required");
  }

  return params.address;
}

export const POST: RequestHandler = async ({ params, request }) => {
  const body = (await request.json().catch(() => ({}))) as {
    lookbackDays?: number;
  };

  try {
    const result = await syncWallet(getAddress(params), {
      lookbackDays: body.lookbackDays,
    });

    return json({ result });
  } catch (error) {
    return json(
      {
        error: error instanceof Error ? error.message : "Failed to sync wallet",
      },
      { status: 500 },
    );
  }
};
