# UI Components

## Market Components

### MarketCard
**File**: `components/market/market-card.tsx`

Displays market preview:
- Question and description
- Status badge (Open/Resolved)
- Outcomes list
- Total volume
- Resolution time
- Link to market detail page

### ResolveMarketDialog
**File**: `components/ResolveMarketDialog.tsx`

Arbitrator resolution interface:
- Radio selection for winning outcome
- Time validation (can't resolve before resolution time)
- Only visible to arbitrator
- Disabled if market already resolved

---

## Portfolio Components

### PositionCard
**File**: `components/portfolio/position-card.tsx`

Displays user position:
- Market question (link to market)
- Outcome bet on
- Bet amount and shares
- Market status
- Claim button (if resolved and unclaimed)
- List for Sale button (if open market)

### ListPositionDialog
**File**: `components/portfolio/list-position-dialog.tsx`

List position for sale:
- Price input (ETH)
- Validation
- List button

### StatsCard
**File**: `components/portfolio/stats-card.tsx`

User statistics display:
- Reputation score
- Total bets
- Correct predictions
- Accuracy percentage

---

## Form Components

### CreateMarketFormDynamic
**File**: `components/CreateMarketFormDynamic.tsx`

Dynamic market creation form:
- Question input (10-200 chars)
- Description textarea (20-1000 chars)
- Dynamic outcomes (2-10, add/remove)
- Resolution date picker
- Arbitrator address input (defaults to connected wallet)
- Token type radio (ETH/USDC)
- Validation with zod
- Success handling with router redirect

**Not Used**: `CreateMarketForm.tsx` (fixed 2 outcomes)

---

## Layout Components

### Header
**File**: `components/layout/header.tsx`

App navigation:
- Logo/brand
- Navigation links (Markets, Create, Portfolio, Marketplace)
- RainbowKit ConnectButton
- Theme toggle

**Not Used**: `footer.tsx`

---

## UI Library (shadcn/ui)

**Location**: `components/ui/`

### Form Components
- `form.tsx` - React Hook Form integration
- `input.tsx` - Text input
- `textarea.tsx` - Multi-line input
- `label.tsx` - Form label
- `radio-group.tsx` - Radio button group
- `button.tsx` - Button variants

### Display Components
- `card.tsx` - Card container (Card, CardHeader, CardTitle, CardDescription, CardContent)
- `badge.tsx` - Status badges
- `alert.tsx` - Alert messages
- `skeleton.tsx` - Loading skeletons
- `progress.tsx` - Progress bar
- `tooltip.tsx` - Tooltips
- `table.tsx` - Data tables
- `tabs.tsx` - Tab navigation

### Modal Components
- `dialog.tsx` - Modal dialogs

---

## Component Patterns

### Client Components

All interactive components use `"use client"` directive:
```typescript
"use client";

import { useAccount } from "wagmi";
// ...
```

### Wagmi Integration

```typescript
const { address } = useAccount();
const { data, isLoading } = useMarket(marketId);
const { placeBet, isPending } = usePlaceBet();
```

### Form Handling

Using react-hook-form + zod:
```typescript
const form = useForm<FormValues>({
  resolver: zodResolver(formSchema),
  defaultValues: { ... }
});

<Form {...form}>
  <form onSubmit={form.handleSubmit(onSubmit)}>
    <FormField ... />
  </form>
</Form>
```

### Loading States

```typescript
{isLoading ? (
  <Skeleton className="h-48 w-full" />
) : (
  <ActualContent />
)}
```

### Error Handling

```typescript
{error && (
  <Alert variant="destructive">
    <AlertTitle>Error</AlertTitle>
    <AlertDescription>{error.message}</AlertDescription>
  </Alert>
)}
```

---

## Unused Components

These components exist but are not used in current pages:
- `market/activity-feed.tsx`
- `market/market-overview-chart.tsx`
- `market/market-stats-card.tsx`
- `market/outcome-bars.tsx`
- `market/price-history-chart.tsx`
- `portfolio/marketplace-positions.tsx`
- `layout/footer.tsx`
