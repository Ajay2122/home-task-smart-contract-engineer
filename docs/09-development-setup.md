# Development Setup

## Prerequisites

- Node.js 18+
- npm or yarn
- MetaMask or compatible wallet
- Sepolia testnet ETH

---

## Installation

### 1. Clone Repository

```bash
git clone <repository-url>
cd prediction-markets
```

### 2. Install Frontend Dependencies

```bash
npm install
```

### 3. Install Contract Dependencies

```bash
cd contracts
npm install
cd ..
```

---

## Environment Variables

Create `.env.local` in root:

```env
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=your_walletconnect_project_id
NEXT_PUBLIC_PREDICTION_MARKET_ADDRESS=0x...
NEXT_PUBLIC_REPUTATION_SYSTEM_ADDRESS=0x...
NEXT_PUBLIC_MOCK_USDC_ADDRESS=0x...
```

**Get WalletConnect Project ID**: https://cloud.walletconnect.com/

---

## Running Locally

### Frontend

```bash
npm run dev
```

Opens at http://localhost:3000

### Hardhat Node (Local Blockchain)

```bash
cd contracts
npx hardhat node
```

Runs local blockchain on http://127.0.0.1:8545

---

## Contract Development

### Compile Contracts

```bash
cd contracts
npx hardhat compile
```

### Run Tests

```bash
cd contracts
npx hardhat test
```

Test file: `contracts/test/PredictionMarket.test.ts`

### Deploy to Sepolia

```bash
cd contracts
npx hardhat run scripts/deploy.ts --network sepolia
```

Update `.env.local` with new contract addresses.

---

## Project Structure

```
├── app/              # Next.js pages
├── components/       # React components
├── lib/             # Hooks, utils, contract configs
├── contracts/       # Smart contracts
│   ├── contracts/   # Solidity files
│   ├── scripts/     # Deployment scripts
│   └── test/        # Contract tests
└── docs/            # Documentation
```

---

## Configuration Files

### Frontend

- `next.config.ts` - Next.js configuration
- `tailwind.config.ts` - Tailwind CSS config
- `tsconfig.json` - TypeScript config
- `components.json` - shadcn/ui config
- `lib/wagmi.ts` - Wagmi/RainbowKit config

### Contracts

- `contracts/hardhat.config.ts` - Hardhat configuration
- `contracts/tsconfig.json` - TypeScript config for contracts

---

## Common Commands

```bash
# Frontend
npm run dev          # Start dev server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint

# Contracts
cd contracts
npx hardhat compile  # Compile contracts
npx hardhat test     # Run tests
npx hardhat node     # Start local node
npx hardhat run scripts/deploy.ts --network sepolia  # Deploy
```

---

## Troubleshooting

### "Cannot find module" errors
```bash
rm -rf node_modules package-lock.json
npm install
```

### Contract deployment fails
- Check Sepolia ETH balance
- Verify RPC endpoint in hardhat.config.ts
- Check private key in environment

### Frontend can't connect to contracts
- Verify contract addresses in `.env.local`
- Check wallet is connected to Sepolia
- Ensure contracts are deployed

### Transaction failures
- Check gas limits
- Verify approval for ERC20 tokens
- Ensure market is in correct status
