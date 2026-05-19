"use client";

import { useMarketCount, useMarkets } from "@/lib/hooks/useMarkets";
import { MarketCard } from "@/components/market/market-card";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Search } from "lucide-react";
import { useState } from "react";

type MarketResult = {
  result?: unknown;
  status: "success" | "failure";
  error?: Error;
};

export default function MarketsPage() {
  const { data: marketCount, isLoading: isLoadingCount } = useMarketCount();
  const count = marketCount ? Number(marketCount) : 0;
  const { data: marketsData, isLoading: isLoadingMarkets } = useMarkets(count);
  const [searchQuery, setSearchQuery] = useState("");

  const filterMarkets = (statusFilter?: number): MarketResult[] => {
    if (!marketsData) return [];

    return marketsData.filter((market) => {
      if (!market.result) return false;

      const [, question, description, , , , , status] = market.result as readonly [bigint, string, string, readonly string[], bigint, string, string, number, bigint];
      const matchesSearch =
        question.toLowerCase().includes(searchQuery.toLowerCase()) ||
        description.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesStatus = statusFilter === undefined || status === statusFilter;

      return matchesSearch && matchesStatus;
    }) as MarketResult[];
  };

  return (
    <div className="w-full px-6 py-8 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">All Markets</h1>
        <p className="text-muted-foreground">Browse and trade on prediction markets</p>
      </div>

      {/* Search */}
      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search markets..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="all" className="w-full">
        <TabsList className="mb-6">
          <TabsTrigger value="all">All Markets ({count})</TabsTrigger>
          <TabsTrigger value="open">Open</TabsTrigger>
          {/* <TabsTrigger value="closed">Closed</TabsTrigger> */}
          <TabsTrigger value="resolved">Resolved</TabsTrigger>
        </TabsList>

        <TabsContent value="all">
          <MarketGrid
            markets={filterMarkets()}
            isLoading={isLoadingCount || isLoadingMarkets}
          />
        </TabsContent>

        <TabsContent value="open">
          <MarketGrid
            markets={filterMarkets(0)}
            isLoading={isLoadingCount || isLoadingMarkets}
          />
        </TabsContent>

        <TabsContent value="closed">
          <MarketGrid
            markets={filterMarkets(1)}
            isLoading={isLoadingCount || isLoadingMarkets}
          />
        </TabsContent>

        <TabsContent value="resolved">
          <MarketGrid
            markets={filterMarkets(2)}
            isLoading={isLoadingCount || isLoadingMarkets}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}



function MarketGrid({ markets, isLoading }: { markets: MarketResult[]; isLoading: boolean }) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <Skeleton key={i} className="h-48 rounded-lg" />
        ))}
      </div>
    );
  }

  if (markets.length === 0) {
    return (
      <div className="text-center py-12 bg-card border rounded-lg">
        <p className="text-muted-foreground">No markets found</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {markets.map((market, idx: number) => {
        if (!market.result || market.status !== "success") return null;
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
  );
}
