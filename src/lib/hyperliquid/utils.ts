export function normalizeAddress(address: string): string {
  const normalized = address.trim().toLowerCase();

  if (!/^0x[a-f0-9]{40}$/.test(normalized)) {
    throw new Error("Invalid Hyperliquid wallet address");
  }

  return normalized;
}

export function normalizeSymbol(symbol: string): string {
  return symbol.trim().toUpperCase();
}

export function formatNumber(
  value: number | string | null | undefined,
  decimals = 2,
): string {
  if (value === null || value === undefined) {
    return "-";
  }

  const numeric = Number(value);

  if (!Number.isFinite(numeric)) {
    return "-";
  }

  return new Intl.NumberFormat("en-US", {
    maximumFractionDigits: decimals,
    minimumFractionDigits: 0,
  }).format(numeric);
}

export function formatUsd(value: number | string | null | undefined): string {
  if (value === null || value === undefined) {
    return "-";
  }

  const numeric = Number(value);

  if (!Number.isFinite(numeric)) {
    return "-";
  }

  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2,
  }).format(numeric);
}

export function parsePositiveNumber(
  value: string | null | undefined,
): number | null {
  if (value === null || value === undefined) {
    return null;
  }

  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : null;
}
