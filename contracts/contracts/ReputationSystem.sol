// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import "@openzeppelin/contracts/access/Ownable.sol";

contract ReputationSystem is Ownable {

    mapping(address => uint256) public reputation;
    mapping(address => uint256) public totalBets;
    mapping(address => uint256) public correctBets;

    uint256 public constant BASE_REPUTATION = 100;
    uint256 public constant CORRECT_BONUS = 10;
    uint256 public constant INCORRECT_PENALTY = 5;
    uint256 public constant MAX_REPUTATION = 1000;

    address public predictionMarket;

    event ReputationUpdated(address indexed user, uint256 newReputation, bool correct);

    constructor() Ownable(msg.sender) {}

    function setPredictionMarket(address _predictionMarket) external onlyOwner {
        predictionMarket = _predictionMarket;
    }

    modifier onlyPredictionMarket() {
        require(msg.sender == predictionMarket, "Only prediction market");
        _;
    }

    function updateReputation(address user, bool correct) external onlyPredictionMarket {
        if (reputation[user] == 0) {
            reputation[user] = BASE_REPUTATION;
        }

        totalBets[user]++;

        if (correct) {
            correctBets[user]++;
            if (reputation[user] + CORRECT_BONUS <= MAX_REPUTATION) {
                reputation[user] += CORRECT_BONUS;
            } else {
                reputation[user] = MAX_REPUTATION;
            }
        } else {
            if (reputation[user] > INCORRECT_PENALTY) {
                reputation[user] -= INCORRECT_PENALTY;
            }
        }

        emit ReputationUpdated(user, reputation[user], correct);
    }

    function getReputation(address user) external view returns (uint256) {
        return reputation[user] == 0 ? BASE_REPUTATION : reputation[user];
    }

    function getWeight(address user) external view returns (uint256) {
        if (totalBets[user] == 0) return BASE_REPUTATION;

        uint256 rep = reputation[user] == 0 ? BASE_REPUTATION : reputation[user];
        uint256 accuracy = (correctBets[user] * 100) / totalBets[user];

        return (rep * (50 + accuracy)) / 100;
    }

    function getStats(address user) external view returns (
        uint256 rep,
        uint256 total,
        uint256 correct,
        uint256 accuracy
    ) {
        rep = reputation[user] == 0 ? BASE_REPUTATION : reputation[user];
        total = totalBets[user];
        correct = correctBets[user];
        accuracy = total > 0 ? (correct * 100) / total : 0;
    }
}
