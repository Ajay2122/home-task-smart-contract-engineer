import { formatUnits } from "viem";

export function formatAddress(address: string): string {
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

export function formatCurrency(value: bigint | string, decimals = 18): string {
  const formatted = formatUnits(BigInt(value), decimals);
  return `$${parseFloat(formatted).toFixed(2)}`;
}

export function formatDate(timestamp: number): string {
  return new Date(timestamp * 1000).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function formatTimeRemaining(timestamp: number): string {
  const now = Math.floor(Date.now() / 1000);
  const diff = timestamp - now;

  if (diff <= 0) return "Ended";

  const days = Math.floor(diff / 86400);
  const hours = Math.floor((diff % 86400) / 3600);

  if (days > 0) return `${days}d ${hours}h`;
  return `${hours}h`;
}
