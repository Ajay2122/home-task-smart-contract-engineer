# Smart Contracts

## Overview

Three smart contracts deployed on Sepolia testnet:

1. **PredictionMarket** - Core betting and market logic
2. **ReputationSystem** - User reputation and accuracy tracking
3. **MockERC20** - Test USDC token for stablecoin markets

## Contract Architecture

### PredictionMarket Contract

**Location**: `contracts/contracts/PredictionMarket.sol`

**Inherits**:
- `ReentrancyGuard` - Protection against reentrancy attacks
- `Ownable` - Owner-only functions for fee withdrawal

**Key Responsibilities**:
- Market creation and management
- Bet placement and share calculation
- Market resolution by arbitrators
- Winnings claims and payouts
- Position trading (listing/buying)
- Platform fee collection (2%)

#### Data Structures

```solidity
struct Market {
    uint256 id;
    string question;
    string description;
    string[] outcomes;
    uint256 resolutionTime;
    address arbitrator;
    address creator;
    uint256 createdAt;
    MarketStatus status;
    uint256 winningOutcome;
    address tokenAddress;      // 0x0 for ETH, ERC20 address for tokens
    uint256 totalVolume;
}

struct Bet {
    uint256 id;
    address bettor;
    uint256 marketId;
    uint256 outcomeIndex;
    uint256 amount;
    uint256 shares;
    uint256 timestamp;
    bool claimed;
}

enum MarketStatus { Open, Closed, Resolved, Cancelled }
```

**Note**: Status 1 (Closed) and 3 (Cancelled) are defined but not used in current implementation.

#### State Variables

```solidity
uint256 public marketCount;
uint256 public betCount;
uint256 public constant PLATFORM_FEE = 2;           // 2%
uint256 public constant FEE_DENOMINATOR = 100;

IReputationSystem public reputationSystem;

mapping(uint256 => Market) public markets;
mapping(uint256 => mapping(uint256 => uint256)) public outcomePools;
mapping(uint256 => mapping(uint256 => uint256)) public outcomeShares;
mapping(uint256 => Bet) public bets;
mapping(address => uint256[]) public userBets;
mapping(uint256 => uint256[]) public marketBets;

// Position trading
mapping(uint256 => bool) public positionsForSale;
mapping(uint256 => uint256) public positionPrices;

// Fee tracking (address(0) for ETH, token address for ERC20)
mapping(address => uint256) public collectedFees;
```

#### Core Functions

**createMarket**
```solidity
function createMarket(
    string memory _question,
    string memory _description,
    string[] memory _outcomes,
    uint256 _resolutionTime,
    address _arbitrator,
    address _tokenAddress
) external returns (uint256)
```
- Creates new prediction market
- Validates: 2+ outcomes, future resolution time, valid arbitrator
- Returns market ID
- Emits: `MarketCreated(marketId, creator, question)`

**placeBet**
```solidity
function placeBet(
    uint256 _marketId,
    uint256 _outcomeIndex,
    uint256 _amount
) external payable nonReentrant returns (uint256)
```
- Places bet on specific outcome
- ETH markets: requires `msg.value`
- ERC20 markets: requires prior approval, uses `transferFrom`
- Calculates shares using automated pricing algorithm
- Updates pools and market volume
- Returns bet ID
- Emits: `BetPlaced(betId, marketId, bettor, amount)`

**resolveMarket**
```solidity
function resolveMarket(uint256 _marketId, uint256 _winningOutcome) external
```
- Only callable by arbitrator
- Only after resolution time
- Sets winning outcome and status to Resolved
- Emits: `MarketResolved(marketId, winningOutcome)`

**claimWinnings**
```solidity
function claimWinnings(uint256 _betId) external nonReentrant
```
- Claims winnings for resolved market
- Winners: Calculates proportional payout, deducts 2% fee, transfers payout
- Losers: Marks as claimed (no payout)
- Updates user reputation for both winners and losers
- Stores collected fees in `collectedFees` mapping
- Emits: `WinningsClaimed(betId, claimer, amount)` (only for winners)

