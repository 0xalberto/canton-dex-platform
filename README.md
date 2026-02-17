# CantonDEX

CantonDEX is a **privacy-preserving institutional dark pool & DEX** built on Canton Network, solving three critical problems:

### Key Features

- **Sub-Transaction Privacy** via Canton Protocol - Confidential order details
- **Atomic DvP Settlement** (Zero counterparty risk, <2s finality)
- **10 DAML Smart Contracts** (579 lines, type-safe) - Canton compliant
- **Web3 Wallet Integration** (MetaMask) - Multi-chain support
- **Institutional Grade** (KYC/AML, risk management, immutable audit trail)
- **Production-Ready Architecture** (4,700+ LOC, fully functional)
- **Shadow Ledger Mode** - Real-time settlement without external ledgers

---

## How to start

```bash
# 1. Clone
git clone https://github.com/0xalberto/cantondex.git
cd cantondex

# 2. Build DAML contracts
cd daml-contracts && daml build

# 3. Start services
cd .. && docker compose up -d

# 4. Upload to Canton
daml ledger upload-dar daml-contracts/.daml/dist/cantondex-contracts-1.0.0.dar --host=localhost --port=10011
