"use client";

import { useMarketCount, useMarkets } from "@/lib/hooks/useMarkets";
import { usePlatformStats } from "@/lib/hooks/useStats";
import { MarketCard } from "@/components/market/market-card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { TrendingUp, Plus } from "lucide-react";
import Link from "next/link";

export default function Home() {
  const { data: marketCount, isLoading: isLoadingCount } = useMarketCount();
  const count = marketCount ? Number(marketCount) : 0;
  const { data: marketsData, isLoading: isLoadingMarkets } = useMarkets(count);
  const { totalVolumeUSD, activeMarkets, isLoading: isLoadingStats } = usePlatformStats();

  return (
    <div className="w-full px-6 py-8 max-w-7xl mx-auto">
      {/* Hero Section */}
      <section className="text-center py-12 space-y-4">
        <div className="flex items-center justify-center gap-2 text-primary">
          <TrendingUp className="h-12 w-12" />
        </div>
        <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
          Satta
        </h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          Trade on the outcome of future events. Create markets, place bets, and earn from your predictions.
        </p>
        <div className="flex gap-4 justify-center pt-4">
          <Link href="/create">
            <Button size="lg">
              <Plus className="mr-2 h-5 w-5" />
              Create Market
            </Button>
          </Link>
          <Link href="/markets">
            <Button size="lg" variant="outline">
              Browse Markets
            </Button>
          </Link>
        </div>
      </section>

      {/* Stats Section */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6 py-8">
        <div className="bg-card border rounded-lg p-6 text-center">
          <div className="text-3xl font-bold">{isLoadingCount ? "..." : count}</div>
          <div className="text-sm text-muted-foreground mt-1">Total Markets</div>
        </div>
        <div className="bg-card border rounded-lg p-6 text-center">
          <div className="text-2xl font-bold">
            {isLoadingStats ? "..." : totalVolumeUSD}
          </div>
          <div className="text-sm text-muted-foreground mt-1">Total Volume</div>
        </div>
        <div className="bg-card border rounded-lg p-6 text-center">
          <div className="text-3xl font-bold">
            {isLoadingStats ? "..." : activeMarkets}
          </div>
          <div className="text-sm text-muted-foreground mt-1">Active Markets</div>
        </div>
      </section>

      {/* Markets Section */}
      <section className="py-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold">Featured Markets</h2>
          <Link href="/markets">
            <Button variant="ghost">View All →</Button>
          </Link>
        </div>

        {isLoadingCount || isLoadingMarkets ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-48 rounded-lg" />
            ))}
          </div>
        ) : count === 0 ? (
          <div className="text-center py-12 bg-card border rounded-lg">
            <p className="text-muted-foreground mb-4">No markets yet. Be the first to create one!</p>
            <Link href="/create">
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Create Market
              </Button>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {marketsData?.slice(0, 6).map((market, idx: number) => {
              if (!market.result) return null;
              const [id, question, description, outcomes, resolutionTime, , , status, totalVolume] = market.result as readonly [bigint, string, string, readonly string[], bigint, string, string, number, bigint];
              return (
                <MarketCard
                  key={idx}
                  id={Number(id)}
                  question={question}
                  description={description}
                  outcomes={outcomes}
                  resolutionTime={Number(resolutionTime)}
                  totalVolume={totalVolume}
                  status={status}
                />
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
