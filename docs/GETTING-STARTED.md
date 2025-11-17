# CantonDEX Getting Started Guide

Welcome to CantonDEX! This guide will help you get up and running with the platform.

---

## What is CantonDEX?

CantonDEX is a **privacy-preserving institutional trading platform** built on Canton Network. It enables:

- **Private Trading**: Your orders and identities remain confidential
- **Atomic Settlement**: Buy and sell happen simultaneously (no settlement risk)
- **Institutional Grade**: 99.99% uptime, <2 second settlement finality
- **Regulatory Compliant**: Built-in KYC/AML, audit trail, trade surveillance
- **Multi-Asset**: Trade equities, crypto, commodities, and more

---

## Quick Start (5 Minutes)

### For Traders

```bash
# 1. Navigate to Trading Terminal
https://trading.cantondex.io

# 2. Sign up (or login if you have an account)
# Email: your-email@example.com
# Password: secure-password

# 3. Complete KYC verification
# Upload ID, address proof, employment info
# Wait for approval (1-24 hours)

# 4. Deposit funds
# Generate USDC deposit address
# Send USDC from your wallet
# Wait for 12 confirmations

# 5. Place your first order!
# Go to Markets → Select symbol (e.g., AAPL/USDC)
# Click BUY/SELL → Enter quantity and price
# Review and confirm
```

### For Developers

```bash
# 1. Clone repository
git clone https://github.com/cantondex/cantondex.git
cd cantondex

# 2. Set up local development
# See: docs/development/LOCAL-SETUP.md

# 3. Start services
docker-compose up -d

# 4. Access locally
http://localhost:3000  # Trading Terminal
http://localhost:8000  # API Gateway
```

---

## Key Concepts

### Privacy

**How does CantonDEX keep orders private?**

```
Your Order Details
    ├─ Account ID: Hidden from other traders
    ├─ Quantity: Only visible to matched counterparty
    └─ Price: Only visible to compliance

Public View: AAPL/USDC bid/ask spread (no order source shown)
```

### Settlement

**How does Delivery-vs-Payment work?**

```
Trade Executed:
Buyer wants: 100 AAPL
Seller wants: 15,047.50 USDC

↓ Atomic DvP Transaction

Buyer receives: 100 AAPL
Seller receives: 15,047.50 USDC

↓ Both happen simultaneously or both fail
```

### Margin

**What's margin and why does it matter?**

```
Margin = Loan from CantonDEX to control larger positions

Example:
├─ Your Cash: 100,000 USDC
├─ With 20% Initial Margin: Can control 500,000 USDC worth
├─ Position: 100 AAPL @ 150 = 15,000 USDC
├─ Margin Required: 3,000 USDC (20%)
└─ Available for more trades: 97,000 USDC
```

---

## Getting Help

### Documentation By Role

**I'm a Trader**
→ [Trading Terminal Guide](./user-guides/TRADING-TERMINAL-GUIDE.md)

**I'm a Developer**
→ [Developer Setup](./development/LOCAL-SETUP.md)

**I'm Integrating APIs**
→ [API Documentation](./api/OPENAPI-SPEC.md)

**I'm a Compliance Officer**
→ [Compliance Guide](./user-guides/COMPLIANCE-DASHBOARD-GUIDE.md)

**I'm an Administrator**
→ [Admin Guide](./user-guides/ADMIN-PANEL-GUIDE.md)

### Common Questions

**Q: How do I create an account?**
A: Visit https://trading.cantondex.io and click "Sign Up"

**Q: How long is KYC approval?**
A: Usually 1-24 hours. Premium accounts may have priority.

**Q: What's the minimum deposit?**
A: Varies by currency. Most: 100 USDC minimum.

**Q: Are my trades private?**
A: Yes! Order details are encrypted. Only your counterparty knows you traded.

**Q: Can I trade 24/7?**
A: Cryptocurrency: Yes. Equities: Follow regular market hours plus extended hours.

**Q: How much commission do I pay?**
A: Maker: 0.05%, Taker: 0.10%. Professional accounts get discounts.

### Support Channels

| Channel | Response Time | Best For |
|---------|---------------|----------|
| Email | 24 hours | Urgent issues |
| Chat | 1-2 hours | Quick questions |
| Help Center | Self-serve | General info |
| Community | Variable | Peer help |

**Email**: support@cantondex.io
**Chat**: In-app chat (bottom right)
**Community**: https://community.cantondex.io

---

## Architecture Overview

### Simple View

```
Your Browser
    ↓ (HTTPS)
Frontend Apps (React, Vue, Angular, Next.js)
    ↓ (REST API)
API Gateway (Order routing, auth)
    ↓
Matching Engine (Order matching <1ms)
    ↓
Settlement Coordinator (DvP on Canton)
    ↓
Canton Network (Privacy + Settlement)
```

### What Happens When You Place an Order

```
1. You click "Buy AAPL"
   └─ Quantity: 100, Price: 150.50

2. API Gateway validates
   └─ Checks: margin, permissions, limits

3. Matching Engine tries to match
   └─ Finds sellers at 150.50 or better
   └─ Creates trades

4. Settlement Coordinator creates DvP
   └─ Atomic transaction on Canton
   └─ Buyer gets AAPL, Seller gets USDC

5. Settlement completes
   └─ Both sides receive assets instantly
   └─ Trade confirmed

6. Your portfolio updates
   └─ New AAPL position shows in account
   └─ Cash balance decreases
```

