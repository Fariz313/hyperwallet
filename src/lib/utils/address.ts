export function isLikelyHyperliquidAddress(address: string): boolean {
  return /^0x[a-fA-F0-9]{40}$/.test(address.trim());
}

export function formatAddress(address: string): string {
  const normalized = address.trim();
  if (normalized.length <= 12) return normalized;
  return `${normalized.slice(0, 6)}…${normalized.slice(-4)}`;
}
