# Prediction Markets Platform

A decentralized prediction markets platform built on Ethereum, allowing users to create markets, place bets, trade positions, and earn reputation based on prediction accuracy.

## 📚 Documentation

Comprehensive documentation is available in the [docs/](docs/) folder:

- **[01-overview.md](docs/01-overview.md)** - Project overview and features
- **[02-smart-contracts.md](docs/02-smart-contracts.md)** - Smart contract documentation
- **[03-market-lifecycle.md](docs/03-market-lifecycle.md)** - Market creation, betting, resolution
- **[04-position-trading.md](docs/04-position-trading.md)** - P2P marketplace for trading positions
- **[05-reputation-system.md](docs/05-reputation-system.md)** - Reputation tracking and scoring
- **[06-frontend-architecture.md](docs/06-frontend-architecture.md)** - Next.js app structure
- **[07-hooks-and-data.md](docs/07-hooks-and-data.md)** - React hooks for blockchain interaction
- **[08-ui-components.md](docs/08-ui-components.md)** - Component library
- **[09-development-setup.md](docs/09-development-setup.md)** - Development environment setup
- **[10-deployment.md](docs/10-deployment.md)** - Deployment guide
- **[11-user-flows.md](docs/11-user-flows.md)** - User journey documentation
- **[12-api-reference.md](docs/12-api-reference.md)** - Complete API reference


## 🚀 Features

- **Binary & Multi-Outcome Markets**: Create markets with 2-10 possible outcomes
- **Dual Token Support**: Support for both ETH and ERC20 tokens (USDC)
- **Automated Market Maker (AMM)**: Dynamic share pricing based on liquidity
- **Position Trading**: P2P marketplace to buy/sell positions before resolution
- **Reputation System**: Track prediction accuracy (100-1000 points)


## 🛠️ Tech Stack

**Smart Contracts:**
- Solidity 0.8.30
- Hardhat
- OpenZeppelin (ReentrancyGuard, IERC20)

**Frontend:**
- Next.js 15 (App Router)
- React 19
- TypeScript
- Tailwind CSS
- Wagmi v2 + Viem
- RainbowKit

---

## 📦 Installation

### Prerequisites

- Node.js 18+
- npm or yarn
- MetaMask or other Web3 wallet

### Clone & Install

```bash
git clone <repository-url>
cd prediction-markets
npm install
```

---

## 🏠 Local Development (Hardhat Network)

### Step 1: Start Local Blockchain

Open **Terminal 1**:

```bash
cd contracts
npx hardhat node
```

This starts a local Ethereum network at `http://127.0.0.1:8545` with 20 pre-funded accounts.

**Save one of the private keys** shown in the output - you'll need it for MetaMask.

---

### Step 2: Deploy Contracts

Open **Terminal 2**:

```bash
cd contracts
npx hardhat run scripts/deploy.ts --network localhost
```

**Expected Output:**
```
Deploying contracts...
ReputationSystem deployed to: 0x5FbDB2315678afecb367f032d93F642f64180aa3
PredictionMarket deployed to: 0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512
Mock USDC deployed to: 0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0

=== SAVE THESE ADDRESSES ===
NEXT_PUBLIC_PREDICTION_MARKET_ADDRESS=0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512
NEXT_PUBLIC_REPUTATION_SYSTEM_ADDRESS=0x5FbDB2315678afecb367f032d93F642f64180aa3
NEXT_PUBLIC_MOCK_USDC_ADDRESS=0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0
```

**Copy these addresses** - you'll need them next.

---

### Step 3: Configure Frontend

Create `.env.local` in the **root folder**:

```env
# WalletConnect Project ID (get from https://cloud.walletconnect.com)
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=your_project_id_here

# Contract Addresses (from deploy output above)
NEXT_PUBLIC_PREDICTION_MARKET_ADDRESS=0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512
NEXT_PUBLIC_REPUTATION_SYSTEM_ADDRESS=0x5FbDB2315678afecb367f032d93F642f64180aa3
NEXT_PUBLIC_MOCK_USDC_ADDRESS=0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0

# Network (localhost)
NEXT_PUBLIC_CHAIN_ID=31337
NEXT_PUBLIC_RPC_URL=http://127.0.0.1:8545
```

