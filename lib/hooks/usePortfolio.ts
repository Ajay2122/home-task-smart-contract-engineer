import { useReadContract, useReadContracts, useAccount } from "wagmi";
import { CONTRACTS } from "../contracts/addresses";
import { PREDICTION_MARKET_ABI, REPUTATION_SYSTEM_ABI } from "../contracts/abis";

// Get all bet IDs for a user
export function useUserBets(address?: `0x${string}`) {
  return useReadContract({
    address: CONTRACTS.PREDICTION_MARKET,
    abi: PREDICTION_MARKET_ABI,
    functionName: "getUserBets",
    args: address ? [address] : undefined,
    query: {
      enabled: !!address,
    },
  });
}

// Get details for a specific bet
export function useBet(betId: number) {
  return useReadContract({
    address: CONTRACTS.PREDICTION_MARKET,
    abi: PREDICTION_MARKET_ABI,
    functionName: "bets",
    args: [BigInt(betId)],
  });
}

// Get multiple bet details at once
export function useBets(betIds: number[]) {
  const contracts = betIds.map((betId) => ({
    address: CONTRACTS.PREDICTION_MARKET,
    abi: PREDICTION_MARKET_ABI,
    functionName: "bets",
    args: [BigInt(betId)],
  }));

  return useReadContracts({
    contracts,
    query: {
      enabled: betIds.length > 0,
    },
  });
}

// Get user reputation stats
export function useUserReputation(address?: `0x${string}`) {
  return useReadContract({
    address: CONTRACTS.REPUTATION_SYSTEM,
    abi: REPUTATION_SYSTEM_ABI,
    functionName: "getStats",
    args: address ? [address] : undefined,
    query: {
      enabled: !!address,
    },
  });
}

// Check if position is for sale
export function usePositionForSale(betId: number) {
  return useReadContract({
    address: CONTRACTS.PREDICTION_MARKET,
    abi: PREDICTION_MARKET_ABI,
    functionName: "positionsForSale",
    args: [BigInt(betId)],
  });
}

// Get position price
export function usePositionPrice(betId: number) {
  return useReadContract({
    address: CONTRACTS.PREDICTION_MARKET,
    abi: PREDICTION_MARKET_ABI,
    functionName: "positionPrices",
    args: [BigInt(betId)],
  });
}

// Custom hook to get portfolio overview
export function usePortfolio() {
  const { address } = useAccount();
  const { data: betIds, isLoading: isLoadingBets } = useUserBets(address);
  const { data: reputation, isLoading: isLoadingReputation } = useUserReputation(address);

  const betIdsArray = betIds ? (betIds as bigint[]).map(id => Number(id)) : [];
  const { data: betsData, isLoading: isLoadingBetsData } = useBets(betIdsArray);

  return {
    address,
    betIds: betIdsArray,
    betsData,
    reputation,
    isLoading: isLoadingBets || isLoadingReputation || isLoadingBetsData,
  };
}
