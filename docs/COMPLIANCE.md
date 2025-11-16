# CantonDEX Compliance & Regulatory Architecture

## 1. Compliance Framework

### Applicable Regulations

| Jurisdiction | Regulation | Requirement | Implementation |
|--------------|-----------|-------------|-----------------|
| EU | GDPR | Data privacy, right-to-forget | Salted hash redaction |
| US | Securities Act | Institutional trading | KYC/AML, accredited investors |
| EU | MiFID II | Trade reporting | Real-time PQS reporting |
| Global | EMIR | Derivatives reporting | Trade surveillance module |
| US | Bank Secrecy Act | AML/CFT | Sanctions screening |

---

## 2. KYC (Know Your Customer)

### KYC Workflow

```
STEP 1: Registration
├─ User creates account
├─ Collects: Email, name, phone
└─ Status: PENDING_KYC

STEP 2: Identity Verification
├─ Redirect to KYC provider (Jumio/Onfido)
├─ Document upload: Passport or ID
├─ Liveness check: Selfie + document match
├─ Auto-verification or manual review
└─ Status: VERIFIED or REJECTED

STEP 3: Source of Funds Verification
├─ Interview: Where funds come from
├─ Documentation: Bank statements, investment history
├─ PEP screening: Politically exposed person check
└─ Status: APPROVED or NEEDS_REVIEW

STEP 4: Ongoing Monitoring
├─ Annual re-verification
├─ Transaction monitoring for anomalies
├─ Address updates
└─ Status: VALID or REQUIRES_UPDATE
```

### KYC Data Storage

```
PostgreSQL Table: kyc_records
├─ user_id (PK)
├─ status (PENDING, VERIFIED, REJECTED, EXPIRED)
├─ verified_at (timestamp)
├─ expires_at (timestamp)
├─ provider (jumio, onfido, persona)
├─ provider_reference_id (external ID)
├─ approval_level (auto, manual, admin_override)
└─ metadata (JSON with additional fields)

GDPR COMPLIANCE:
- Data retention: 5 years (regulatory requirement)
- Deletion: Automatic on account closure
- Redaction: Salted hash + audit trail
- Portability: CSV export via API
```

---

## 3. AML (Anti-Money Laundering)

### AML Screening Process

```
FOR EACH TRANSACTION:

1. Party Screening
   ├─ Sanctions list check (OFAC, EU, UK)
   ├─ PEP (Politically Exposed Person) check
   ├─ Adverse media screening
   └─ Result: PASS, FAIL, or REVIEW_REQUIRED

2. Transaction Risk Assessment
   ├─ Amount: Unusual large trades → Flag
   ├─ Velocity: Rapid repeat transactions → Flag
   ├─ Counterparty: Known sanctions entity → Block
   ├─ Geography: High-risk jurisdictions → Alert
   └─ Result: CLEAR, WARN, or BLOCK

3. Action
   ├─ CLEAR: Allow transaction
   ├─ WARN: Process + log for review
   ├─ BLOCK: Reject transaction + alert compliance
   └─ REVIEW: Hold pending compliance approval
```

### Sanctions List Integration

```
External Feeds:
├─ OFAC SDN (Specially Designated Nationals)
├─ EU Consolidated List
├─ UK Consolidated List
├─ UNSC (UN Security Council) Sanctions
└─ Internal watchlist

Matching Algorithm:
├─ Exact name match
├─ Fuzzy match (Levenshtein distance)
├─ Phonetic match (Soundex)
└─ Confidence score threshold: >95%

Update Frequency:
├─ Daily for OFAC
├─ Weekly for others
└─ Manual refresh capability
```

---

## 4. Trade Surveillance

### Surveillance Rules Engine

```
RULE: Wash Trading Detection
├─ Trigger: Same party buys + sells at identical price
├─ Lookback: 1 day
├─ Threshold: >3 times
├─ Action: Flag for review
└─ Penalty: Account suspension

RULE: Spoofing Detection
├─ Trigger: Large orders entered + cancelled without execution
├─ Lookback: 1 hour
├─ Threshold: >10 cancellations per 100 orders
├─ Action: Alert compliance officer
└─ Penalty: Warning or suspension

RULE: Layering Detection
├─ Trigger: Multiple orders at different price levels
├─ Quick cancellation after large order executed
├─ Lookback: 5 minutes
├─ Threshold: >5 layered orders
├─ Action: Manual investigation
└─ Penalty: Fine or suspension

RULE: Front-Running Detection
├─ Trigger: Non-public trader executes similar orders
├─ Before public large order
├─ Within 1 minute window
├─ Action: Escalate to regulator
└─ Penalty: Criminal liability
```