---

### Step 4: Configure MetaMask for Localhost

1. Open MetaMask
2. Click network dropdown → **Add Network** → **Add a network manually**
3. Enter:
   - **Network Name**: Localhost 8545
   - **RPC URL**: http://127.0.0.1:8545
   - **Chain ID**: 31337
   - **Currency Symbol**: ETH
4. Click **Save**
5. Import account using one of the private keys from Step 1:
   - Click account icon → **Import Account**
   - Paste private key
   - You should see ~10,000 ETH balance

---

### Step 5: Start Frontend

Open **Terminal 3**:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

### Step 6: Test Locally

1. **Connect Wallet**: Click "Connect Wallet" and select your imported account
2. **Create Market**:
   - Go to "Create Market"
   - Fill in details (resolution date can be 1 minute from now for testing)
   - Select "ETH" as token
   - Submit transaction
3. **Place Bet**:
   - Go to "Markets"
   - Click on your market
   - Select outcome and enter amount (e.g., 0.01 ETH)
   - Place bet
4. **Test Position Trading**:
   - Go to "Portfolio"
   - List a position for sale
   - Switch accounts in MetaMask
   - Buy the position from "Marketplace"

**Note**: For localhost testing, you can use Hardhat's time manipulation:
```bash
# In Terminal 2
npx hardhat console --network localhost
> await network.provider.send("evm_increaseTime", [3600]) // Fast forward 1 hour
> await network.provider.send("evm_mine") // Mine a block
```

---

## 🌐 Sepolia Testnet Deployment

### Step 1: Get Sepolia ETH

Get free Sepolia ETH from faucets:
- https://sepoliafaucet.com/
- https://www.alchemy.com/faucets/ethereum-sepolia

You'll need ~0.02 ETH for deployment and testing.

---

### Step 2: Configure Environment

Create `contracts/.env`:

```env
SEPOLIA_RPC_URL=https://eth-sepolia.g.alchemy.com/v2/YOUR_ALCHEMY_KEY
PRIVATE_KEY=your_wallet_private_key_here
ETHERSCAN_API_KEY=your_etherscan_api_key_here
```

**Get API Keys:**
- **Alchemy RPC**: https://dashboard.alchemy.com/
- **Etherscan API**: https://etherscan.io/myapikey

**Get Private Key from MetaMask:**
1. Click account menu → Account details
2. Click "Show private key"
3. Enter password and copy key
4. ⚠️ **NEVER** commit this to git!

---

### Step 3: Deploy to Sepolia

```bash
cd contracts
npx hardhat run scripts/deploy.ts --network sepolia
```

**Expected Output:**
```
Deploying contracts...
ReputationSystem deployed to: 0xABC123...
PredictionMarket deployed to: 0xDEF456...
Mock USDC deployed to: 0x789GHI...

Verifying on Etherscan...
✅ All contracts verified
```

**Copy the addresses** displayed.

---

### Step 4: Configure Frontend for Sepolia

Update `.env.local` in root folder:

```env
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=your_project_id_here

# Contract Addresses (from Sepolia deployment)
NEXT_PUBLIC_PREDICTION_MARKET_ADDRESS=0xDEF456...
NEXT_PUBLIC_REPUTATION_SYSTEM_ADDRESS=0xABC123...
NEXT_PUBLIC_MOCK_USDC_ADDRESS=0x789GHI...

# Sepolia Network
NEXT_PUBLIC_CHAIN_ID=11155111
NEXT_PUBLIC_RPC_URL=https://eth-sepolia.g.alchemy.com/v2/YOUR_KEY
```

---

### Step 5: Update Contract ABIs

After deployment, copy the latest ABIs to the frontend:

