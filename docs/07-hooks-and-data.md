# Hooks and Data

## Contract Read Hooks

### useMarkets.ts

**useMarketCount()**
```typescript
const { data: marketCount } = useMarketCount();
// Returns total number of markets
```

**useMarket(marketId)**
```typescript
const { data: market } = useMarket(marketId);
// Returns full market tuple
```

**useMarkets(count)**
```typescript
const { data: marketsData } = useMarkets(count);
// Returns array of markets using useReadContracts
```

**useMarketPrice(marketId, outcomeIndex)**
```typescript
const { data: price } = useMarketPrice(marketId, outcomeIndex);
// Returns probability (0-100)
```

**useTotalPool(marketId)**
```typescript
const { data: totalPool } = useTotalPool(marketId);
// Returns sum of all outcome pools
```

**useMarketPools(marketId, outcomeCount)**
```typescript
const { pools, isLoading } = useMarketPools(marketId, outcomeCount);
// Returns array of pools for all outcomes
```

**useMarketTokenAddress(marketId)**
```typescript
const { data: tokenAddress } = useMarketTokenAddress(marketId);
// Returns token address (0x0 for ETH)
```

---

## Betting Hooks

### useBet.ts

**usePlaceBet()**
```typescript
const { placeBet, isPending, isConfirming, isSuccess, hash } = usePlaceBet();

placeBet(marketId, outcomeIndex, amount, tokenAddress);
// ETH: tokenAddress undefined or 0x0, sends msg.value
// ERC20: tokenAddress provided, requires prior approval
```

**useApproveERC20()**
```typescript
const { approve, isPending, isConfirming, isSuccess } = useApproveERC20();

approve(tokenAddress, amount);
// Approves PredictionMarket to spend tokens
```

**useERC20Allowance(tokenAddress, userAddress)**
```typescript
const { data: allowance } = useERC20Allowance(tokenAddress, userAddress);
// Returns current allowance
```

**useERC20Balance(tokenAddress, userAddress)**
```typescript
const { data: balance } = useERC20Balance(tokenAddress, userAddress);
// Returns user token balance
```

**useClaimWinnings()**
```typescript
const { claimWinnings, isPending, isConfirming, isSuccess } = useClaimWinnings();

claimWinnings(betId);
```

---

## Portfolio Hooks

### usePortfolio.ts

**useUserBets(address)**
```typescript
const { data: betIds } = useUserBets(address);
// Returns array of bet IDs for user
```

**useBet(betId)**
```typescript
const { data: bet } = useBet(betId);
// Returns bet tuple
```

**useBets(betIds)**
```typescript
const { data: betsData } = useBets(betIds);
// Returns array of bets using useReadContracts
```

**useUserReputation(address)**
```typescript
const { data: reputation } = useUserReputation(address);
// Returns [reputation, totalBets, correctBets, accuracy]
```

**usePortfolio()**
```typescript
const { address, betIds, betsData, reputation, isLoading } = usePortfolio();
// Combined hook for portfolio page
```

**usePositionForSale(betId)**
```typescript
const { data: isForSale } = usePositionForSale(betId);
```

**usePositionPrice(betId)**
```typescript
const { data: price } = usePositionPrice(betId);
```

---

## Position Trading Hooks

### usePositionTrading.ts

**useListPosition()**
```typescript
const { listPosition, isPending, isConfirming, isSuccess } = useListPosition();

listPosition(betId, priceInEth);
```

**useBuyPosition()**
```typescript
const { buyPosition, isPending, isConfirming, isSuccess } = useBuyPosition();

buyPosition(betId, priceInEth);
// Sends ETH value with transaction
```

---

## Marketplace Hooks

### useMarketplaceListings.ts

**useMarketplaceListings()**
```typescript
const { listings, isLoading, error } = useMarketplaceListings();

// Returns array of:
{
  betId: bigint,
  price: bigint,
  seller: string,
  marketId: bigint,
  outcomeIndex: bigint,
  amount: bigint,
  shares: bigint,
  timestamp: number
}
```