### Alert Management

```
ALERT LIFECYCLE:

1. GENERATED
   ├─ Automated rule trigger
   ├─ Severity: Critical, High, Medium, Low
   ├─ Assigned to: Compliance analyst
   └─ Timestamp: Rule execution time

2. REVIEW
   ├─ Analyst investigates
   ├─ Checks: Previous history, context
   ├─ Decision: True positive or false positive
   └─ Comment: Investigation notes

3. ESCALATION (if needed)
   ├─ Regulator notification
   ├─ SAR (Suspicious Activity Report) filing
   ├─ Account freeze (if warranted)
   └─ Criminal referral (if applicable)

4. CLOSED
   ├─ Resolution: No action / Fine / Suspension
   ├─ Documented: Case file created
   ├─ Archived: For regulatory reporting
   └─ Analytics: Feed into future rule tuning
```

---

## 5. Audit Trail & Immutability

### Audit Log Structure

```
ComplianceModule Contract (Daml):

record ComplianceLog =
  timestamp: Time
  party: Party
  action: Text
  previousState: Optional Record
  newState: Record
  hash: Text  -- sha256(salt + json(newState))
  signatory: signatory party, regulatorObserver

EXAMPLE LOG ENTRY:
{
  "timestamp": "2025-11-16T10:30:00Z",
  "party": "alice@hedge.fund",
  "action": "TradeExecuted",
  "previousState": {
    "orderId": "order-123",
    "status": "PENDING"
  },
  "newState": {
    "orderId": "order-123",
    "status": "MATCHED",
    "tradeId": "trade-xyz",
    "counterparty": "bob@fund2.com"
  },
  "hash": "sha256(salt_abcd1234 + json_object)"
}
```

### Salted Hash Integrity Verification

```
VERIFICATION PROCESS:

1. Regulator retrieves audit log
2. For each entry:
   a. Extract: timestamp, party, action, newState, hash, salt
   b. Recalculate: sha256(salt + json(newState))
   c. Compare: recalculated_hash == stored_hash
   d. Result: ✓ (not tampered) or ✗ (tampered)

GDPR RIGHT-TO-FORGET:
- Cannot delete audit log (immutable + salt)
- Can redact: newState → [REDACTED]
- Recalculate: sha256(salt + "[REDACTED]")
- Verification still works (proves data was there)
- But content is no longer visible
```

### Retention Policy

```
RETENTION SCHEDULE:

Hot Storage (Searchable):
├─ Duration: 1 year
├─ Location: PostgreSQL main
├─ Cost: High (indexed)
└─ Query performance: <100ms

Warm Storage (Compressed):
├─ Duration: Years 1-3
├─ Location: S3 intelligent-tiering
├─ Cost: Medium
└─ Query performance: <5s

Cold Storage (Archive):
├─ Duration: Years 3-7
├─ Location: Glacier (30-day retrieval)
├─ Cost: Low
└─ Query performance: >1 hour
```

---

## 6. Regulatory Reporting

### Trade Reporting (MiFID II)

```
REPORT FORMAT:
├─ Instrument: Asset class (equity, derivative, etc.)
├─ Venue: Trading venue (CantonDEX)
├─ Price: Execution price
├─ Quantity: Trade size
├─ Side: Buy or sell
├─ Timing: Execution timestamp
├─ Counterparty: Obfuscated (if not public)
└─ Currency: Settlement currency

RECIPIENT:
├─ Competent authority (SEC for US, ESMA for EU)
├─ Reporting deadline: T+1 (next business day)
├─ Format: EMIR-compatible XML/JSON
└─ Authentication: Digital signatures
```

### Suspicious Activity Report (SAR)

```
SAR FILING REQUIREMENTS:
├─ Trigger: Confirmed suspicious activity
├─ Deadline: 30 days after detection
├─ Content: Description, amounts, parties involved
├─ Supporting docs: Evidence, investigation notes
├─ Recipient: FinCEN (US) or equivalent
└─ Confidentiality: Not disclosed to involved parties

SAR WORKFLOW:
1. Compliance team: Investigation completed
2. Senior management: SAR approval required
3. Submission: Electronic filing to regulator
4. Confirmation: Receipt and case number
5. Follow-up: Potential law enforcement investigation
```

### Position Reporting

```
REPORTING REQUIREMENT:
├─ Frequency: Daily or weekly (by asset class)
├─ Content: Long/short positions, aggregate volume
├─ Threshold: Market impact thresholds apply
├─ Format: Standardized template
└─ Timeline: T+1 or T+2 depending on market

POSITION LIMITS:
├─ Per party: Max 5% of trading volume
├─ Sector: Max 10% of sector volume
├─ System-wide: Real-time monitoring
└─ Breach: Automatic alert + forced liquidation
```

