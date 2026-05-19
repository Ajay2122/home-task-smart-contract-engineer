# API Reference

## Smart Contract Functions

### PredictionMarket

#### Write Functions

**createMarket**
```solidity
function createMarket(
    string memory _question,
    string memory _description,
    string[] memory _outcomes,
    uint256 _resolutionTime,
    address _arbitrator,
    address _tokenAddress
) external returns (uint256 marketId)
```

**placeBet**
```solidity
function placeBet(
    uint256 _marketId,
    uint256 _outcomeIndex,
    uint256 _amount
) external payable nonReentrant returns (uint256 betId)
```

**resolveMarket**
```solidity
function resolveMarket(uint256 _marketId, uint256 _winningOutcome) external
```

**claimWinnings**
```solidity
function claimWinnings(uint256 _betId) external nonReentrant
```

**listPosition**
```solidity
function listPosition(uint256 _betId, uint256 _price) external
```

**buyPosition**
```solidity
function buyPosition(uint256 _betId) external payable nonReentrant
```

**withdrawFees**
```solidity
function withdrawFees(address _tokenAddress) external onlyOwner nonReentrant
```

#### Read Functions

**markets**
```solidity
function markets(uint256 _marketId) public view returns (Market memory)
```

**bets**
```solidity
function bets(uint256 _betId) public view returns (Bet memory)
```

**getMarket**
```solidity
function getMarket(uint256 _marketId) external view returns (
    uint256 id,
    string memory question,
    string memory description,
    string[] memory outcomes,
    uint256 resolutionTime,
    address arbitrator,
    address creator,
    MarketStatus status,
    uint256 totalVolume,
    address tokenAddress
)
```

**getUserBets**
```solidity
function getUserBets(address _user) external view returns (uint256[] memory)
```

**getMarketBets**
```solidity
function getMarketBets(uint256 _marketId) external view returns (uint256[] memory)
```

**getTotalPool**
```solidity
function getTotalPool(uint256 _marketId) public view returns (uint256)
```

**getPrice**
```solidity
function getPrice(uint256 _marketId, uint256 _outcomeIndex) public view returns (uint256)
```

**calculateShares**
```solidity
function calculateShares(
    uint256 _marketId,
    uint256 _outcomeIndex,
    uint256 _amount
) public view returns (uint256)
```

**getAvailableFees**
```solidity
function getAvailableFees(address _tokenAddress) external view returns (uint256)
```

**marketCount**
```solidity
function marketCount() public view returns (uint256)
```

**betCount**
```solidity
function betCount() public view returns (uint256)
```

**outcomePools**
```solidity
function outcomePools(uint256 marketId, uint256 outcomeIndex) public view returns (uint256)
```

**outcomeShares**
```solidity
function outcomeShares(uint256 marketId, uint256 outcomeIndex) public view returns (uint256)
```

**positionsForSale**
```solidity
function positionsForSale(uint256 betId) public view returns (bool)
```

**positionPrices**
```solidity
function positionPrices(uint256 betId) public view returns (uint256)
```

**collectedFees**
```solidity
function collectedFees(address tokenAddress) public view returns (uint256)
```

---

### ReputationSystem

#### Write Functions

**updateReputation**
```solidity
function updateReputation(address user, bool correct) external onlyPredictionMarket
```

**setPredictionMarket**
```solidity
function setPredictionMarket(address _predictionMarket) external onlyOwner
```

#### Read Functions

**getReputation**
```solidity
function getReputation(address user) external view returns (uint256)
```

**getStats**
```solidity
function getStats(address user) external view returns (
    uint256 rep,
    uint256 total,
    uint256 correct,
    uint256 accuracy
)
```

**getWeight**
```solidity
function getWeight(address user) external view returns (uint256)
```

**reputation**
```solidity
function reputation(address user) public view returns (uint256)
```

**totalBets**
```solidity
function totalBets(address user) public view returns (uint256)
```

**correctBets**
```solidity
function correctBets(address user) public view returns (uint256)
```

---

### MockERC20

#### Write Functions

**approve**
```solidity
function approve(address spender, uint256 amount) external returns (bool)
```

**transfer**
```solidity
function transfer(address to, uint256 amount) external returns (bool)
```

**transferFrom**
```solidity
function transferFrom(address from, address to, uint256 amount) external returns (bool)
```

