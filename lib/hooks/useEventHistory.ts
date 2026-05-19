import { usePublicClient } from "wagmi";
import { CONTRACTS } from "../contracts/addresses";
import { PREDICTION_MARKET_ABI } from "../contracts/abis";
import { useEffect, useState } from "react";
import { parseAbiItem } from "viem";

interface BetEvent {
  betId: bigint;
  marketId: bigint;
  bettor: string;
  amount: bigint;
  timestamp: number;
  blockNumber: bigint;
  transactionHash: string;
}

interface ClaimEvent {
  betId: bigint;
  claimer: string;
  amount: bigint;
  timestamp: number;
  transactionHash: string;
}

interface PositionSaleEvent {
  betId: bigint;
  seller: string;
  buyer: string;
  price: bigint;
  timestamp: number;
  transactionHash: string;
}

interface ResolutionEvent {
  marketId: bigint;
  winningOutcome: bigint;
  timestamp: number;
  transactionHash: string;
}

/**
 * Hook to fetch all BetPlaced events for a specific market
 * Returns array of bets with timestamps for activity feed
 */
export function useMarketBetHistory(marketId: number) {
  const publicClient = usePublicClient();
  const [bets, setBets] = useState<BetEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    async function fetchBets() {
      if (!publicClient) return;

      try {
        setIsLoading(true);

        // Get current block
        const currentBlock = await publicClient.getBlockNumber();
        // Query last 9,999 blocks (free tier RPC limit is 10,000)
        const fromBlock = currentBlock > BigInt(9999) ? currentBlock - BigInt(9999) : BigInt(0);

        // Query BetPlaced events for this market
        const logs = await publicClient.getLogs({
          address: CONTRACTS.PREDICTION_MARKET,
          event: parseAbiItem('event BetPlaced(uint256 indexed betId, uint256 indexed marketId, address indexed bettor, uint256 amount)'),
          args: {
            marketId: BigInt(marketId),
          },
          fromBlock,
          toBlock: 'latest',
        });

        // Get block timestamps for each bet
        const betsWithTime = await Promise.all(
          logs.map(async (log) => {
            const block = await publicClient.getBlock({
              blockNumber: log.blockNumber
            });

            return {
              betId: log.args.betId!,
              marketId: log.args.marketId!,
              bettor: log.args.bettor!,
              amount: log.args.amount!,
              timestamp: Number(block.timestamp),
              blockNumber: log.blockNumber!,
              transactionHash: log.transactionHash,
            };
          })
        );

        // Sort by timestamp (newest first)
        betsWithTime.sort((a, b) => b.timestamp - a.timestamp);

        setBets(betsWithTime);
        setError(null);
      } catch (err) {
        console.error("Error fetching bet history:", err);
        setError(err as Error);
      } finally {
        setIsLoading(false);
      }
    }

    if (marketId > 0) {
      fetchBets();
    }
  }, [publicClient, marketId]);

  return { bets, isLoading, error };
}

/**
 * Hook to fetch all bets placed by a specific user
 * Useful for user transaction history
 */
export function useUserBetHistory(userAddress: `0x${string}` | undefined) {
  const publicClient = usePublicClient();
  const [bets, setBets] = useState<BetEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    async function fetchBets() {
      if (!publicClient || !userAddress) {
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);

        const currentBlock = await publicClient.getBlockNumber();
        const fromBlock = currentBlock > BigInt(9999) ? currentBlock - BigInt(9999) : BigInt(0);

        // Query all BetPlaced events by this user
        const logs = await publicClient.getLogs({
          address: CONTRACTS.PREDICTION_MARKET,
          event: parseAbiItem('event BetPlaced(uint256 indexed betId, uint256 indexed marketId, address indexed bettor, uint256 amount)'),
          args: {
            bettor: userAddress,
          },
          fromBlock,
          toBlock: 'latest',
        });

        const betsWithTime = await Promise.all(
          logs.map(async (log) => {
            const block = await publicClient.getBlock({
              blockNumber: log.blockNumber
            });

            return {
              betId: log.args.betId!,
              marketId: log.args.marketId!,
              bettor: log.args.bettor!,
              amount: log.args.amount!,
              timestamp: Number(block.timestamp),
              blockNumber: log.blockNumber!,
              transactionHash: log.transactionHash,
            };
          })
        );

        // Sort by timestamp (newest first)
        betsWithTime.sort((a, b) => b.timestamp - a.timestamp);

        setBets(betsWithTime);
        setError(null);
      } catch (err) {
        console.error("Error fetching user bet history:", err);
        setError(err as Error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchBets();
  }, [publicClient, userAddress]);

  return { bets, isLoading, error };
}

