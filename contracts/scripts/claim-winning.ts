import { ethers } from "hardhat";

async function main() {
  const provider = new ethers.JsonRpcProvider("http://127.0.0.1:8545");

  // Accounts to check (same ones you used in multi-bet.ts)
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

  // Deployed contract
  const MARKET_ADDRESS = "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512";
  const PredictionMarket = await ethers.getContractAt("PredictionMarket", MARKET_ADDRESS, provider);

  const totalBets = await PredictionMarket.betCount();
  console.log(`Checking ${totalBets} bets across ${accounts.length} accounts`);

  // Loop over each account and attempt to claim winnings
  for (const acc of accounts) {
    const wallet = new ethers.Wallet(acc.privateKey, provider);
    const balance = ethers.formatEther(await provider.getBalance(acc.address))
    const signer = wallet.connect(provider);

    // Retrieve bets placed by this account
    const betIds = await PredictionMarket.getUserBets(acc.address);
    if (betIds.length === 0) {
      console.log(`No bets found for ${acc.address}`);
      continue;
    }
    
    console.log(`\nAccount ${acc.address} has ${betIds.length} bets`);
    
    for (const betId of betIds) {
      try {
        const bet = await PredictionMarket.bets(betId);
        const market = await PredictionMarket.markets(bet.marketId);

        if (market.status != 2) {
          console.log(`  Market ${bet.marketId} not resolved yet {status: ${market.status}}`);
          continue;
        }
        if (bet.claimed) {
          console.log(`  Bet ${betId} already claimed`);
          continue;
        }

        const tx = await PredictionMarket.connect(signer).claimWinnings(betId);
        const receipt = await tx.wait();
        console.log(`  Claimed winnings for Bet ${betId} in block ${receipt.blockNumber}`);
        console.log(`  Balance before claim: ${balance} ETH`);
        console.log(`  Balance after claim: ${ethers.formatEther(await provider.getBalance(acc.address))} ETH`);
      } catch (err: any) {
        const msg = err?.message?.split("\n")[0] || err.toString();
        console.log(`  Could not claim Bet ${betId}: ${msg}`);
      }
    }
  }

  console.log("\nFinished checking all accounts.");
}

main().catch((err) => {
  console.error("Error claiming winnings:", err);
  process.exit(1);
});
