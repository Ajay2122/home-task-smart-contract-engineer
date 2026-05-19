import { useReadContract, useReadContracts } from "wagmi";
import { CONTRACTS } from "../contracts/addresses";
import { PREDICTION_MARKET_ABI } from "../contracts/abis";

export function useMarketCount() {
  return useReadContract({
    address: CONTRACTS.PREDICTION_MARKET,
    abi: PREDICTION_MARKET_ABI,
    functionName: "marketCount",
  });
}

export function useMarket(marketId: number) {
  return useReadContract({
    address: CONTRACTS.PREDICTION_MARKET,
    abi: PREDICTION_MARKET_ABI,
    functionName: "getMarket",
    args: [BigInt(marketId)],
  });
}

export function useMarkets(count: number) {
  const contracts = Array.from({ length: count }, (_, i) => ({
    address: CONTRACTS.PREDICTION_MARKET,
    abi: PREDICTION_MARKET_ABI,
    functionName: "getMarket" as const,
    args: [BigInt(i + 1)],
  }));

  return useReadContracts({ contracts });
}

export function useMarketPrice(marketId: number, outcomeIndex: number) {
  return useReadContract({
    address: CONTRACTS.PREDICTION_MARKET,
    abi: PREDICTION_MARKET_ABI,
    functionName: "getPrice",
    args: [BigInt(marketId), BigInt(outcomeIndex)],
  });
}

export function useTotalPool(marketId: number) {
  return useReadContract({
    address: CONTRACTS.PREDICTION_MARKET,
    abi: PREDICTION_MARKET_ABI,
    functionName: "getTotalPool",
    args: [BigInt(marketId)],
  });
}

/**
 * Hook to get all outcome pools for a market
 */
export function useMarketPools(marketId: number, outcomeCount: number) {
  const contracts = Array.from({ length: outcomeCount }, (_, i) => ({
    address: CONTRACTS.PREDICTION_MARKET,
    abi: PREDICTION_MARKET_ABI,
    functionName: "outcomePools" as const,
    args: [BigInt(marketId), BigInt(i)],
  }));

  const result = useReadContracts({ contracts });

  const pools = result.data?.map((r) => r.result as bigint) || [];

  return {
    pools,
    isLoading: result.isLoading,
    error: result.error,
  };
}

/**
 * Hook to get the token address for a market
 * Returns 0x0 for ETH markets, token address for ERC20 markets
 */
export function useMarketTokenAddress(marketId: number) {
  const result = useReadContract({
    address: CONTRACTS.PREDICTION_MARKET,
    abi: PREDICTION_MARKET_ABI,
    functionName: "getMarket",
    args: [BigInt(marketId)],
  });

  // getMarket returns: [id, question, description, outcomes, resolutionTime, arbitrator, creator, status, totalVolume, tokenAddress]
  // tokenAddress is at index 9
  const marketData = result.data as readonly unknown[] | undefined;
  const tokenAddress = marketData?.[9] as `0x${string}` | undefined;

  return {
    ...result,
    data: tokenAddress,
  };
}
