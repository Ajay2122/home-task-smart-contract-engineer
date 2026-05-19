# Position Trading

## Overview

Position trading allows users to trade betting positions before market resolution via a P2P marketplace.

---

## Listing a Position

**Requirements**:
- You must own the bet
- Bet must not be claimed
- Market must be Open

**Process**:
```solidity
PredictionMarket.listPosition(betId, price)
```

**State Changes**:
- `positionsForSale[betId] = true`
- `positionPrices[betId] = price`

---

## Buying a Position

**Requirements**:
- Position must be listed
- Send ETH equal to asking price

**Process**:
```solidity
PredictionMarket.buyPosition(betId) payable
```

**State Changes**:
- `bet.bettor = buyer` (ownership transfer)
- `positionsForSale[betId] = false`
- Transfer ETH to seller

---

## Position Ownership

### Bet Struct
```solidity
struct Bet {
    address bettor;  // Current owner (changes when sold)
    ...
}
```

### User Bets Array

**Important**: `userBets[address]` is only updated when bets are **placed**, not when bought.

```solidity
mapping(address => uint256[]) public userBets;
```

**Example**:
- Alice places bet #1 → `userBets[Alice] = [1]`
- Bob buys bet #1 → `bet.bettor = Bob`
- But `userBets[Alice]` still contains `[1]`

**Portfolio Display**: Frontend filters by `bet.bettor == currentUser` to show only owned positions.

---

## Marketplace

### Finding Listings

Uses blockchain events:

```typescript
// Get PositionListed events
const listedEvents = getLogs('PositionListed')

// Get PositionSold events (to filter out)
const soldEvents = getLogs('PositionSold')

// Active = Listed but not sold
const activeListings = listed.filter(not_in_sold)

// Verify on-chain
const isForSale = positionsForSale[betId]
const currentPrice = positionPrices[betId]
```

### Marketplace Statistics

- Total Listings: Count of active positions
- Total Value: Sum of asking prices
- Active Markets: Unique market IDs
- Sellers: Unique seller addresses

---

## Hooks

**useListPosition**
```typescript
const { listPosition, isPending } = useListPosition();
listPosition(betId, "0.5"); // 0.5 ETH
```

**useBuyPosition**
```typescript
const { buyPosition, isPending } = useBuyPosition();
buyPosition(betId, "0.5");
```

**useMarketplaceListings**
```typescript
const { listings, isLoading } = useMarketplaceListings();
// Returns array of listings with bet details
```

---

## Payment

- **Listing**: No payment, just gas
- **Buying**: ETH payment only (even for USDC markets)
- Position trading uses ETH; underlying bet keeps original token

---

## Edge Cases

### Position Sold While Viewing
Transaction reverts if `positionsForSale[betId] = false`

### Market Resolved Before Purchase
`listPosition()` checks market.status == Open, reverts if resolved

### Seller Claims While Listed
`claimWinnings()` marks `bet.claimed = true`, buyers can't buy claimed bets
