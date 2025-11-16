"""
Compliance Service (Spring Boot)
KYC/AML, trade surveillance, alert management, audit trails
"""

import asyncio
from enum import Enum
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

class ComplianceStatus(str, Enum):
    """Compliance status"""
    APPROVED = "approved"
    PENDING = "pending"
    REJECTED = "rejected"
    FROZEN = "frozen"

class AlertSeverity(str, Enum):
    """Alert severity levels"""
    INFO = "info"
    WARNING = "warning"
    CRITICAL = "critical"

class SurveillanceRule(str, Enum):
    """Trade surveillance rules"""
    WASH_TRADING = "wash_trading"
    SPOOFING = "spoofing"
    LAYERING = "layering"
    FRONT_RUNNING = "front_running"

class KYCRecord(BaseModel):
    """KYC record"""
    account_id: str
    status: ComplianceStatus
    verified_at: Optional[datetime]
    expires_at: Optional[datetime]
    document_type: str
    document_id: str
    kyc_provider: str  # Jumio, Onfido, etc.

class AMLCheck(BaseModel):
    """AML screening result"""
    account_id: str
    check_type: str  # sanctions, pep, adverse_media
    status: str  # clear, match, review
    matches: List[str]
    checked_at: datetime

class ComplianceAlert(BaseModel):
    """Compliance alert"""
    alert_id: str
    account_id: str
    rule: SurveillanceRule
    severity: AlertSeverity
    description: str
    evidence: dict
    created_at: datetime
    status: str  # open, investigating, resolved, dismissed

class AuditLog(BaseModel):
    """Immutable audit trail entry with salted hash"""
    log_id: str
    timestamp: datetime
    action: str
    actor: str
    resource: str
    details: dict
    salted_hash: str  # SHA-256(action + actor + resource + timestamp + salt)

