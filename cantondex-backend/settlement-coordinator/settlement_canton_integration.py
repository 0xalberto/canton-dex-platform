"""
Settlement Coordinator - Canton Integration
Implements atomic DvP settlement using Canton DAML contracts
"""

import os
import sys
import logging
from typing import Dict, Optional
from datetime import datetime, date
from uuid import UUID

# Add canton-client to path
sys.path.append(os.path.join(os.path.dirname(__file__), '..', 'canton-client'))
from canton_ledger_client import CantonLedgerClient, ContractId

logger = logging.getLogger(__name__)


class CantonSettlementCoordinator:
    """
    Settlement coordinator using Canton Network for atomic DvP
    """
    
    def __init__(
        self,
        canton_host: str = None,
        canton_port: int = None,
        securities_issuer_party: str = None,
        cash_provider_party: str = None
    ):
        self.canton_client = CantonLedgerClient(
            ledger_api_host=canton_host or os.getenv("CANTON_LEDGER_API_HOST", "localhost"),
            ledger_api_port=canton_port or int(os.getenv("CANTON_LEDGER_API_PORT", "4851"))
        )
        
        # Canton parties
        self.securities_issuer = securities_issuer_party or os.getenv("SECURITIES_ISSUER_PARTY")
        self.cash_provider = cash_provider_party or os.getenv("CASH_PROVIDER_PARTY")
        
        logger.info("Canton Settlement Coordinator initialized")
    
    async def create_settlement_contract(
        self,
        trade_id: str,
        buyer_party: str,
        seller_party: str,
        symbol: str,
        quantity: float,
        cash_amount: float,
        settlement_date: date
    ) -> ContractId:
        """
        Create a Settlement contract on Canton ledger
        
        Args:
            trade_id: Trade identifier
            buyer_party: Buyer party identifier
            seller_party: Seller party identifier
            symbol: Trading symbol
            quantity: Asset quantity
            cash_amount: Cash amount
            settlement_date: Settlement date
            
        Returns:
            ContractId: Created settlement contract
        """
        settlement_id = f"set_{trade_id}"
        
        settlement_args = {
            "settlementId": settlement_id,
            "tradeId": trade_id,
            "buyer": buyer_party,
            "seller": seller_party,
            "securitiesIssuer": self.securities_issuer,
            "cashProvider": self.cash_provider,
            "symbol": symbol,
            "quantity": str(quantity),
            "cashAmount": str(cash_amount),
            "settlementDate": settlement_date.isoformat(),
            "status": "pending",
            "observers": []
        }
        
        logger.info(f"Creating settlement contract: {settlement_id}")
        
        try:
            contract_id = await self.canton_client.create_contract(
                template_id="Main:Settlement",
                arguments=settlement_args,
                party=buyer_party
            )
            
            logger.info(f"Settlement contract created: {contract_id.contract_id}")
            return contract_id
            
        except Exception as e:
            logger.error(f"Failed to create settlement contract: {e}")
            raise
    
    async def execute_atomic_dvp(
        self,
        settlement_contract_id: str,
        buyer_party: str,
        seller_party: str,
        buyer_securities_ref: str,
        seller_cash_ref: str
    ) -> Dict:
        """
        Execute atomic Delivery-vs-Payment settlement
        
        This exercises the ExecuteDeliveryVsPayment choice on the Settlement contract.
        Canton ensures atomicity: both transfers succeed or both fail.
        
        Args:
            settlement_contract_id: Settlement contract ID
            buyer_party: Buyer party
            seller_party: Seller party
            buyer_securities_ref: Buyer's securities ledger reference
            seller_cash_ref: Seller's cash ledger reference
            
        Returns:
            Settlement result
        """
        logger.info(f"Executing atomic DvP for settlement: {settlement_contract_id}")
        
        dvp_args = {
            "buyerSecuritiesRef": buyer_securities_ref,
            "sellerCashRef": seller_cash_ref
        }
        
        try:
            result = await self.canton_client.exercise_choice(
                contract_id=settlement_contract_id,
                choice_name="ExecuteDeliveryVsPayment",
                arguments=dvp_args,
                party=buyer_party
            )
            
            logger.info(f"Atomic DvP executed successfully: {settlement_contract_id}")
            return result
            
        except Exception as e:
            logger.error(f"Atomic DvP failed: {e}")
            
            # Try to fail settlement gracefully
            try:
                await self.fail_settlement(
                    settlement_contract_id=settlement_contract_id,
                    failure_reason=str(e),
                    party=buyer_party
                )
            except Exception as fail_error:
                logger.error(f"Failed to mark settlement as failed: {fail_error}")
            
            raise
    
    async def fail_settlement(
        self,
        settlement_contract_id: str,
        failure_reason: str,
        party: str
    ) -> None:
        """
        Mark settlement as failed
        
        Args:
            settlement_contract_id: Settlement contract ID
            failure_reason: Reason for failure
            party: Party exercising the choice
        """
        logger.warning(f"Failing settlement {settlement_contract_id}: {failure_reason}")
        
        fail_args = {
            "failureReason": failure_reason
        }
        
        await self.canton_client.exercise_choice(
            contract_id=settlement_contract_id,
            choice_name="FailSettlement",
            arguments=fail_args,
            party=party
        )
    
    async def query_settlement_status(
        self,
        settlement_id: str,
        party: str
    ) -> Optional[Dict]:
        """
        Query settlement status from Canton
        
        Args:
            settlement_id: Settlement identifier
            party: Party querying
            
        Returns:
            Settlement contract data or None
        """
        settlements = await self.canton_client.query_active_contracts(
            template_id="Main:Settlement",
            party=party,
            query_filter={"settlementId": settlement_id}
        )
        
        return settlements[0] if settlements else None
    
    async def health_check(self) -> bool:
        """
        Check if Canton is healthy
        
        Returns:
            True if healthy, False otherwise
        """
        return await self.canton_client.health_check()


# Example usage
async def main():
    coordinator = CantonSettlementCoordinator()
    
    # Check health
    is_healthy = await coordinator.health_check()
    print(f"Canton healthy: {is_healthy}")
    
    if is_healthy:
        # Create settlement
        settlement_cid = await coordinator.create_settlement_contract(
            trade_id="trd_123456",
            buyer_party="Alice::participant",
            seller_party="Bob::participant",
            symbol="AAPL/USDC",
            quantity=100.0,
            cash_amount=15047.50,
            settlement_date=date(2024, 11, 19)
        )
        print(f"Settlement created: {settlement_cid.contract_id}")
        
        # Execute DvP
        result = await coordinator.execute_atomic_dvp(
            settlement_contract_id=settlement_cid.contract_id,
            buyer_party="Alice::participant",
            seller_party="Bob::participant",
            buyer_securities_ref="sec_ref_123",
            seller_cash_ref="cash_ref_456"
        )
        print(f"DvP executed: {result}")


if __name__ == "__main__":
    import asyncio
    asyncio.run(main())
