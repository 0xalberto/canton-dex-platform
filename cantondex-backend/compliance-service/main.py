"""FastAPI wrapper for the compliance service."""

import os
from typing import Optional
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from datetime import datetime

from compliance_service import (
    ComplianceService,
    ComplianceAlert,
    AlertSeverity,
    SurveillanceRule,
)

app = FastAPI(
    title="CantonDEX Compliance Service",
    description="KYC/AML checks, compliance alerts, and audit logging",
    version="1.0.0",
)

allowed_origins = os.getenv("COMPLIANCE_CORS_ORIGINS", "*")
origins = [origin.strip() for origin in allowed_origins.split(",") if origin.strip()] or ["*"]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins if "*" not in origins else ["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

service = ComplianceService()


class KYCRequest(BaseModel):
    account_id: str
    full_name: str
    date_of_birth: str
    document_type: str
    document_id: str


class AMLRequest(BaseModel):
    account_id: str


class AlertSimulationRequest(BaseModel):
    account_id: str
    rule: SurveillanceRule
    severity: AlertSeverity = AlertSeverity.WARNING
    description: str
    evidence: dict


@app.get("/health")
async def health_check():
    """Simple health endpoint for orchestration and monitoring."""
    return {
        "service": "compliance",
        "status": "healthy",
        "alerts": len(service.alerts),
        "kyc_records": len(service.kyc_records),
    }


@app.post("/kyc")
async def perform_kyc(request: KYCRequest):
    """Trigger a KYC verification flow for an account."""
    record = await service.perform_kyc(
        account_id=request.account_id,
        full_name=request.full_name,
        date_of_birth=request.date_of_birth,
        document_type=request.document_type,
        document_id=request.document_id,
    )
    return record


@app.get("/kyc/{account_id}")
async def get_kyc_record(account_id: str):
    record = service.kyc_records.get(account_id)
    if not record:
        raise HTTPException(status_code=404, detail="KYC record not found")
    return record


@app.get("/kyc")
async def list_kyc_records():
    """Return all known KYC records."""
    return {
        "count": len(service.kyc_records),
        "records": list(service.kyc_records.values()),
    }


@app.post("/aml")
async def perform_aml(request: AMLRequest):
    """Trigger AML/sanctions screening for an account."""
    result = await service.perform_aml_screening(request.account_id)
    return result


@app.get("/alerts")
async def list_alerts():
    """Return all active compliance alerts."""
    return {
        "count": len(service.alerts),
        "alerts": service.alerts,
    }


@app.get("/alerts/{alert_id}")
async def get_alert(alert_id: str):
    for alert in service.alerts:
        if alert.alert_id == alert_id:
            return alert
    raise HTTPException(status_code=404, detail="Alert not found")


@app.post("/alerts/simulate")
async def simulate_alert(request: AlertSimulationRequest):
    """Generate a synthetic alert for demo and frontend testing."""
    alert = await service.generate_alert(
        account_id=request.account_id,
        rule=request.rule,
        severity=request.severity,
        description=request.description,
        evidence={
            **request.evidence,
            "generated_at": datetime.utcnow().isoformat(),
        },
    )
    return alert


@app.get("/audit-log")
async def audit_log():
    """Return audit log entries for the compliance dashboard."""
    return {
        "count": len(service.audit_log),
        "entries": service.audit_log,
    }
