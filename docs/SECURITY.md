# CantonDEX Security Architecture

## 1. Threat Model

### Assets to Protect

1. **Financial Assets**: User balances, trades, positions
2. **Private Information**: Order details, counterparty identities, trading strategies
3. **System Integrity**: Ledger immutability, transaction atomicity
4. **Regulatory Compliance**: Audit trails, KYC/AML data

### Threat Actors

| Actor | Capability | Goal | Mitigations |
|-------|-----------|------|------------|
| Competitor | Monitor trades | Extract alpha | Sub-transaction privacy, encrypted orders |
| Regulator | Full access | Audit compliance | Selective disclosure API |
| Attacker | Network access | Steal funds | HSM signing, multi-sig |
| Malicious Node | Byzantine behavior | Double-spend | BFT consensus, Canton protocol |
| Insider | System access | Extract data | Encryption, RBAC, audit logs |

---

## 2. Authentication & Authorization

### Authentication Flow

```
1. User → Keycloak
   POST /auth/realms/cantondex/protocol/openid-connect/token
   {
     "grant_type": "password",
     "client_id": "frontend",
     "username": "trader@hedge.fund",
     "password": "***"
   }

2. Keycloak → JWT Token
   {
     "sub": "alice@hedge.fund",
     "iss": "http://keycloak:8080/auth",
     "aud": "cantondex-api",
     "exp": 1700000000,
     "iat": 1699900000,
     "roles": ["trader"],
     "canton_party": "alice_hedge_fund::1220..."
   }

3. Frontend → API Gateway (Authorization header)
   GET /api/v1/orders
   Authorization: Bearer {jwt_token}

4. API Gateway → Verify Signature
   - Fetch Keycloak public key
   - Verify JWT signature
   - Extract party ID + roles
   - Grant access if authorized
```

### Role-Based Access Control (RBAC)

```
ROLES:
├─ Admin
│  └─ All operations
│
├─ Trader
│  ├─ Create orders
│  ├─ View own positions
│  ├─ Modify own settings
│  └─ CANNOT: Modify compliance, access other traders' data
│
├─ Viewer
│  ├─ Read-only access
│  ├─ View public market data
│  └─ CANNOT: Trade, modify any data
│
├─ Compliance
│  ├─ View all trades
│  ├─ View KYC/AML status
│  ├─ Generate reports
│  └─ CANNOT: Execute trades, modify positions
│
└─ Regulator
   ├─ Full audit access
   ├─ View all parties
   ├─ Access encryption keys (for audit)
   └─ Generate compliance reports
```

### Multi-Factor Authentication (MFA)

- **Method 1**: TOTP (Time-based One-Time Password)
  - Enabled for Traders and Admin
  - Setup: Scan QR code with authenticator app
  - Verify on login

- **Method 2**: Security Keys (Optional)
  - FIDO2 support
  - Institutional requirement for large traders

---

## 3. Encryption Strategy

### Encryption at Rest

**PostgreSQL Primary Database**
```sql
-- Enable Transparent Data Encryption (TDE)
ALTER SYSTEM SET ssl = on;
ALTER SYSTEM SET ssl_cert_file = '/path/to/cert.pem';

-- Table-level encryption for sensitive data
CREATE EXTENSION pgcrypto;

CREATE TABLE user_credentials (
  user_id UUID PRIMARY KEY,
  password_hash bytea NOT NULL,
  encrypted_api_key bytea NOT NULL GENERATED ALWAYS AS 
    (pgp_sym_encrypt(api_key, encryption_key))
);
```

**Redis Cache**
```
- Persistence: RDB + AOF
- Encryption: AES-256-GCM
- Key rotation: 30 days
```

**S3 Backups**
```
- Encryption: AES-256 (AWS KMS managed)
- Versioning: Enabled
- Lifecycle: Archive after 90 days
```

### Encryption in Transit

