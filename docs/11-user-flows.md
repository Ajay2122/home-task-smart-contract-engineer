# User Flows

## 1. Creating a Market

1. **Connect Wallet**
   - Click "Connect Wallet" in header
   - Select wallet (MetaMask, etc.)
   - Approve connection to Sepolia

2. **Navigate to Create Page**
   - Click "Create Market" in navigation
   - Or use button on home page

3. **Fill Form**
   - Enter question (10-200 chars)
   - Write description (20-1000 chars)
   - Add outcomes (2-10):
     - Click "+ Add Outcome" for more
     - Click X to remove (minimum 2)
   - Select resolution date (must be future)
   - Enter arbitrator address (defaults to your address)
   - Choose token type: ETH or USDC

4. **Submit**
   - Click "Create Market"
   - Wallet prompts for signature
   - Wait for transaction confirmation
   - Redirects to home page on success

---

## 2. Placing a Bet (ETH Market)

1. **Find Market**
   - Browse on home page or markets page
   - Click market card to view details

2. **Review Market**
   - Read question and description
   - Check resolution date
   - View current odds

3. **Select Outcome**
   - Click on outcome card
   - Shows selected state

4. **Enter Amount**
   - Input bet amount in ETH
   - Example: 0.1

5. **Place Bet**
   - Click "Place Bet with ETH"
   - Wallet prompts with ETH amount
   - Approve transaction
   - Wait for confirmation
   - Bet appears in recent activity

---

## 3. Placing a Bet (USDC Market)

1. **Find USDC Market**
   - Identified by "USDC" currency badge

2. **Select Outcome & Amount**
   - Click outcome
   - Enter amount in USDC

3. **Approve USDC** (first time only)
   - Alert shows approval required
   - Click "Approve USDC"
   - Wallet prompts for approval
   - Wait for confirmation

4. **Place Bet**
   - Alert shows "Token Approval: Ready"
   - Click "Place Bet with USDC"
   - Wallet prompts (no value, just approval)
   - Confirm transaction

---

## 4. Viewing Portfolio

1. **Connect Wallet** (required)

2. **Navigate to Portfolio**
   - Click "Portfolio" in navigation

3. **View Tabs**
   - **Positions**: Active bets you own
   - **Bets**: All bets you've placed (history)
   - **Claims**: All winnings you've claimed

4. **View Stats**
   - Reputation score
   - Total bets
   - Accuracy percentage

---

## 5. Listing Position for Sale

1. **Go to Portfolio**
   - Navigate to Portfolio page
   - Switch to "Positions" tab

2. **Find Active Position**
   - Look for open market bets
   - Position shows market question and outcome

3. **List for Sale**
   - Click "List for Sale" button
   - Dialog opens

4. **Set Price**
   - Enter asking price in ETH
   - Example: 0.12

5. **Confirm Listing**
   - Click "List Position"
   - Wallet prompts
   - Approve transaction
   - Position appears in marketplace

---

## 6. Buying a Position

1. **Navigate to Marketplace**
   - Click "Marketplace" in navigation

2. **Browse Listings**
   - View all positions for sale
   - Search by market ID, bet ID, or seller
   - Click market badge to view market details

3. **Review Position**
   - Check market question
   - View outcome
   - See original bet amount and shares
   - Review asking price

4. **Buy Position**
   - Click "Buy for X ETH"
   - Wallet prompts with ETH amount
   - Approve transaction
   - Ownership transfers to you
   - Position appears in your portfolio

---

## 7. Resolving a Market (Arbitrator Only)

1. **Navigate to Market**
   - Must be the designated arbitrator
   - Market must have passed resolution time

2. **Click Resolve Button**
   - Button appears at top of market page
   - Shows "Resolve Market" (or "Not Yet" if before time)

3. **Select Winner**
   - Dialog shows all outcomes
   - Select winning outcome via radio button

4. **Confirm Resolution**
   - Click "Confirm Resolution"
   - Wallet prompts
   - Approve transaction
   - Market status changes to "Resolved"

---

## 8. Claiming Winnings

1. **Market Must Be Resolved**
   - Check market page or portfolio

2. **Go to Portfolio**
   - Navigate to Positions tab
   - Find resolved market bets

3. **Claim**
   - **If Winner**:
     - Click "Claim Winnings" button
     - Wallet prompts
     - Approve transaction
     - Receive payout (minus 2% fee)
     - Reputation +10

   - **If Loser**:
     - Click "Claim" button (updates reputation)
     - Wallet prompts
     - No payout received
     - Reputation -5

4. **View in Claims Tab**
   - Winning claims show in "Claims" tab
   - Shows amount received and timestamp

---

## Common User Journeys

### New User Journey
1. Connect wallet
2. Browse markets
3. Place first bet (ETH market for simplicity)
4. Wait for resolution
5. Claim winnings or take loss
6. Check reputation in portfolio

### Active Trader Journey
1. Browse multiple markets
2. Place several bets
3. List some positions for sale
4. Buy undervalued positions from marketplace
5. Monitor portfolio
6. Claim winnings from resolved markets

### Market Creator Journey
1. Think of prediction question
2. Create market with clear resolution criteria
3. Set self as arbitrator
4. Promote market
5. After resolution date, resolve market
6. Community claims winnings

---

## Error Scenarios

### Insufficient Balance
- "Insufficient funds" error
- Solution: Get more ETH/USDC

### Wrong Network
- Transactions fail
- Solution: Switch to Sepolia in wallet

### Bet on Resolved Market
- "Market not open" error
- Solution: Can only bet on open markets

### Resolve Before Time
- Button disabled
- Solution: Wait until after resolution time

### Claim Already Claimed
- "Already claimed" error
- Solution: Each bet can only be claimed once

### Buy Own Position
- Alert: "This is your listing"
- Solution: Can't buy your own position
