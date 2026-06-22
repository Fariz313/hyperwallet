export interface HyperwalletNotificationPayload {
  title: string;
  body: string;
  url?: string;
  type?: "wallet" | "market" | "alert" | "leaderboard" | "system";
  createdAt?: string;
}
