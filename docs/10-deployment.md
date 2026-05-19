# Deployment

## Contract Deployment

### 1. Setup Hardhat Config

Edit `contracts/hardhat.config.ts`:

```typescript
networks: {
  sepolia: {
    url: process.env.SEPOLIA_RPC_URL || "",
    accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : []
  }
}
```

### 2. Set Environment Variables

Create `contracts/.env`:

```env
SEPOLIA_RPC_URL=https://sepolia.infura.io/v3/YOUR_INFURA_KEY
PRIVATE_KEY=your_wallet_private_key
ETHERSCAN_API_KEY=your_etherscan_api_key
```

### 3. Deploy Contracts

```bash
cd contracts
npx hardhat run scripts/deploy.ts --network sepolia
```

**Deployment Order**:
1. ReputationSystem
2. PredictionMarket (with ReputationSystem address)
3. Link: `reputationSystem.setPredictionMarket(predictionMarketAddress)`
4. MockERC20 (Mock USDC)

**Output**:
```
ReputationSystem: 0x...
PredictionMarket: 0x...
Mock USDC: 0x...
```

### 4. Update Environment Variables

Update root `.env.local`:

```env
NEXT_PUBLIC_PREDICTION_MARKET_ADDRESS=0x...
NEXT_PUBLIC_REPUTATION_SYSTEM_ADDRESS=0x...
NEXT_PUBLIC_MOCK_USDC_ADDRESS=0x...
```

---

## Contract Verification

### Verify on Etherscan

```bash
cd contracts
npx hardhat verify --network sepolia <CONTRACT_ADDRESS> <CONSTRUCTOR_ARGS>
```

**Examples**:

```bash
# Reputation System (no args)
npx hardhat verify --network sepolia 0x... 

# Prediction Market (reputation address arg)
npx hardhat verify --network sepolia 0x... "0x<REPUTATION_ADDRESS>"

# MockERC20
npx hardhat verify --network sepolia 0x... "Mock USDC" "USDC"
```

---

## Frontend Deployment

### Vercel (Recommended)

1. **Push to GitHub**

2. **Import to Vercel**
   - Connect repository
   - Framework: Next.js
   - Root directory: `/`

3. **Add Environment Variables**
   ```
   NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=...
   NEXT_PUBLIC_PREDICTION_MARKET_ADDRESS=0x...
   NEXT_PUBLIC_REPUTATION_SYSTEM_ADDRESS=0x...
   NEXT_PUBLIC_MOCK_USDC_ADDRESS=0x...
   ```

4. **Deploy**
   - Vercel builds and deploys automatically
   - Deploys on every push to main branch

### Other Platforms

**Build Command**:
```bash
npm run build
```

**Start Command**:
```bash
npm run start
```

**Output Directory**: `.next`

---

## Post-Deployment

### 1. Test Contracts

```bash
# Check balance script
cd contracts
node check-balance.js
```

### 2. Verify Frontend

- Connect wallet to Sepolia
- Create test market
- Place test bet
- Verify transactions on Etherscan

### 3. Mint Test USDC

```bash
# If using MockERC20
cast send <MOCK_USDC_ADDRESS> "mint(address,uint256)" <YOUR_ADDRESS> 1000000000000000000000 --rpc-url <SEPOLIA_RPC> --private-key <KEY>
```

---

## Network Configuration

### Sepolia Testnet

- **Chain ID**: 11155111
- **Currency**: SepoliaETH
- **Block Explorer**: https://sepolia.etherscan.io/
- **Faucets**:
  - https://sepoliafaucet.com/
  - https://sepolia-faucet.pk910.de/

### RPC Endpoints

- Infura: `https://sepolia.infura.io/v3/YOUR_KEY`
- Alchemy: `https://eth-sepolia.g.alchemy.com/v2/YOUR_KEY`
- Public: `https://rpc.sepolia.org`

---

## Deployment Script Details

**File**: `contracts/scripts/deploy.ts`

```typescript
// 1. Deploy ReputationSystem
const ReputationSystem = await ethers.getContractFactory("ReputationSystem");
const reputationSystem = await ReputationSystem.deploy();

// 2. Deploy PredictionMarket
const PredictionMarket = await ethers.getContractFactory("PredictionMarket");
const predictionMarket = await PredictionMarket.deploy(repAddress);

// 3. Link contracts
await reputationSystem.setPredictionMarket(marketAddress);

// 4. Deploy MockERC20
const MockERC20 = await ethers.getContractFactory("MockERC20");
const usdc = await MockERC20.deploy("Mock USDC", "USDC");
```

---

## Security Checklist

- [ ] Use separate wallet for deployment (not main wallet)
- [ ] Verify all contract addresses before updating frontend
- [ ] Test on Sepolia before mainnet (if going to mainnet)
- [ ] Verify contracts on Etherscan
- [ ] Keep private keys secure (never commit to git)
- [ ] Use `.gitignore` for `.env` files
- [ ] Test all flows after deployment

---

## Troubleshooting

### "Insufficient funds"
- Get Sepolia ETH from faucets
- Deployment costs ~0.01-0.02 ETH on Sepolia

### "Nonce too low"
- Reset MetaMask account
- Wait for pending transactions

### "Contract not verified"
- Ensure constructor args match deployment
- Check compiler version in hardhat.config
- Wait a few minutes after deployment

### Frontend shows "Contract not found"
- Verify addresses in `.env.local`
- Rebuild frontend: `npm run build`
- Clear browser cache
