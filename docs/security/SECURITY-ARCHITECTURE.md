# Security Architecture Documentation

## Overview

This document describes the comprehensive security architecture of CantonDEX, including threat models, security layers, controls, and compliance mechanisms.

---

## Security Principles

1. **Defense in Depth**: Multiple layers of security controls
2. **Privacy by Design**: User data protected at all levels
3. **Least Privilege**: Users have minimum necessary permissions
4. **Zero Trust**: All access verified, never implicit trust
5. **Encryption First**: Data encrypted in transit and at rest
6. **Audit Everything**: Comprehensive logging for compliance

---

## Threat Model

### External Threats

**1. Unauthorized Access**
- **Risk**: Attacker gains access to accounts
- **Mitigation**:
  - OAuth 2.0 + JWT authentication
  - 2FA/MFA enforcement for institutional users
  - Account lockout after failed login attempts
  - Device fingerprinting

**2. Data Breach**
- **Risk**: Sensitive data exfiltrated
- **Mitigation**:
  - TLS 1.3 for all data in transit
  - AES-256 encryption at rest
  - Sensitive data tokenization
  - Regular security audits

**3. Man-in-the-Middle (MITM)**
- **Risk**: Attacker intercepts communications
- **Mitigation**:
  - TLS certificate pinning
  - HSTS (HTTP Strict-Transport-Security)
  - API rate limiting
  - Request signing for sensitive operations

**4. DDoS Attack**
- **Risk**: Service unavailability
- **Mitigation**:
  - CloudFlare/WAF protection
  - Rate limiting (100 req/min per IP)
  - Request validation
  - Automatic scaling

**5. Smart Contract Exploit**
- **Risk**: Attacker exploits Daml contract logic
- **Mitigation**:
  - Formal verification of contracts
  - Code review before deployment
  - Daml safety guarantees (type system)
  - Immutability of executed trades

### Internal Threats

**1. Insider Threat**
- **Risk**: Malicious employee accesses data
- **Mitigation**:
  - Role-based access control (RBAC)
  - Logging all privileged operations
  - Segregation of duties
  - Regular access reviews

**2. Accidental Data Exposure**
- **Risk**: Engineer misconfigures system
- **Mitigation**:
  - Infrastructure-as-Code reviewed
  - Configuration validation
  - Secrets management (no hardcoded keys)
  - Automated security scanning

**3. Supply Chain Risk**
- **Risk**: Compromised dependency
- **Mitigation**:
  - Dependency scanning (npm audit, cargo audit)
  - Pin dependency versions
  - Regular updates and patches
  - Lock files in version control

---

## Security Architecture Layers

### Layer 1: Network Security

**TLS/HTTPS**
```
Client ←TLS 1.3→ API Gateway (443)
Client ←Cleartext→ LocalDev (8000, :reload only)

TLS Configuration:
- Version: 1.3 minimum
- Certificates: Let's Encrypt (auto-renewed)
- Certificate Pinning: Enabled for mobile
- HSTS: max-age=63072000 (2 years)
```

**WAF (Web Application Firewall)**
```
CloudFlare Rules:
- Block SQL injection patterns
- Block XSS attempts
- Block path traversal
- Rate limit: 100 req/min per IP
```

### Layer 2: Authentication & Authorization

**OAuth 2.0 with OpenID Connect**
```
Client → Keycloak (OpenID Provider)
       → JWT Token (valid 1 hour)
       → API Gateway (Authorization header)
```

**JWT Structure**
```json
{
  "sub": "user_id_uuid",
  "email": "trader@cantondex.io",
  "account_id": "acc_uuid",
  "role": "professional",
  "kyc_tier": "tier_2",
  "scopes": ["trade:read", "trade:write", "account:read"],
  "exp": 1700000000,
  "iat": 1699996400,
  "iss": "https://keycloak.cantondex.io"
}
```

**Role-Based Access Control (RBAC)**
```
Roles:
├─ user (retail traders)
├─ professional (professional traders)
├─ institutional (institutional accounts)
├─ compliance_officer
├─ admin
└─ super_admin

Role Permissions Matrix:
User              Trading  Compliance  Admin
└─ View Orders    ✓
├─ Place Orders   ✓
├─ Deposit/Withdraw ✓
└─ Account Settings ✓

Compliance Officer
├─ View All Orders             ✓
├─ View Compliance Alerts      ✓
├─ Generate Reports            ✓
└─ Take Compliance Actions     ✓

Admin
├─ All Compliance              ✓
├─ User Management             ✓
├─ System Configuration        ✓
└─ Financial Management        ✓
```

### Layer 3: Data Security

**Encryption at Rest**
```
PostgreSQL:
- Table: encrypted with AES-256
- Column-level: for sensitive columns (passwords, API keys)
- Backup: encrypted before storage

Redis:
- TLS encryption: enabled
- Password: required (stored securely)
- Data: TTL for sensitive values

S3 (if used):
- Server-side encryption: AES-256
- Client-side encryption: for highly sensitive docs
```

**Password Security**
```
Password Storage:
- Algorithm: BCrypt (cost factor: 12)
- Example: $2b$12$R9h7cIPz0gi.URNNX3kh2OPST9/PgBkqquzi.Ss7KIUgO2t0jWMUm

Password Policy:
- Minimum: 12 characters
- Required: 1 uppercase, 1 number, 1 symbol
- Expiration: None (consider rotation for high-privilege)
- History: Prevent reuse of last 5 passwords

Session Management:
- Duration: 1 hour of inactivity → auto-logout
- Remember me: Creates 14-day token (requires re-auth for sensitive)
```

