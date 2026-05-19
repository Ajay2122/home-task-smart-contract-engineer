import { useMarkets, useMarketCount } from "./useMarkets";
import { formatEther } from "viem";
import { useMemo } from "react";
import { usePlatformActivity } from "./useEventHistory";

export function usePlatformStats() {
  const { data: marketCount } = useMarketCount();
  const count = marketCount ? Number(marketCount) : 0;
  const { data: marketsData, isLoading } = useMarkets(count);

  const stats = useMemo(() => {
    if (!marketsData) {
      return {
        totalVolume: "0.00",
        totalVolumeUSD: "0.00",
        totalTraders: 0,
        activeMarkets: 0,
      };
    }

    let totalEthVolume = BigInt(0);
    let totalUsdcVolume = BigInt(0);
    const uniqueTraders = new Set<string>();
    let activeMarkets = 0;

    for (const market of marketsData) {
      if (!market.result) continue;

      const [, , , , , , , status, totalVolume, tokenAddress] = market.result as readonly [
        bigint,
        string,
        string,
        readonly string[],
        bigint,
        string,
        string,
        number,
        bigint,
        string
      ];

      // Count active markets (status = 0 means Open)
      if (status === 0) {
        activeMarkets++;
      }

      // Sum volume by token type
      const isEthMarket = !tokenAddress || tokenAddress === "0x0000000000000000000000000000000000000000";
      if (isEthMarket) {
        totalEthVolume += totalVolume;
      } else {
        totalUsdcVolume += totalVolume;
      }
    }

    // Format volumes separately for ETH and USDC
    const ethVolumeFormatted = parseFloat(formatEther(totalEthVolume)).toFixed(4);
    const usdcVolumeFormatted = parseFloat(formatEther(totalUsdcVolume)).toFixed(2);

    // Create display string
    let volumeDisplay = "";
    if (totalEthVolume > 0 && totalUsdcVolume > 0) {
      volumeDisplay = `${ethVolumeFormatted} ETH + ${usdcVolumeFormatted} USDC`;
    } else if (totalEthVolume > 0) {
      volumeDisplay = `${ethVolumeFormatted} ETH`;
    } else if (totalUsdcVolume > 0) {
      volumeDisplay = `${usdcVolumeFormatted} USDC`;
    } else {
      volumeDisplay = "0";
    }

    return {
      totalVolume: parseFloat(formatEther(totalEthVolume + totalUsdcVolume)).toFixed(4),
      totalVolumeDisplay: volumeDisplay,
      totalVolumeUSD: volumeDisplay, // Reusing for backward compatibility
      totalTraders: uniqueTraders.size,
      activeMarkets,
    };
  }, [marketsData]);

  return {
    ...stats,
    isLoading,
  };
}

// Hook to get unique traders count using blockchain events
export function useTotalTraders() {
  const { activity } = usePlatformActivity(1000); // Get last 1000 bets

  const traders = useMemo(() => {
    if (!activity || activity.length === 0) return 0;
    // Count unique bettor addresses
    const uniqueBettors = new Set(activity.map(bet => bet.bettor.toLowerCase()));
    return uniqueBettors.size;
  }, [activity]);

  return traders;
}

// Get total volume across all markets
export function useTotalVolume() {
  const { data: marketCount } = useMarketCount();
  const count = marketCount ? Number(marketCount) : 0;
  const { data: marketsData } = useMarkets(count);

  const totalVolume = useMemo(() => {
    if (!marketsData) return "0.00";

    let totalVolumeWei = BigInt(0);;

    for (const market of marketsData) {
      if (!market.result) continue;
      const [, , , , , , , , volume] = market.result as readonly [
        bigint,
        string,
        string,
        readonly string[],
        bigint,
        string,
        string,
        number,
        bigint
      ];
      totalVolumeWei += volume;
    }

    return parseFloat(formatEther(totalVolumeWei)).toFixed(4);
  }, [marketsData]);

  return totalVolume;
}

// Hook to count unique bettors across all markets
export function useUniqueBettors() {
  // Same as useTotalTraders - count unique bettors from events
  return useTotalTraders();
}
