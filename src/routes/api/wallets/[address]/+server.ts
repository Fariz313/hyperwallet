import { json } from "@sveltejs/kit";
import type { RequestHandler } from "@sveltejs/kit";
import { getWalletDetail } from "../../../../server/services/walletDetails";
import { walletsService } from "../../../../server/services/wallets";

function getAddress(params: { address?: string }): string {
  if (!params.address) {
    throw new Error("Wallet address is required");
  }

  return params.address;
}

export const GET: RequestHandler = async ({ params }) => {
  try {
    const wallet = await getWalletDetail(getAddress(params));
    return json({ wallet });
  } catch (error) {
    return json(
      { error: error instanceof Error ? error.message : "Wallet not found" },
      { status: 404 },
    );
  }
};

export const PATCH: RequestHandler = async ({ params, request }) => {
  const body = (await request.json().catch(() => ({}))) as {
    label?: string;
    tags?: string[];
    isActive?: boolean;
  };

  try {
    const wallet = await walletsService.updateWallet(getAddress(params), {
      label: body.label,
      tags: Array.isArray(body.tags) ? body.tags : [],
      isActive: body.isActive,
    });

    return json({ wallet });
  } catch (error) {
    return json(
      {
        error:
          error instanceof Error ? error.message : "Failed to update wallet",
      },
      { status: 400 },
    );
  }
};

export const DELETE: RequestHandler = async ({ params }) => {
  try {
    const result = await walletsService.deleteWallet(getAddress(params));

    if (!result.deleted) {
      return json({ error: "Wallet not found" }, { status: 404 });
    }

    return json({ result });
  } catch (error) {
    return json(
      {
        error:
          error instanceof Error ? error.message : "Failed to delete wallet",
      },
      { status: 400 },
    );
  }
};
