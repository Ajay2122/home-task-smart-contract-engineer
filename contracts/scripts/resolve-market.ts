import { ethers, network } from "hardhat";

async function main() {
  const [arbitrator] = await ethers.getSigners();
  console.log("Using account:", arbitrator.address);

  // Contract address (update to your deployed address)
  const MARKET_ADDRESS = "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512";

  // Market ID to resolve
  const marketId = 1;

  // Choose winning outcome (0 = first outcome, 1 = second outcome, etc.)
  const winningOutcome = 0;

  // Connect to contract
  const PredictionMarket = await ethers.getContractAt("PredictionMarket", MARKET_ADDRESS);

  // Fetch market info
  const market = await PredictionMarket.markets(marketId);
  console.log("\nMarket Info:");
  console.log(`   Question: ${market.question}`);
  console.log(`   Resolution time: ${market.resolutionTime}`);
  console.log(`   Current time: ${Math.floor(Date.now() / 1000)}`);
  console.log(`   Arbitrator: ${market.arbitrator}`);

  // Verify arbitrator
  if (market.arbitrator.toLowerCase() !== arbitrator.address.toLowerCase()) {
    throw new Error("This account is not the arbitrator for this market.");
  }

  // Check time — skip forward if not reached
  const currentTime = Math.floor(Date.now() / 1000);
  const resolutionTime = Number(market.resolutionTime);

  if (currentTime < resolutionTime) {
    const timeToSkip = resolutionTime - currentTime + 5; // +5s buffer
    console.log(`\nSkipping forward ${timeToSkip} seconds...`);
    await network.provider.send("evm_increaseTime", [timeToSkip]);
    await network.provider.send("evm_mine");
    console.log("Time advanced. Market ready for resolution!");
  }

  // Resolve market
  console.log(`\nResolving market ${marketId} with outcome index ${winningOutcome}...`);
  const tx = await PredictionMarket.connect(arbitrator).resolveMarket(marketId, winningOutcome);
  const receipt = await tx.wait();

  console.log("\nMarket resolved!");
  console.log(`Transaction hash: ${receipt.hash}`);
  console.log(`Block number: ${receipt.blockNumber}`);

  // Verify update
  const updatedMarket = await PredictionMarket.markets(marketId);
  console.log("\nUpdated Market Info:");
  console.log(`   Winning outcome: ${updatedMarket.winningOutcome}`);
  console.log(`   Status (2 = Resolved): ${updatedMarket.status}`);
}

main().catch((err) => {
  console.error("Error resolving market:", err);
  process.exit(1);
});
