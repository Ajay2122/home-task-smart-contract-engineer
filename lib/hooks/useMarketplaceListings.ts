import { usePublicClient } from "wagmi";
import { CONTRACTS } from "../contracts/addresses";
import { PREDICTION_MARKET_ABI } from "../contracts/abis";
import { useEffect, useState, useMemo } from "react";
import { parseAbiItem, formatEther, formatUnits, zeroAddress } from "viem";
import { useMarket } from "./useMarkets";

export interface MarketplaceListing {
  betId: bigint;
  price: bigint;
  seller: string;
  marketId: bigint;
  outcomeIndex: bigint;
  amount: bigint;
  shares: bigint;
  timestamp: number;
}

/**
 * Hook to fetch all positions currently listed for sale
 * Uses PositionListed and PositionSold events to track active listings
 */
export function useMarketplaceListings() {
  const publicClient = usePublicClient();
  const [listings, setListings] = useState<MarketplaceListing[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    async function fetchListings() {
      if (!publicClient) return;

      try {
        setIsLoading(true);

        const currentBlock = await publicClient.getBlockNumber();
        const fromBlock = currentBlock > BigInt(9999) ? currentBlock - BigInt(9999) : BigInt(0);

        // Get all PositionListed events
        const listedEvents = await publicClient.getLogs({
          address: CONTRACTS.PREDICTION_MARKET,
          event: parseAbiItem('event PositionListed(uint256 indexed betId, uint256 price)'),
          fromBlock,
          toBlock: 'latest',
        });

        // Get all PositionSold events to filter out sold positions
        const soldEvents = await publicClient.getLogs({
          address: CONTRACTS.PREDICTION_MARKET,
          event: parseAbiItem('event PositionSold(uint256 indexed betId, address seller, address buyer, uint256 price)'),
          fromBlock,
          toBlock: 'latest',
        });

        // Create set of sold betIds
        const soldBetIds = new Set(soldEvents.map(e => e.args.betId?.toString()));

        // Filter out sold positions and fetch bet details
        const activeListings: MarketplaceListing[] = [];
        const processedBetIds = new Set<string>();

        for (const event of listedEvents) {
          const betId = event.args.betId;
          const price = event.args.price;

          if (!betId || !price || soldBetIds.has(betId.toString()) || processedBetIds.has(betId.toString())) {
            continue;
          }

          processedBetIds.add(betId.toString());

          try {
            // Check if still for sale on-chain
            const isForSale = await publicClient.readContract({
              address: CONTRACTS.PREDICTION_MARKET,
              abi: PREDICTION_MARKET_ABI,
              functionName: 'positionsForSale',
              args: [betId],
            }) as boolean;

            if (!isForSale) continue;

            // Get current price (may have changed)
            const currentPrice = await publicClient.readContract({
              address: CONTRACTS.PREDICTION_MARKET,
              abi: PREDICTION_MARKET_ABI,
              functionName: 'positionPrices',
              args: [betId],
            }) as bigint;

            // Get bet details
            const bet = await publicClient.readContract({
              address: CONTRACTS.PREDICTION_MARKET,
              abi: PREDICTION_MARKET_ABI,
              functionName: 'bets',
              args: [betId],
            }) as readonly [bigint, string, bigint, bigint, bigint, bigint, bigint, boolean];

            const [id, bettor, marketId, outcomeIndex, amount, shares, timestamp, claimed] = bet;

            // Only include unclaimed positions
            if (!claimed) {
              const block = await publicClient.getBlock({ blockNumber: event.blockNumber });

              activeListings.push({
                betId,
                price: currentPrice,
                seller: bettor,
                marketId,
                outcomeIndex,
                amount,
                shares,
                timestamp: Number(block.timestamp),
              });
            }
          } catch (err) {
            console.error(`Error fetching bet ${betId}:`, err);
          }
        }

        // Sort by timestamp (newest first)
        activeListings.sort((a, b) => b.timestamp - a.timestamp);

        setListings(activeListings);
        setError(null);
      } catch (err) {
        console.error("Error fetching marketplace listings:", err);
        setError(err as Error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchListings();

    // Refresh every 30 seconds
    const interval = setInterval(fetchListings, 30000);
    return () => clearInterval(interval);
  }, [publicClient]);

  return { listings, isLoading, error };
}

/**
 * Hook to get marketplace statistics with proper token separation
 * This version fetches market data to properly separate ETH and USDC listings
 */
export function useMarketplaceStats() {
  const { listings, isLoading } = useMarketplaceListings();
  const publicClient = usePublicClient();
  const [stats, setStats] = useState({
    totalListings: 0,
    totalValue: BigInt(0),
    totalValueDisplay: "0",
    uniqueMarkets: 0,
    uniqueSellers: 0,
  });

  useEffect(() => {
    async function calculateStats() {
      if (!publicClient || listings.length === 0) {
        setStats({
          totalListings: 0,
          totalValue: BigInt(0),
          totalValueDisplay: "0",
          uniqueMarkets: 0,
          uniqueSellers: 0,
        });
        return;
      }

      let totalEthValue = BigInt(0);
      let totalUsdcValue = BigInt(0);

      // Fetch token address for each unique market
      const uniqueMarketIds = new Set(listings.map(l => l.marketId));
      const marketTokenMap = new Map<string, string>();

      for (const marketId of uniqueMarketIds) {
        try {
          const market = await publicClient.readContract({
            address: CONTRACTS.PREDICTION_MARKET,
            abi: PREDICTION_MARKET_ABI,
            functionName: 'getMarket',
            args: [marketId],
          }) as readonly unknown[];

          const tokenAddress = market[9] as string; // tokenAddress is at index 9
          marketTokenMap.set(marketId.toString(), tokenAddress);
        } catch (err) {
          console.error(`Error fetching market ${marketId}:`, err);
        }
      }

      // Sum values by token type
      for (const listing of listings) {
        const tokenAddress = marketTokenMap.get(listing.marketId.toString());
        const isEthMarket = !tokenAddress || tokenAddress === zeroAddress;

        if (isEthMarket) {
          totalEthValue += listing.price;
        } else {
          totalUsdcValue += listing.price;
        }
      }

      // Format display string (same logic as home page)
      const ethFormatted = parseFloat(formatEther(totalEthValue)).toFixed(4);
      const usdcFormatted = parseFloat(formatEther(totalUsdcValue)).toFixed(2);

      let volumeDisplay = "";
      if (totalEthValue > 0 && totalUsdcValue > 0) {
        volumeDisplay = `${ethFormatted} ETH + ${usdcFormatted} USDC`;
      } else if (totalEthValue > 0) {
        volumeDisplay = `${ethFormatted} ETH`;
      } else if (totalUsdcValue > 0) {
        volumeDisplay = `${usdcFormatted} USDC`;
      } else {
        volumeDisplay = "0";
      }

      setStats({
        totalListings: listings.length,
        totalValue: totalEthValue + totalUsdcValue,
        totalValueDisplay: volumeDisplay,
        uniqueMarkets: uniqueMarketIds.size,
        uniqueSellers: new Set(listings.map(l => l.seller)).size,
      });
    }

    calculateStats();
  }, [listings, publicClient]);

  return { stats, isLoading };
}
