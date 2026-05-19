import { useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { CONTRACTS } from "../contracts/addresses";
import { PREDICTION_MARKET_ABI } from "../contracts/abis";
import { parseEther } from "viem";

// Hook to list a position for sale
export function useListPosition() {
  const { data: hash, writeContract, isPending } = useWriteContract();

  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  const listPosition = (betId: number, price: string) => {
    writeContract({
      address: CONTRACTS.PREDICTION_MARKET,
      abi: PREDICTION_MARKET_ABI,
      functionName: "listPosition",
      args: [BigInt(betId), parseEther(price)],
    });
  };

  return {
    listPosition,
    isPending,
    isConfirming,
    isSuccess,
    hash,
  };
}

// Hook to cancel a position listing
export function useCancelListing() {
  const { data: hash, writeContract, isPending } = useWriteContract();

  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  const cancelListing = (betId: number) => {
    writeContract({
      address: CONTRACTS.PREDICTION_MARKET,
      abi: PREDICTION_MARKET_ABI,
      functionName: "cancelListing",
      args: [BigInt(betId)],
    });
  };

  return {
    cancelListing,
    isPending,
    isConfirming,
    isSuccess,
    hash,
  };
}

// Hook to buy a position
export function useBuyPosition() {
  const { data: hash, writeContract, isPending } = useWriteContract();

  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  const buyPosition = (betId: number, price: string, tokenAddress?: `0x${string}`) => {
    const priceWei = parseEther(price);

    // Check if ETH or ERC20 market
    const isEthMarket = !tokenAddress || tokenAddress === "0x0000000000000000000000000000000000000000";

    if (isEthMarket) {
      // ETH market - send ETH with transaction
      writeContract({
        address: CONTRACTS.PREDICTION_MARKET,
        abi: PREDICTION_MARKET_ABI,
        functionName: "buyPosition",
        args: [BigInt(betId)],
        value: priceWei,
      });
    } else {
      // ERC20 market - no ETH sent, requires prior approval
      writeContract({
        address: CONTRACTS.PREDICTION_MARKET,
        abi: PREDICTION_MARKET_ABI,
        functionName: "buyPosition",
        args: [BigInt(betId)],
      });
    }
  };

  return {
    buyPosition,
    isPending,
    isConfirming,
    isSuccess,
    hash,
  };
}
