# ADR-001: Multi-Domain Settlement Strategy

**Status**: ACCEPTED

**Date**: 2025-11-16

## Context

CantonDEX needs to enable atomic settlement across multiple Canton synchronization domains. Institutional traders operate in different jurisdictions with different regulatory requirements and latency constraints. A single-domain approach limits flexibility and scalability.

### The Problem

- **Single Domain**: Cannot serve geographically distributed institutions
- **Bridge Pattern**: Introduces counterparty risk and breaks atomicity
- **Naive Multi-Domain**: Sequential settlement → timing windows for failure

## Decision

**Implement atomic multi-domain settlement using Canton's domain reassignment protocol:**

1. **Trade Phase**: Execute on trader's preferred domain (private/public)
2. **Settlement Phase**: Reassign to settlement domain (regulator-approved)
3. **Atomic Guarantee**: Canton ensures both phases succeed or both fail

### Settlement Flow

```
Phase 1: Trade (Domain 1 - Private)
┌─────────────────────────────────┐
│ Alice creates order              │
│ Bob accepts order                │
│ OrderMatched event               │
└─────────────────────────────────┘
                │
                │ Both parties agree to settle on Domain 2
                ▼
Phase 2: Settlement (Domain 2 - Settlement)
┌─────────────────────────────────┐
│ Create SettlementInstruction     │
│ Exercise AtomicTrade choice      │
│ Assets exchanged (atomic)        │
│ SettlementCompleted event        │
└─────────────────────────────────┘
```

## Consequences

### Positive
- ✅ Atomic settlement across domains (Canton protocol guarantees)
- ✅ Privacy preserved (domain reassignment transparent to parties)
- ✅ Scalable (multiple settlement domains possible)
- ✅ Regulatory flexibility (domain operators can add jurisdictions)

### Negative
- ❌ Requires domain coordination (latency +200-500ms)
- ❌ Complexity in failure recovery
- ❌ Mediator overhead for cross-domain

### Mitigation
- Add domain affinity caching (predict settlement domain)
- Implement automatic retry with exponential backoff
- Provide mediator health monitoring

## Alternatives Considered

### A. Single Shared Domain
- ❌ Scalability bottleneck
- ❌ Latency issues for global participants
- ✅ Simpler implementation

### B. Sidechain/Bridge Model
- ❌ Breaks atomicity (two-phase commit risk)
- ❌ Counterparty risk in bridges
- ✅ Familiar pattern in blockchain

### C. Optimistic Rollup (sequenced settlement)
- ❌ Timing windows for failure
- ❌ Batch-based (not suitable for real-time)
- ✅ High throughput

## Implementation Guidelines

1. **Settlement Domain Selection**:
   ```daml
   selectSettlementDomain: Party -> Party -> Domain
   -- Use shared jurisdiction domain or agreed-upon domain
   ```

2. **Failure Recovery**:
   ```daml
   -- If settlement fails:
   -- 1. Retry on same domain (2x, exponential backoff)
   -- 2. Fallback to backup domain
   -- 3. Manual intervention (regulator approval)
   ```

3. **Monitoring**:
   ```
   - Domain latency: <500ms P95
   - Settlement success rate: >99.9%
   - Failure recovery time: <5 minutes
   ```

---

# ADR-002: Encrypted Order Book Strategy

**Status**: ACCEPTED

**Date**: 2025-11-16

## Context

The core differentiator of CantonDEX is privacy. But how do we maintain an order book without revealing orders to unmatched counterparties?

### The Challenge

- **Transparency**: Public order books leak information (front-running risk)
- **Privacy**: Encrypted orders → How to match them?
- **Performance**: Matching must be <1ms for institutional traders

## Decision

**Implement encrypted order book with deterministic comparison:**

1. **Encryption Scheme**: Order(price, quantity) encrypted with trader's key
2. **Matching**: Use commutative encryption for comparison without decryption
3. **Visibility**: Only matched orders reveal details to counterparties

### Encryption Algorithm

```
Order Encryption:
- Scheme: AES-GCM (authenticated encryption)
- Key: Derived from trader's private key
- Plaintext: price || quantity || nonce
- Ciphertext: Only trader can decrypt

Matching (Commutative Encryption):
- Encrypt order1 with key1 → E1
- Encrypt order1 with key2 → E1'
- Compare E1 == E1' (commutative property)
- If match: Both parties decrypt own ciphertexts
```

### Order Visibility Tiers

```
TIER 1: ENCRYPTED (No match yet)
┌─────────────────────────────────┐
│ Alice: Sees own order (price, qty)
│ Bob: Sees nothing
│ Market: Sees nothing
│ Regulator: Sees encrypted order + metadata
└─────────────────────────────────┘
                │
                │ Price matches
                ▼
TIER 2: MATCHED (Counterparties revealed)
┌─────────────────────────────────┐
│ Alice: Sees full order + Bob's details
│ Bob: Sees full order + Alice's details
│ Market: Sees aggregated volume only
│ Regulator: Sees all details + full audit trail
└─────────────────────────────────┘
```

## Consequences

### Positive
- ✅ Privacy preserved until match (no front-running)
- ✅ Regulator has full visibility (compliance)
- ✅ Institutional-grade dark pool features
- ✅ Prevents order flow information leakage

### Negative
- ❌ Encryption overhead (cryptographic operations)
- ❌ Complexity in matching logic
- ❌ Key management requirements

### Performance Impact
- Encryption: ~100 microseconds per order
- Matching: ~500 microseconds (with encryption)
- Total: <1ms P99 latency (acceptable)

## Alternatives Considered

### A. Public Order Book
- ✅ Simplest implementation
- ❌ Massive front-running risk
- ❌ Not suitable for institutions

### B. Completely Opaque (No matching)
- ✅ Maximum privacy
- ❌ No liquidity discovery
- ❌ Requires pre-negotiation (TradFi limitation)

### C. Threshold Encryption (Validator reveals)
- ✅ Decentralized approach
- ❌ Complexity in validator coordination
- ❌ Latency overhead (validator voting)

## Implementation Notes

1. **Key Rotation**: Every 24 hours, new encryption keys
2. **Audit Access**: Regulator key derivation for transparent audit
3. **Fallback**: Plaintext matching during system degradation (labeled "INSECURE")

---

# ADR-003: Custody Integration & External Signing

**Status**: PENDING_DECISION

**Date**: 2025-11-16

## Context

Institutional traders use external custodians (Fireblocks, Anchorage, BitGo) for asset management and HSM-based signing. CantonDEX must integrate seamlessly with these systems.

### The Challenge

- **External Signing**: Transactions must be signed outside the system (HSM/custody)
- **Coordination**: Custody provider actions must be coordinated with Daml contracts
- **Atomicity**: Settlement must wait for custody confirmation

## Decision

**Implement CustodyBridge pattern with async coordination:**

```
1. Trader submits order
2. SettlementInstruction created (PENDING)
3. Custody provider signs deposit/withdrawal (off-ledger)
4. Signature submitted via CustodyBridge choice
5. SettlementInstruction exercise (ACTIVE → COMPLETED)
```

## Consequences

- ✅ Custody provider independence maintained
- ✅ HSM signing security preserved
- ❌ Additional latency (custody provider response time)
- ❌ Network dependencies (custody provider uptime)

## Implementation Timeline

- EPIC-02: Mock custody integration
- EPIC-03: Live Fireblocks integration testing
- EPIC-04: Production deployment with live signatories

---