/**
 * Hook to fetch all WinningsClaimed events
 * Shows who claimed winnings and how much
 */
export function useClaimHistory(userAddress?: `0x${string}`) {
  const publicClient = usePublicClient();
  const [claims, setClaims] = useState<ClaimEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    async function fetchClaims() {
      if (!publicClient) return;

      try {
        setIsLoading(true);

        const currentBlock = await publicClient.getBlockNumber();
        const fromBlock = currentBlock > BigInt(9999) ? currentBlock - BigInt(9999) : BigInt(0);

        const logs = await publicClient.getLogs({
          address: CONTRACTS.PREDICTION_MARKET,
          event: parseAbiItem('event WinningsClaimed(uint256 indexed betId, address indexed claimer, uint256 amount)'),
          args: userAddress ? { claimer: userAddress } : undefined,
          fromBlock,
          toBlock: 'latest',
        });

        const claimsWithTime = await Promise.all(
          logs.map(async (log) => {
            const block = await publicClient.getBlock({
              blockNumber: log.blockNumber
            });

            return {
              betId: log.args.betId!,
              claimer: log.args.claimer!,
              amount: log.args.amount!,
              timestamp: Number(block.timestamp),
              transactionHash: log.transactionHash,
            };
          })
        );

        claimsWithTime.sort((a, b) => b.timestamp - a.timestamp);

        setClaims(claimsWithTime);
        setError(null);
      } catch (err) {
        console.error("Error fetching claim history:", err);
        setError(err as Error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchClaims();
  }, [publicClient, userAddress]);

  return { claims, isLoading, error };
}

/**
 * Hook to fetch position trading history
 * Shows all position sales
 */
export function usePositionTradeHistory(marketId?: number) {
  const publicClient = usePublicClient();
  const [trades, setTrades] = useState<PositionSaleEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    async function fetchTrades() {
      if (!publicClient) return;

      try {
        setIsLoading(true);

        const currentBlock = await publicClient.getBlockNumber();
        const fromBlock = currentBlock > BigInt(9999) ? currentBlock - BigInt(9999) :BigInt(0);

        const logs = await publicClient.getLogs({
          address: CONTRACTS.PREDICTION_MARKET,
          event: parseAbiItem('event PositionSold(uint256 indexed betId, address seller, address buyer, uint256 price)'),
          fromBlock,
          toBlock: 'latest',
        });

        const tradesWithTime = await Promise.all(
          logs.map(async (log) => {
            const block = await publicClient.getBlock({
              blockNumber: log.blockNumber
            });

            return {
              betId: log.args.betId!,
              seller: log.args.seller!,
              buyer: log.args.buyer!,
              price: log.args.price!,
              timestamp: Number(block.timestamp),
              transactionHash: log.transactionHash,
            };
          })
        );

        tradesWithTime.sort((a, b) => b.timestamp - a.timestamp);

        setTrades(tradesWithTime);
        setError(null);
      } catch (err) {
        console.error("Error fetching position trade history:", err);
        setError(err as Error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchTrades();
  }, [publicClient, marketId]);

  return { trades, isLoading, error };
}

/**
 * Hook to fetch all resolved markets
 * Shows historical market outcomes
 */
export function useMarketResolutionHistory() {
  const publicClient = usePublicClient();
  const [resolutions, setResolutions] = useState<ResolutionEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchResolutions() {
      if (!publicClient) return;

      try {
        setIsLoading(true);

        const currentBlock = await publicClient.getBlockNumber();
        const fromBlock = currentBlock > BigInt(9999) ? currentBlock - BigInt(9999) : BigInt(0);

        const logs = await publicClient.getLogs({
          address: CONTRACTS.PREDICTION_MARKET,
          event: parseAbiItem('event MarketResolved(uint256 indexed marketId, uint256 winningOutcome)'),
          fromBlock,
          toBlock: 'latest',
        });

        const resolutionsWithTime = await Promise.all(
          logs.map(async (log) => {
            const block = await publicClient.getBlock({
              blockNumber: log.blockNumber
            });

            return {
              marketId: log.args.marketId!,
              winningOutcome: log.args.winningOutcome!,
              timestamp: Number(block.timestamp),
              transactionHash: log.transactionHash,
            };
          })
        );

        resolutionsWithTime.sort((a, b) => b.timestamp - a.timestamp);

        setResolutions(resolutionsWithTime);
      } catch (err) {
        console.error("Error fetching resolution history:", err);
      } finally {
        setIsLoading(false);
      }
    }

    fetchResolutions();
  }, [publicClient]);

  return { resolutions, isLoading };
}

