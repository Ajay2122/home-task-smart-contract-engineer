# Testing Guide

This guide shows you how to test all the contract changes.

---

## Step 1: Compile Contracts

```bash
cd contracts
npx hardhat compile
```

**Expected Output**:
```
Compiled X Solidity files successfully
```

If you get errors, check the contract syntax.

---

## Step 2: Run Existing Tests

```bash
npx hardhat test
```

**Expected Output**:
```
  PredictionMarket
    ✔ Should create a market
    ✔ Should place a bet and claim winnings

  2 passing (XXXms)
```

---

## Step 3: Deploy to Local Hardhat Network (Optional)

### Terminal 1 - Start Local Node:
```bash
cd contracts
npx hardhat node
```

This starts a local blockchain at http://127.0.0.1:8545

### Terminal 2 - Deploy:
```bash
cd contracts
npx hardhat run scripts/deploy.ts --network localhost
```

**Save the addresses** printed:
```
ReputationSystem: 0x...
PredictionMarket: 0x...
Mock USDC: 0x...
```

---

## Step 4: Deploy to Sepolia Testnet

### Prerequisites:
1. Get Sepolia ETH from faucet: https://sepoliafaucet.com/
2. Set up `.env` file in `contracts/` folder:

```env
SEPOLIA_RPC_URL=https://sepolia.infura.io/v3/YOUR_INFURA_KEY
PRIVATE_KEY=your_wallet_private_key
ETHERSCAN_API_KEY=your_etherscan_api_key
```

### Deploy:
```bash
cd contracts
npx hardhat run scripts/deploy.ts --network sepolia
```

**Expected Output**:
```
Deploying contracts...
ReputationSystem: 0xABC...
PredictionMarket: 0xDEF...
Mock USDC: 0x123...

=== SAVE THESE ADDRESSES ===
NEXT_PUBLIC_PREDICTION_MARKET_ADDRESS= 0xDEF...
NEXT_PUBLIC_REPUTATION_SYSTEM_ADDRESS= 0xABC...
NEXT_PUBLIC_MOCK_USDC_ADDRESS= 0x123...
```

---

## Step 5: Update Frontend Environment

Update `.env.local` in the root folder:

```env
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=your_project_id
NEXT_PUBLIC_PREDICTION_MARKET_ADDRESS=0xDEF...
NEXT_PUBLIC_REPUTATION_SYSTEM_ADDRESS=0xABC...
NEXT_PUBLIC_MOCK_USDC_ADDRESS=0x123...
```

---

## Step 6: Update Contract ABIs

After deployment, copy the ABIs:

```bash
# From contracts folder
cp artifacts/contracts/PredictionMarket.sol/PredictionMarket.json ../lib/contracts/abis/
cp artifacts/contracts/ReputationSystem.sol/ReputationSystem.json ../lib/contracts/abis/
cp artifacts/contracts/MockERC20.sol/MockERC20.json ../lib/contracts/abis/
```

---

## Step 7: Test Frontend Locally

```bash
# From root folder
npm run dev
```

Open http://localhost:3000

---

## Step 8: Manual Testing Checklist