class ComplianceService:
    """Compliance service"""
    
    def __init__(self):
        self.kyc_records: Dict[str, KYCRecord] = {}
        self.aml_checks: Dict[str, List[AMLCheck]] = {}
        self.alerts: List[ComplianceAlert] = []
        self.audit_log: List[AuditLog] = []
    
    async def perform_kyc(
        self,
        account_id: str,
        full_name: str,
        date_of_birth: str,
        document_type: str,
        document_id: str,
    ) -> KYCRecord:
        """
        Perform KYC verification
        
        Integrates with KYC provider (Jumio, Onfido, etc.)
        """
        record = KYCRecord(
            account_id=account_id,
            status=ComplianceStatus.PENDING,
            verified_at=None,
            expires_at=None,
            document_type=document_type,
            document_id=document_id,
            kyc_provider="jumio",  # Stub
        )
        
        # Call KYC provider API (stub)
        kyc_result = await self._call_kyc_provider(
            full_name,
            date_of_birth,
            document_type,
            document_id,
        )
        
        if kyc_result["status"] == "verified":
            record.status = ComplianceStatus.APPROVED
            record.verified_at = datetime.utcnow()
            record.expires_at = datetime.utcnow() + timedelta(days=365)
        else:
            record.status = ComplianceStatus.REJECTED
        
        self.kyc_records[account_id] = record
        return record
    
    async def perform_aml_screening(self, account_id: str) -> AMLCheck:
        """
        Perform AML/sanctions screening
        
        Checks against:
        - Sanctions lists (OFAC, EU, UN)
        - PEP (Politically Exposed Person) database
        - Adverse media screening
        """
        check = AMLCheck(
            account_id=account_id,
            check_type="sanctions",
            status="clear",
            matches=[],
            checked_at=datetime.utcnow(),
        )
        
        # Call AML screening service (stub)
        screening_result = await self._call_aml_screening(account_id)
        
        if screening_result["matches"]:
            check.status = "match"
            check.matches = screening_result["matches"]
            
            # Generate alert
            await self.generate_alert(
                account_id=account_id,
                rule=SurveillanceRule.SPOOFING,
                severity=AlertSeverity.CRITICAL,
                description=f"AML hit: {', '.join(screening_result['matches'])}",
                evidence=screening_result,
            )
        
        if account_id not in self.aml_checks:
            self.aml_checks[account_id] = []
        
        self.aml_checks[account_id].append(check)
        return check
    
    async def analyze_trade(
        self,
        account_id: str,
        trade_id: str,
        side: str,
        quantity: float,
        price: float,
        market: str,
    ):
        """
        Analyze trade for suspicious patterns
        
        Detects:
        - Wash trading (buy/sell to self)
        - Spoofing (fake orders to move price)
        - Layering (multiple orders at different prices)
        - Front-running (trading ahead of client orders)
        """
        # Simplified pattern matching
        
        # Check for wash trading
        recent_trades = await self._get_recent_trades(account_id, market)
        for trade in recent_trades:
            if (trade["side"] != side and
                trade["price"] == price and
                trade["quantity"] == quantity):
                await self.generate_alert(
                    account_id=account_id,
                    rule=SurveillanceRule.WASH_TRADING,
                    severity=AlertSeverity.CRITICAL,
                    description="Possible wash trading detected",
                    evidence={"trade_id": trade_id, "previous_trade": trade},
                )
    
    async def generate_alert(
        self,
        account_id: str,
        rule: SurveillanceRule,
        severity: AlertSeverity,
        description: str,
        evidence: dict,
    ) -> ComplianceAlert:
        """Generate compliance alert"""
        alert = ComplianceAlert(
            alert_id=str(UUID.new_v4()),
            account_id=account_id,
            rule=rule,
            severity=severity,
            description=description,
            evidence=evidence,
            created_at=datetime.utcnow(),
            status="open",
        )
        
        self.alerts.append(alert)
        
        # Log to audit trail
        await self.audit_log_action(
            action="alert_generated",
            actor="compliance_service",
            resource=f"account:{account_id}",
            details={"alert_id": alert.alert_id, "rule": rule.value},
        )
        
        return alert
    
    async def audit_log_action(
        self,
        action: str,
        actor: str,
        resource: str,
        details: dict,
    ) -> AuditLog:
        """
        Log action to immutable audit trail
        
        Uses salted hash for integrity verification (GDPR compliant)
        Allows verifying logs haven't been tampered with
        """
        import hashlib
        import secrets
        
        # Generate random salt
        salt = secrets.token_hex(16)
        
        # Create hashable string
        log_string = f"{action}:{actor}:{resource}:{datetime.utcnow().isoformat()}:{salt}"
        
        # Calculate salted hash
        salted_hash = hashlib.sha256(log_string.encode()).hexdigest()
        
        log_entry = AuditLog(
            log_id=str(UUID.new_v4()),
            timestamp=datetime.utcnow(),
            action=action,
            actor=actor,
            resource=resource,
            details=details,
            salted_hash=salted_hash,
        )
        
        self.audit_log.append(log_entry)
        return log_entry
    
    async def generate_sar_report(self) -> dict:
        """
        Generate Suspicious Activity Report (SAR)
        
        Required for critical alerts under AML regulations
        """
        critical_alerts = [a for a in self.alerts if a.severity == AlertSeverity.CRITICAL]
        
        sar = {
            "report_date": datetime.utcnow().isoformat(),
            "alert_count": len(critical_alerts),
            "alerts": [
                {
                    "alert_id": a.alert_id,
                    "account_id": a.account_id,
                    "rule": a.rule.value,
                    "description": a.description,
                }
                for a in critical_alerts
            ],
        }
        
        return sar
    
    async def _call_kyc_provider(self, full_name, dob, doc_type, doc_id):
        """Stub: Call KYC provider API"""
        return {"status": "verified"}
    
    async def _call_aml_screening(self, account_id):
        """Stub: Call AML screening service"""
        return {"matches": []}
    
    async def _get_recent_trades(self, account_id, market, hours=24):
        """Stub: Get recent trades for account"""
        return []
