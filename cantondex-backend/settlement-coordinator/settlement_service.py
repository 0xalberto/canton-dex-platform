"""
Settlement Coordinator Service
Orchestrates atomic multi-domain settlement via Canton Ledger API
"""

from enum import Enum
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime
from uuid import UUID
import httpx
import asyncio

from config import SettlementConfig

class SettlementStatus(str, Enum):
    """Settlement states"""
    PENDING = "pending"
    EXECUTING = "executing"
    COMPLETED = "completed"
    FAILED = "failed"
    ROLLED_BACK = "rolled_back"

class SettlementRequest(BaseModel):
    """Settlement creation request"""
    trade_id: UUID
    buyer_account_id: str
    seller_account_id: str
    asset: str
    asset_quantity: float
    payment_amount: float
    domain_id: Optional[str] = None

class SettlementRecord(BaseModel):
    """Settlement record"""
    settlement_id: UUID
    trade_id: UUID
    status: SettlementStatus
    created_at: datetime
    completed_at: Optional[datetime]
    buyer_account_id: str
    seller_account_id: str
    asset: str
    asset_quantity: float
    payment_amount: float
    domain_id: str
    Canton_contract_id: Optional[str] = None

class SettlementService:
    """Settlement coordinator service"""
    
    def __init__(self, config: SettlementConfig):
        self.config = config
        self.canton_client = httpx.AsyncClient(
            base_url=config.CANTON_API_URL,
            auth=(config.CANTON_API_USER, config.CANTON_API_PASSWORD),
            timeout=config.CANTON_TIMEOUT,
        )
    
    async def create_settlement(
        self,
        request: SettlementRequest,
    ) -> SettlementRecord:
        """
        Create atomic settlement from matched trade
        
        Atomicity guarantee: Trade atomically transfers asset from seller to buyer
        and payment from buyer to seller via Canton AtomicTrade contract
        
        Args:
            request: Settlement request with trade details
        
        Returns:
            Settlement record
        """
        settlement_id = UUID.new_v4()
        
        try:
            # Create settlement record in database
            settlement = SettlementRecord(
                settlement_id=settlement_id,
                trade_id=request.trade_id,
                status=SettlementStatus.PENDING,
                created_at=datetime.utcnow(),
                completed_at=None,
                buyer_account_id=request.buyer_account_id,
                seller_account_id=request.seller_account_id,
                asset=request.asset,
                asset_quantity=request.asset_quantity,
                payment_amount=request.payment_amount,
                domain_id=request.domain_id or await self.select_domain(
                    request.buyer_account_id,
                    request.seller_account_id,
                ),
                Canton_contract_id=None,
            )
            
            # Update status to executing
            settlement.status = SettlementStatus.EXECUTING
            
            # Exercise AtomicTrade contract on Canton
            contract_id = await self.execute_atomic_trade(settlement)
            settlement.Canton_contract_id = contract_id
            
            # Update status to completed
            settlement.status = SettlementStatus.COMPLETED
            settlement.completed_at = datetime.utcnow()
            
            return settlement
            
        except Exception as e:
            # Handle settlement failure
            settlement.status = SettlementStatus.FAILED
            await self.handle_settlement_failure(settlement, str(e))
            raise
    
    async def execute_atomic_trade(
        self,
        settlement: SettlementRecord,
    ) -> str:
        """
        Exercise AtomicTrade contract on Canton
        
        Args:
            settlement: Settlement record
        
        Returns:
            Contract ID
        """
        # Prepare contract parameters
        contract_params = {
            "buyer": settlement.buyer_account_id,
            "seller": settlement.seller_account_id,
            "asset": settlement.asset,
            "assetQuantity": settlement.asset_quantity,
            "paymentAmount": settlement.payment_amount,
            "domainId": settlement.domain_id,
            "settlementId": str(settlement.settlement_id),
        }
        
        # Call Canton JSON API to exercise contract
        response = await self.canton_client.post(
            f"/v1/exercise",
            json={
                "templateId": "Main:AtomicTrade",
                "contractId": None,
                "choice": "ExecuteAtomicTrade",
                "argument": contract_params,
            },
        )
        
        if response.status_code >= 400:
            raise Exception(f"Canton contract execution failed: {response.text}")
        
        result = response.json()
        return result.get("contractId")
    
    async def select_domain(
        self,
        buyer_account_id: str,
        seller_account_id: str,
    ) -> str:
        """
        Select appropriate domain for settlement
        
        Multi-domain settlement requires both parties to be on same domain.
        Falls back to public domain if no common private domain.
        
        Args:
            buyer_account_id: Buyer account
            seller_account_id: Seller account
        
        Returns:
            Domain ID
        """
        # Query available domains for both accounts
        buyer_domains = await self.get_account_domains(buyer_account_id)
        seller_domains = await self.get_account_domains(seller_account_id)
        
        # Find common domains
        common = set(buyer_domains) & set(seller_domains)
        
        if common:
            # Prefer private domain, else public
            private_domains = [d for d in common if "private" in d]
            return private_domains[0] if private_domains else common.pop()
        else:
            # Use public settlement domain
            return "settlement-public"
    
    async def get_account_domains(self, account_id: str) -> List[str]:
        """Get domains for account"""
        # Query from database or ledger
        # Simplified stub
        return ["private-domain-1", "settlement-public"]
    
    async def handle_settlement_failure(
        self,
        settlement: SettlementRecord,
        error: str,
    ):
        """
        Handle settlement failure with retry/rollback logic
        
        Args:
            settlement: Failed settlement
            error: Error message
        """
        # Log failure
        print(f"Settlement {settlement.settlement_id} failed: {error}")
        
        # Automatic retry with exponential backoff
        for attempt in range(3):
            delay = 2 ** attempt
            await asyncio.sleep(delay)
            
            try:
                contract_id = await self.execute_atomic_trade(settlement)
                settlement.status = SettlementStatus.COMPLETED
                settlement.Canton_contract_id = contract_id
                return
            except Exception as e:
                print(f"Retry {attempt + 1} failed: {e}")
                continue
        
        # Rollback failed settlement
        settlement.status = SettlementStatus.ROLLED_BACK
