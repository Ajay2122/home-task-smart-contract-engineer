import { ethers } from "hardhat";

async function main() {
  const [user] = await ethers.getSigners();
  console.log("Using account:", user.address);

  // === Change this to your deployed contract address ===
  const MARKET_ADDRESS = "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512";
  const PredictionMarket = await ethers.getContractAt("PredictionMarket", MARKET_ADDRESS);

  // === Total Markets ===
  const totalMarkets = await PredictionMarket.marketCount();
  console.log(`\nTotal Markets: ${totalMarkets}\n`);

  if (totalMarkets === 0n) {
    console.log("No markets found yet.");
    return;
  }

  // === Try to fetch MarketCreated events for fallback ===
  const createdEvents = await PredictionMarket.queryFilter(
    PredictionMarket.filters.MarketCreated(),
    0,
    "latest"
  );
  const eventsById: Record<string, any> = {};
  for (const ev of createdEvents) {
    const id = ev.args?.marketId?.toString() ?? ev.args?.[0]?.toString();
    eventsById[id] = ev.args;
  }

  // === Loop through all markets ===
  for (let i = 1n; i <= totalMarkets; i++) {
    console.log(`Market ${i}`);
    try {
      const market = await PredictionMarket.markets(i);

      // Convert enum to readable string
      const statusMap = ["Open", "Closed", "Resolved", "Cancelled"];
      const status =
        statusMap[Number(market.status)] ?? `Unknown (${market.status})`;

      console.log("   Question:   ", market.question ?? "(unknown)");
      console.log("   Description:", market.description ?? "(none)");

      // Try to access outcomes (may not exist)
      let outcomes: string[] = [];
      if (market.outcomes && Array.isArray(market.outcomes)) {
        outcomes = market.outcomes.map((o: string) => o);
      } else if (eventsById[i.toString()]?.outcomes) {
        outcomes = eventsById[i.toString()].outcomes;
      } else {
        outcomes = ["(not retrievable from struct)"];
      }

      console.log("   Outcomes:   ", outcomes.join(", "));
      console.log(
        "   Resolves at:",
        new Date(Number(market.resolutionTime) * 1000).toLocaleString()
      );
      console.log("   Arbitrator:", market.arbitrator);
      console.log(
        "   Token:",
        market.tokenAddress === ethers.ZeroAddress ? "ETH" : market.tokenAddress
      );
      console.log("   Status:", status);
      console.log("   Creator:", market.creator);
      console.log(
        "   Created:",
        new Date(Number(market.createdAt) * 1000).toLocaleString()
      );
    } catch (err: any) {
      console.log("   Could not read from struct — using event fallback.");
      const ev = eventsById[i.toString()];
      if (ev) {
        console.log("   Question:   ", ev.question ?? "(unknown)");
        console.log("   Outcomes:   ", ev.outcomes?.join(", ") ?? "(N/A)");
        console.log("   Creator:", ev.creator ?? ev[1] ?? "(unknown)");
      } else {
        console.log("   No event data found for this market ID.");
      }
    }
    console.log("-----------------------------------------------------\n");
  }
}

main().catch((err) => {
  console.error("Error:", err);
  process.exit(1);
});
