import { expect } from "chai";
import { ethers } from "hardhat";
import { time } from "@nomicfoundation/hardhat-network-helpers";

/**
 * World Cup on-chain betting assessment scenarios.
 *
 * By default these tests deploy `WorldCupBetting.sol` (stub -> all calls revert) so the suite is
 * RED until the candidate implements that contract.
 *
 * Instructors: run with WORLD_CUP_ASSESSMENT_SOLUTION=1 to deploy `PredictionMarket` instead and
 * verify that the scenario spec matches the reference implementation.
 *
 *   cd contracts && npx hardhat test test/WorldCupBetting.assessment.test.ts
 */

const ASSESSMENT_CONTRACT =
  process.env.WORLD_CUP_ASSESSMENT_SOLUTION === "1" ? "PredictionMarket" : "WorldCupBetting";

describe("World Cup on-chain betting (assessment scenarios)", function () {
  let predictionMarket: any;
  let reputationSystem: any;
  let usdc: any;
  let owner: any;
  let oracle: any;
  let fanBrazil: any;
  let fanSerbia: any;
  let fanDraw: any;
  let fanFrance: any;
  let fanSpain: any;
  let neutralFan: any;

  async function deployFixture() {
    const signers = await ethers.getSigners();
    [
      owner,
      oracle,
      fanBrazil,
      fanSerbia,
      fanDraw,
      fanFrance,
      fanSpain,
      neutralFan,
    ] = signers;

    const ReputationSystem = await ethers.getContractFactory("ReputationSystem");
    const reputation = await ReputationSystem.deploy();
    await reputation.waitForDeployment();

    const Market = await ethers.getContractFactory(ASSESSMENT_CONTRACT);
    const market = await Market.deploy(await reputation.getAddress());
    await market.waitForDeployment();

    await reputation.setPredictionMarket(await market.getAddress());

    const MockERC20 = await ethers.getContractFactory("MockERC20");
    const token = await MockERC20.deploy("Mock USDC", "mUSDC");
    await token.waitForDeployment();

    return { reputation, market, token };
  }

  beforeEach(async function () {
    const { reputation, market, token } = await deployFixture();
    reputationSystem = reputation;
    predictionMarket = market;
    usdc = token;
  });

  it("Scenario A: group-stage match with three outcomes (1X2) can be created and resolved", async function () {
    const resolution = (await time.latest()) + 7 * 24 * 3600;

    await predictionMarket.createMarket(
      "World Cup 2026: Brazil vs Serbia — match result?",
      "Resolves to the actual full-time result (90 minutes + stoppage).",
      ["Brazil", "Draw", "Serbia"],
      resolution,
      oracle.address,
      ethers.ZeroAddress
    );

    const marketId = await predictionMarket.marketCount();
    expect(marketId).to.equal(1n);

    const betDraw = ethers.parseEther("0.2");
    await predictionMarket
      .connect(fanDraw)
      .placeBet(marketId, 1, betDraw, 0, { value: betDraw });

    await time.increaseTo(resolution + 1);
    await predictionMarket.connect(oracle).resolveMarket(marketId, 1);

    const m = await predictionMarket.getMarket(marketId);
    expect(m.status).to.equal(2);
  });

  it("Scenario B: knockout yes/no market — winner receives net payout after platform fee", async function () {
    const resolution = (await time.latest()) + 86400;

    await predictionMarket.createMarket(
      "World Cup 2026 R16: Will France eliminate Spain?",
      "YES if France advances (wins in regulation, extra time, or pens).",
      ["YES", "NO"],
      resolution,
      oracle.address,
      ethers.ZeroAddress
    );

    const marketId = await predictionMarket.marketCount();
    const stakeYes = ethers.parseEther("1");
    const stakeNo = ethers.parseEther("1");

    await predictionMarket
      .connect(fanFrance)
      .placeBet(marketId, 0, stakeYes, 0, { value: stakeYes });
    await predictionMarket
      .connect(fanSpain)
      .placeBet(marketId, 1, stakeNo, 0, { value: stakeNo });

    await time.increaseTo(resolution + 1);
    await predictionMarket.connect(oracle).resolveMarket(marketId, 0);

    const yesBets = await predictionMarket.getMarketBets(marketId);
    const yesBetId = yesBets[0];

    const balanceBefore = await ethers.provider.getBalance(fanFrance.address);
    const tx = await predictionMarket.connect(fanFrance).claimWinnings(yesBetId);
    const receipt = await tx.wait();
    const gas = receipt!.fee;

    const balanceAfter = await ethers.provider.getBalance(fanFrance.address);
    expect(balanceAfter + gas).to.be.gt(balanceBefore);

    const fees = await predictionMarket.getAvailableFees(ethers.ZeroAddress);
    expect(fees).to.be.gt(0n);

    const ownerBefore = await ethers.provider.getBalance(owner.address);
    const wd = await predictionMarket.connect(owner).withdrawFees(ethers.ZeroAddress);
    const wdReceipt = await wd.wait();
    const ownerAfter = await ethers.provider.getBalance(owner.address);
    expect(ownerAfter + wdReceipt!.fee).to.be.gt(ownerBefore);
  });

  it("Scenario C: oracle cannot resolve before kickoff window closes", async function () {
    const resolution = (await time.latest()) + 3600;

    await predictionMarket.createMarket(
      "World Cup Final: who lifts the trophy?",
      "Resolves to the tournament winner.",
      ["Country A", "Country B"],
      resolution,
      oracle.address,
      ethers.ZeroAddress
    );

    const marketId = await predictionMarket.marketCount();
    await expect(
      predictionMarket.connect(oracle).resolveMarket(marketId, 0)
    ).to.be.revertedWith("Too early");
  });

  it("Scenario D: random fan cannot resolve the match", async function () {
    const resolution = (await time.latest()) + 60;

    await predictionMarket.createMarket(
      "World Cup: will the host nation reach the semis?",
      "YES if the host reaches the semi-finals.",
      ["YES", "NO"],
      resolution,
      oracle.address,
      ethers.ZeroAddress
    );

    const marketId = await predictionMarket.marketCount();
    await time.increaseTo(resolution + 1);

    await expect(
      predictionMarket.connect(neutralFan).resolveMarket(marketId, 0)
    ).to.be.revertedWith("Only arbitrator");
  });

  it("Scenario E: no new stakes after the official resolution timestamp", async function () {
    const resolution = (await time.latest()) + 120;

    await predictionMarket.createMarket(
      "World Cup: golden boot — over 6 goals?",
      "YES if the top scorer has more than 6 goals.",
      ["YES", "NO"],
      resolution,
      oracle.address,
      ethers.ZeroAddress
    );

    const marketId = await predictionMarket.marketCount();
    await time.increaseTo(resolution);

    const stake = ethers.parseEther("0.05");
    await expect(
      predictionMarket
        .connect(fanBrazil)
        .placeBet(marketId, 0, stake, 0, { value: stake })
    ).to.be.revertedWith("Market closed");
  });

  it("Scenario F: slippage guard rejects bets when minShares is too high", async function () {
    const resolution = (await time.latest()) + 86400;

    await predictionMarket.createMarket(
      "World Cup: will VAR overturn a goal in the final?",
      "YES if any goal is overturned by VAR in the final.",
      ["YES", "NO"],
      resolution,
      oracle.address,
      ethers.ZeroAddress
    );

    const marketId = await predictionMarket.marketCount();
    const stake = ethers.parseEther("0.1");

    await expect(
      predictionMarket
        .connect(fanBrazil)
        .placeBet(marketId, 0, stake, ethers.MaxUint256, { value: stake })
    ).to.be.revertedWith("Slippage exceeded");
  });

  it("Scenario G: secondary market — ticket buyer collects if seller picked the winner", async function () {
    const resolution = (await time.latest()) + 86400;

    await predictionMarket.createMarket(
      "World Cup: will the underdog win the opening match?",
      "YES if the lower-ranked team wins.",
      ["YES", "NO"],
      resolution,
      oracle.address,
      ethers.ZeroAddress
    );

    const marketId = await predictionMarket.marketCount();
    const stake = ethers.parseEther("0.5");

    await predictionMarket
      .connect(fanBrazil)
      .placeBet(marketId, 0, stake, 0, { value: stake });

    const betIds = await predictionMarket.getUserBets(fanBrazil.address);
    const betId = betIds[betIds.length - 1];

    const listPrice = ethers.parseEther("0.55");
    await predictionMarket.connect(fanBrazil).listPosition(betId, listPrice);

    await predictionMarket.connect(neutralFan).buyPosition(betId, { value: listPrice });

    await time.increaseTo(resolution + 1);
    await predictionMarket.connect(oracle).resolveMarket(marketId, 0);

    const before = await ethers.provider.getBalance(neutralFan.address);
    const claimTx = await predictionMarket.connect(neutralFan).claimWinnings(betId);
    const claimReceipt = await claimTx.wait();
    const after = await ethers.provider.getBalance(neutralFan.address);
    expect(after + claimReceipt!.fee).to.be.gt(before);
  });

  it("Scenario H: stablecoin pool — same lifecycle using ERC20 collateral", async function () {
    const resolution = (await time.latest()) + 86400;
    const tokenAddr = await usdc.getAddress();

    await predictionMarket.createMarket(
      "World Cup sponsor pool: total goals over 170?",
      "YES if total tournament goals exceed 170.",
      ["YES", "NO"],
      resolution,
      oracle.address,
      tokenAddr
    );

    const marketId = await predictionMarket.marketCount();
    const amount = ethers.parseUnits("100", 18);

    await usdc.mint(fanFrance.address, amount);
    await usdc.mint(fanSpain.address, amount);
    await usdc.connect(fanFrance).approve(await predictionMarket.getAddress(), amount);
    await usdc.connect(fanSpain).approve(await predictionMarket.getAddress(), amount);

    await predictionMarket.connect(fanFrance).placeBet(marketId, 0, amount / 2n, 0);
    await predictionMarket.connect(fanSpain).placeBet(marketId, 1, amount / 2n, 0);

    await time.increaseTo(resolution + 1);
    await predictionMarket.connect(oracle).resolveMarket(marketId, 0);

    const bets = await predictionMarket.getMarketBets(marketId);
    const franceBetId = bets[0];

    const balBefore = await usdc.balanceOf(fanFrance.address);
    await predictionMarket.connect(fanFrance).claimWinnings(franceBetId);
    const balAfter = await usdc.balanceOf(fanFrance.address);
    expect(balAfter).to.be.gt(balBefore);
  });

  it("Scenario I: losing side can settle to record reputation without double-claim", async function () {
    const resolution = (await time.latest()) + 86400;

    await predictionMarket.createMarket(
      "World Cup: will there be a penalty shootout in the final?",
      "YES if the final is decided on penalties.",
      ["YES", "NO"],
      resolution,
      oracle.address,
      ethers.ZeroAddress
    );

    const marketId = await predictionMarket.marketCount();
    const stake = ethers.parseEther("0.02");

    await predictionMarket
      .connect(fanBrazil)
      .placeBet(marketId, 0, stake, 0, { value: stake });

    const bets = await predictionMarket.getMarketBets(marketId);
    const betId = bets[0];

    await time.increaseTo(resolution + 1);
    await predictionMarket.connect(oracle).resolveMarket(marketId, 1);

    const ethBefore = await ethers.provider.getBalance(fanBrazil.address);
    await predictionMarket.connect(fanBrazil).claimWinnings(betId);
    const ethAfter = await ethers.provider.getBalance(fanBrazil.address);
    expect(ethAfter).to.be.lte(ethBefore);

    await expect(
      predictionMarket.connect(fanBrazil).claimWinnings(betId)
    ).to.be.revertedWith("Already claimed");
  });
});
