import { getWalletDetail } from "../../../server/services/walletDetails";
import type { PageServerLoad } from "./$types";

export const load: PageServerLoad = async ({ params }) => ({
  wallet: await getWalletDetail(params.address),
});
