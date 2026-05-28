// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

interface IReputationSystem {
    function updateReputation(address user, bool correct) external;
    function getReputation(address user) external view returns (uint256);
}

/**
 * @title WorldCupBetting
 * @notice Full implementation of the on-chain prediction market for World Cup matches.
 *
 * Design decisions
 * ----------------
 * AMM share pricing
 *   First bet on an outcome:  shares = amount * 100
 *   Subsequent bets:          shares = (amount * 100 * totalPool) / (newPool * currentPool)
 *   Early bettors earn more shares per unit; as a pool grows the cost-per-share rises,
 *   making implied prices crowd-reflective.
 *
 * Platform fee
 *   2 % is deducted from winning payouts only.  Fees are tracked per collateral token
 *   (address(0) = ETH) so ETH and ERC-20 accounting never mix.
 *
 * Secondary market
 *   bet.bettor is updated atomically before any ETH transfer (CEI pattern), so the
 *   new owner safely acquires both the claim right and the reputation update.
 *
 * Security
 *   - nonReentrant on every function that moves value.
 *   - CEI (Checks → Effects → Interactions) throughout.
 */
contract WorldCupBetting is ReentrancyGuard, Ownable {

    // ─── Enums & structs ────────────────────────────────────────────────────

    enum MarketStatus { Open, Closed, Resolved, Cancelled }

    struct Market {
        uint256 id;
        string  question;
        string  description;
        string[] outcomes;
        uint256 resolutionTime;
        address arbitrator;
        address creator;
        uint256 createdAt;
        MarketStatus status;
        uint256 winningOutcome;
        address tokenAddress;   // address(0) = native ETH
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
        bool    claimed;
    }

    // ─── Constants ──────────────────────────────────────────────────────────

    uint256 public constant PLATFORM_FEE    = 2;
    uint256 public constant FEE_DENOMINATOR = 100;

    // ─── State ──────────────────────────────────────────────────────────────

    IReputationSystem public reputationSystem;

    uint256 public marketCount;
    uint256 public betCount;

    mapping(uint256 => Market) public markets;
    mapping(uint256 => Bet)    public bets;

    /// outcomePools[marketId][outcomeIndex]  — total collateral staked on each outcome
    mapping(uint256 => mapping(uint256 => uint256)) public outcomePools;
    /// outcomeShares[marketId][outcomeIndex] — total shares issued for each outcome
    mapping(uint256 => mapping(uint256 => uint256)) public outcomeShares;

    mapping(address => uint256[]) public userBets;
    mapping(uint256 => uint256[]) public marketBets;

    // Secondary market
    mapping(uint256 => bool)    public positionsForSale;
    mapping(uint256 => uint256) public positionPrices;

    // Fee accounting: address(0) = ETH, token address = ERC-20
    mapping(address => uint256) public collectedFees;

    // ─── Events ─────────────────────────────────────────────────────────────

    event MarketCreated(uint256 indexed marketId, address indexed creator, string question);
    event BetPlaced(uint256 indexed betId, uint256 indexed marketId, address indexed bettor, uint256 amount);
    event MarketResolved(uint256 indexed marketId, uint256 winningOutcome);
    event WinningsClaimed(uint256 indexed betId, address indexed claimer, uint256 amount);
    event PositionListed(uint256 indexed betId, uint256 price);
    event PositionSold(uint256 indexed betId, address seller, address buyer, uint256 price);
    event FeesWithdrawn(address indexed token, uint256 amount, address indexed to);

    // ─── Constructor ────────────────────────────────────────────────────────

    constructor(address _reputationSystem) Ownable(msg.sender) {
        reputationSystem = IReputationSystem(_reputationSystem);
    }

    // ─── Market lifecycle ───────────────────────────────────────────────────

    /**
     * @notice Create a new prediction market.
     * @param _question        Human-readable question.
     * @param _description     Extended description / resolution criteria.
     * @param _outcomes        Outcome labels — 2 to 10 items.
     * @param _resolutionTime  Unix timestamp after which the arbitrator may resolve.
     * @param _arbitrator      Address authorised to call resolveMarket.
     * @param _tokenAddress    Collateral token (address(0) for native ETH).
     * @return marketId        1-indexed ID of the new market.
     */
    function createMarket(
        string  memory _question,
        string  memory _description,
        string[] memory _outcomes,
        uint256 _resolutionTime,
        address _arbitrator,
        address _tokenAddress
    ) external returns (uint256) {
        require(_outcomes.length >= 2,             "Need at least 2 outcomes");
        require(_resolutionTime > block.timestamp, "Resolution must be in future");
        require(_arbitrator != address(0),         "Invalid arbitrator");

        marketCount++;

        Market storage m = markets[marketCount];
        m.id             = marketCount;
        m.question       = _question;
        m.description    = _description;
        m.outcomes       = _outcomes;
        m.resolutionTime = _resolutionTime;
        m.arbitrator     = _arbitrator;
        m.creator        = msg.sender;
        m.createdAt      = block.timestamp;
        m.status         = MarketStatus.Open;
        m.tokenAddress   = _tokenAddress;

        emit MarketCreated(marketCount, msg.sender, _question);
        return marketCount;
    }

    /**
     * @notice Place a bet on an outcome.
     *
     * ETH markets:    send msg.value == _amount.
     * ERC-20 markets: approve this contract for _amount first; call with msg.value == 0.
     *
     * @param _marketId      Target market.
     * @param _outcomeIndex  Outcome to back (0-based).
     * @param _amount        Collateral amount.
     * @param _minShares     Slippage guard — reverts if shares issued < this value.
     * @return betId         1-indexed ID of the recorded bet.
     */
    function placeBet(
        uint256 _marketId,
        uint256 _outcomeIndex,
        uint256 _amount,
        uint256 _minShares
    ) external payable nonReentrant returns (uint256) {
        Market storage market = markets[_marketId];

        require(market.status == MarketStatus.Open,      "Market not open");
        require(block.timestamp < market.resolutionTime, "Market closed");
        require(_outcomeIndex < market.outcomes.length,  "Invalid outcome");
        require(_amount > 0,                             "Amount must be > 0");

        if (market.tokenAddress == address(0)) {
            require(msg.value == _amount, "Incorrect ETH amount");
        } else {
            require(msg.value == 0, "Do not send ETH for ERC20 market");
            IERC20(market.tokenAddress).transferFrom(msg.sender, address(this), _amount);
        }

        uint256 shares = calculateShares(_marketId, _outcomeIndex, _amount);
        require(shares >= _minShares, "Slippage exceeded");

        betCount++;
        Bet storage bet  = bets[betCount];
        bet.id           = betCount;
        bet.bettor       = msg.sender;
        bet.marketId     = _marketId;
        bet.outcomeIndex = _outcomeIndex;
        bet.amount       = _amount;
        bet.shares       = shares;
        bet.timestamp    = block.timestamp;

        outcomePools[_marketId][_outcomeIndex]  += _amount;
        outcomeShares[_marketId][_outcomeIndex] += shares;
        market.totalVolume                      += _amount;

        userBets[msg.sender].push(betCount);
        marketBets[_marketId].push(betCount);

        emit BetPlaced(betCount, _marketId, msg.sender, _amount);
        return betCount;
    }

    /**
     * @notice Resolve a market — arbitrator-only, only after resolutionTime.
     * @param _marketId        Market to resolve.
     * @param _winningOutcome  0-based index of the correct outcome.
     */
    function resolveMarket(uint256 _marketId, uint256 _winningOutcome) external {
        Market storage market = markets[_marketId];

        require(msg.sender == market.arbitrator,          "Only arbitrator");
        require(market.status == MarketStatus.Open,       "Market not open");
        require(block.timestamp >= market.resolutionTime, "Too early");
        require(_winningOutcome < market.outcomes.length, "Invalid outcome");

        market.status         = MarketStatus.Resolved;
        market.winningOutcome = _winningOutcome;

        emit MarketResolved(_marketId, _winningOutcome);
    }

    /**
     * @notice Claim winnings (winners) or settle for reputation (losers).
     *
     * Winners: payout = (shares / totalWinningShares) × totalPool − 2 % fee.
     * Losers:  no payout; reputation penalty recorded; bet marked claimed.
     *
     * bet.claimed is set to true before any external call (CEI).
     *
     * @param _betId  ID of the bet to settle.
     */
    function claimWinnings(uint256 _betId) external nonReentrant {
        Bet    storage bet    = bets[_betId];
        Market storage market = markets[bet.marketId];

        require(msg.sender == bet.bettor,               "Not your bet");
        require(!bet.claimed,                           "Already claimed");
        require(market.status == MarketStatus.Resolved, "Market not resolved");

        bet.claimed = true; // CEI: effect before interaction

        if (bet.outcomeIndex == market.winningOutcome) {
            uint256 totalWinningShares = outcomeShares[bet.marketId][market.winningOutcome];
            uint256 totalPool          = getTotalPool(bet.marketId);

            uint256 grossPayout = (bet.shares * totalPool) / totalWinningShares;
            uint256 fee         = (grossPayout * PLATFORM_FEE) / FEE_DENOMINATOR;
            uint256 netPayout   = grossPayout - fee;

            collectedFees[market.tokenAddress] += fee;

            reputationSystem.updateReputation(msg.sender, true);

            if (market.tokenAddress == address(0)) {
                (bool ok, ) = payable(msg.sender).call{value: netPayout}("");
                require(ok, "ETH transfer failed");
            } else {
                IERC20(market.tokenAddress).transfer(msg.sender, netPayout);
            }

            emit WinningsClaimed(_betId, msg.sender, netPayout);
        } else {
            reputationSystem.updateReputation(msg.sender, false);
        }
    }

    // ─── Secondary market ───────────────────────────────────────────────────

    /**
     * @notice List an unclaimed, open-market bet for sale.
     * @param _betId   Bet to list.
     * @param _price   Asking price in the market's collateral currency.
     */
    function listPosition(uint256 _betId, uint256 _price) external {
        Bet    storage bet = bets[_betId];
        require(msg.sender == bet.bettor,                           "Not your bet");
        require(!bet.claimed,                                       "Bet already claimed");
        require(markets[bet.marketId].status == MarketStatus.Open,  "Market not open");

        positionsForSale[_betId] = true;
        positionPrices[_betId]   = _price;

        emit PositionListed(_betId, _price);
    }

    /**
     * @notice Cancel a secondary-market listing.
     * @param _betId  Bet to delist.
     */
    function cancelListing(uint256 _betId) external {
        Bet storage bet = bets[_betId];
        require(msg.sender == bet.bettor, "Not your bet");
        require(positionsForSale[_betId], "Not listed");

        positionsForSale[_betId] = false;
        positionPrices[_betId]   = 0;

        emit PositionListed(_betId, 0);
    }

    /**
     * @notice Purchase a listed position, atomically transferring claim rights.
     *
     * ETH markets:    send msg.value >= asking price; excess is refunded.
     * ERC-20 markets: approve this contract for asking price first.
     *
     * @param _betId  Bet to purchase.
     */
    function buyPosition(uint256 _betId) external payable nonReentrant {
        require(positionsForSale[_betId], "Position not for sale");

        Bet    storage bet    = bets[_betId];
        Market storage market = markets[bet.marketId];
        address seller        = bet.bettor;
        uint256 price         = positionPrices[_betId];

        // Effects before interactions (CEI)
        bet.bettor               = msg.sender;
        positionsForSale[_betId] = false;

        userBets[msg.sender].push(_betId);

        if (market.tokenAddress == address(0)) {
            require(msg.value >= price, "Insufficient ETH");
            (bool ok, ) = payable(seller).call{value: price}("");
            require(ok, "ETH transfer failed");
            if (msg.value > price) {
                (bool refund, ) = payable(msg.sender).call{value: msg.value - price}("");
                require(refund, "Refund failed");
            }
        } else {
            require(msg.value == 0, "Do not send ETH for ERC20 market");
            IERC20(market.tokenAddress).transferFrom(msg.sender, seller, price);
        }

        emit PositionSold(_betId, seller, msg.sender, price);
    }

    // ─── Fee management ─────────────────────────────────────────────────────

    /**
     * @notice Withdraw accumulated platform fees. Owner-only.
     * @param _tokenAddress  Token to withdraw (address(0) for ETH).
     */
    function withdrawFees(address _tokenAddress) external onlyOwner nonReentrant {
        uint256 fees = collectedFees[_tokenAddress];
        require(fees > 0, "No fees to withdraw");

        collectedFees[_tokenAddress] = 0;

        if (_tokenAddress == address(0)) {
            (bool ok, ) = payable(owner()).call{value: fees}("");
            require(ok, "ETH transfer failed");
        } else {
            IERC20(_tokenAddress).transfer(owner(), fees);
        }

        emit FeesWithdrawn(_tokenAddress, fees, owner());
    }

    /**
     * @notice Query accumulated fees without withdrawing.
     * @param _tokenAddress  Token to query (address(0) for ETH).
     */
    function getAvailableFees(address _tokenAddress) external view returns (uint256) {
        return collectedFees[_tokenAddress];
    }

    // ─── AMM / pricing helpers ──────────────────────────────────────────────

    /**
     * @notice Shares issued for a given collateral amount on an outcome.
     *
     * LMSR-lite formula:
     *   First depositor: shares = amount * 100
     *   Subsequent:      shares = (amount * 100 * totalPool) / (newPool * currentPool)
     *
     * @param _marketId      Market.
     * @param _outcomeIndex  Outcome.
     * @param _amount        Collateral deposited.
     * @return shares        Shares issued.
     */
    function calculateShares(
        uint256 _marketId,
        uint256 _outcomeIndex,
        uint256 _amount
    ) public view returns (uint256) {
        uint256 currentPool = outcomePools[_marketId][_outcomeIndex];
        if (currentPool == 0) return _amount * 100;

        uint256 totalPool = getTotalPool(_marketId);
        uint256 newPool   = currentPool + _amount;

        return (_amount * 100 * totalPool) / (newPool * currentPool);
    }

    /**
     * @notice Implied probability of an outcome as an integer percentage [0, 100].
     * Returns 50 (equal prior) when the market pool is empty.
     */
    function getPrice(uint256 _marketId, uint256 _outcomeIndex) public view returns (uint256) {
        uint256 pool  = outcomePools[_marketId][_outcomeIndex];
        uint256 total = getTotalPool(_marketId);
        if (total == 0) return 50;
        return (pool * 100) / total;
    }

    /**
     * @notice Total collateral locked in a market across all outcomes.
     */
    function getTotalPool(uint256 _marketId) public view returns (uint256) {
        Market storage market = markets[_marketId];
        uint256 total = 0;
        for (uint256 i = 0; i < market.outcomes.length; i++) {
            total += outcomePools[_marketId][i];
        }
        return total;
    }

    // ─── View helpers ────────────────────────────────────────────────────────

    /// @notice All bet IDs belonging to a user (including purchased secondary positions).
    function getUserBets(address _user) external view returns (uint256[] memory) {
        return userBets[_user];
    }

    /// @notice All bet IDs placed on a market, in chronological order.
    function getMarketBets(uint256 _marketId) external view returns (uint256[] memory) {
        return marketBets[_marketId];
    }

    /**
     * @notice Full market details with named return values.
     *
     * Named returns allow Ethers.js / Viem to access fields by name:
     *   const m = await contract.getMarket(id);
     *   m.status  // ← works
     */
    function getMarket(uint256 _marketId)
        external
        view
        returns (
            uint256      id,
            string memory question,
            string memory description,
            string[] memory outcomes,
            uint256      resolutionTime,
            address      arbitrator,
            address      creator,
            MarketStatus status,
            uint256      totalVolume,
            address      tokenAddress
        )
    {
        Market storage m = markets[_marketId];
        return (
            m.id,
            m.question,
            m.description,
            m.outcomes,
            m.resolutionTime,
            m.arbitrator,
            m.creator,
            m.status,
            m.totalVolume,
            m.tokenAddress
        );
    }
}