---

## 7. Data Privacy (GDPR)

### Data Minimization

```
COLLECT:
✓ Email, name, phone (for authentication)
✓ KYC documents (regulatory requirement)
✓ Trading history (order data)
✗ Location tracking
✗ Browsing history
✗ Device identifiers
```

### Data Subject Rights

```
RIGHTS:

1. Right to Access
   ├─ User requests: GET /api/v1/privacy/export
   ├─ System generates: ZIP with all personal data
   ├─ Delivery: Email within 30 days
   └─ Format: JSON, CSV, PDF

2. Right to Deletion (Right to be Forgotten)
   ├─ User requests: POST /api/v1/privacy/forget
   ├─ System action: Salted hash redaction
   ├─ Timeline: 30 days
   ├─ Exception: Regulatory retention (7 years)
   └─ Confirmation: Email confirmation

3. Right to Portability
   ├─ User requests: GET /api/v1/privacy/export
   ├─ System provides: Machine-readable format
   ├─ Includes: All personal data
   └─ Provider: Can port to competitor

4. Right to Rectification
   ├─ User updates: Profile information
   ├─ System validates: New information
   ├─ Timestamp: Change logged
   └─ Propagation: Updated to all systems
```

### Privacy by Design

```
PRINCIPLES:
├─ Data minimization: Collect only necessary data
├─ Purpose limitation: Use only for stated purpose
├─ Accuracy: Keep data current
├─ Integrity: Protect against alteration
├─ Confidentiality: Encrypt in transit + rest
├─ Accountability: Audit trail maintained
└─ Transparency: Privacy policy clear

IMPLEMENTATION:
├─ Privacy Impact Assessment (PIA)
├─ Privacy notices at collection
├─ Consent management (opt-in for marketing)
├─ Regular privacy audits
└─ Privacy training for staff
```

---

## 8. Compliance Monitoring

### Compliance Dashboard

```
METRICS DISPLAYED:
├─ KYC compliance rate: % users verified
├─ AML screening success: % trades cleared
├─ Trade surveillance: Alerts pending review
├─ Regulatory reporting: Reports filed on time
├─ Audit trail completeness: % transactions logged
└─ Data breach incidents: Number + severity

ALERTS GENERATED:
├─ KYC expiration: 30 days before expiry
├─ AML block: Transaction cannot execute
├─ Suspicious activity: Manual investigation required
├─ Compliance deadline: Upcoming reporting deadline
└─ Audit failure: Incomplete audit trail
```

### Regular Audits

```
INTERNAL AUDIT SCHEDULE:
├─ Monthly: Compliance metric review
├─ Quarterly: KYC/AML effectiveness
├─ Semi-annual: System controls testing
├─ Annual: Full compliance audit
└─ As-needed: Incident investigations

EXTERNAL AUDIT SCHEDULE:
├─ Annual: SOC2 Type II audit
├─ Triennial: ISO 27001 certification
├─ Ad-hoc: Regulatory examinations
└─ As-needed: Customer audits
```

---

## 9. Compliance Violations & Penalties

### Violation Classification

| Violation | Severity | Penalty | Action |
|-----------|----------|---------|--------|
| Incomplete KYC | HIGH | $10K-100K | Account suspension |
| AML screening fail | CRITICAL | Regulatory fine | Transaction block |
| Trade surveillance miss | MEDIUM | Warning | Investigation |
| Late reporting | MEDIUM | $5K | Late fee |
| Data breach | CRITICAL | Criminal liability | Immediate notification |

### Remediation Process

1. **Detection**: Monitoring triggers violation
2. **Investigation**: Root cause analysis
3. **Containment**: Limit damage (freeze account, block transactions)
4. **Remediation**: Fix underlying issue
5. **Prevention**: Update controls to prevent recurrence
6. **Reporting**: Self-report to regulator if required
7. **Resolution**: Close incident + document learnings

---

## 10. Compliance Checklist (EPIC-01)

- [x] Regulatory mapping (GDPR, MiFID II, etc.)
- [x] KYC workflow design
- [x] AML screening integration
- [x] Trade surveillance rules
- [x] Audit trail immutability (salted hash)
- [x] Data retention policy
- [x] GDPR compliance framework
- [x] Regulatory reporting formats
- [x] Compliance dashboard mockup
- [x] Compliance monitoring strategy

---

**Document Version**: 1.0.0  
**Last Updated**: 2025-11-16  
**Status**: EPIC-01 APPROVED
