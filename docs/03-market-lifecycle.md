# Market Lifecycle

## Overview

A prediction market goes through these stages:
1. **Creation** - Market is created with outcomes and parameters
2. **Open** - Users can place bets and trade positions
3. **Resolution** - Arbitrator determines winning outcome
4. **Claiming** - Winners claim their payouts

---

## 1. Market Creation

### Creating a Market

**Required Parameters**:
- **Question**: 10-200 characters
- **Description**: 20-1000 characters
- **Outcomes**: 2-10 possible outcomes (max 50 chars each)
- **Resolution Date**: Future datetime
- **Arbitrator**: Ethereum address
- **Token Type**: ETH or USDC

**Example - Binary Market**:
```typescript
{
  question: "Will Bitcoin reach $100k by end of 2025?",
  description: "Market resolves YES if BTC hits $100,000...",
  outcomes: ["Yes", "No"],
  resolutionDate: "2025-12-31T23:59",
  arbitrator: "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb",
  tokenType: "ETH"
}
```

### Smart Contract Call

**ETH Market**:
```solidity
PredictionMarket.createMarket(
    "Will Bitcoin reach $100k by end of 2025?",
    "Market resolves YES if...",
    ["Yes", "No"],
    1735689599,  // Unix timestamp
    0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb,
    0x0000000000000000000000000000000000000000  // ETH
)
```

### Initial State

- **Status**: Open (0)
- **Total Volume**: 0
- **Outcome Pools**: All 0
- **Outcome Shares**: All 0

---

## 2. Betting Phase

### Placing Bets

#### ETH Markets

```typescript
await predictionMarket.placeBet(
    marketId,
    outcomeIndex,
    amount,
    { value: parseEther("0.1") }
)
```

#### ERC20 Markets (Two-Step)

1. **Approve**:
```typescript
await mockUSDC.approve(
    predictionMarketAddress,
    parseEther("100")
)
```

2. **Place Bet**:
```typescript
await predictionMarket.placeBet(
    marketId,
    outcomeIndex,
    parseEther("100")
)
```

### Share Calculation

**First Bet**:
```
shares = amount * 100
```

**Subsequent Bets**:
```
shares = (amount * 100 * totalPool) / (newPool * currentPool)
```

### Price/Probability

```
price = (outcomePool * 100) / totalPool
```

Returns percentage (0-100).

### Market Updates

After each bet:
- `outcomePools[marketId][outcomeIndex] += amount`
- `outcomeShares[marketId][outcomeIndex] += shares`
- `market.totalVolume += amount`
- `userBets[bettor].push(betId)`
- `marketBets[marketId].push(betId)`

---

## 3. Market Resolution

### Requirements

- **Who**: Only the designated arbitrator
- **When**: After `resolutionTime` has passed
- **Status**: Market must be Open

### Resolution Process

```solidity
PredictionMarket.resolveMarket(marketId, winningOutcomeIndex)
```

**Validations**:
- `msg.sender == market.arbitrator`
- `block.timestamp >= market.resolutionTime`
- `market.status == MarketStatus.Open`
- `winningOutcome < market.outcomes.length`

**Changes**:
- `market.status = Resolved (2)`
- `market.winningOutcome = winningOutcomeIndex`

---

## 4. Claiming Winnings

### Payout Calculation

**For Winners**:
```solidity
totalWinningShares = outcomeShares[marketId][winningOutcome]
totalPool = sum of all outcome pools
payout = (betShares * totalPool) / totalWinningShares
fee = (payout * 2) / 100
netPayout = payout - fee
```

### Smart Contract Call

```solidity
PredictionMarket.claimWinnings(betId)
```

**For Winners**:
1. Mark `bet.claimed = true`
2. Calculate payout and fee
3. Store fee: `collectedFees[tokenAddress] += fee`
4. Update reputation: `reputationSystem.updateReputation(user, true)`
5. Transfer net payout
6. Emit `WinningsClaimed(betId, claimer, netPayout)`

**For Losers**:
1. Mark `bet.claimed = true`
2. Update reputation: `reputationSystem.updateReputation(user, false)`
3. No payout

### Fee Collection

Owner can withdraw fees:
```solidity
PredictionMarket.withdrawFees(tokenAddress)
```

Fees tracked separately for ETH (address(0)) and each ERC20.

---

## Market Status Flow

```
CREATE → OPEN → RESOLVED
         (betting)  (claiming)
```

**Note**: Closed (1) and Cancelled (3) statuses are defined but not used.

---

## Time Constraints

### Before Resolution Time
- Market status: Open
- Users can: Place bets, list positions, buy positions
- Arbitrator cannot: Resolve market

### After Resolution Time
- Market status: Open (until arbitrator resolves)
- Users can: Continue betting
- Arbitrator can: Resolve market

### After Resolution
- Market status: Resolved
- Users can: Claim winnings only
- Users cannot: Place new bets, trade positions

---

## Edge Cases

### Position Ownership Transfer
If position sold before resolution:
- Original bettor no longer owns bet
- New owner can claim winnings
- Reputation update goes to claimer (not original bettor)

### Multiple Outcomes
- Only bets on winning outcome get payouts
- All losing outcomes receive nothing
- Total pool divided among all winning shares

### Unclaimed Winnings
- Winners can claim anytime after resolution
- No time limit
- Funds remain in contract
