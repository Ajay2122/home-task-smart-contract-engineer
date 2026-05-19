import { useWriteContract, useWaitForTransactionReceipt, useReadContract } from "wagmi";
import { CONTRACTS } from "../contracts/addresses";
import { PREDICTION_MARKET_ABI, MOCK_ERC20_ABI } from "../contracts/abis";
import { parseEther, parseUnits } from "viem";

/**
 * Hook for placing bets on markets
 * Handles both ETH and ERC20 token markets
 */
export function usePlaceBet() {
  const { data: hash, writeContract, isPending } = useWriteContract();

  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  const placeBet = (
    marketId: number,
    outcomeIndex: number,
    amount: string,
    tokenAddress?: `0x${string}`, // Optional: ERC20 token address
    slippageTolerance: number = 5 // Default 5% slippage tolerance
  ) => {
    const amountWei = parseEther(amount);

    // Calculate minimum shares with slippage (95% of expected shares by default)
    const minShares = BigInt(0); // Set to 0 to accept any amount (user can adjust if needed)

    // For ETH markets (tokenAddress is 0x0 or undefined)
    if (!tokenAddress || tokenAddress === "0x0000000000000000000000000000000000000000") {
      writeContract({
        address: CONTRACTS.PREDICTION_MARKET,
        abi: PREDICTION_MARKET_ABI,
        functionName: "placeBet",
        args: [BigInt(marketId), BigInt(outcomeIndex), amountWei, minShares],
        value: amountWei, // Send ETH with transaction
      });
    } else {
      // For ERC20 markets (approval must be done separately)
      writeContract({
        address: CONTRACTS.PREDICTION_MARKET,
        abi: PREDICTION_MARKET_ABI,
        functionName: "placeBet",
        args: [BigInt(marketId), BigInt(outcomeIndex), amountWei, minShares],
        // No value for ERC20
      });
    }
  };

  return {
    placeBet,
    isPending,
    isConfirming,
    isSuccess,
    hash,
  };
}

/**
 * Hook for approving ERC20 tokens for betting
 * Must be called before placeBet for ERC20 markets
 */
export function useApproveERC20() {
  const { data: hash, writeContract, isPending } = useWriteContract();

  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  const approve = (tokenAddress: `0x${string}`, amount: string) => {
    const amountWei = parseEther(amount);

    writeContract({
      address: tokenAddress,
      abi: MOCK_ERC20_ABI,
      functionName: "approve",
      args: [CONTRACTS.PREDICTION_MARKET, amountWei],
    });
  };

  return {
    approve,
    isPending,
    isConfirming,
    isSuccess,
    hash,
  };
}

/**
 * Hook to check ERC20 allowance
 * Returns how much the user has approved for betting
 */
export function useERC20Allowance(
  tokenAddress: `0x${string}` | undefined,
  userAddress: `0x${string}` | undefined
) {
  return useReadContract({
    address: tokenAddress,
    abi: MOCK_ERC20_ABI,
    functionName: "allowance",
    args: userAddress ? [userAddress, CONTRACTS.PREDICTION_MARKET] : undefined,
    query: {
      enabled: !!tokenAddress && !!userAddress && tokenAddress !== "0x0000000000000000000000000000000000000000",
    },
  });
}

/**
 * Hook to check ERC20 balance
 * Returns user's token balance
 */
export function useERC20Balance(
  tokenAddress: `0x${string}` | undefined,
  userAddress: `0x${string}` | undefined
) {
  return useReadContract({
    address: tokenAddress,
    abi: MOCK_ERC20_ABI,
    functionName: "balanceOf",
    args: userAddress ? [userAddress] : undefined,
    query: {
      enabled: !!tokenAddress && !!userAddress && tokenAddress !== "0x0000000000000000000000000000000000000000",
    },
  });
}

export function useClaimWinnings() {
  const { data: hash, writeContract, isPending } = useWriteContract();

  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  const claimWinnings = (betId: number) => {
    writeContract({
      address: CONTRACTS.PREDICTION_MARKET,
      abi: PREDICTION_MARKET_ABI,
      functionName: "claimWinnings",
      args: [BigInt(betId)],
    });
  };

  return {
    claimWinnings,
    isPending,
    isConfirming,
    isSuccess,
    hash,
  };
}
