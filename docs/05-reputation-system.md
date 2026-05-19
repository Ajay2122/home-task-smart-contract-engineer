# Reputation System

## Overview

Tracks user prediction accuracy and rewards consistent performance with points-based scoring (100-1000).

---

## How It Works

### Initial State

New users default to BASE_REPUTATION (100) when first claiming.

```solidity
if (reputation[user] == 0) {
    reputation[user] = BASE_REPUTATION; // 100
}
```

---

## Reputation Updates

### Update Trigger

Called from `PredictionMarket.claimWinnings()`:

```solidity
if (bet.outcomeIndex == market.winningOutcome) {
    reputationSystem.updateReputation(msg.sender, true);  // Winner
} else {
    reputationSystem.updateReputation(msg.sender, false); // Loser
}
```

### Correct Prediction (Win)

```solidity
totalBets[user]++;
correctBets[user]++;
reputation[user] += CORRECT_BONUS; // +10
// Capped at MAX_REPUTATION (1000)
```

### Incorrect Prediction (Loss)

```solidity
totalBets[user]++;
reputation[user] -= INCORRECT_PENALTY; // -5
// Floored at 0
```

---

## Constants

```solidity
BASE_REPUTATION = 100
CORRECT_BONUS = 10
INCORRECT_PENALTY = 5
MAX_REPUTATION = 1000
```

---

## User Statistics

### getStats

```solidity
function getStats(address user) external view returns (
    uint256 rep,
    uint256 total,
    uint256 correct,
    uint256 accuracy
)
```

Returns:
- `rep`: Current reputation (or 100 if new)
- `total`: Total bets claimed
- `correct`: Number of winning bets
- `accuracy`: `(correctBets * 100) / totalBets` (0 if no bets)

---

## Weight Calculation

### getWeight

```solidity
function getWeight(address user) external view returns (uint256)
```

Formula: `(reputation * (50 + accuracy)) / 100`

Returns BASE_REPUTATION (100) if user has no bets.

**Purpose**: For potential future weighted voting features.

---

## Frontend Integration

### useUserReputation Hook

```typescript
const { data } = useUserReputation(address);
// Returns: [reputation, totalBets, correctBets, accuracy]
```

### Portfolio Display

```typescript
const [rep, total, correct, accuracy] = reputation || [100, 0, 0, 0];

<StatsCard>
    <div>Reputation: {Number(rep)}</div>
    <div>Accuracy: {Number(accuracy)}%</div>
    <div>Total Bets: {Number(total)}</div>
    <div>Correct: {Number(correct)}</div>
</StatsCard>
```

---

## Access Control

```solidity
modifier onlyPredictionMarket() {
    require(msg.sender == predictionMarket, "Only prediction market");
    _;
}
```

Only PredictionMarket contract can call `updateReputation()`.

**Setup**:
```solidity
// During deployment
reputationSystem.setPredictionMarket(predictionMarketAddress);
```

---

## Events

```solidity
event ReputationUpdated(
    address indexed user,
    uint256 newReputation,
    bool correct
);
```

---

## API Reference

### Read Functions

**getReputation(address user) → uint256**
Returns current reputation (or 100 if new)

**getStats(address user) → (uint256, uint256, uint256, uint256)**
Returns reputation, totalBets, correctBets, accuracy

**getWeight(address user) → uint256**
Returns calculated weight

### Write Functions

**updateReputation(address user, bool correct)** [onlyPredictionMarket]
Updates reputation, totalBets, correctBets

**setPredictionMarket(address)** [onlyOwner]
One-time setup to link PredictionMarket contract
