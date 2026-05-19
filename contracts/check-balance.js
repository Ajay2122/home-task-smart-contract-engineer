const { ethers } = require("hardhat");

async function main() {
  const [deployer] = await ethers.getSigners();
  const balance = await ethers.provider.getBalance(deployer.address);

  console.log("Deployer Address:", deployer.address);
  console.log("Balance:", ethers.formatEther(balance), "ETH");

  if (balance === 0n) {
    console.log("\n⚠️  No funds! Get Sepolia ETH from: https://sepoliafaucet.com");
  } else {
    console.log("\n✅ Ready to deploy!");
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
