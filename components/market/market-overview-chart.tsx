"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { useMarketPrice, useTotalPool } from "@/lib/hooks/useMarkets";
import { formatCurrency } from "@/lib/utils/format";
import { useReadContract } from "wagmi";
import { CONTRACTS } from "@/lib/contracts/addresses";
import { PREDICTION_MARKET_ABI } from "@/lib/contracts/abis";
import { Abi } from "viem";
import { TrendingUp, DollarSign } from "lucide-react";

interface MarketOverviewChartProps {
  marketId: number;
  outcomes: readonly string[];
  totalVolume: bigint;
}

export function MarketOverviewChart({ marketId, outcomes, totalVolume }: MarketOverviewChartProps) {
  const { data: totalPool } = useTotalPool(marketId);

  // Get REAL data from blockchain for each outcome
  const outcomesData = outcomes.map((outcome, idx) => {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const { data: price } = useMarketPrice(marketId, idx);
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const { data: pool } = useReadContract({
      address: CONTRACTS.PREDICTION_MARKET,
      abi: PREDICTION_MARKET_ABI as Abi,
      functionName: "outcomePools",
      args: [BigInt(marketId), BigInt(idx)],
    });

    return {
      name: outcome,
      probability: price ? Number(price) : 0,
      pool: pool ? Number(pool) : 0,
    };
  });

  // Color palette
  const COLORS = ['#10b981', '#3b82f6', '#1f2937', '#f59e0b', '#8b5cf6', '#ec4899'];

  // Format ETH
  const formatETH = (wei: number) => {
    const eth = wei / 1e18;
    return eth.toFixed(4);
  };

  // Check if there's any data
  const hasData = outcomesData.some(d => d.probability > 0 || d.pool > 0);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Market Overview</CardTitle>
            <CardDescription>Current probabilities and pool distribution</CardDescription>
          </div>
          <div className="text-right space-y-1">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <DollarSign className="h-4 w-4" />
              <span>Total Pool</span>
            </div>
            <div className="text-lg font-bold">
              {totalPool ? formatCurrency(totalPool as bigint) : "$0.00"}
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {!hasData ? (
          <div className="text-center py-12 text-muted-foreground">
            <TrendingUp className="h-12 w-12 mx-auto mb-4 opacity-20" />
            <p className="font-medium">No bets placed yet</p>
            <p className="text-sm mt-1">Be the first to bet on this market!</p>
          </div>
        ) : (
          <>
            {/* Probability Bar Chart */}
            <div className="mb-8">
              <h4 className="text-sm font-medium mb-4">Current Probabilities</h4>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={outcomesData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" opacity={0.5} />
                  <XAxis type="number" domain={[0, 100]} tickFormatter={(v) => `${v}%`} />
                  <YAxis type="category" dataKey="name" width={100} />
                  <Tooltip
                    formatter={(value: number | string) => [`${value}%`, 'Probability']}
                    contentStyle={{
                      backgroundColor: '#fff',
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px',
                    }}
                  />
                  <Bar dataKey="probability" radius={[0, 8, 8, 0]}>
                    {outcomesData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Detailed Stats Table */}
            <div className="space-y-3">
              <h4 className="text-sm font-medium">Detailed Breakdown</h4>
              {outcomesData.map((data, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-3 rounded-lg border bg-card"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="w-3 h-3 rounded-full flex-shrink-0"
                      style={{ backgroundColor: COLORS[idx % COLORS.length] }}
                    />
                    <span className="font-medium">{data.name}</span>
                  </div>
                  <div className="flex items-center gap-4 text-sm">
                    <div className="text-right">
                      <div className="font-bold text-lg" style={{ color: COLORS[idx % COLORS.length] }}>
                        {data.probability}%
                      </div>
                      <div className="text-xs text-muted-foreground">Probability</div>
                    </div>
                    <div className="text-right">
                      <div className="font-medium">
                        {formatETH(data.pool)} ETH
                      </div>
                      <div className="text-xs text-muted-foreground">Pool Size</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Summary Stats */}
            <div className="mt-6 p-4 bg-muted rounded-lg">
              <div className="grid grid-cols-2 gap-4 text-center">
                <div>
                  <div className="text-2xl font-bold">{formatCurrency(totalVolume)}</div>
                  <div className="text-sm text-muted-foreground">Total Volume</div>
                </div>
                <div>
                  <div className="text-2xl font-bold">{outcomes.length}</div>
                  <div className="text-sm text-muted-foreground">Outcomes</div>
                </div>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
