"use client";

import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useMarketPools, useMarketTokenAddress } from "@/lib/hooks/useMarkets";
import { PlusCircle } from "lucide-react";
import { formatEther, formatUnits, zeroAddress } from "viem";

interface MarketCardProps {
  id: number;
  question: string;
  description: string;
  outcomes: readonly string[];
  resolutionTime: number;
  totalVolume: bigint;
  status: number;
}

export function MarketCard({
  id,
  question,
  outcomes,
  totalVolume,
  status,
}: MarketCardProps) {
  const { pools } = useMarketPools(id, outcomes.length);
  const { data: tokenAddress } = useMarketTokenAddress(id);

  // Check if it's an ETH market or ERC20 market
  const isEthMarket = !tokenAddress || tokenAddress === zeroAddress;

  // Format volume based on token type
  const formatVolume = () => {
    if (isEthMarket) {
      return `${parseFloat(formatEther(totalVolume)).toFixed(4)} ETH`;
    } else {
      return `${parseFloat(formatUnits(totalVolume, 18)).toFixed(2)} USDC`;
    }
  };

  // Calculate probabilities based on pool sizes
  const calculateProbability = (outcomeIndex: number): number => {
    if (!pools || totalVolume === BigInt(0)) return 0;
    const pool = pools[outcomeIndex] || BigInt(0);
    return Number((pool * BigInt(10000)) / totalVolume) / 100;
  };

  // Get status badge color
  const getStatusColor = () => {
    switch (status) {
      case 0: return "bg-green-500/10 text-green-600 dark:text-green-400";
      case 1: return "bg-yellow-500/10 text-yellow-600 dark:text-yellow-400";
      case 2: return "bg-blue-500/10 text-blue-600 dark:text-blue-400";
      case 3: return "bg-red-500/10 text-red-600 dark:text-red-400";
      default: return "";
    }
  };

  return (
    <Card className="hover:shadow-lg transition-all duration-200 h-full flex flex-col">
      <CardContent className="p-5 flex flex-col h-full">
        {/* Header */}
        <div className="mb-4">
          <Link href={`/markets/${id}`}>
            <h3 className="font-semibold text-base leading-tight line-clamp-2 hover:text-primary transition-colors min-h-[2.5rem]">
              {question}
            </h3>
          </Link>
        </div>

        {/* Outcomes Grid */}
        <div className="grid grid-cols-2 gap-2 flex-1 mb-4">
          {outcomes.map((outcome, idx) => {
            const probability = calculateProbability(idx);

            return (
              <Link key={idx} href={`/markets/${id}`}>
                <div className="flex flex-col items-center justify-center p-3 rounded-lg hover:bg-accent/50 transition-colors border border-border/50 h-full">
                  <span className="text-2xl font-bold text-primary mb-1">
                    {probability > 0 ? `${probability}%` : '-'}
                  </span>
                  <span className="text-sm font-medium text-center">
                    {outcome}
                  </span>
                </div>
              </Link>
            );
          })}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-3 border-t">
          <div className="text-sm text-muted-foreground">
            {formatVolume()} volume
          </div>
          <div className="flex items-center gap-2">
            <Badge
              variant="secondary"
              className={`${getStatusColor()} text-xs px-2 py-0.5 border-0`}
            >
              {status === 0 ? 'Open' : status === 1 ? 'Closed' : status === 2 ? 'Resolved' : 'Cancelled'}
            </Badge>
            <Link href={`/markets/${id}`}>
              <Button size="sm" variant="ghost" className="h-8 w-8 p-0">
                <PlusCircle className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}