### Test 1: Create Market (ETH)
1. Connect wallet (make sure you're on Sepolia)
2. Click "Create Market"
3. Fill form:
   - Question: "Test Market?"
   - Description: "Testing..."
   - Outcomes: "Yes", "No"
   - Resolution date: Tomorrow
   - Arbitrator: Your address (default)
   - Token: **ETH**
4. Click "Create Market"
5. **✅ Verify**: Transaction succeeds, redirects to home

### Test 2: Place Bet (ETH Market)
1. Go to Markets page
2. Click on your test market
3. Select "Yes" outcome
4. Enter amount: 0.01 ETH
5. Click "Place Bet with ETH"
6. **✅ Verify**: Transaction succeeds, bet appears in activity

### Test 3: Create USDC Market
1. Create another market
2. Select Token: **USDC**
3. **✅ Verify**: Market created successfully

### Test 4: Place Bet (USDC Market)
1. Go to USDC market
2. Select outcome
3. Enter amount: 1 USDC
4. **First**: Click "Approve USDC" → approve transaction
5. **Second**: Click "Place Bet with USDC" → bet transaction
6. **✅ Verify**: Both transactions succeed

### Test 5: List Position for Sale
1. Go to Portfolio
2. Find an active position
3. Click "List for Sale"
4. Enter price: 0.02 ETH
5. **✅ Verify**: Position listed in marketplace

### Test 6: Cancel Listing (NEW FEATURE!)
1. Go to Portfolio
2. Find your listed position
3. Click "Cancel Listing" (if UI added)
4. Or use console:
```javascript
// In browser console
import { useCancelListing } from '@/lib/hooks/usePositionTrading'
const { cancelListing } = useCancelListing()
cancelListing(betId) // Your bet ID
```
5. **✅ Verify**: Position removed from marketplace

### Test 7: Buy Position (ETH Market)
1. Go to Marketplace
2. Find a listing (not yours)
3. Click "Buy"
4. **✅ Verify**:
   - ETH deducted from your wallet
   - Seller receives ETH
   - Position now in your portfolio

### Test 8: Buy Position (USDC Market)
1. List a USDC market position
2. Buy with another account
3. **First**: Approve USDC spending
4. **Second**: Buy position
5. **✅ Verify**:
   - USDC transferred to seller
   - Position ownership transferred

### Test 9: Resolve Market
1. Wait until after resolution time (or use Hardhat time travel)
2. As arbitrator, click "Resolve Market"
3. Select winning outcome
4. **✅ Verify**: Market status changes to "Resolved"

### Test 10: Claim Winnings
1. Go to Portfolio
2. Find resolved market bet
3. **If Winner**: Click "Claim Winnings"
   - **✅ Verify**: Receive payout (minus 2% fee)
   - **✅ Verify**: Reputation +10
4. **If Loser**: Click "Claim"
   - **✅ Verify**: No payout
   - **✅ Verify**: Reputation -5

---

## Step 9: Test New Contract Features

### Test `.call()` instead of `.transfer()`

**What Changed**: ETH transfers now use `.call()` instead of `.transfer()`

**How to Test**:
1. Claim winnings from an ETH market
2. Buy a position on an ETH market
3. **✅ Verify**: No "transfer failed" errors

**Why This Matters**: Some smart contract wallets couldn't receive ETH with `.transfer()`. Now they can.

---

### Test Slippage Protection

**What Changed**: `placeBet()` now has `_minShares` parameter

**How to Test**:
1. Place a bet on any market
2. **✅ Verify**: Transaction succeeds (minShares currently set to 0)

**Future Enhancement**: Calculate expected shares and set `minShares` to 95% of expected.

---

### Test ERC20 Position Trading

**What Changed**: Can now buy/sell USDC market positions with USDC (not just ETH)

**How to Test**:
1. Create USDC market
2. Place bet
3. List position for sale (price in USDC)
4. Buy position with another account:
   - Approve USDC first
   - Buy position (no ETH sent)
5. **✅ Verify**:
   - Buyer's USDC decreased
   - Seller's USDC increased
   - Position transferred

---

### Test userBets Mapping Update

**What Changed**: `userBets` array now updates when position is bought

**How to Test**:
1. Check user1's bets: `getUserBets(user1Address)`
2. User1 lists position, user2 buys it
3. Check user2's bets: `getUserBets(user2Address)`
4. **✅ Verify**: Bet ID appears in user2's array

---

## Step 10: Verify on Etherscan

After deploying to Sepolia:

1. Go to https://sepolia.etherscan.io/
2. Search for your contract address
3. Check:
   - ✅ Contract deployed
   - ✅ Transactions appearing
   - ✅ Events emitted

---

## Troubleshooting

### Error: "Insufficient funds"
**Solution**: Get more Sepolia ETH from faucet

### Error: "Nonce too high"
**Solution**: Reset MetaMask account (Settings → Advanced → Clear activity)

### Error: "Contract not found"
**Solution**: Check contract addresses in `.env.local`

### Error: "placeBet() missing argument"
**Solution**: Update ABI files (Step 6)

### Error: "Slippage exceeded"
**Solution**: This shouldn't happen (minShares = 0), but if it does, increase your bet amount

### Frontend not showing changes
**Solution**:
```bash
rm -rf .next
npm run build
npm run dev
```

---

## Quick Test Script

For rapid testing, create this script:

**File**: `contracts/scripts/quickTest.ts`

```typescript
import { ethers } from "hardhat";

async function main() {
  const [owner, user1] = await ethers.getSigners();

  // Get deployed contract
  const predictionMarket = await ethers.getContractAt(
    "PredictionMarket",
    "YOUR_CONTRACT_ADDRESS"
  );

  // Test 1: Create market
  console.log("Creating market...");
  const tx = await predictionMarket.createMarket(
    "Quick test?",
    "Testing",
    ["Yes", "No"],
    Math.floor(Date.now() / 1000) + 86400,
    owner.address,
    ethers.ZeroAddress
  );
  await tx.wait();
  console.log("✅ Market created");

  // Test 2: Place bet with slippage protection
  console.log("Placing bet...");
  const betTx = await predictionMarket.placeBet(
    1,
    0,
    ethers.parseEther("0.01"),
    0, // minShares
    { value: ethers.parseEther("0.01") }
  );
  await betTx.wait();
  console.log("✅ Bet placed");

  console.log("All tests passed!");
}

main();
```

Run: `npx hardhat run scripts/quickTest.ts --network sepolia`

---

## Summary

**Testing Order**:
1. ✅ Compile contracts
2. ✅ Run unit tests
3. ✅ Deploy to Sepolia
4. ✅ Update frontend env
5. ✅ Update ABIs
6. ✅ Manual UI testing
7. ✅ Verify all 7 fixes work

**All 7 fixes should work if**:
- Compilation succeeds
- Tests pass
- Deployment succeeds
- Manual tests pass

Good luck! 🚀