**TLS 1.3 Configuration**
```nginx
# NGINX reverse proxy
server {
  listen 443 ssl http2;
  
  ssl_protocols TLSv1.3;
  ssl_ciphers ECDHE-ECDSA-AES256-GCM-SHA384;
  ssl_prefer_server_ciphers on;
  ssl_session_timeout 1d;
  ssl_session_cache shared:SSL:50m;
  
  # HSTS: Enforce HTTPS
  add_header Strict-Transport-Security "max-age=63072000" always;
}
```

**Internal Service-to-Service**
```
- mTLS (mutual TLS) between microservices
- Certificate pinning for Canton connections
- Certificate rotation: 90 days
```

### Smart Contract Privacy

**Sub-Transaction Encryption**
- Daml native privacy (built-in)
- Each party sees only relevant sub-transactions
- No additional encryption needed
- Canton protocol handles key derivation

---

## 4. Key Management

### Master Key Hierarchy

```
┌────────────────────────────┐
│    HSM (Hardware Module)   │
│  Root Master Key (RMK)     │
│  • Airgapped               │
│  • Backed up: 3 copies     │
└────────────┬───────────────┘
             │
    ┌────────▼──────────┐
    │ HashiCorp Vault   │
    ├───────────────────┤
    │ • DB Master Key   │ ← Encrypted with RMK
    │ • TLS CA Key      │
    │ • JWT Signing Key │
    │ • API Keys        │
    └────────────┬──────┘
                 │
        ┌────────▼──────────┐
        │ Application Layer │
        │ • Request tokens  │
        │ • Use short-lived │
        │   credentials     │
        └───────────────────┘
```

### Key Rotation Policy

```
Rotation Frequency:
- Master Key: Annually (manual process)
- Database Key: 30 days (automatic)
- JWT Signing Key: 90 days (automatic)
- TLS Certificates: 90 days (automatic)
- API Keys: User-initiated (min 60 days)

Rotation Process:
1. Generate new key
2. Dual-write with old + new key (grace period: 1 week)
3. Re-encrypt all data with new key
4. Retire old key
5. Audit log: Rotation timestamp + operator
```

---

## 5. Network Security

### Firewall Rules

```
INBOUND:
- Port 443 (HTTPS): All IP addresses
- Port 5011 (Canton Participant): Admin subnet only
- Port 9090 (Prometheus): Internal subnet only
- Port 3306 (MySQL): Internal subnet only

OUTBOUND:
- Port 443 (HTTPS): All destinations
- Port 80 (HTTP): Keycloak only (redirects to 443)
- Port 5432 (PostgreSQL Replica): Secondary region only
- Port 6379 (Redis): Application subnet only
```

### DDoS Protection

```
AWS Shield Standard:
- UDP floods, SYN floods
- DNS query floods
- Free protection

AWS WAF (Web Application Firewall):
- Rate limiting: 2,000 req/5min per IP
- Geo-blocking: Block suspicious countries
- SQL injection detection
- XSS protection

CloudFlare DDoS:
- Anycast network (global distribution)
- Automatic traffic scrubbing
- Fallback to AWS Shield
```

### IDS/IPS (Intrusion Detection/Prevention)

```
Suricata Rules:
- Monitor for suspicious patterns
- Alert on port scanning
- Detect data exfiltration attempts
- Block malicious IP ranges

Automated Response:
- Threshold exceeded → Auto-block IP
- Escalate to security team
- Generate incident report
```

---

## 6. Data Security

### PII Protection

```
Personally Identifiable Information:
- User names, emails, phone numbers
- KYC documents (passport, ID)
- Trading history (linked to individual)

Protection Measures:
- Encryption at rest (AES-256)
- TLS in transit
- Minimized logging (no PII in logs)
- GDPR compliance (right-to-forget via salted hash)
```

### Audit Logging

```
IMMUTABLE AUDIT LOG:
{
  "timestamp": "2025-11-16T10:30:00Z",
  "actor": "alice@hedge.fund",
  "action": "OrderCreated",
  "resource": "order-123",
  "oldValue": null,
  "newValue": {"price": 100, "qty": 1000},
  "status": "SUCCESS",
  "hash": "sha256(salt + json_value)"
}

RETENTION:
- Hot storage: 1 year
- Archive: 7 years (regulatory requirement)
- Immutable: Cannot be deleted (salted hash prevents tampering)
```