**listPosition**
```solidity
function listPosition(uint256 _betId, uint256 _price) external
```
- Lists position for sale on marketplace
- Only position owner can list
- Market must be open
- Bet must not be claimed
- Emits: `PositionListed(betId, price)`

**buyPosition**
```solidity
function buyPosition(uint256 _betId) external payable nonReentrant
```
- Buys listed position with ETH
- Transfers ownership (updates `bet.bettor`)
- Pays seller via ETH transfer
- Removes from sale
- Emits: `PositionSold(betId, seller, buyer, price)`

**withdrawFees**
```solidity
function withdrawFees(address _tokenAddress) external onlyOwner nonReentrant
```
- Owner-only function
- Withdraws collected platform fees
- Separate tracking for ETH (address(0)) and each ERC20
- Emits: `FeesWithdrawn(token, amount, to)`

**getAvailableFees**
```solidity
function getAvailableFees(address _tokenAddress) external view returns (uint256)
```
- View function to check available fees for withdrawal

#### Pricing Algorithm

**Share Calculation**
```solidity
function calculateShares(
    uint256 _marketId,
    uint256 _outcomeIndex,
    uint256 _amount
) public view returns (uint256)
```

Formula:
- If pool empty: `shares = amount * 100`
- Otherwise: `shares = (amount * 100 * totalPool) / (newPool * currentPool)`

**Price Calculation**
```solidity
function getPrice(uint256 _marketId, uint256 _outcomeIndex)
    public view returns (uint256)
```

Formula: `price = (outcomePool * 100) / totalPool`

Returns probability as percentage (0-100). Returns 50 if total pool is 0.

**Get Total Pool**
```solidity
function getTotalPool(uint256 _marketId) public view returns (uint256)
```
Sums all outcome pools for the market.

#### View Functions

**getUserBets**
```solidity
function getUserBets(address _user) external view returns (uint256[] memory)
```
Returns array of bet IDs for a user.

**getMarketBets**
```solidity
function getMarketBets(uint256 _marketId) external view returns (uint256[] memory)
```
Returns array of bet IDs for a market.

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
Returns full market details.

---

### ReputationSystem Contract

**Location**: `contracts/contracts/ReputationSystem.sol`

**Inherits**: `Ownable`

**Key Responsibilities**:
- Track user prediction accuracy
- Update reputation scores
- Calculate user weights

#### State Variables

```solidity
mapping(address => uint256) public reputation;
mapping(address => uint256) public totalBets;
mapping(address => uint256) public correctBets;

uint256 public constant BASE_REPUTATION = 100;
uint256 public constant CORRECT_BONUS = 10;
uint256 public constant INCORRECT_PENALTY = 5;
uint256 public constant MAX_REPUTATION = 1000;

address public predictionMarket;
```

#### Core Functions

**updateReputation**
```solidity
function updateReputation(address user, bool correct)
    external onlyPredictionMarket
```
- Called by PredictionMarket on claim
- Initializes new users at BASE_REPUTATION (100)
- Correct: +10 reputation (capped at 1000)
- Incorrect: -5 reputation (floored at 0)
- Updates totalBets and correctBets counters
- Emits: `ReputationUpdated(user, newReputation, correct)`

**getReputation**
```solidity
function getReputation(address user) external view returns (uint256)
```
Returns reputation (or BASE_REPUTATION if never initialized).

**getStats**
```solidity
function getStats(address user) external view returns (
    uint256 rep,
    uint256 total,
    uint256 correct,
    uint256 accuracy
)
```
Returns complete user statistics. Accuracy calculated as `(correctBets * 100) / totalBets` (0 if no bets).

**getWeight**
```solidity
function getWeight(address user) external view returns (uint256)
```
Calculates user weight. Formula: `(reputation * (50 + accuracy)) / 100`

Returns BASE_REPUTATION if user has no bets.

**setPredictionMarket**
```solidity
function setPredictionMarket(address _predictionMarket) external onlyOwner
```
One-time setup during deployment to link to PredictionMarket contract.

---

### MockERC20 Contract

**Location**: `contracts/contracts/MockERC20.sol`

**Inherits**: OpenZeppelin's `ERC20`

**Purpose**: Test token for USDC markets on Sepolia