Uses events to find active listings:
- Queries PositionListed events
- Filters out PositionSold events
- Verifies on-chain with positionsForSale mapping
- Refreshes every 30 seconds

**useMarketplaceStats()**
```typescript
const { stats, isLoading } = useMarketplaceStats();

// Returns:
{
  totalListings: number,
  totalValue: bigint,
  uniqueMarkets: number,
  uniqueSellers: number
}
```

---

## Event History Hooks

### useEventHistory.ts

**useMarketBetHistory(marketId)**
```typescript
const { bets, isLoading, error } = useMarketBetHistory(marketId);

// Returns array of BetPlaced events with timestamps
```

**useUserBetHistory(userAddress)**
```typescript
const { bets, isLoading, error } = useUserBetHistory(userAddress);

// Returns all bets by user
```

**useClaimHistory(userAddress)**
```typescript
const { claims, isLoading, error } = useClaimHistory(userAddress);

// Returns all WinningsClaimed events
```

**usePositionTradeHistory(marketId)**
```typescript
const { trades, isLoading, error } = usePositionTradeHistory(marketId);

// Returns all PositionSold events
```

**useMarketResolutionHistory()**
```typescript
const { resolutions, isLoading } = useMarketResolutionHistory();

// Returns all MarketResolved events
```

**useMarketStatistics(marketId)**
```typescript
const { stats, isLoading } = useMarketStatistics(marketId);

// Calculates stats from bet history:
// totalBets, uniqueBettors, totalVolume, averageBetSize, firstBetTime, lastBetTime
```

**usePlatformActivity(limit)**
```typescript
const { activity, isLoading } = usePlatformActivity(20);

// Returns recent platform-wide bets
```

---

## Statistics Hooks

### useStats.ts

**usePlatformStats()**
```typescript
const { totalVolume, totalVolumeUSD, activeMarkets, isLoading } = usePlatformStats();
```

Calculates:
- Total volume across all markets
- USD value (ETH @ $3500, USDC @ $1)
- Active markets count

**useTotalTraders()**
```typescript
const traders = useTotalTraders();
// Counts unique bettors from activity
```

**useTotalVolume()**
```typescript
const totalVolume = useTotalVolume();
// Sum of all market volumes
```

---

## Market Creation Hooks

### useCreateMarket.ts

**useCreateMarket()**
```typescript
const { createMarket, isPending, isConfirming, isSuccess, hash, error } = useCreateMarket();

createMarket(question, description, outcomes, resolutionTime, arbitrator, tokenAddress);
```

**useResolveMarket()**
```typescript
const { resolveMarket, isPending, isConfirming, isSuccess } = useResolveMarket();

resolveMarket(marketId, winningOutcome);
```

---

## Price History Hooks

### usePriceHistory.ts

**Note**: Price history implementation exists but is not fully integrated in UI.

**usePriceHistory(marketId, outcomeCount)**
```typescript
const { priceHistory, isLoading } = usePriceHistory(marketId, outcomeCount);
// Loads from localStorage
```

**useRecordPriceHistory(marketId, outcomes, enabled)**
```typescript
useRecordPriceHistory(marketId, outcomes, true);
// Records prices every 5 minutes to localStorage
```

---

## Data Flow

```
Component
    ↓
Wagmi Hook (useReadContract/useWriteContract)
    ↓
Viem Client
    ↓
RPC Provider
    ↓
Smart Contract
```

**Caching**: React Query automatically caches contract reads and refetches on block changes.

**Write Flow**:
1. User action triggers hook
2. Hook calls wagmi's `writeContract`
3. Wallet prompts user for signature
4. Transaction sent to network
5. `useWaitForTransactionReceipt` tracks confirmation
6. `isSuccess` triggers UI updates
7. React Query refetches affected data
