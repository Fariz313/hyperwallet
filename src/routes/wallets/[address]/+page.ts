import { getWalletDetail } from "../../../server/services/walletDetails";
import type { PageLoad } from "./$types";

export const ssr = true;

export const load: PageLoad = async ({ params }) => ({
  wallet: await getWalletDetail(params.address),
});