**mint**
```solidity
function mint(address to, uint256 amount) external
```

#### Read Functions

**balanceOf**
```solidity
function balanceOf(address account) external view returns (uint256)
```

**allowance**
```solidity
function allowance(address owner, address spender) external view returns (uint256)
```

**decimals**
```solidity
function decimals() external view returns (uint8)
```

**totalSupply**
```solidity
function totalSupply() external view returns (uint256)
```

---

## Frontend Hooks API

### Contract Interaction Hooks

**useWriteContract**
```typescript
const { writeContract, isPending, error } = useWriteContract();
```

**useReadContract**
```typescript
const { data, isLoading, error } = useReadContract({ address, abi, functionName, args });
```

**useReadContracts**
```typescript
const { data, isLoading } = useReadContracts({ contracts: [...] });
```

**useWaitForTransactionReceipt**
```typescript
const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });
```

### Wallet Hooks

**useAccount**
```typescript
const { address, isConnected } = useAccount();
```

**usePublicClient**
```typescript
const publicClient = usePublicClient();
```

---

## Utility Functions

### Formatting (lib/utils/format.ts)

**formatAddress**
```typescript
function formatAddress(address: string): string
// Returns: "0x1234...5678"
```

**formatCurrency**
```typescript
function formatCurrency(value: bigint | string, decimals = 18): string
// Returns: "$1.23"
```

**formatDate**
```typescript
function formatDate(timestamp: number): string
// Returns: "Jan 1, 2024"
```

**formatTimeRemaining**
```typescript
function formatTimeRemaining(timestamp: number): string
// Returns: "2d 5h" or "Ended"
```

### Viem Functions

**parseEther**
```typescript
parseEther("1.5") // Returns: 1500000000000000000n
```

**formatEther**
```typescript
formatEther(1500000000000000000n) // Returns: "1.5"
```

**parseUnits**
```typescript
parseUnits("100", 6) // For USDC: 100000000n
```

**formatUnits**
```typescript
formatUnits(100000000n, 6) // Returns: "100"
```

---

## Events

### Contract Events

**PredictionMarket**
- `MarketCreated(uint256 indexed marketId, address indexed creator, string question)`
- `BetPlaced(uint256 indexed betId, uint256 indexed marketId, address indexed bettor, uint256 amount)`
- `MarketResolved(uint256 indexed marketId, uint256 winningOutcome)`
- `WinningsClaimed(uint256 indexed betId, address indexed claimer, uint256 amount)`
- `PositionListed(uint256 indexed betId, uint256 price)`
- `PositionSold(uint256 indexed betId, address seller, address buyer, uint256 price)`
- `FeesWithdrawn(address indexed token, uint256 amount, address indexed to)`

**ReputationSystem**
- `ReputationUpdated(address indexed user, uint256 newReputation, bool correct)`

---

## Constants

**PredictionMarket**
```solidity
PLATFORM_FEE = 2
FEE_DENOMINATOR = 100
```

**ReputationSystem**
```solidity
BASE_REPUTATION = 100
CORRECT_BONUS = 10
INCORRECT_PENALTY = 5
MAX_REPUTATION = 1000
```

---

## Contract Addresses

Configured via environment variables:
- `process.env.NEXT_PUBLIC_PREDICTION_MARKET_ADDRESS`
- `process.env.NEXT_PUBLIC_REPUTATION_SYSTEM_ADDRESS`
- `process.env.NEXT_PUBLIC_MOCK_USDC_ADDRESS`

Import from: `lib/contracts/addresses.ts`

```typescript
import { CONTRACTS } from "@/lib/contracts/addresses";

CONTRACTS.PREDICTION_MARKET
CONTRACTS.REPUTATION_SYSTEM
CONTRACTS.MOCK_USDC
```

---

## Error Messages

Common revert messages:

- `"Need at least 2 outcomes"`
- `"Resolution must be in future"`
- `"Invalid arbitrator"`
- `"Market not open"`
- `"Invalid outcome"`
- `"Amount must be > 0"`
- `"Only arbitrator"`
- `"Too early"` (resolution)
- `"Not your bet"`
- `"Already claimed"`
- `"Market not resolved"`
- `"Position not for sale"`
- `"Insufficient payment"`
- `"No fees to withdraw"`
- `"Only prediction market"`
