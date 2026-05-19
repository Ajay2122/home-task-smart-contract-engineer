import { useEffect, useState } from "react";
import { useMarketPrice } from "./useMarkets";
import { useMarketBetHistory } from "./useEventHistory";

interface PricePoint {
  timestamp: number;
  price: number;
  blockNumber: bigint;
}

interface PriceHistory {
  [outcomeIndex: number]: PricePoint[];
}

const STORAGE_PREFIX = "price_history_";
const MAX_POINTS = 100; // Keep last 100 data points per outcome

/**
 * Hook to track and store historical price data for a market
 * Uses localStorage to persist data across sessions
 * Updates when new bets are detected
 */
export function usePriceHistory(marketId: number, outcomeCount: number) {
  const [priceHistory, setPriceHistory] = useState<PriceHistory>({});
  const [isLoading, setIsLoading] = useState(true);

  const { bets } = useMarketBetHistory(marketId);

  useEffect(() => {
    if (marketId <= 0 || outcomeCount <= 0) return;

    // Load existing history from localStorage
    const storageKey = `${STORAGE_PREFIX}${marketId}`;
    const stored = localStorage.getItem(storageKey);

    if (stored) {
      try {
        const parsed = JSON.parse(stored) as Record<string, Array<{
          timestamp: number;
          price: number;
          blockNumber: string;
        }>>;
        // Convert string blockNumbers back to BigInt
        const converted: PriceHistory = {};
        Object.keys(parsed).forEach((key) => {
          converted[parseInt(key)] = parsed[key].map((point) => ({
            ...point,
            blockNumber: BigInt(point.blockNumber),
          }));
        });
        setPriceHistory(converted);
      } catch (err) {
        console.error("Failed to parse price history:", err);
      }
    }

    setIsLoading(false);
  }, [marketId, outcomeCount]);

  // Update history when new bets come in
  useEffect(() => {
    if (!bets || bets.length === 0) return;

    const updateHistory = async () => {
      const storageKey = `${STORAGE_PREFIX}${marketId}`;

      // Load from localStorage to avoid dependency loop
      const stored = localStorage.getItem(storageKey);
      const newHistory: PriceHistory = {};

      if (stored) {
        try {
          const parsed = JSON.parse(stored) as Record<string, Array<{
            timestamp: number;
            price: number;
            blockNumber: string;
          }>>;
          Object.keys(parsed).forEach((key) => {
            newHistory[parseInt(key)] = parsed[key].map((point) => ({
              ...point,
              blockNumber: BigInt(point.blockNumber),
            }));
          });
        } catch (err) {
          console.error("Failed to parse existing history:", err);
        }
      }

      // Group bets by outcome and get latest bet per outcome
      const latestBets = new Map<number, typeof bets[0]>();

      bets.forEach((bet) => {
        const outcomeIdx = Number(bet.marketId); // This would need the actual outcome index
        const existing = latestBets.get(outcomeIdx);
        if (!existing || bet.timestamp > existing.timestamp) {
          latestBets.set(outcomeIdx, bet);
        }
      });

      // Initialize history for all outcomes
      for (let i = 0; i < outcomeCount; i++) {
        if (!newHistory[i]) {
          newHistory[i] = [];
        }
      }

      setPriceHistory(newHistory);

      // Save to localStorage (convert BigInt to string for JSON)
      const toStore: Record<string, Array<{
        timestamp: number;
        price: number;
        blockNumber: string;
      }>> = {};
      Object.keys(newHistory).forEach((key) => {
        toStore[key] = newHistory[parseInt(key)].map((point) => ({
          ...point,
          blockNumber: point.blockNumber.toString(),
        }));
      });

      try {
        localStorage.setItem(storageKey, JSON.stringify(toStore));
      } catch (err) {
        console.error("Failed to save price history:", err);
      }
    };

    updateHistory();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bets, marketId, outcomeCount]);

  return { priceHistory, isLoading };
}

/**
 * Hook to record current prices periodically
 * Call this from market detail pages to track prices over time
 */
export function useRecordPriceHistory(
  marketId: number,
  outcomes: readonly string[],
  enabled: boolean = true
) {
  const prices = outcomes.map((_, idx) => {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const { data } = useMarketPrice(marketId, idx);
    return data ? Number(data) : 50;
  });

  useEffect(() => {
    if (!enabled || marketId <= 0 || outcomes.length === 0) return;

    const recordPrices = () => {
      const storageKey = `${STORAGE_PREFIX}${marketId}`;
      const stored = localStorage.getItem(storageKey);

      const history: PriceHistory = {};

      if (stored) {
        try {
          const parsed = JSON.parse(stored) as Record<string, Array<{
            timestamp: number;
            price: number;
            blockNumber: string;
          }>>;
          Object.keys(parsed).forEach((key) => {
            history[parseInt(key)] = parsed[key].map((point) => ({
              ...point,
              blockNumber: BigInt(point.blockNumber || "0"),
            }));
          });
        } catch (err) {
          console.error("Failed to parse existing history:", err);
        }
      }

      // Record current prices
      const now = Date.now();

      outcomes.forEach((_, idx) => {
        if (!history[idx]) {
          history[idx] = [];
        }

        const newPoint: PricePoint = {
          timestamp: now,
          price: prices[idx],
          blockNumber: BigInt(0), // We don't have block number in client-side recording
        };

        history[idx].push(newPoint);

        // Keep only last MAX_POINTS
        if (history[idx].length > MAX_POINTS) {
          history[idx] = history[idx].slice(-MAX_POINTS);
        }
      });

      // Save to localStorage
      const toStore: Record<string, Array<{
        timestamp: number;
        price: number;
        blockNumber: string;
      }>> = {};
      Object.keys(history).forEach((key) => {
        toStore[key] = history[parseInt(key)].map((point) => ({
          ...point,
          blockNumber: point.blockNumber.toString(),
        }));
      });

      try {
        localStorage.setItem(storageKey, JSON.stringify(toStore));
      } catch (err) {
        console.error("Failed to save price history:", err);
      }
    };

    // Record immediately
    recordPrices();

    // Record every 5 minutes
    const interval = setInterval(recordPrices, 5 * 60 * 1000);

    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [marketId, outcomes.length, enabled]);
}

/**
 * Clear price history for a specific market
 */
export function clearPriceHistory(marketId: number) {
  const storageKey = `${STORAGE_PREFIX}${marketId}`;
  localStorage.removeItem(storageKey);
}

/**
 * Clear all price history
 */
export function clearAllPriceHistory() {
  const keys = Object.keys(localStorage);
  keys.forEach((key) => {
    if (key.startsWith(STORAGE_PREFIX)) {
      localStorage.removeItem(key);
    }
  });
}
