import { json } from "@sveltejs/kit";
import type { RequestHandler } from "@sveltejs/kit";
import { walletsService } from "../../../server/services/wallets";

export const GET: RequestHandler = async () => {
  const wallets = await walletsService.listWallets();
  return json({ wallets });
};

export const POST: RequestHandler = async ({ request }) => {
  const body = (await request.json().catch(() => ({}))) as {
    address?: string;
    label?: string;
    tags?: string[];
    isActive?: boolean;
  };

  if (!body.address) {
    return json({ error: "Wallet address is required" }, { status: 400 });
  }

  try {
    const wallet = await walletsService.createWallet({
      address: body.address,
      label: body.label,
      tags: Array.isArray(body.tags) ? body.tags : [],
      isActive: body.isActive ?? true,
    });

    return json({ wallet }, { status: 201 });
  } catch (error) {
    return json(
      {
        error:
          error instanceof Error ? error.message : "Failed to create wallet",
      },
      { status: 400 },
    );
  }
};