**Secrets Management**
```
Development:
- .env files (git-ignored)
- Local secrets only
- No production keys in dev

Production:
- AWS Secrets Manager
- Automatic rotation every 30 days
- Access logging
- Audit trail
```

### Layer 4: Application Security

**Input Validation**
```python
# Example validation
class PlaceOrderRequest(BaseModel):
    account_id: UUID  # Validate UUID format
    symbol: str = Field(..., pattern="^[A-Z]{1,10}/[A-Z]{1,10}$")  # Symbol pattern
    quantity: Decimal = Field(..., gt=0, decimal_places=8)  # Positive, decimals
    price: Decimal = Field(..., gt=0, decimal_places=8)  # Positive, decimals

# Validation happens automatically on request
```

**Output Encoding**
```
API Responses:
- JSON: Escaped HTML entities
- CSV Export: Escaped quotes
- PDF Report: Safe PDF generation

Error Messages:
- Generic: "Invalid input" (to users)
- Detailed: In logs only (for debugging)
- No stack traces: To clients
```

**SQL Injection Prevention**
```python
# Use parameterized queries
cursor.execute(
    "SELECT * FROM orders WHERE account_id = %s AND symbol = %s",
    (account_id, symbol)  # Separated from query
)

# NOT: f"SELECT * FROM orders WHERE account_id = '{account_id}'"
```

**XSS Prevention**
```html
<!-- Vulnerable -->
<div>{{ user_input }}</div>

<!-- Safe -->
<div v-text="user_input"></div>  <!-- Vue.js auto-escapes -->
<div>{/* userInput */}</div>  <!-- React auto-escapes -->
```

### Layer 5: Smart Contract Security

**Daml Contract Guarantees**
```daml
-- Type system prevents many exploits
-- Partial functions marked with ()
-- All template arguments must be used

template Order
  with
    order_id: Text
    quantity: Decimal  -- Type system prevents overflow
    price: Decimal
  where
    signatory buyer, seller
    -- Only buyer and seller can exercise choices
    -- All obligations must be fulfilled

choice CancelOrder : ()
  controller buyer  -- Only buyer can cancel
  do
    assert (not filled)  -- Prevents double-spending
    return ()
```

---

## Compliance & Regulatory

### KYC/AML (Know Your Customer / Anti-Money Laundering)

**KYC Process**
```
1. Information Submission
   ├─ Full name, DOB
   ├─ Address, phone
   ├─ Employment details
   └─ Source of funds

2. Document Verification
   ├─ Government ID
   ├─ Address proof
   └─ Employment verification

3. Manual Review (24 hours)
   ├─ Compliance officer review
   ├─ Risk assessment
   └─ Approval/rejection

4. Ongoing Monitoring
   ├─ Monthly suspicious activity check
   ├─ Annual information refresh
   └─ Transaction pattern analysis
```

**Risk Tiers**
```
Tier 0 (Unverified): No trading
Tier 1 (Basic KYC): Limited trading ($10k/day)
Tier 2 (Enhanced KYC): Full trading
Tier 3 (Institutional): Unlimited trading
```

### Audit Trail

**All Actions Logged**
```
Event: Order Placed
├─ User: user_uuid
├─ Account: account_uuid
├─ Timestamp: 2024-11-17T16:30:00Z
├─ IP Address: 203.0.113.42
├─ User Agent: Mozilla/5.0...
├─ Order Details: {symbol, quantity, price}
├─ Account Balance: 100000
└─ Margin Available: 50000
```

**Retention Policy**
```
Development Logs: 7 days
Production Logs: 7 years
  (Required for regulatory compliance)
Backup: Monthly snapshots to cold storage
```

---

## Incident Response

### Security Incident Classification

**Critical**
- Account takeover
- Data breach
- Smart contract exploit
- System outage

**High**
- Suspicious transaction
- Failed authentication attempts
- Configuration error
- Performance degradation

**Medium**
- Failed login
- Invalid request
- API error
- Service lag

### Response Procedures

**Upon Critical Incident**
```
1. Immediate (0-5 min)
   ├─ Page on-call security team
   ├─ Isolate affected systems
   └─ Enable detailed logging

2. Assessment (5-30 min)
   ├─ Determine scope
   ├─ Identify root cause
   └─ Notify affected users

3. Remediation (30 min - 24 hours)
   ├─ Patch vulnerability
   ├─ Reset affected credentials
   ├─ Notify customers
   └─ Publish advisory

4. Recovery (24-48 hours)
   ├─ Restore from backup
   ├─ Verify system integrity
   ├─ Conduct forensics
   └─ Post-mortem review
```

---

## Regular Security Activities

### Weekly
- Review failed login attempts
- Check for unusual API usage
- Scan dependencies for vulnerabilities

### Monthly
- Security code review (random module)
- Penetration testing update
- Compliance check

### Quarterly
- Full security audit
- Disaster recovery drill
- Team security training

### Annually
- Third-party penetration test
- SOC 2 / ISO 27001 audit
- Security architecture review

---

## References

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [NIST Cybersecurity Framework](https://www.nist.gov/cyberframework)
- [PCI DSS Compliance](https://www.pcisecuritystandards.org/)
- [GDPR Compliance](https://gdpr-info.eu/)
