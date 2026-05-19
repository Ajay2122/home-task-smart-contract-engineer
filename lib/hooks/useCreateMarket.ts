"use client";

import { useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { CONTRACTS } from "@/lib/contracts/addresses";
import { PREDICTION_MARKET_ABI } from "@/lib/contracts/abis";
import type { Abi } from "viem";

/**
 * Hook for creating a new prediction market
 *
 * @returns Object containing createMarket function and transaction states
 */
export function useCreateMarket() {
  const { data: hash, writeContract, isPending, error } = useWriteContract();

  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  const createMarket = (
    question: string,
    description: string,
    outcomes: string[],
    resolutionTime: number, // Unix timestamp
    arbitrator: string, // Address
    tokenAddress: string // Address (0x0 for ETH)
  ) => {
    writeContract({
      address: CONTRACTS.PREDICTION_MARKET!,
      abi: PREDICTION_MARKET_ABI as Abi,
      functionName: "createMarket",
      args: [
        question,
        description,
        outcomes,
        BigInt(resolutionTime),
        arbitrator as `0x${string}`,
        tokenAddress as `0x${string}`,
      ],
    });
  };

  return {
    createMarket,
    isPending,
    isConfirming,
    isSuccess,
    hash,
    error,
  };
}

/**
 * Hook for resolving a market (arbitrator only)
 *
 * @returns Object containing resolveMarket function and transaction states
 */
export function useResolveMarket() {
  const { data: hash, writeContract, isPending, error } = useWriteContract();

  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  const resolveMarket = (marketId: number, winningOutcome: number) => {
    writeContract({
      address: CONTRACTS.PREDICTION_MARKET!,
      abi: PREDICTION_MARKET_ABI as Abi,
      functionName: "resolveMarket",
      args: [BigInt(marketId), BigInt(winningOutcome)],
    });
  };

  return {
    resolveMarket,
    isPending,
    isConfirming,
    isSuccess,
    hash,
    error,
  };
}