/**
 * Hook to calculate market statistics from events
 * Returns total bets, unique bettors, etc.
 */
export function useMarketStatistics(marketId: number) {
  const { bets, isLoading } = useMarketBetHistory(marketId);

  const stats = {
    totalBets: bets.length,
    uniqueBettors: new Set(bets.map(b => b.bettor)).size,
    totalVolume: bets.reduce((sum, bet) => sum + bet.amount, BigInt(0)),
    averageBetSize: bets.length > 0
      ? bets.reduce((sum, bet) => sum + bet.amount,BigInt(0)) / BigInt(bets.length)
      : BigInt(0),
    firstBetTime: bets.length > 0 ? bets[bets.length - 1].timestamp : 0,
    lastBetTime: bets.length > 0 ? bets[0].timestamp : 0,
  };

  return { stats, isLoading };
}

/**
 * Hook to get recent platform-wide activity
 * Shows all recent bets across all markets
 */
export function usePlatformActivity(limit: number = 20) {
  const publicClient = usePublicClient();
  const [activity, setActivity] = useState<BetEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchActivity() {
      if (!publicClient) return;

      try {
        setIsLoading(true);

        const currentBlock = await publicClient.getBlockNumber();
        // Only last 10,000 blocks for recent activity
        const fromBlock = currentBlock > BigInt(10000) ? currentBlock - BigInt(10000) : BigInt(0);

        const logs = await publicClient.getLogs({
          address: CONTRACTS.PREDICTION_MARKET,
          event: parseAbiItem('event BetPlaced(uint256 indexed betId, uint256 indexed marketId, address indexed bettor, uint256 amount)'),
          fromBlock,
          toBlock: 'latest',
        });

        const recentBets = await Promise.all(
          logs.slice(-limit).map(async (log) => {
            const block = await publicClient.getBlock({
              blockNumber: log.blockNumber
            });

            return {
              betId: log.args.betId!,
              marketId: log.args.marketId!,
              bettor: log.args.bettor!,
              amount: log.args.amount!,
              timestamp: Number(block.timestamp),
              blockNumber: log.blockNumber!,
              transactionHash: log.transactionHash,
            };
          })
        );

        recentBets.sort((a, b) => b.timestamp - a.timestamp);

        setActivity(recentBets);
      } catch (err) {
        console.error("Error fetching platform activity:", err);
      } finally {
        setIsLoading(false);
      }
    }

    fetchActivity();
  }, [publicClient, limit]);

  return { activity, isLoading };
}