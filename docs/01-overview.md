# Overview

## What is Prediction Markets?

A decentralized prediction market platform built on Ethereum that allows users to create markets, place bets on future events, and trade positions. The platform combines blockchain transparency with an intuitive user experience.

## Key Features

### Multi-Outcome Markets
- Support for 2-10 outcomes per market
- Binary (Yes/No) and multi-choice markets
- Automated market maker pricing algorithm

### Dual Token Support
- **ETH Markets**: Bet with native Ethereum
- **USDC Markets**: Bet with stablecoin (ERC20)
- Separate approval flow for ERC20 tokens

### Position Trading
- P2P marketplace for trading positions
- List positions for sale before market resolution
- Exit early or buy into winning positions
- Trading happens in ETH only

### Reputation System
- Track user accuracy and performance
- Reputation scoring (100-1000 points)
- +10 for wins, -5 for losses
- Weight calculations based on track record

### Decentralized Resolution
- Arbitrator-based resolution system
- Time-locked resolution (after resolution date)
- Transparent outcome determination

### Platform Fees
- 2% fee on winnings only
- No fees on position trading (P2P)
- Owner can withdraw collected fees

## Tech Stack

### Smart Contracts
- **Solidity 0.8.30**
- **Hardhat** - Development & testing framework
- **OpenZeppelin** - Security-audited contract libraries (ReentrancyGuard, Ownable, ERC20)
- **Sepolia Testnet** - Deployment network

### Frontend
- **Next.js 15** - React framework with App Router
- **TypeScript** - Type-safe development
- **Tailwind CSS** - Utility-first styling
- **shadcn/ui** - Component library

### Web3 Integration
- **Wagmi v2** - React hooks for Ethereum
- **Viem** - TypeScript Ethereum library
- **RainbowKit** - Wallet connection UI
- **WalletConnect** - Multi-wallet support

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Next.jsFrontend                      │
│  ┌──────────┐  ┌───────────┐  ┌───────────┐  ┌─────────┐│
│  │  Markets │  │ Portfolio │  │Marketplace│  │ Create  ││
│  │   Page   │  │   Page    │  │   Page    │  │  Page   ││
│  └────┬─────┘  └─────┬─────┘  └─────┬─────┘  └────┬────┘│
│       │              │              │             │     │
│       └──────────────┴──────────────┴─────────────┘     │
│                          │                              │
│              ┌───────────▼───────────┐                  │
│              │   Wagmi Hooks Layer   │                  │
│              │  (useMarkets, useBet) │                  │
│              └───────────┬───────────┘                  │
└────────────────────────────┼────────────────────────────┘
                             │
                  ┌──────────▼──────────┐
                  │   RainbowKit/Viem   │
                  │   (Web3 Provider)   │
                  └──────────┬──────────┘
                             │
        ┌────────────────────┼────────────────────┐
        │                    │                    │
┌───────▼─────────┐  ┌────────▼─────────┐  ┌──────▼──────┐
│ PredictionMarket│  │ ReputationSystem │  │  MockERC20  │
│    Contract     │  │    Contract      │  │  (USDC)     │
│                 │  │                  │  │             │
│ - createMarket  │  │ - updateRep      │  │ - approve   │
│ - placeBet      │  │ - getStats       │  │ - transfer  │
│ - resolveMarket │  │ - getWeight      │  │ - mint      │
│ - claimWinnings │  │                  │  │             │
│ - listPosition  │  │                  │  │             │
│ - buyPosition   │  │                  │  │             │
│ - withdrawFees  │  │                  │  │             │
└─────────────────┘  └──────────────────┘  └─────────────┘
         │                    │
         └────────────────────┘
                  │
         Sepolia Blockchain
```

## How It Works

### 1. Create Market
Users create prediction markets with:
- Question and description
- 2-10 possible outcomes
- Resolution date (future timestamp)
- Arbitrator address
- Token type (ETH or USDC)

### 2. Place Bets
- Users select an outcome and bet amount
- For ETH: send ETH with transaction
- For USDC: approve tokens first, then bet
- Shares calculated using automated pricing
- Pools updated, odds change dynamically

### 3. Trade Positions
- List positions on marketplace with asking price (ETH only)
- P2P trading - buyer pays seller directly
- Ownership transfers automatically
- No platform fees on trades

### 4. Resolve & Claim
- Arbitrator resolves after resolution time passes
- Winners claim proportional share of total pool
- 2% platform fee deducted from winnings
- Reputation updated (+10 win, -5 loss)
- Losers can claim to update reputation

## Network Information

- **Network**: Sepolia Testnet
- **Chain ID**: 11155111
- **Block Explorer**: https://sepolia.etherscan.io/

## Environment Variables Required

```
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=...
NEXT_PUBLIC_PREDICTION_MARKET_ADDRESS=0x...
NEXT_PUBLIC_REPUTATION_SYSTEM_ADDRESS=0x...
NEXT_PUBLIC_MOCK_USDC_ADDRESS=0x...
```

## Getting Started

1. **Connect Wallet**: Use RainbowKit to connect MetaMask or other wallets
2. **Get Test ETH**: Use Sepolia faucet
3. **Browse Markets**: Explore existing prediction markets
4. **Place Bets**: Choose outcomes and place bets
5. **Trade Positions**: List or buy positions on marketplace
6. **Create Markets**: Launch your own prediction markets

## Fee Structure

- **Platform Fee**: 2% of winnings only
- **Position Trading**: No platform fees (P2P, seller gets full amount)
- **Market Creation**: Free (only gas)
- **Betting**: Only gas fees

## Documentation Structure

- [02-smart-contracts.md](./02-smart-contracts.md) - Contract architecture
- [03-market-lifecycle.md](./03-market-lifecycle.md) - Market operations
- [04-position-trading.md](./04-position-trading.md) - Marketplace features
- [05-reputation-system.md](./05-reputation-system.md) - User reputation
- [06-frontend-architecture.md](./06-frontend-architecture.md) - Frontend structure
- [07-hooks-and-data.md](./07-hooks-and-data.md) - React hooks
- [08-ui-components.md](./08-ui-components.md) - UI components
- [09-development-setup.md](./09-development-setup.md) - Local setup
- [10-deployment.md](./10-deployment.md) - Deployment guide
- [11-user-flows.md](./11-user-flows.md) - User journeys
- [12-api-reference.md](./12-api-reference.md) - API documentation

.