"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatDate } from "@/lib/utils/format";
import { useMarket, useMarketTokenAddress } from "@/lib/hooks/useMarkets";
import { useClaimWinnings } from "@/lib/hooks/useBet";
import { TrendingUp, Clock, DollarSign } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { ListPositionDialog } from "./list-position-dialog";
import { formatEther, formatUnits, zeroAddress } from "viem";

interface PositionCardProps {
  betId: number;
  betData: unknown;
}

export function PositionCard({ betId, betData }: PositionCardProps) {
  const [isListDialogOpen, setIsListDialogOpen] = useState(false);
  const { claimWinnings, isPending, isConfirming } = useClaimWinnings();

  // Parse bet data
  const [, , marketId, outcomeIndex, amount, shares, timestamp, claimed] = (betData as readonly [bigint, string, bigint, bigint, bigint, bigint, bigint, boolean]) || [];

  const { data: market } = useMarket(Number(marketId));
  const { data: tokenAddress } = useMarketTokenAddress(Number(marketId));

  if (!market || !betData) return null;

  const [, question, , outcomes, , , , status, , winningOutcome] = market as readonly [bigint, string, string, readonly string[], bigint, string, string, number, bigint, bigint];

  // Determine token symbol and format amount (same as market-card.tsx)
  const isEthMarket = !tokenAddress || tokenAddress === zeroAddress;

  const formattedAmount = isEthMarket
    ? `${parseFloat(formatEther(amount)).toFixed(4)} ETH`
    : `${parseFloat(formatUnits(amount, 18)).toFixed(2)} USDC`;

  const formattedShares = isEthMarket
    ? formatEther(shares)
    : parseFloat(formatUnits(shares, 18)).toFixed(2);

  const handleClaimWinnings = () => {
    claimWinnings(betId);
    toast.success("Claiming winnings...");
  };

  const getStatusBadge = () => {
    switch (status) {
      case 0: return <Badge variant="default">Active</Badge>;
      case 1: return <Badge variant="secondary">Closed</Badge>;
      case 2: return <Badge variant="outline">Resolved</Badge>;
      case 3: return <Badge variant="destructive">Cancelled</Badge>;
      default: return null;
    }
  };

  const isWinner = status === 2 && Number(outcomeIndex) === Number(winningOutcome);
  const isLoser = status === 2 && Number(outcomeIndex) !== Number(winningOutcome);
  const canClaim = isWinner && !claimed; // Winner and not claimed yet
  const isActive = status === 0; // Market is still open

  return (
    <>
      <Card className="hover:shadow-lg transition-shadow">
        <CardHeader>
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <CardTitle className="text-lg mb-2">{question}</CardTitle>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <span>Bet on:</span>
                <Badge variant="secondary">{outcomes[Number(outcomeIndex)]}</Badge>
              </div>
            </div>
            {getStatusBadge()}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                <DollarSign className="h-4 w-4" />
                <span>Bet Amount</span>
              </div>
              <p className="text-lg font-semibold">{formattedAmount}</p>
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                <TrendingUp className="h-4 w-4" />
                <span>Shares</span>
              </div>
              <p className="text-lg font-semibold">{formattedShares}</p>
            </div>
          </div>

          <div className="flex items-center gap-2 text-sm text-muted-foreground pt-2 border-t">
            <Clock className="h-4 w-4" />
            <span>Placed: {formatDate(Number(timestamp))}</span>
          </div>

          <div className="flex gap-2">
            {canClaim && (
              <Button
                className="flex-1"
                onClick={handleClaimWinnings}
                disabled={isPending || isConfirming}
              >
                {isPending || isConfirming ? "Claiming..." : "Claim Winnings"}
              </Button>
            )}
            {isWinner && claimed && (
              <Badge variant="outline" className="flex-1 justify-center py-2 bg-green-50 dark:bg-green-950 text-green-700 dark:text-green-300">
                ✓ Claimed
              </Badge>
            )}
            {isLoser && (
              <Badge variant="destructive" className="flex-1 justify-center py-2">
                Lost
              </Badge>
            )}
            {isActive && !claimed && (
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setIsListDialogOpen(true)}
              >
                List for Sale
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      <ListPositionDialog
        betId={betId}
        isOpen={isListDialogOpen}
        onClose={() => setIsListDialogOpen(false)}
        tokenAddress={tokenAddress}
      />
    </>
  );
}
