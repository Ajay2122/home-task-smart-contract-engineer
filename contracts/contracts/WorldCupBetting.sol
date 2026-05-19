// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

interface IReputationSystem {
    function updateReputation(address user, bool correct) external;
    function getReputation(address user) external view returns (uint256);
}

/**
 * @title WorldCupBetting
 * @notice Assessment entrypoint: replace stub bodies with a full prediction market until
 *         `test/WorldCupBetting.assessment.test.ts` passes. Out-of-the-box, every call reverts so
 *         the assessment suite is red until you implement behavior.
 * @dev Optional behavioral reference in-repo: `PredictionMarket.sol` (do not modify that file
 *      unless your interview allows it). Instructors can run tests against the reference by
 *      setting `WORLD_CUP_ASSESSMENT_SOLUTION=1` when executing Hardhat (see `assessment/instructions.md`).
 */
contract WorldCupBetting is ReentrancyGuard, Ownable {
    enum MarketStatus {
        Open,
        Closed,
        Resolved,
        Cancelled
    }

    IReputationSystem public reputationSystem;
    uint256 public marketCount;
    uint256 public betCount;

    constructor(address _reputationSystem) Ownable(msg.sender) {
        reputationSystem = IReputationSystem(_reputationSystem);
    }

    function _candidateStub() internal pure {
        revert("WorldCupBetting: candidate implementation required");
    }

    function createMarket(
        string memory,
        string memory,
        string[] memory,
        uint256,
        address,
        address
    ) external returns (uint256) {
        _candidateStub();
    }

    function placeBet(uint256, uint256, uint256, uint256) external payable returns (uint256) {
        _candidateStub();
    }

    function resolveMarket(uint256, uint256) external {
        _candidateStub();
    }

    function claimWinnings(uint256) external nonReentrant {
        _candidateStub();
    }

    function listPosition(uint256, uint256) external {
        _candidateStub();
    }

    function cancelListing(uint256) external {
        _candidateStub();
    }

    function buyPosition(uint256) external payable nonReentrant {
        _candidateStub();
    }

    function withdrawFees(address) external onlyOwner nonReentrant {
        _candidateStub();
    }

    function getAvailableFees(address) external view returns (uint256) {
        _candidateStub();
    }

    function calculateShares(uint256, uint256, uint256) public view returns (uint256) {
        _candidateStub();
    }

    function getPrice(uint256, uint256) public view returns (uint256) {
        _candidateStub();
    }

    function getTotalPool(uint256) public view returns (uint256) {
        _candidateStub();
    }

    function getUserBets(address) external view returns (uint256[] memory) {
        _candidateStub();
    }

    function getMarketBets(uint256) external view returns (uint256[] memory) {
        _candidateStub();
    }

    function getMarket(uint256)
        external
        view
        returns (
            uint256,
            string memory,
            string memory,
            string[] memory,
            uint256,
            address,
            address,
            MarketStatus,
            uint256,
            address
        )
    {
        _candidateStub();
    }
}
