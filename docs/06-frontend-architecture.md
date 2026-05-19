# Frontend Architecture

## Overview

Next.js 15 application with App Router, TypeScript, and Tailwind CSS.

---

## Project Structure

```
app/
├── page.tsx                 # Home page (featured markets, stats)
├── layout.tsx               # Root layout (providers, header)
├── globals.css              # Global styles
├── create/
│   └── page.tsx            # Create market form
├── markets/
│   ├── page.tsx            # All markets list
│   └── [id]/
│       └── page.tsx        # Market detail page
├── marketplace/
│   └── page.tsx            # Position trading marketplace
└── portfolio/
    └── page.tsx            # User portfolio and positions

components/
├── CreateMarketForm.tsx            # Basic create market form (not used)
├── CreateMarketFormDynamic.tsx     # Dynamic outcome create form (used)
├── ResolveMarketDialog.tsx         # Arbitrator resolution dialog
├── layout/
│   ├── header.tsx                  # App header with wallet connect
│   └── footer.tsx                  # Footer (not used)
├── market/
│   ├── market-card.tsx             # Market preview card
│   ├── activity-feed.tsx           # Market activity (not used)
│   ├── market-overview-chart.tsx   # Chart component (not used)
│   ├── market-stats-card.tsx       # Stats display (not used)
│   ├── outcome-bars.tsx            # Outcome probability bars (not used)
│   └── price-history-chart.tsx     # Price chart (not used)
├── portfolio/
│   ├── position-card.tsx           # User position card
│   ├── list-position-dialog.tsx    # List for sale dialog
│   ├── marketplace-positions.tsx   # Marketplace view (not used)
│   └── stats-card.tsx              # User stats display
├── providers/
│   ├── web3-provider.tsx           # Wagmi + RainbowKit provider
│   └── theme-provider.tsx          # Dark/light theme provider
└── ui/                              # shadcn/ui components
    ├── button.tsx, card.tsx, dialog.tsx, form.tsx
    ├── input.tsx, label.tsx, textarea.tsx
    ├── alert.tsx, badge.tsx, skeleton.tsx
    ├── tabs.tsx, table.tsx, tooltip.tsx
    ├── progress.tsx, radio-group.tsx
    └── ...

lib/
├── contracts/
│   ├── abis/                       # Contract ABIs
│   │   ├── PredictionMarket.json
│   │   ├── ReputationSystem.json
│   │   ├── MockERC20.json
│   │   └── index.ts
│   └── addresses.ts                # Contract addresses from env
├── hooks/
│   ├── useMarkets.ts               # Market read hooks
│   ├── useBet.ts                   # Betting and ERC20 hooks
│   ├── useCreateMarket.ts          # Market creation and resolution
│   ├── usePortfolio.ts             # User portfolio hooks
│   ├── usePositionTrading.ts       # Position listing/buying
│   ├── useMarketplaceListings.ts   # Marketplace event queries
│   ├── useEventHistory.ts          # Event history hooks
│   ├── useStats.ts                 # Platform statistics
│   └── usePriceHistory.ts          # Price tracking (not fully used)
├── utils/
│   ├── format.ts                   # Formatting utilities
│   └── cn.ts                       # Tailwind class merging
├── utils.ts                         # General utilities
└── wagmi.ts                         # Wagmi configuration

```

---

## Pages

### Home (`/`)
- Platform statistics (total markets, volume, active markets)
- Featured markets grid (first 6 markets)
- Hero section with call-to-action

### Markets (`/markets`)
- Tabs: All, Open, Resolved
- Search by question/description
- MarketCard grid display

### Market Detail (`/markets/[id]`)
- Market information and description
- Current odds display with colored bars
- Betting interface (outcome selection, amount input)
- ERC20 approval flow for USDC markets
- Resolve button (arbitrators only, after resolution time)
- Recent activity feed (last 8 bets)

### Create Market (`/create`)
- Dynamic form (2-10 outcomes)
- Token type selection (ETH/USDC)
- Validation (zod schema)
- Wallet connection required

### Portfolio (`/portfolio`)
- Tabs: Positions, Bets History, Claims History
- User reputation stats card
- Position cards with "List for Sale" option
- Win rate calculation
- Transaction history with Etherscan links

### Marketplace (`/marketplace`)
- Marketplace statistics
- Search by market/bet ID/seller
- Position listing cards
- Buy button with ETH payment

---

## Providers

### Web3Provider

```typescript
// components/providers/web3-provider.tsx
<WagmiProvider config={config}>
  <QueryClientProvider client={queryClient}>
    <RainbowKitProvider>
      {children}
    </RainbowKitProvider>
  </QueryClientProvider>
</WagmiProvider>
```

Configuration in `lib/wagmi.ts`:
- Chain: Sepolia
- RainbowKit wallet UI
- WalletConnect project ID

### ThemeProvider

Dark mode by default, system preference support.

---

## Routing

- App Router (Next.js 15)
- File-based routing
- Dynamic routes: `/markets/[id]`
- Client components ("use client") for interactivity

---

## Styling

- **Tailwind CSS**: Utility-first styling
- **shadcn/ui**: Pre-built accessible components
- **CSS Variables**: Theme colors in `globals.css`
- **Dark Mode**: Default theme

---

## State Management

- **Wagmi hooks**: Contract reads/writes
- **React Query**: Caching and refetching
- **React useState**: Local component state
- **No global state**: Each page manages own state
