# ADR-001: Choice of Canton Network

**Status**: Accepted
**Date**: November 2024
**Author**: Architecture Team
**Affected Components**: All layers

## Context

The CantonDEX platform requires a blockchain infrastructure that supports:
- Privacy-preserving order matching with encrypted order books
- Atomic multi-party settlement (Delivery-vs-Payment)
- Sub-transaction confidentiality for institutional trading
- Regulatory compliance by design
- Institutional-grade settlement finality
- Multi-domain atomic composition for cross-border trades

Several options were evaluated:
1. **Ethereum with Privacy Protocols** (Tornado Cash, Privacy Pools)
2. **Layer 2 Solutions** (Arbitrum, Optimism)
3. **Privacy Blockchains** (Monero, Zcash)
4. **Enterprise Blockchains** (Hyperledger Fabric, Corda)
5. **Canton Network** (Daml-based privacy ledger)

## Decision Drivers

### Must-Have Requirements
- **Sub-transaction Privacy**: Trading participants' identities and order details must remain confidential
- **Atomic Settlement**: Buy and sell sides must settle simultaneously (no counterparty risk)
- **Regulatory Compliance**: Built-in compliance mechanisms (audit trail, KYC integration)
- **Institutional Grade**: 99.99% uptime, <2s settlement finality

### Important Qualities
- **Multi-domain Composition**: Support for cross-domain atomic transactions
- **Smart Contract Language**: Contract semantics that prevent common security issues
- **Developer Experience**: Clear, testable smart contract language
- **Enterprise Support**: Commercial support for production deployments

## Considered Options

### Option 1: Ethereum + Privacy Protocols
**Pros**:
- Largest developer ecosystem
- Proven liquidity infrastructure
- Multiple privacy solutions available

**Cons**:
- Privacy through mixers/pools is not true confidentiality
- Settlement is not atomic (use multiple transactions)
- High gas costs for complex settlements
- Difficult to enforce compliance rules on-chain
- Not designed for institutional trading

**Verdict**: ❌ Rejected

### Option 2: Layer 2 Solutions
**Pros**:
- Lower transaction costs
- Faster finality than L1

**Cons**:
- Privacy not solved (inherits L1 issues)
- Still no atomic multi-party settlement
- Compliance harder to enforce

**Verdict**: ❌ Rejected

### Option 3: Privacy Blockchains (Monero, Zcash)
**Pros**:
- True privacy at protocol level
- No trace of transactions

**Cons**:
- Privacy for users but breaks regulatory compliance
- No institutional settlement capabilities
- Not suitable for regulated financial trading

**Verdict**: ❌ Rejected

### Option 4: Enterprise Blockchains (Hyperledger, Corda)
**Pros**:
- Privacy-by-design
- Programmable business logic
- Enterprise support available

**Cons**:
- Smaller ecosystem
- Limited interoperability
- Not designed for multi-party atomic settlement
- Complex smart contract model (Corda contracts)

**Verdict**: ⚠️ Partially suitable but not ideal

### Option 5: Canton Network
**Pros**:
- **Sub-transaction Privacy**: Cryptographically enforced, participants only see what they need
- **Daml Smart Contracts**: Template-based approach prevents common vulnerabilities
- **Multi-domain Atomic Composition**: Built specifically for this use case
- **Settlement Finality**: Deterministic settlement in <2 seconds
- **Regulatory Alignment**: Audit trail and compliance features built-in
- **Institutional Support**: Digital Asset (company behind Canton) provides enterprise support
- **Interoperability**: Can synchronize with other Canton networks

**Cons**:
- Smaller ecosystem than Ethereum
- Requires learning Daml language
- Custody integration requires custom implementation

**Verdict**: ✅ **Selected** - Best fit for institutional trading

## Decision Outcome

**We will use Canton Network as the core settlement and privacy layer for CantonDEX.**

### Key Architectural Implications

1. **Multi-Domain Architecture**
   - Private domain for order matching
   - Public domain for settlement transparency (if needed)
   - Jurisdiction-specific domains for regulatory compliance

2. **Daml Smart Contracts**
   - 10 templates for trading lifecycle:
     - Order
     - Trade
     - Settlement
     - Margin
     - Compliance
     - And others

3. **Privacy Guarantees**
   - Buyers/sellers only see matching counterparty info
   - Order book is encrypted
   - Compliance sees only required audit trail

4. **Settlement Model**
   - Atomic Delivery-vs-Payment
   - Cryptocurrency holds on private ledger
   - Multi-currency settlement
   - Fails atomically if either side can't deliver

## Consequences

### Positive
- Institutional-grade privacy and settlement
- Regulatory compliance built-in
- No settlement risk or counterparty exposure
- True multi-party atomicity
- Audit trail for all transactions

### Negative
- Requires Canton infrastructure setup and maintenance
- Team must learn Daml programming language
- Smaller ecosystem for tools and libraries
- Custom integrations needed for custody providers

## Validation

### How We Know This Decision Was Right

1. **Privacy Metrics**
   - Matching Engine < 1ms latency with encryption
   - Order book confidentiality maintained
   - No data leakage to public domain

2. **Settlement Reliability**
   - 99.99%+ uptime target met
   - <2s P99 settlement finality
   - Zero settlement failures due to platform

3. **Compliance Effectiveness**
   - 100% audit trail coverage
   - Automatic suspicious activity detection
   - Zero compliance violations due to platform

4. **Team Satisfaction**
   - Daml adoption metrics
   - Development velocity on contracts
   - Operational incident rates

## Alternatives If This Doesn't Work

1. **Migrate to Corda**: Similar architecture, potentially easier custody integration
2. **Hybrid Model**: Use Canton for settlement but Ethereum for liquidity
3. **Build Custom**: Enterprise blockchain with Hyperledger Fabric

Each alternative would require 3-6 months for major refactoring.

## References

- [Canton Network Documentation](https://docs.daml.com/)
- [Daml Language Reference](https://docs.daml.com/daml/intro/0_Intro.html)
- [System Architecture](../architecture/SYSTEM-ARCHITECTURE.md)
- [Smart Contracts Design](../architecture/DAML-CONTRACTS.md)
