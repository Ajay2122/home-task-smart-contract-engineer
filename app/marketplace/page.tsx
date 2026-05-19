"use client";

import { useState } from "react";
import { useAccount } from "wagmi";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { formatEther, formatUnits, zeroAddress } from "viem";
import { ShoppingCart, Search, TrendingUp, Wallet, ExternalLink } from "lucide-react";
import Link from "next/link";
import { useBuyPosition } from "@/lib/hooks/usePositionTrading";
import { useMarket } from "@/lib/hooks/useMarkets";
import { toast } from "sonner";
import { formatDate } from "@/lib/utils/format";
import { useMarketplaceListings, useMarketplaceStats, type MarketplaceListing } from "@/lib/hooks/useMarketplaceListings";

export default function MarketplacePage() {
  const { address } = useAccount();
  const { listings, isLoading, error } = useMarketplaceListings();
  const { stats } = useMarketplaceStats();
  const [searchQuery, setSearchQuery] = useState("");

  const filteredListings = listings.filter((listing) => {
    const searchLower = searchQuery.toLowerCase();
    return (
      listing.marketId.toString().includes(searchLower) ||
      listing.seller.toLowerCase().includes(searchLower) ||
      listing.betId.toString().includes(searchLower)
    );
  });

  if (!address) {
    return (
      <div className="w-full px-6 py-8 max-w-7xl mx-auto">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            {/* <ShoppingCart className="h-8 w-8 text-primary" /> */}
            <h1 className="text-3xl font-bold">Position Trading</h1>
          </div>
          <p className="text-muted-foreground">
            Buy and sell prediction market positions before resolution
          </p>
        </div>

        <Alert>
          <Wallet className="h-5 w-5" />
          <AlertTitle>Wallet Not Connected</AlertTitle>
          <AlertDescription>
            Connect your wallet to browse and trade positions
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="w-full px-6 py-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          {/* <ShoppingCart className="h-8 w-8 text-primary" /> */}
          <h1 className="text-3xl font-bold">Position Trading</h1>
        </div>
        <p className="text-muted-foreground">
          Buy positions from other users and trade before market resolution
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Listings
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {isLoading ? "..." : stats.totalListings}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Value
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold">
              {isLoading ? "..." : stats.totalValueDisplay}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Active Markets
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {isLoading ? "..." : stats.uniqueMarkets}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Sellers
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {isLoading ? "..." : stats.uniqueSellers}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by market ID, bet ID, or seller address..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Error State */}
      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertTitle>Error Loading Listings</AlertTitle>
          <AlertDescription>
            {error.message || "Failed to load marketplace listings. Please try again."}
          </AlertDescription>
        </Alert>
      )}

      {/* Listings */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className="h-80 w-full" />
          ))}
        </div>
      ) : filteredListings.length === 0 ? (
        <Card>
          <CardContent className="py-16">
            <div className="text-center">
              <ShoppingCart className="h-16 w-16 mx-auto text-muted-foreground/50 mb-4" />
              <h3 className="text-lg font-semibold mb-2">
                {searchQuery ? "No Matching Listings" : "No Positions Listed"}
              </h3>
              <p className="text-sm text-muted-foreground mb-6">
                {searchQuery
                  ? "Try adjusting your search terms"
                  : "There are currently no positions available for purchase."}
              </p>
              {!searchQuery && (
                <>
                  <div className="space-y-2 text-sm text-muted-foreground mb-6">
                    <p className="font-semibold">To list a position for sale:</p>
                    <ol className="list-decimal list-inside space-y-1">
                      <li>Go to your Portfolio</li>
                      <li>Find an active position</li>
                      <li>Click &quot;List for Sale&quot;</li>
                      <li>Set your asking price</li>
                    </ol>
                  </div>
                  <Link href="/portfolio">
                    <Button>Go to Portfolio</Button>
                  </Link>
                </>
              )}
            </div>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="text-sm text-muted-foreground mb-4">
            Showing {filteredListings.length} {filteredListings.length === 1 ? "listing" : "listings"}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredListings.map((listing) => (
              <PositionListingCard
                key={listing.betId.toString()}
                listing={listing}
                userAddress={address}
              />
            ))}
          </div>
        </>
      )}

      {/* Info Card */}
      <Card className="mt-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            How Position Trading Works
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div>
            <h4 className="font-semibold mb-1">1. Browse Listings</h4>
            <p className="text-muted-foreground">
              View all positions currently listed for sale by other users
            </p>
          </div>
          <div>
            <h4 className="font-semibold mb-1">2. Buy Position</h4>
            <p className="text-muted-foreground">
              Purchase a position at the seller&apos;s asking price
            </p>
          </div>
          <div>
            <h4 className="font-semibold mb-1">3. Own the Position</h4>
            <p className="text-muted-foreground">
              The position transfers to you - claim winnings if it wins!
            </p>
          </div>
          <div className="pt-3 border-t">
            <p className="text-xs text-muted-foreground">
              <strong>Note:</strong> Position trading allows you to exit early or
              buy into markets you believe will win. All trades are peer-to-peer
              with no platform fees.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function PositionListingCard({
  listing,
  userAddress,
}: {
  listing: MarketplaceListing;
  userAddress: `0x${string}`;
}) {
  const { data: market } = useMarket(Number(listing.marketId));
  const { buyPosition, isPending } = useBuyPosition();

  if (!market) {
    return (
      <Card className="opacity-60">
        <CardContent className="py-8 text-center">
          <p className="text-sm text-muted-foreground">Loading market data...</p>
        </CardContent>
      </Card>
    );
  }

  const [, question, , outcomes, , , , , , tokenAddress] = market as readonly [
    bigint,
    string,
    string,
    readonly string[],
    bigint,
    string,
    string,
    number,
    bigint,
    string  // tokenAddress
  ];

  // Determine token type
  const isEthMarket = !tokenAddress || tokenAddress === zeroAddress;
  const tokenSymbol = isEthMarket ? "ETH" : "USDC";

  // Format amounts with correct token
  const formattedAmount = isEthMarket
    ? `${parseFloat(formatEther(listing.amount)).toFixed(4)} ${tokenSymbol}`
    : `${parseFloat(formatUnits(listing.amount, 18)).toFixed(2)} ${tokenSymbol}`;

  const formattedPrice = isEthMarket
    ? `${parseFloat(formatEther(listing.price)).toFixed(4)} ${tokenSymbol}`
    : `${parseFloat(formatUnits(listing.price, 18)).toFixed(2)} ${tokenSymbol}`;

  const formattedShares = isEthMarket
    ? formatEther(listing.shares)
    : parseFloat(formatUnits(listing.shares, 18)).toFixed(2);

  const isOwnListing = listing.seller.toLowerCase() === userAddress.toLowerCase();

  const handleBuy = () => {
    buyPosition(
      Number(listing.betId),
      formatEther(listing.price),
      tokenAddress as `0x${string}` | undefined
    );
    toast.success("Purchasing position...");
  };

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader>
        <div className="flex items-start justify-between gap-2 mb-2">
          <CardTitle className="text-base leading-tight line-clamp-2">
            {question}
          </CardTitle>
          <Link href={`/markets/${listing.marketId}`} target="_blank">
            <Badge variant="outline" className="cursor-pointer hover:bg-accent flex-shrink-0">
              #{listing.marketId.toString()}
              <ExternalLink className="h-3 w-3 ml-1" />
            </Badge>
          </Link>
        </div>
        <CardDescription className="flex items-center gap-2">
          <span>Position on:</span>
          <Badge variant="secondary">
            {outcomes[Number(listing.outcomeIndex)]}
          </Badge>
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-3 gap-3 text-sm">
          <div>
            <div className="text-muted-foreground text-xs mb-1">Original Bet</div>
            <div className="font-semibold">{formattedAmount}</div>
          </div>
          <div className="col-span-2">
            <div className="text-muted-foreground text-xs mb-1 ">Shares</div>
            <div className="font-semibold overflow-auto">{formattedShares}</div>
          </div>
        </div>

        <div className="pt-2 border-t">
          <div className="text-muted-foreground text-xs mb-1">Asking Price</div>
          <div className="text-2xl font-bold text-primary">
            {formattedPrice}
          </div>
        </div>

        <div className="text-xs text-muted-foreground space-y-1 pt-2 border-t">
          <div className="flex justify-between">
            <span>Seller:</span>
            <span className="font-mono">
              {listing.seller.slice(0, 6)}...{listing.seller.slice(-4)}
            </span>
          </div>
          <div className="flex justify-between">
            <span>Listed:</span>
            <span>{formatDate(listing.timestamp)}</span>
          </div>
          <div className="flex justify-between">
            <span>Bet ID:</span>
            <span className="font-mono">#{listing.betId.toString()}</span>
          </div>
        </div>

        {isOwnListing ? (
          <Alert>
            <AlertDescription className="text-xs">
              This is your listing. Go to Portfolio to manage it.
            </AlertDescription>
          </Alert>
        ) : (
          <Button
            className="w-full"
            onClick={handleBuy}
            disabled={isPending}
          >
            {isPending ? "Purchasing..." : `Buy for ${formattedPrice}`}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
