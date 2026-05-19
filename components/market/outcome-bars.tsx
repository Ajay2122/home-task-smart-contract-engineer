"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useMarketPrice, useTotalPool } from "@/lib/hooks/useMarkets";
import { formatCurrency } from "@/lib/utils/format";
import { useReadContract } from "wagmi";
import { CONTRACTS } from "@/lib/contracts/addresses";
import { PREDICTION_MARKET_ABI } from "@/lib/contracts/abis";
import { Abi } from "viem";

interface OutcomeBarsProps {
  marketId: number;
  outcomes: readonly string[];
}

export function OutcomeBars({ marketId, outcomes }: OutcomeBarsProps) {
  const { data: totalPool } = useTotalPool(marketId);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Outcome Analysis</CardTitle>
        <CardDescription>
          Probability distribution and pool sizes
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {outcomes.map((outcome, idx) => (
          <OutcomeBar
            key={idx}
            outcome={outcome}
            marketId={marketId}
            outcomeIndex={idx}
            totalPool={totalPool as bigint}
          />
        ))}
      </CardContent>
    </Card>
  );
}

function OutcomeBar({
  outcome,
  marketId,
  outcomeIndex,
}: {
  outcome: string;
  marketId: number;
  outcomeIndex: number;
  totalPool: bigint;
}) {
  const { data: price } = useMarketPrice(marketId, outcomeIndex);
  const pricePercent = price ? Number(price) : 0;

  // Get pool for this outcome
  const { data: outcomePool } = useReadContract({
    address: CONTRACTS.PREDICTION_MARKET,
    abi: PREDICTION_MARKET_ABI as Abi,
    functionName: "outcomePools",
    args: [BigInt(marketId), BigInt(outcomeIndex)],
  });

  const pool = outcomePool as bigint | undefined;

  // Color gradient based on probability
  const getBarColor = (percent: number) => {
    if (percent >= 66) return "bg-green-500";
    if (percent >= 33) return "bg-yellow-500";
    return "bg-red-500";
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-sm">
        <span className="font-medium">{outcome}</span>
        <div className="flex items-center gap-3">
          <span className="text-muted-foreground">
            {pool ? formatCurrency(pool) : "$0.00"}
          </span>
          <span className="font-bold text-primary">{pricePercent}%</span>
        </div>
      </div>

      {/* Progress bar */}
      <div className="relative h-3 bg-muted rounded-full overflow-hidden">
        <div
          className={`h-full transition-all duration-300 ${getBarColor(pricePercent)}`}
          style={{ width: `${pricePercent}%` }}
        />
      </div>
    </div>
  );
}