```bash
cd contracts
cp artifacts/contracts/PredictionMarket.sol/PredictionMarket.json ../lib/contracts/abis/
cp artifacts/contracts/ReputationSystem.sol/ReputationSystem.json ../lib/contracts/abis/
cp artifacts/contracts/MockERC20.sol/MockERC20.json ../lib/contracts/abis/
```

---

### Step 6: Start Frontend

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

Make sure MetaMask is connected to **Sepolia** network.

---

## 🧪 Testing

### Quick Unit Tests

```bash
cd contracts
npx hardhat test
```

**Expected Output:**
```
  PredictionMarket
    ✔ Should create a market
    ✔ Should place a bet and claim winnings

  2 passing (XXXms)
```

---

### Comprehensive Integration Test (Sepolia)

This test covers **all features** including the 7 bug fixes.

#### Prerequisites:
1. Contracts deployed to Sepolia
2. Have contract addresses

#### Set Environment Variables:

```bash
cd contracts
export REPUTATION_ADDRESS=0xABC123...
export MARKET_ADDRESS=0xDEF456...
export USDC_ADDRESS=0x789GHI...
```

Or add to `contracts/.env`:
```env
REPUTATION_ADDRESS=0xABC123...
MARKET_ADDRESS=0xDEF456...
USDC_ADDRESS=0x789GHI...
```

#### Run Test:

```bash
npx hardhat run scripts/test-all.ts --network sepolia
```

**What It Tests:**
- ✅ Binary & Multi-outcome Markets (ETH & USDC)
- ✅ Betting with Slippage Protection
- ✅ Position Listing, Canceling, and Trading
- ✅ ERC20 Position Trading
- ✅ Market Resolution & Claims
- ✅ Reputation System Updates
- ✅ Fee Collection & Withdrawal
- ✅ All 7 Bug Fixes Applied


---

## 📁 Project Structure

```
prediction-markets/
├── contracts/               # Smart contracts
│   ├── contracts/          # Solidity files
│   │   ├── PredictionMarket.sol
│   │   ├── ReputationSystem.sol
│   │   └── MockERC20.sol
│   ├── scripts/            # Deployment & test scripts
│   ├── test/               # Unit tests
│   └── hardhat.config.ts   # Hardhat configuration
├── app/                    # Next.js pages (App Router)
│   ├── page.tsx           # Home page
│   ├── markets/           # Market pages
│   ├── create/            # Create market page
│   ├── portfolio/         # User portfolio
│   └── marketplace/       # Position trading
├── components/            # React components
│   ├── ui/               # UI primitives
│   └── ...               # Feature components
├── lib/                  # Libraries & utilities
│   ├── hooks/           # Wagmi hooks
│   ├── contracts/       # Contract addresses & ABIs
│   └── utils/           # Helper functions
├── docs/                # Documentation
└── .env.local          # Environment variables (create this)
```

---

## 🔧 Common Issues & Solutions

### Local Development Issues

**Issue**: "Cannot connect to localhost:8545"
- **Solution**: Make sure `npx hardhat node` is running in Terminal 1

**Issue**: "Nonce too high" error
- **Solution**: Reset MetaMask account:
  - Settings → Advanced → Clear activity tab data

**Issue**: "Insufficient funds"
- **Solution**: Make sure you imported an account from `npx hardhat node` output

---

### Sepolia Issues

**Issue**: "Insufficient funds for gas"
- **Solution**: Get more Sepolia ETH from faucets

**Issue**: "Contract not found"
- **Solution**:
  1. Check contract addresses in `.env.local`
  2. Make sure you're on Sepolia network in MetaMask
  3. Verify contracts deployed successfully

**Issue**: "Transaction underpriced"
- **Solution**: Wait a moment and retry (gas price fluctuation)

**Issue**: Frontend not showing updates
- **Solution**:
  ```bash
  rm -rf .next
  npm run build
  npm run dev
  ```

---

**Happy Predicting! 🎯**