```solidity
contract MockERC20 is ERC20 {
    constructor(string memory name, string memory symbol)
        ERC20(name, symbol)
    {
        _mint(msg.sender, 1000000 * 10 ** decimals());
    }

    function mint(address to, uint256 amount) external {
        _mint(to, amount);
    }
}
```

**Key Features**:
- Standard ERC20 implementation
- 18 decimals
- Public mint function (no access control - for testing only)
- Initial supply: 1,000,000 tokens to deployer

---

## Contract Interactions

### ETH Market Flow

```
User → PredictionMarket.createMarket(..., tokenAddress: 0x000...000)
    └─ MarketCreated event

User → PredictionMarket.placeBet(marketId, outcome, amount)
    ├─ msg.value = amount (ETH)
    ├─ Shares calculated
    ├─ Pools updated
    └─ BetPlaced event
```

### ERC20 Market Flow

```
User → PredictionMarket.createMarket(..., tokenAddress: USDC)
    └─ MarketCreated event

User → MockERC20.approve(PredictionMarket, amount)
    └─ Approval event

User → PredictionMarket.placeBet(marketId, outcome, amount)
    ├─ ERC20.transferFrom(user, contract, amount)
    ├─ Shares calculated
    ├─ Pools updated
    └─ BetPlaced event
```

### Resolution and Claiming

```
Arbitrator → PredictionMarket.resolveMarket(marketId, winningOutcome)
    ├─ Time check: block.timestamp >= resolutionTime
    ├─ Status = Resolved
    └─ MarketResolved event

Winner → PredictionMarket.claimWinnings(betId)
    ├─ Calculate payout: (shares * totalPool) / totalWinningShares
    ├─ Fee: payout * 2%
    ├─ Net payout: payout - fee
    ├─ Store fee: collectedFees[token] += fee
    ├─ ReputationSystem.updateReputation(winner, true)
    ├─ Transfer net payout
    └─ WinningsClaimed event

Loser → PredictionMarket.claimWinnings(betId)
    ├─ Mark claimed: bet.claimed = true
    ├─ ReputationSystem.updateReputation(loser, false)
    └─ No event (no payout)
```

---

## Events

### PredictionMarket Events

```solidity
event MarketCreated(uint256 indexed marketId, address indexed creator, string question);
event BetPlaced(uint256 indexed betId, uint256 indexed marketId, address indexed bettor, uint256 amount);
event MarketResolved(uint256 indexed marketId, uint256 winningOutcome);
event WinningsClaimed(uint256 indexed betId, address indexed claimer, uint256 amount);
event PositionListed(uint256 indexed betId, uint256 price);
event PositionSold(uint256 indexed betId, address seller, address buyer, uint256 price);
event FeesWithdrawn(address indexed token, uint256 amount, address indexed to);
```

### ReputationSystem Events

```solidity
event ReputationUpdated(address indexed user, uint256 newReputation, bool correct);
```

---

## Security Features

### ReentrancyGuard
Applied to: `placeBet`, `claimWinnings`, `buyPosition`, `withdrawFees`

Prevents reentrancy attacks during external calls and transfers.

### Access Control
- `resolveMarket`: Only market's designated arbitrator
- `withdrawFees`: Only contract owner
- `updateReputation`: Only PredictionMarket contract

### Input Validation
- Resolution time must be in future (market creation)
- Outcome index must be valid
- Bet amounts must be > 0
- Market must be open for betting
- Arbitrator address must be valid (not 0x0)
- Resolution only after resolution time passes

### Transfer Safety
- ETH transfers use `.transfer()` (2300 gas limit)
- ERC20 transfers use OpenZeppelin's `IERC20` interface
- All transfers checked for success implicitly

---

## Contract Addresses (Sepolia)

Set via environment variables:
- `NEXT_PUBLIC_PREDICTION_MARKET_ADDRESS`
- `NEXT_PUBLIC_REPUTATION_SYSTEM_ADDRESS`
- `NEXT_PUBLIC_MOCK_USDC_ADDRESS`

Configured in: `lib/contracts/addresses.ts`

---

## Testing

Contract tests: `contracts/test/PredictionMarket.test.ts`

Run tests:
```bash
cd contracts
npx hardhat test
```
