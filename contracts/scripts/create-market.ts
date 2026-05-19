import { ethers } from "hardhat";

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Using account:", deployer.address);

  const marketAddress = "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512";
  const PredictionMarket = await ethers.getContractAt("PredictionMarket", marketAddress);

  // Prepare parameters
  const question = "Will Bitcoin exceed $100,000 by 2026?";
  const description = "Prediction about Bitcoin price in 2026";
  const outcomes = ["Yes", "No"];
  const resolutionTime = Math.floor(Date.now() / 1000) + 3600; // 1 hour later

  // Create market
  const tx = await PredictionMarket.createMarket(
    question,
    description,
    outcomes,
    resolutionTime,
    deployer.address,        // arbitrator
    ethers.ZeroAddress       // use ETH, no ERC20
  );

  const receipt = await tx.wait();
  console.log("Transaction confirmed in block", receipt.blockNumber);

  // Instead of parsing logs, just read the counter directly
  const marketId = await PredictionMarket.marketCount();
  console.log(`Market created with ID: ${marketId}`);

  // Optional: verify stored market data (if your contract has a public `markets` mapping)
  const market = await PredictionMarket.markets(marketId);
  console.log("Stored market info:");
  console.log("   Question:", market.question);
  console.log("   Creator:", market.creator);
  console.log("   Resolution:", market.resolutionTime.toString());
}

main().catch((err) => {
  console.error("Error:", err);
  process.exit(1);
});
