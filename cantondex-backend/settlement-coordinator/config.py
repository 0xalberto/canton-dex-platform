"""Configuration helpers for the settlement coordinator."""

import os
from dataclasses import dataclass


@dataclass
class SettlementConfig:
    """Simple env-driven config for the settlement coordinator."""

    CANTON_LEDGER_API_HOST: str = os.getenv("CANTON_LEDGER_API_HOST", "localhost")
    CANTON_LEDGER_API_PORT: int = int(os.getenv("CANTON_LEDGER_API_PORT", "4851"))
    SECURITIES_ISSUER_PARTY: str = os.getenv("SECURITIES_ISSUER_PARTY", "SecuritiesIssuer::participant")
    CASH_PROVIDER_PARTY: str = os.getenv("CASH_PROVIDER_PARTY", "CashProvider::participant")
    SERVICE_PORT: int = int(os.getenv("SETTLEMENT_COORDINATOR_PORT", "8003"))
