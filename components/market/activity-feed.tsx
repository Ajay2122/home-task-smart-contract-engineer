"use client";

import { useMarketBetHistory } from "@/lib/hooks/useEventHistory";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { formatEther } from "viem";
import { formatDistanceToNow } from "date-fns";
import { Activity, TrendingUp, ExternalLink } from "lucide-react";
import Link from "next/link";

interface ActivityFeedProps {
  marketId: number;
  maxItems?: number;
}

export function ActivityFeed({ marketId, maxItems = 10 }: ActivityFeedProps) {
  const { bets, isLoading, error } = useMarketBetHistory(marketId);

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Recent Activity
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Unable to load activity feed
          </p>
        </CardContent>
      </Card>
    );
  }

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Recent Activity
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </CardContent>
      </Card>
    );
  }

  const recentBets = bets.slice(0, maxItems);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="h-5 w-5" />
          Recent Activity
        </CardTitle>
        <CardDescription>
          {bets.length} {bets.length === 1 ? "bet" : "bets"} placed on this market
        </CardDescription>
      </CardHeader>
      <CardContent>
        {recentBets.length === 0 ? (
          <div className="text-center py-8">
            <TrendingUp className="h-12 w-12 mx-auto text-muted-foreground/50 mb-3" />
            <p className="text-sm text-muted-foreground">
              No bets placed yet. Be the first!
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {recentBets.map((bet) => (
              <div
                key={bet.betId.toString()}
                className="flex items-start justify-between gap-4 p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-medium truncate">
                      {formatAddress(bet.bettor)}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      placed a bet
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span className="font-semibold text-primary">
                      {formatEther(bet.amount)} ETH
                    </span>
                    <span>•</span>
                    <span>
                      {formatDistanceToNow(bet.timestamp * 1000, {
                        addSuffix: true,
                      })}
                    </span>
                  </div>
                </div>
                <Link
                  href={`https://sepolia.etherscan.io/tx/${bet.transactionHash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-shrink-0"
                >
                  <ExternalLink className="h-4 w-4 text-muted-foreground hover:text-primary transition-colors" />
                </Link>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

/**
 * Compact activity feed for sidebar
 */
export function CompactActivityFeed({ marketId }: { marketId: number }) {
  const { bets, isLoading } = useMarketBetHistory(marketId);

  if (isLoading) {
    return (
      <div className="space-y-2">
        {[...Array(3)].map((_, i) => (
          <Skeleton key={i} className="h-8 w-full" />
        ))}
      </div>
    );
  }

  const recentBets = bets.slice(0, 5);

  if (recentBets.length === 0) {
    return (
      <p className="text-xs text-muted-foreground text-center py-4">
        No recent activity
      </p>
    );
  }

  return (
    <div className="space-y-2">
      {recentBets.map((bet) => (
        <div
          key={bet.betId.toString()}
          className="text-xs text-muted-foreground"
        >
          <span className="font-medium text-foreground">
            {formatAddress(bet.bettor)}
          </span>{" "}
          bet{" "}
          <span className="font-semibold text-primary">
            {formatEther(bet.amount)} ETH
          </span>
          <div className="text-[10px] mt-0.5">
            {formatDistanceToNow(bet.timestamp * 1000, { addSuffix: true })}
          </div>
        </div>
      ))}
    </div>
  );
}

// Helper function to format addresses
function formatAddress(address: string): string {
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}
