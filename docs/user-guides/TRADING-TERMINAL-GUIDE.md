# CantonDEX Trading Terminal User Guide

## Overview

The Trading Terminal is a professional-grade trading interface for institutional and retail traders. It provides real-time market data, advanced order management, portfolio tracking, and comprehensive trading tools.

**Technology**: React 18.2, TypeScript
**Port (Local)**: 3000
**URL**: https://trading.cantondex.io

---

## Getting Started

### Account Creation

1. Navigate to https://trading.cantondex.io
2. Click "Sign Up"
3. Enter your email and create a password
4. Verify your email address
5. Complete KYC profile information
6. Wait for KYC approval (1-24 hours)
7. Once approved, you can start trading

### Login

```
Email: your-email@example.com
Password: your-secure-password
2FA Code: (if enabled)
```

### Securing Your Account

**Enable Two-Factor Authentication**:
1. Go to Settings → Security
2. Click "Enable 2FA"
3. Scan QR code with authenticator app (Google Authenticator, Authy, etc.)
4. Enter 6-digit code to verify
5. Save backup codes in secure location

**Create API Keys** (optional):
1. Settings → API Keys
2. Click "Generate New Key"
3. Select permissions (read/trade)
4. Save the key securely
5. Use in automated trading systems

---

## Dashboard

### Main View

The dashboard displays:

1. **Account Summary**
   - Total balance
   - Available balance
   - Unrealized P&L
   - Account equity
   - Margin level

2. **Quick Stats**
   - Daily P&L
   - 24h trading volume
   - Open positions count
   - Order count

3. **Favorite Symbols**
   - Real-time prices
   - Price changes
   - 24h high/low

### Navigating the Interface

**Left Sidebar**:
- Dashboard
- Markets
- Orders
- Trades
- Portfolio
- Settings

**Top Navigation**:
- Search for symbols
- Account selector
- Notifications
- Settings

---

## Trading

### Market Overview

**Markets Page** shows all available trading pairs:

1. **Symbol List**
   - Symbol name
   - Current bid/ask prices
   - 24h change %
   - 24h volume

2. **Filters**
   - Asset class (equities, crypto, etc.)
   - Volume
   - Price range
   - Custom watchlist

### Placing Orders

#### Step 1: Select Symbol

```
Search or select: AAPL/USDC
```

#### Step 2: Choose Order Type

**Limit Order** (Most common):
- Price: 150.50
- Quantity: 100
- Time in Force: GTC (Good Till Cancelled)

**Market Order**:
- Quantity: 100
- Executes immediately at best available price

**Stop Order**:
- Stop Price: 149.50
- Quantity: 100
- Triggers when price reaches stop level

**Stop-Limit Order**:
- Stop Price: 149.50
- Limit Price: 149.00
- Quantity: 100

#### Step 3: Set Parameters

**Order Settings**:
- **Time in Force**:
  - GTC: Good Till Cancelled (default)
  - IOC: Immediate or Cancel
  - FOK: Fill or Kill
  - Day: Expires at market close

- **Advanced Options**:
  - Hidden Order: Not visible in public order book
  - Post-Only: Only provides liquidity (no taker fees)
  - Iceberg Quantity: Shows only small portions

#### Step 4: Review & Submit

```
Review Order:
├─ Side: BUY
├─ Symbol: AAPL/USDC
├─ Quantity: 100 shares
├─ Price: 150.50
├─ Total: 15,050 USDC
├─ Commission: ~10.54 USDC (0.07%)
├─ Margin Required: 3,009.50 USDC
└─ [PLACE ORDER]
```

### Order Management

#### View Orders

**Active Orders**:
1. Go to Orders tab
2. See all pending orders
3. Filter by symbol, side, type

**Order Details**:
- Quantity remaining
- Average fill price
- Fills received
- Created time

**Order Actions**:
- Cancel: `[X]` button
- Replace: Change price/quantity
- View Details: Click order row

#### Cancel Order

```
Order: ord_1234567890
│
├─ Click [X] Cancel
│
└─ Status changes to "CANCELLED"
```

#### Replace Order

1. Click order → Edit
2. Change quantity or price
3. Review new parameters
4. Submit

---

## Portfolio Management

### Positions

**View Current Positions**:
1. Go to Portfolio tab
2. See all holdings

**Position Details**:
```
Symbol: AAPL/USDC
├─ Quantity: 100 shares
├─ Entry Price: 149.975
├─ Current Price: 150.475
├─ Position Value: 15,047.50 USDC
├─ Unrealized P&L: +50 USDC (+0.33%)
├─ Margin Requirement: 3,009.50 USDC
└─ Concentration: 14.7% of portfolio
```

### Account Balance

**Balance Details**:
```
Total Balance: 102,000 USDC
├─ Cash: 100,000 USDC
├─ Positions Value: 15,047.50 USDC
├─ Available: 96,990.50 USDC
└─ Reserved: 5,009.50 USDC
```

### Performance Metrics

**Daily Performance**:
- Daily P&L: +2,000 USDC (+2.0%)
- Highest Equity: 103,500 USDC
- Lowest Equity: 100,500 USDC

**Risk Metrics**:
- Margin Level: 1.8x (Safe)
- Margin Utilization: 4.92%
- VaR 95%: -1,500 USDC (estimated)

---

## Charts & Analysis

### Trading Charts

**Chart Types**:
- Candlestick (default)
- OHLC Bar
- Line
- Area

