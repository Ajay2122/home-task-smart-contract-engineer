import { ethers } from "hardhat";

async function main() {
  // Hardhat local provider
  const provider = new ethers.JsonRpcProvider("http://127.0.0.1:8545");

  // List of bettors (6 accounts from Hardhat)
  const accounts = [
    {
      address: "0xBcd4042DE499D14e55001CcbB24a551F3b954096",
      privateKey: "0xf214f2b2cd398c806f84e317254e0f0b801d0643303237d97a22a48e01628897",
    },
    {
      address: "0x71bE63f3384f5fb98995898A86B02Fb2426c5788",
      privateKey: "0x701b615bbdfb9de65240bc28bd21bbc0d996645a3dd57e7b12bc2bdf6f192c82",
    },
    {
      address: "0xFABB0ac9d68B0B445fB7357272Ff202C5651694a",
      privateKey: "0xa267530f49f8280200edf313ee7af6b827f2a8bce2897751d06a843f644967b1",
    },
    {
      address: "0x1CBd3b2770909D4e10f157cABC84C7264073C9Ec",
      privateKey: "0x47c99abed3324a2707c28affff1267e45918ec8c3f20b8aa892e8b065d2942dd",
    },
    {
      address: "0xdF3e18d64BC6A983f673Ab319CCaE4f1a57C7097",
      privateKey: "0xc526ee95bf44d8fc405a158bb884d9d1238d99f0612e9f33d006bb0789009aaa",
    },
    {
      address: "0xcd3B766CCDd6AE721141F452C550Ca635964ce71",
      privateKey: "0x8166f546bab6da521a8369cab06c5d2b9e46670292d85c875ee9ec20e84ffb61",
    },
  ];

  // Connect to your deployed PredictionMarket contract
  const MARKET_ADDRESS = "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512";
  const marketId = 1; // ID of your created market
  const amountETH = ethers.parseEther("0.001"); // 0.001 ETH per bet

  const PredictionMarket = await ethers.getContractAt("PredictionMarket", MARKET_ADDRESS, provider);
  const market = await PredictionMarket.markets(marketId);

  if (market.tokenAddress !== ethers.ZeroAddress) {
    throw new Error("This script only supports ETH markets. ERC20 markets require token approval first.");
  }

  console.log(`Placing multiple bets on Market #${marketId}`);
  console.log(`   Question: ${market.question}\n`);

  // Make each account place a bet
  for (let i = 0; i < accounts.length; i++) {
    const { address, privateKey } = accounts[i];
    const wallet = new ethers.Wallet(privateKey, provider);
    const signer = wallet.connect(provider);

    // Alternate outcomes: even = Yes, odd = No
    const outcomeIndex = i % 2; // 0 = first outcome, 1 = second outcome

    console.log(`Bettor ${i + 1}: ${address}`);
    console.log(`   -> Outcome: ${outcomeIndex === 0 ? "Yes" : "No"}`);
    console.log(`   -> Amount: ${ethers.formatEther(amountETH)} ETH`);

    const tx = await PredictionMarket.connect(signer).placeBet(
      marketId,
      outcomeIndex,
      amountETH,
      { value: amountETH }
    );

    const receipt = await tx.wait();
    console.log(`   Bet placed in block ${receipt.blockNumber}\n`);
  }

  // Summary
  const totalBets = await PredictionMarket.betCount();
  console.log(`All bets placed successfully! Total bets so far: ${totalBets}`);
}

main().catch((err) => {
  console.error("Error in multi-bet script:", err);
  process.exit(1);
});