---

## Key Features

### For Traders

✅ **Real-time Order Book**: See live prices
✅ **Advanced Orders**: Limit, Market, Stop, Stop-Limit
✅ **Dark Pool**: Trade confidentially
✅ **Multi-Asset**: Equities, Crypto, Commodities
✅ **Portfolio Management**: Track positions and P&L
✅ **Risk Tools**: Margin monitoring, position limits

### For Compliance

✅ **Trade Surveillance**: Detect suspicious patterns
✅ **Audit Trail**: 100% transaction history
✅ **Reporting**: Regulatory reports
✅ **Alert System**: Real-time compliance alerts
✅ **KYC Management**: Customer verification
✅ **Transaction Monitoring**: AML screening

### For Administrators

✅ **User Management**: Create/suspend accounts
✅ **Configuration**: Fee settings, trading pairs
✅ **Monitoring**: System health, performance
✅ **Reporting**: Financial, operational reports
✅ **Security**: Authentication, access control

---

## Next Steps

### 1. Set Up Your Environment

**For Trading**:
1. Create account at https://trading.cantondex.io
2. Complete KYC verification
3. Deposit funds
4. Start trading!

**For Development**:
1. Clone repository
2. Follow [Local Setup Guide](./development/LOCAL-SETUP.md)
3. Run `docker-compose up`
4. Start contributing!

### 2. Learn the Platform

- Read [System Architecture](./architecture/SYSTEM-ARCHITECTURE.md)
- Review [API Documentation](./api/OPENAPI-SPEC.md)
- Study [Database Schema](./database/SCHEMA.md)
- Review [Security Documentation](./security/SECURITY-ARCHITECTURE.md)

### 3. Make Your First Trade/Integration

**As Trader**:
1. Place a test order
2. Monitor execution
3. Check settlement
4. Close position

**As Developer**:
1. Read API docs
2. Make first API call
3. Integrate into your system
4. Test end-to-end

### 4. Join the Community

- **Discord**: https://discord.gg/cantondex
- **Twitter**: https://twitter.com/cantondex
- **GitHub**: https://github.com/cantondex/cantondex
- **Forum**: https://forum.cantondex.io

---

## FAQs

### Account & Trading

**Q: Is my money safe?**
A: Yes. Funds are held by licensed custodians. Atomic settlement prevents loss.

**Q: Can I use multiple accounts?**
A: One account per person. Sub-accounts available for firms.

**Q: What's the fee structure?**
A: Maker 0.05%, Taker 0.10%. Deposit/Withdrawal: varies by currency.

**Q: Can I automate my trading?**
A: Yes! Use the REST API to build trading bots.

### Technical

**Q: What's the order settlement time?**
A: <2 seconds P99. Instant in normal conditions.

**Q: Is the API rate-limited?**
A: Yes. 1000 req/min per account. Higher for institutions.

**Q: Can I access the order book via API?**
A: Yes, REST and WebSocket APIs both available.

**Q: Do you support algorithmic trading?**
A: Yes! WebSocket for real-time data, REST for orders.

### Compliance

**Q: Is trading data retained?**
A: Yes, 7 years for regulatory compliance.

**Q: Can I export my trading history?**
A: Yes, CSV/PDF formats available.

**Q: What happens in case of disputes?**
A: Immutable transaction history proves what happened.

---

## Resources

| Resource | URL |
|----------|-----|
| Main Website | https://cantondex.io |
| Trading Platform | https://trading.cantondex.io |
| Documentation | https://docs.cantondex.io |
| API Docs | https://api-docs.cantondex.io |
| Status Page | https://status.cantondex.io |
| Support | support@cantondex.io |
| GitHub | https://github.com/cantondex |

---

## Troubleshooting

### Can't log in?

1. Check email is correct
2. Reset password if needed
3. Contact support if still stuck

### Order not executing?

1. Check margin is available
2. Check order price is reasonable
3. Check market is open
4. Check risk limits

### Deposit not arriving?

1. Check transaction on blockchain
2. Wait for 12 confirmations
3. Check address is correct
4. Contact support with tx hash

### API not responding?

1. Check service status: https://status.cantondex.io
2. Check your rate limit
3. Check network connectivity
4. File issue on GitHub

---

## What's Next?

**🚀 Ready to get started?**

1. **As a Trader**: Go to https://trading.cantondex.io
2. **As a Developer**: Clone the repo and follow [setup guide](./development/LOCAL-SETUP.md)
3. **As Compliance**: Review [compliance docs](./user-guides/COMPLIANCE-DASHBOARD-GUIDE.md)

**📚 Want to learn more?**

- Read [System Architecture](./architecture/SYSTEM-ARCHITECTURE.md)
- Check [API Examples](./api/OPENAPI-SPEC.md)
- Review [Best Practices](./security/BEST-PRACTICES.md)

**❓ Have questions?**

- Check [FAQs](./knowledge/FAQs.md)
- Search [documentation](./README.md)
- Ask in [community forum](https://community.cantondex.io)

---

**Welcome to CantonDEX! 🎉**

Let's build the future of institutional trading together.
