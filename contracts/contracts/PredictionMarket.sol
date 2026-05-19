// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

interface IReputationSystem {
    function updateReputation(address user, bool correct) external;
    function getReputation(address user) external view returns (uint256);
}

contract PredictionMarket is ReentrancyGuard, Ownable {

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
        address tokenAddress;
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

    uint256 public marketCount;
    uint256 public betCount;
    uint256 public constant PLATFORM_FEE = 2;
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

    // Fee tracking - address(0) for ETH, token address for ERC20
    mapping(address => uint256) public collectedFees;

    event MarketCreated(uint256 indexed marketId, address indexed creator, string question);
    event BetPlaced(uint256 indexed betId, uint256 indexed marketId, address indexed bettor, uint256 amount);
    event MarketResolved(uint256 indexed marketId, uint256 winningOutcome);
    event WinningsClaimed(uint256 indexed betId, address indexed claimer, uint256 amount);
    event PositionListed(uint256 indexed betId, uint256 price);
    event PositionSold(uint256 indexed betId, address seller, address buyer, uint256 price);
    event FeesWithdrawn(address indexed token, uint256 amount, address indexed to);

    constructor(address _reputationSystem) Ownable(msg.sender) {
        reputationSystem = IReputationSystem(_reputationSystem);
    }

    function createMarket(
        string memory _question,
        string memory _description,
        string[] memory _outcomes,
        uint256 _resolutionTime,
        address _arbitrator,
        address _tokenAddress
    ) external returns (uint256) {
        require(_outcomes.length >= 2, "Need at least 2 outcomes");
        require(_resolutionTime > block.timestamp, "Resolution must be in future");
        require(_arbitrator != address(0), "Invalid arbitrator");

        marketCount++;

        Market storage newMarket = markets[marketCount];
        newMarket.id = marketCount;
        newMarket.question = _question;
        newMarket.description = _description;
        newMarket.outcomes = _outcomes;
        newMarket.resolutionTime = _resolutionTime;
        newMarket.arbitrator = _arbitrator;
        newMarket.creator = msg.sender;
        newMarket.createdAt = block.timestamp;
        newMarket.status = MarketStatus.Open;
        newMarket.tokenAddress = _tokenAddress;

        emit MarketCreated(marketCount, msg.sender, _question);
        return marketCount;
    }

    function placeBet(
        uint256 _marketId,
        uint256 _outcomeIndex,
        uint256 _amount,
        uint256 _minShares
    ) external payable nonReentrant returns (uint256) {
        Market storage market = markets[_marketId];

        require(market.status == MarketStatus.Open, "Market not open");
        require(block.timestamp < market.resolutionTime, "Market closed");
        require(_outcomeIndex < market.outcomes.length, "Invalid outcome");
        require(_amount > 0, "Amount must be > 0");

        if (market.tokenAddress == address(0)) {
            require(msg.value == _amount, "Incorrect ETH amount");
        } else {
            IERC20(market.tokenAddress).transferFrom(msg.sender, address(this), _amount);
        }

        uint256 shares = calculateShares(_marketId, _outcomeIndex, _amount);
        require(shares >= _minShares, "Slippage exceeded");

        betCount++;
        Bet storage bet = bets[betCount];
        bet.id = betCount;
        bet.bettor = msg.sender;
        bet.marketId = _marketId;
        bet.outcomeIndex = _outcomeIndex;
        bet.amount = _amount;
        bet.shares = shares;
        bet.timestamp = block.timestamp;

        outcomePools[_marketId][_outcomeIndex] += _amount;
        outcomeShares[_marketId][_outcomeIndex] += shares;
        market.totalVolume += _amount;

        userBets[msg.sender].push(betCount);
        marketBets[_marketId].push(betCount);

        emit BetPlaced(betCount, _marketId, msg.sender, _amount);
        return betCount;
    }

    function resolveMarket(uint256 _marketId, uint256 _winningOutcome) external {
        Market storage market = markets[_marketId];

        require(msg.sender == market.arbitrator, "Only arbitrator");
        require(market.status == MarketStatus.Open, "Market not open");
        require(block.timestamp >= market.resolutionTime, "Too early");
        require(_winningOutcome < market.outcomes.length, "Invalid outcome");

        market.status = MarketStatus.Resolved;
        market.winningOutcome = _winningOutcome;

        emit MarketResolved(_marketId, _winningOutcome);
    }

    function claimWinnings(uint256 _betId) external nonReentrant {
        Bet storage bet = bets[_betId];
        Market storage market = markets[bet.marketId];

        require(msg.sender == bet.bettor, "Not your bet");
        require(!bet.claimed, "Already claimed");
        require(market.status == MarketStatus.Resolved, "Market not resolved");

        if (bet.outcomeIndex == market.winningOutcome) {
            bet.claimed = true;

            uint256 totalWinningShares = outcomeShares[bet.marketId][market.winningOutcome];
            uint256 totalPool = getTotalPool(bet.marketId);

            uint256 payout = (bet.shares * totalPool) / totalWinningShares;
            uint256 fee = (payout * PLATFORM_FEE) / FEE_DENOMINATOR;
            uint256 netPayout = payout - fee;

            // Track collected fees
            collectedFees[market.tokenAddress] += fee;

            reputationSystem.updateReputation(msg.sender, true);

            if (market.tokenAddress == address(0)) {
                (bool success, ) = payable(msg.sender).call{value: netPayout}("");
                require(success, "ETH transfer failed");
            } else {
                IERC20(market.tokenAddress).transfer(msg.sender, netPayout);
            }

            emit WinningsClaimed(_betId, msg.sender, netPayout);
        } else {
            bet.claimed = true;
            reputationSystem.updateReputation(msg.sender, false);
        }
    }

    function listPosition(uint256 _betId, uint256 _price) external {
        Bet storage bet = bets[_betId];
        require(msg.sender == bet.bettor, "Not your bet");
        require(!bet.claimed, "Bet already claimed");
        require(markets[bet.marketId].status == MarketStatus.Open, "Market not open");

        positionsForSale[_betId] = true;
        positionPrices[_betId] = _price;

        emit PositionListed(_betId, _price);
    }

    /**
     * @notice Cancel a position listing
     * @param _betId The ID of the bet to unlist
     */
    function cancelListing(uint256 _betId) external {
        Bet storage bet = bets[_betId];
        require(msg.sender == bet.bettor, "Not your bet");
        require(positionsForSale[_betId], "Not listed");

        positionsForSale[_betId] = false;
        positionPrices[_betId] = 0;

        emit PositionListed(_betId, 0); // Emit with 0 price to indicate cancellation
    }

    function buyPosition(uint256 _betId) external payable nonReentrant {
        require(positionsForSale[_betId], "Position not for sale");

        Bet storage bet = bets[_betId];
        Market storage market = markets[bet.marketId];
        address seller = bet.bettor;
        uint256 price = positionPrices[_betId];

        // Update ownership
        bet.bettor = msg.sender;
        positionsForSale[_betId] = false;

        // Update userBets mapping for new owner
        userBets[msg.sender].push(_betId);

        // Transfer payment to seller (use market's token type)
        if (market.tokenAddress == address(0)) {
            // ETH market - payment in ETH
            require(msg.value >= price, "Insufficient ETH");
            (bool success, ) = payable(seller).call{value: price}("");
            require(success, "ETH transfer failed");

            // Refund excess
            if (msg.value > price) {
                (bool refundSuccess, ) = payable(msg.sender).call{value: msg.value - price}("");
                require(refundSuccess, "Refund failed");
            }
        } else {
            // ERC20 market - payment in ERC20
            require(msg.value == 0, "Do not send ETH for ERC20 market");
            IERC20(market.tokenAddress).transferFrom(msg.sender, seller, price);
        }

        emit PositionSold(_betId, seller, msg.sender, price);
    }

    /**
     * @notice Withdraw collected platform fees (owner only)
     * @param _tokenAddress Address of token to withdraw (address(0) for ETH)
     */
    function withdrawFees(address _tokenAddress) external onlyOwner nonReentrant {
        uint256 fees = collectedFees[_tokenAddress];
        require(fees > 0, "No fees to withdraw");

        collectedFees[_tokenAddress] = 0;

        if (_tokenAddress == address(0)) {
            (bool success, ) = payable(owner()).call{value: fees}("");
            require(success, "ETH transfer failed");
        } else {
            IERC20(_tokenAddress).transfer(owner(), fees);
        }

        emit FeesWithdrawn(_tokenAddress, fees, owner());
    }

    /**
     * @notice Get available fees for withdrawal
     * @param _tokenAddress Address of token (address(0) for ETH)
     */
    function getAvailableFees(address _tokenAddress) external view returns (uint256) {
        return collectedFees[_tokenAddress];
    }

    function calculateShares(uint256 _marketId, uint256 _outcomeIndex, uint256 _amount)
        public view returns (uint256)
    {
        uint256 currentPool = outcomePools[_marketId][_outcomeIndex];
        if (currentPool == 0) return _amount * 100;

        uint256 totalPool = getTotalPool(_marketId);
        uint256 newPool = currentPool + _amount;

        return (_amount * 100 * totalPool) / (newPool * currentPool);
    }

    function getPrice(uint256 _marketId, uint256 _outcomeIndex)
        public view returns (uint256)
    {
        uint256 pool = outcomePools[_marketId][_outcomeIndex];
        uint256 total = getTotalPool(_marketId);

        if (total == 0) return 50;
        return (pool * 100) / total;
    }

    function getTotalPool(uint256 _marketId) public view returns (uint256) {
        Market storage market = markets[_marketId];
        uint256 total = 0;
        for (uint256 i = 0; i < market.outcomes.length; i++) {
            total += outcomePools[_marketId][i];
        }
        return total;
    }

    function getUserBets(address _user) external view returns (uint256[] memory) {
        return userBets[_user];
    }

    function getMarketBets(uint256 _marketId) external view returns (uint256[] memory) {
        return marketBets[_marketId];
    }

    /**
     * @notice Get market details including token address
     * @dev Updated to include tokenAddress in return values
     */
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
    ) {
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
