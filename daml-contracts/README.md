# CantonDEX DAML Smart Contracts

## Overview

This directory contains all 10 core DAML smart contract templates for the CantonDEX privacy-preserving institutional trading platform.

## Templates

1. **Account** - Trading account with cash balances
2. **Order** - Trading order (encrypted in production)
3. **Trade** - Executed trade record
4. **Settlement** - Atomic Delivery-vs-Payment (DvP) settlement
5. **Asset** - Tradable asset (security, crypto, commodity)
6. **Margin** - Margin requirements and calculations
7. **Compliance** - KYC/AML verification status
8. **RiskLimit** - Risk limits enforcement
9. **CustodyBridge** - External custody provider integration
10. **AuditLog** - Immutable audit trail

## Building

```bash
# Install Daml SDK (if not installed)
curl -sSL https://get.daml.com | sh

# Build contracts
daml build

# Test contracts
daml test

# Generate DAR file
daml build -o cantondex-contracts.dar
```

## Deployment

```bash
# Upload to Canton participant
daml ledger upload-dar cantondex-contracts.dar --host=localhost --port=10011

# Verify deployment
daml ledger list-parties --host=localhost --port=10011
```

## Development

```bash
# Start Daml IDE
daml studio
```