---

## 7. Compliance Controls

### SOC2 Type II

```
Control Categories:
├─ Security (CC)
│  ├─ Access controls
│  ├─ Encryption
│  └─ Monitoring
│
├─ Availability (A)
│  ├─ High availability
│  ├─ Backup/recovery
│  └─ Disaster recovery
│
├─ Processing Integrity (PI)
│  ├─ Data validation
│  ├─ Transaction atomicity
│  └─ Error handling
│
├─ Confidentiality (C)
│  ├─ Sub-transaction privacy
│  ├─ Data classification
│  └─ Selective disclosure
│
└─ Privacy (P)
   ├─ GDPR compliance
   ├─ Data minimization
   └─ User rights (portability, forget)
```

### Security Testing

```
VULNERABILITY ASSESSMENT:
- Monthly penetration testing
- Automated SAST (static analysis)
- DAST (dynamic analysis)
- Dependency scanning

TESTING MATRIX:
┌────────────────────┬───────────────┬──────────────┐
│ Test Type          │ Frequency     │ Tool         │
├────────────────────┼───────────────┼──────────────┤
│ Penetration Test   │ Quarterly     │ Manual + Tool│
│ SAST               │ On commit     │ Checkmarx    │
│ DAST               │ Weekly        │ OWASP ZAP    │
│ Dependency Scan    │ Daily         │ Snyk         │
│ Container Scan     │ On push       │ Trivy        │
└────────────────────┴───────────────┴──────────────┘
```

---

## 8. Incident Response

### Security Incident Classification

```
P1 - Critical:
- Data breach confirmed
- Unauthorized transactions
- System compromise
- Action: Immediate shutdown + forensics

P2 - High:
- Attempted unauthorized access
- Suspicious activity patterns
- Certificate compromise
- Action: Isolate + investigate

P3 - Medium:
- Policy violations
- Suspicious but non-critical
- Minor vulnerabilities
- Action: Log + monitor

P4 - Low:
- Documentation issues
- Configuration recommendations
- Action: Schedule fix
```

### Incident Response Plan

1. **Detect**: Monitoring alerts → Security team
2. **Contain**: Isolate affected systems
3. **Investigate**: Forensics + root cause analysis
4. **Eradicate**: Patch vulnerability + remove threat
5. **Recover**: Restore from backup + verify integrity
6. **Post-Mortem**: Document learnings + update controls

---

## 9. Third-Party Risk Management

### Vendor Security Assessment

```
EVALUATION CRITERIA:
- ISO 27001 certification
- SOC2 Type II report
- Financial stability
- Incident history
- Compliance posture
- Data protection practices
```

### Critical Vendors

| Vendor | Service | Risk Level | Mitigation |
|--------|---------|-----------|-----------|
| Keycloak | Authentication | HIGH | Redundancy, backup auth method |
| PostgreSQL | Database | CRITICAL | Multi-region replication, backup |
| AWS | Infrastructure | HIGH | SLA enforcement, vendor diversification |
| Fireblocks | Custody | CRITICAL | Multi-sig wallets, regular audits |

---

## 10. Security Checklist

- [ ] TLS 1.3 enabled for all external endpoints
- [ ] All secrets in HashiCorp Vault (no hardcoding)
- [ ] MFA enabled for all admin accounts
- [ ] Regular penetration testing (quarterly)
- [ ] Encryption keys rotated (30-90 day cycle)
- [ ] Audit logs immutable (salted hash)
- [ ] Backup encryption verified (AES-256)
- [ ] Disaster recovery tested (annual)
- [ ] Security training completed (annual)
- [ ] Incident response plan tested (quarterly)

---

**Document Version**: 1.0.0  
**Last Updated**: 2025-11-16  
**Status**: EPIC-01 APPROVED
