"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useMarketPools } from "@/lib/hooks/useMarkets";
import { TrendingUp } from "lucide-react";
import { formatEther } from "viem";

interface MarketStatsCardProps {
  marketId: number;
  outcomes: readonly string[];
  totalVolume: bigint;
  isEthMarket: boolean;
}

const OUTCOME_COLORS = [
  "#3b82f6", // blue
  "#ef4444", // red
  "#10b981", // green
  "#f59e0b", // amber
  "#8b5cf6", // purple
  "#ec4899", // pink
  "#14b8a6", // teal
  "#f97316", // orange
];

export function MarketStatsCard({ marketId, outcomes, totalVolume, isEthMarket }: MarketStatsCardProps) {
  const { pools } = useMarketPools(marketId, outcomes.length);

  // Calculate probabilities and pool sizes
  const outcomeStats = outcomes.map((outcome, idx) => {
    const pool = pools?.[idx] || BigInt(0);
    const probability = totalVolume > BigInt(0)
      ? Number((pool * BigInt(10000)) / totalVolume) / 100
      : 0;

    return {
      name: outcome,
      probability,
      pool,
      color: OUTCOME_COLORS[idx % OUTCOME_COLORS.length],
    };
  });

  // Sort by probability (highest first)
  const sortedStats = [...outcomeStats].sort((a, b) => b.probability - a.probability);

  const hasData = totalVolume > BigInt(0);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5" />
          Current Market Odds
        </CardTitle>
        <CardDescription>
          Live probability distribution based on betting volume
        </CardDescription>
      </CardHeader>
      <CardContent>
        {!hasData ? (
          <div className="text-center py-8 text-muted-foreground">
            <p className="font-medium">No bets placed yet</p>
            <p className="text-sm mt-1">Be the first to bet on this market!</p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Outcome bars */}
            {sortedStats.map((stat, idx) => (
              <div key={idx} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div
                      className="w-3 h-3 rounded-full flex-shrink-0"
                      style={{ backgroundColor: stat.color }}
                    />
                    <span className="font-medium text-sm">{stat.name}</span>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-lg" style={{ color: stat.color }}>
                      {stat.probability.toFixed(1)}%
                    </div>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${stat.probability}%`,
                      backgroundColor: stat.color,
                    }}
                  />
                </div>

                {/* Pool size */}
                <div className="text-xs text-muted-foreground text-right">
                  Pool: {parseFloat(formatEther(stat.pool)).toFixed(4)} {isEthMarket ? "ETH" : "USDC"}
                </div>
              </div>
            ))}

            {/* Summary */}
            <div className="pt-4 border-t space-y-2">
              <div className="flex justify-between items-center text-sm">
                <span className="text-muted-foreground">Total Volume</span>
                <span className="font-semibold">
                  {parseFloat(formatEther(totalVolume)).toFixed(4)} {isEthMarket ? "ETH" : "USDC"}
                </span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-muted-foreground">Outcomes</span>
                <span className="font-semibold">{outcomes.length}</span>
              </div>
            </div>

            {/* Info badge */}
            <Badge variant="secondary" className="w-full justify-center text-xs py-2">
              Probabilities update with each new bet
            </Badge>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