**Timeframes**:
- 1 minute
- 5 minutes
- 15 minutes
- 1 hour
- 4 hours
- 1 day
- 1 week

### Technical Indicators

**Available Indicators**:
- Moving Averages (SMA, EMA)
- MACD
- RSI (Relative Strength Index)
- Bollinger Bands
- Volume Profile
- Order Flow

### Adding to Watchlist

1. Click heart icon on chart
2. Symbol added to favorites
3. Access from sidebar

---

## Deposits & Withdrawals

### Deposit Cryptocurrency

**Step 1: Create Deposit Address**

```
Currency: USDC
Blockchain: Ethereum

Generate Address ↓

Address: 0x1234567890abcdef1234567890abcdef12345678
Tag: (optional)
Minimum: 100 USDC
```

**Step 2: Send Funds**

Use your external wallet to send USDC to the address provided.

**Step 3: Confirm Deposit**

- Monitor deposit status
- Wait for 12 blockchain confirmations
- Funds appear in your account

**Deposit Status**:
```
Pending (0 confirmations)
    ↓ (12 confirmations)
Confirmed - Funds available
```

### Withdraw Cryptocurrency

**Step 1: Request Withdrawal**

```
Currency: USDC
Amount: 5,000
Blockchain: Ethereum
Destination Address: 0xabcd...ef12
```

**Step 2: Review**

```
Amount: 5,000 USDC
Fee: 5 USDC (estimated)
Net: 4,995 USDC
```

**Step 3: Approval**

- Withdrawal pending review
- Admin approval required for compliance
- You'll receive confirmation email

**Step 4: Execution**

```
Status: Processing
Transaction Hash: 0xabcd1234...
Confirmations: 3/12
```

---

## Risk Management

### Margin Levels

**Safe** (Margin Level > 1.5):
- All trading available
- No restrictions
- Status: Green

**Warning** (1.0 < Margin Level ≤ 1.5):
- Warning notification
- New orders require margin
- Post-only orders available
- Status: Yellow

**Danger** (Margin Level ≤ 1.0):
- Margin call issued
- New orders blocked
- 24-hour deadline to add funds
- Forced liquidation may occur
- Status: Red

### Margin Call Response

If you receive a margin call:

1. **Add Funds**: Deposit more cryptocurrency
2. **Close Positions**: Sell losing positions
3. **Reduce Orders**: Cancel pending buy orders
4. **Contact Support**: If issues arise

### Daily Limits

Check your daily trading limits:

1. Settings → Risk Management
2. View daily loss limit
3. View daily used amount
4. Monitor remaining allowance

---

## Notifications

### Notification Types

- Order filled
- Margin call warning
- Position closed
- Deposit confirmed
- Withdrawal processed
- System alerts

### Managing Notifications

**Email Preferences**:
1. Settings → Notifications
2. Toggle email alerts
3. Choose notification types

**In-App Notifications**:
- Bell icon in top right
- Shows recent alerts
- Click to dismiss

---

## Trading History

### View Trades

1. Go to Trades tab
2. See all executed trades
3. Filter by symbol, date, side

**Trade Details**:
```
Trade ID: trd_1234567890
├─ Symbol: AAPL/USDC
├─ Side: BUY
├─ Quantity: 100
├─ Price: 150.475
├─ Commission: 10.54 USDC
├─ Executed: Nov 17, 2024, 4:30 PM
└─ Settlement: Confirmed
```

### Export History

**Export Options**:
- PDF report
- CSV spreadsheet
- JSON format

**Steps**:
1. Select date range
2. Choose format
3. Download file

---

## Settings

### Account Settings

**Profile**:
- Edit name
- Update phone
- Change email

**Security**:
- Change password
- Enable/disable 2FA
- View login history
- Manage API keys

**Notifications**:
- Email preferences
- Alert types
- Notification frequency

### Trading Preferences

**Order Defaults**:
- Default order type
- Default time in force
- Default commission tier

**Interface**:
- Theme (light/dark)
- Chart defaults
- Favorite symbols

---

## Troubleshooting

### Can't Place Order

**Error: Insufficient Margin**
- Solution: Deposit more funds or close positions

**Error: Order Rejected**
- Check order parameters
- Verify symbol exists
- Check trading hours

### Order Stuck

**Status: Pending for Too Long**
- Check order status page
- Verify symbol is trading
- Cancel and retry

### Deposit Not Appearing

**Steps**:
1. Check address is correct
2. Wait for confirmations (12 blocks)
3. Check status page
4. Contact support if issue persists

---

## FAQs

### Q: What are trading hours?
A: Markets are open 24/7 for cryptocurrency. Equity trading follows standard market hours plus extended hours.

### Q: What are the commission rates?
A: Maker: 0.05%, Taker: 0.10%. Professional accounts may qualify for lower rates.

### Q: How long do deposits take?
A: 12 blockchain confirmations (typically 1-2 minutes for Ethereum).

### Q: Can I cancel a pending order?
A: Yes, click the [X] button on the order. If partially filled, remaining quantity is cancelled.

### Q: What's the minimum order size?
A: Varies by symbol. Most symbols: 0.01 units.

### Q: How is margin calculated?
A: Initial Margin = Position Value × 20%. Maintenance = IM × 50%.

---

## Support

**Contact Support**:
- Email: support@cantondex.io
- Chat: In-app chat (bottom right)
- Status: https://status.cantondex.io

**Help Center**: https://help.cantondex.io

**Community**: https://community.cantondex.io
