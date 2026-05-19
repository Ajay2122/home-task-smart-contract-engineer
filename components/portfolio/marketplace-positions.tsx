"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/utils/format";
import { useMarket } from "@/lib/hooks/useMarkets";
import { useBuyPosition } from "@/lib/hooks/usePositionTrading";
import { usePositionPrice, usePositionForSale } from "@/lib/hooks/usePortfolio";
import { ShoppingCart, TrendingUp, DollarSign } from "lucide-react";
import { toast } from "sonner";
import { formatEther } from "viem";
import { useAccount } from "wagmi";

interface MarketplacePositionCardProps {
  betId: number;
  betData: unknown;
}

export function MarketplacePositionCard({ betId, betData }: MarketplacePositionCardProps) {
  const { address } = useAccount();
  const { buyPosition, isPending, isConfirming } = useBuyPosition();
  const { data: positionPrice } = usePositionPrice(betId);
  const { data: isForSale } = usePositionForSale(betId);

  const [, , marketId, outcomeIndex, amount, shares] = (betData as readonly [bigint, string, bigint, bigint, bigint, bigint, bigint, boolean]) || [];

  const { data: market } = useMarket(Number(marketId));

  if (!market || !betData || !isForSale) return null;

  const [, question, , outcomes] = market as readonly [bigint, string, string, readonly string[], bigint, string, string, number, bigint];

  const handleBuyPosition = () => {
    if (!address) {
      toast.error("Please connect your wallet first");
      return;
    }

    if (!positionPrice) {
      toast.error("Position price not available");
      return;
    }

    const priceInEth = formatEther(positionPrice as bigint);
    buyPosition(betId, priceInEth);
    toast.success("Purchasing position...");
  };

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader>
        <div className="flex items-start justify-between gap-4">
          <CardTitle className="text-lg">{question}</CardTitle>
          <Badge variant="default">For Sale</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="text-sm text-muted-foreground">Position on:</div>
          <Badge variant="secondary" className="text-base">
            {outcomes[Number(outcomeIndex)]}
          </Badge>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-1 text-sm text-muted-foreground">
              <DollarSign className="h-4 w-4" />
              <span>Original Bet</span>
            </div>
            <p className="text-lg font-semibold">{formatCurrency(amount)}</p>
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-1 text-sm text-muted-foreground">
              <TrendingUp className="h-4 w-4" />
              <span>Shares</span>
            </div>
            <p className="text-lg font-semibold">{Number(shares).toLocaleString()}</p>
          </div>
        </div>

        {positionPrice ? (
          <div className="pt-3 border-t">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm text-muted-foreground">Sale Price</span>
              <span className="text-2xl font-bold text-primary">
                {formatEther(positionPrice as bigint)} ETH
              </span>
            </div>
            <Button
              className="w-full"
              onClick={handleBuyPosition}
              disabled={!address || isPending || isConfirming}
            >
              <ShoppingCart className="h-4 w-4 mr-2" />
              {!address
                ? "Connect Wallet to Buy"
                : isPending || isConfirming
                ? "Purchasing..."
                : "Buy Position"}
            </Button>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}

interface MarketplacePositionsListProps {
  betIds: number[];
  betsData: Array<{ result?: readonly [bigint, string, bigint, bigint, bigint, bigint, bigint, boolean] }>;
}

export function MarketplacePositionsList({ betIds, betsData }: MarketplacePositionsListProps) {
  if (!betsData || betsData.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <ShoppingCart className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <p className="text-muted-foreground">No positions available for sale</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-4">
        <ShoppingCart className="h-5 w-5" />
        <h2 className="text-xl font-semibold">Marketplace - Positions for Sale</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {betsData.map((betResult, index) => {
          if (!betResult.result) return null;
          return (
            <MarketplacePositionCard
              key={betIds[index]}
              betId={betIds[index]}
              betData={betResult.result}
            />
          );
        })}
      </div>
    </div>
  );
}
