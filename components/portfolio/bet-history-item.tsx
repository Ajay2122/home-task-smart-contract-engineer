"use client";

import { Badge } from "@/components/ui/badge";
import { ExternalLink } from "lucide-react";
import Link from "next/link";
import { formatEther, formatUnits, zeroAddress } from "viem";
import { format } from "date-fns";
import { useMarketTokenAddress } from "@/lib/hooks/useMarkets";

interface BetHistoryItemProps {
  betId: bigint;
  marketId: bigint;
  amount: bigint;
  timestamp: number;
  transactionHash: string;
}

export function BetHistoryItem({
  betId,
  marketId,
  amount,
  timestamp,
  transactionHash,
}: BetHistoryItemProps) {
  const { data: tokenAddress } = useMarketTokenAddress(Number(marketId));

  // Determine token type and format amount
  const isEthMarket = !tokenAddress || tokenAddress === zeroAddress;

  const formattedAmount = isEthMarket
    ? `${parseFloat(formatEther(amount)).toFixed(4)} ETH`
    : `${parseFloat(formatUnits(amount, 18)).toFixed(2)} USDC`;

  return (
    <div className="flex items-center justify-between p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors">
      <div className="flex-1">
        <div className="flex items-center gap-3 mb-2">
          <Link href={`/markets/${marketId}`}>
            <Badge
              variant="outline"
              className="cursor-pointer hover:bg-primary hover:text-primary-foreground"
            >
              Market #{marketId.toString()}
            </Badge>
          </Link>
          <span className="text-xs text-muted-foreground">
            Bet ID: {betId.toString()}
          </span>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <span className="font-semibold text-primary">
            {formattedAmount}
          </span>
          <span className="text-muted-foreground">•</span>
          <span className="text-muted-foreground">
            {format(timestamp * 1000, "MMM d, yyyy 'at' h:mm a")}
          </span>
        </div>
      </div>
      <Link
        href={`https://sepolia.etherscan.io/tx/${transactionHash}`}
        target="_blank"
        rel="noopener noreferrer"
        className="flex-shrink-0"
      >
        <ExternalLink className="h-5 w-5 text-muted-foreground hover:text-primary transition-colors" />
      </Link>
    </div>
  );
}
