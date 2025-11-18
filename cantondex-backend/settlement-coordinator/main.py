"""FastAPI service exposing Canton settlement orchestration endpoints."""

import os
from datetime import date, datetime
from typing import Dict
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from settlement_canton_integration import CantonSettlementCoordinator
from config import SettlementConfig

config = SettlementConfig()
coordinator = CantonSettlementCoordinator(
    canton_host=config.CANTON_LEDGER_API_HOST,
    canton_port=config.CANTON_LEDGER_API_PORT,
    securities_issuer_party=config.SECURITIES_ISSUER_PARTY,
    cash_provider_party=config.CASH_PROVIDER_PARTY,
)

app = FastAPI(
    title="CantonDEX Settlement Coordinator",
    description="Atomic DvP settlement interface backed by Canton",
    version="1.0.0",
)

allowed_origins = os.getenv("SETTLEMENT_CORS_ORIGINS", "*")
origins = [origin.strip() for origin in allowed_origins.split(",") if origin.strip()] or ["*"]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins if "*" not in origins else ["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class SettlementRequest(BaseModel):
    trade_id: str
    buyer_party: str
    seller_party: str
    symbol: str
    quantity: float
    cash_amount: float
    settlement_date: date
    buyer_securities_ref: str
    seller_cash_ref: str


class SettlementRecord(BaseModel):
    settlement_id: str
    trade_id: str
    contract_id: str
    status: str
    executed_at: datetime
    buyer_party: str
    seller_party: str
    symbol: str
    quantity: float
    cash_amount: float


settlement_store: Dict[str, SettlementRecord] = {}


@app.get("/health")
async def health_check():
    canton_ok = await coordinator.health_check()
    return {
        "service": "settlement-coordinator",
        "status": "healthy" if canton_ok else "degraded",
        "canton": canton_ok,
    }


@app.post("/settlements", response_model=SettlementRecord)
async def create_and_execute_settlement(request: SettlementRequest):
    """Create a settlement contract and execute atomic DvP in one call."""
    settlement_contract = await coordinator.create_settlement_contract(
        trade_id=request.trade_id,
        buyer_party=request.buyer_party,
        seller_party=request.seller_party,
        symbol=request.symbol,
        quantity=request.quantity,
        cash_amount=request.cash_amount,
        settlement_date=request.settlement_date,
    )

    dvp_result = await coordinator.execute_atomic_dvp(
        settlement_contract_id=settlement_contract.contract_id,
        buyer_party=request.buyer_party,
        seller_party=request.seller_party,
        buyer_securities_ref=request.buyer_securities_ref,
        seller_cash_ref=request.seller_cash_ref,
    )

    dvp_payload = dvp_result.get("result") or {}
    settlement_id = dvp_payload.get("settlementId") or f"set-{request.trade_id}"

    record = SettlementRecord(
        settlement_id=settlement_id,
        trade_id=request.trade_id,
        contract_id=settlement_contract.contract_id,
        status="completed",
        executed_at=datetime.utcnow(),
        buyer_party=request.buyer_party,
        seller_party=request.seller_party,
        symbol=request.symbol,
        quantity=request.quantity,
        cash_amount=request.cash_amount,
    )

    settlement_store[record.settlement_id] = record
    return record


@app.get("/settlements/{settlement_id}", response_model=SettlementRecord)
async def get_settlement(settlement_id: str):
    if settlement_id in settlement_store:
        return settlement_store[settlement_id]

    canton_record = await coordinator.query_settlement_status(
        settlement_id=settlement_id,
        party=config.SECURITIES_ISSUER_PARTY,
    )

    if not canton_record:
        raise HTTPException(status_code=404, detail="Settlement not found")

    payload = canton_record.get("payload", {})
    record = SettlementRecord(
        settlement_id=payload.get("settlementId", settlement_id),
        trade_id=payload.get("tradeId", ""),
        contract_id=canton_record.get("contractId", ""),
        status=payload.get("status", "unknown"),
        executed_at=datetime.utcnow(),
        buyer_party=payload.get("buyer", ""),
        seller_party=payload.get("seller", ""),
        symbol=payload.get("symbol", ""),
        quantity=float(payload.get("quantity", 0)),
        cash_amount=float(payload.get("cashAmount", 0)),
    )
    settlement_store[record.settlement_id] = record
    return record


@app.get("/settlements")
async def list_settlements():
    return {
        "count": len(settlement_store),
        "settlements": list(settlement_store.values()),
    }
