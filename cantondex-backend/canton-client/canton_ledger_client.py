"""
Canton Ledger API Client
Integrates with Canton Network JSON Ledger API for DAML contract operations
"""

import asyncio
import json
import logging
from typing import Dict, List, Optional, Any
from datetime import datetime
import aiohttp
from dataclasses import dataclass

logger = logging.getLogger(__name__)


@dataclass
class ContractId:
    """Represents a DAML contract identifier"""
    contract_id: str
    template_id: str


@dataclass
class Party:
    """Represents a Canton party"""
    party: str


class CantonLedgerClient:
    """
    Canton Ledger API Client
    
    Provides methods to:
    - Create contracts
    - Exercise choices
    - Query active contracts
    - Stream transaction events
    """
    
    def __init__(
        self,
        ledger_api_host: str = "localhost",
        ledger_api_port: int = 4851,
        application_id: str = "cantondex",
        timeout: int = 30
    ):
        self.base_url = f"http://{ledger_api_host}:{ledger_api_port}"
        self.application_id = application_id
        self.timeout = aiohttp.ClientTimeout(total=timeout)
        
        logger.info(f"Canton Ledger API Client initialized: {self.base_url}")
    
    async def create_contract(
        self,
        template_id: str,
        arguments: Dict[str, Any],
        party: str
    ) -> ContractId:
        """
        Create a new DAML contract
        
        Args:
            template_id: DAML template identifier (e.g., "Main:Order")
            arguments: Contract arguments as dictionary
            party: Party creating the contract
            
        Returns:
            ContractId: Created contract identifier
        """
        url = f"{self.base_url}/v1/create"
        
        payload = {
            "templateId": template_id,
            "payload": arguments,
            "meta": {
                "actAs": [party],
                "applicationId": self.application_id,
                "commandId": f"cmd_{datetime.now().timestamp()}"
            }
        }
        
        async with aiohttp.ClientSession(timeout=self.timeout) as session:
            async with session.post(url, json=payload) as response:
                if response.status == 200:
                    result = await response.json()
                    contract_id = result.get("result", {}).get("contractId")
                    
                    logger.info(f"Contract created: {contract_id}")
                    return ContractId(
                        contract_id=contract_id,
                        template_id=template_id
                    )
                else:
                    error_text = await response.text()
                    logger.error(f"Failed to create contract: {error_text}")
                    raise Exception(f"Contract creation failed: {error_text}")
    
    async def exercise_choice(
        self,
        contract_id: str,
        choice_name: str,
        arguments: Dict[str, Any],
        party: str
    ) -> Dict[str, Any]:
        """
        Exercise a choice on a DAML contract
        
        Args:
            contract_id: Contract identifier
            choice_name: Name of the choice to exercise
            arguments: Choice arguments as dictionary
            party: Party exercising the choice
            
        Returns:
            Exercise result
        """
        url = f"{self.base_url}/v1/exercise"
        
        payload = {
            "templateId": None,  # Will be fetched from contract
            "contractId": contract_id,
            "choice": choice_name,
            "argument": arguments,
            "meta": {
                "actAs": [party],
                "applicationId": self.application_id,
                "commandId": f"cmd_{datetime.now().timestamp()}"
            }
        }
        
        async with aiohttp.ClientSession(timeout=self.timeout) as session:
            async with session.post(url, json=payload) as response:
                if response.status == 200:
                    result = await response.json()
                    
                    logger.info(f"Choice exercised: {choice_name} on {contract_id}")
                    return result.get("result", {})
                else:
                    error_text = await response.text()
                    logger.error(f"Failed to exercise choice: {error_text}")
                    raise Exception(f"Choice exercise failed: {error_text}")
    
    async def query_active_contracts(
        self,
        template_id: str,
        party: str,
        query_filter: Optional[Dict[str, Any]] = None
    ) -> List[Dict[str, Any]]:
        """
        Query active contracts
        
        Args:
            template_id: DAML template identifier
            party: Party querying contracts
            query_filter: Optional filter criteria
            
        Returns:
            List of active contracts
        """
        url = f"{self.base_url}/v1/query"
        
        payload = {
            "templateIds": [template_id],
            "query": query_filter or {},
            "readAs": [party]
        }
        
        async with aiohttp.ClientSession(timeout=self.timeout) as session:
            async with session.post(url, json=payload) as response:
                if response.status == 200:
                    result = await response.json()
                    contracts = result.get("result", [])
                    
                    logger.info(f"Query returned {len(contracts)} contracts")
                    return contracts
                else:
                    error_text = await response.text()
                    logger.error(f"Query failed: {error_text}")
                    raise Exception(f"Query failed: {error_text}")
    
    async def fetch_contract(
        self,
        contract_id: str,
        party: str
    ) -> Optional[Dict[str, Any]]:
        """
        Fetch a specific contract by ID
        
        Args:
            contract_id: Contract identifier
            party: Party fetching the contract
            
        Returns:
            Contract data or None if not found
        """
        url = f"{self.base_url}/v1/fetch"
        
        payload = {
            "contractId": contract_id,
            "readAs": [party]
        }
        
        async with aiohttp.ClientSession(timeout=self.timeout) as session:
            async with session.post(url, json=payload) as response:
                if response.status == 200:
                    result = await response.json()
                    return result.get("result")
                elif response.status == 404:
                    logger.warning(f"Contract not found: {contract_id}")
                    return None
                else:
                    error_text = await response.text()
                    logger.error(f"Fetch failed: {error_text}")
                    raise Exception(f"Fetch failed: {error_text}")
    
    async def allocate_party(
        self,
        party_id_hint: str,
        display_name: Optional[str] = None
    ) -> Party:
        """
        Allocate a new party on the ledger
        
        Args:
            party_id_hint: Suggested party identifier
            display_name: Optional display name
            
        Returns:
            Party: Allocated party
        """
        url = f"{self.base_url}/v1/parties/allocate"
        
        payload = {
            "identifierHint": party_id_hint,
            "displayName": display_name or party_id_hint
        }
        
        async with aiohttp.ClientSession(timeout=self.timeout) as session:
            async with session.post(url, json=payload) as response:
                if response.status == 200:
                    result = await response.json()
                    party_id = result.get("result", {}).get("identifier")
                    
                    logger.info(f"Party allocated: {party_id}")
                    return Party(party=party_id)
                else:
                    error_text = await response.text()
                    logger.error(f"Party allocation failed: {error_text}")
                    raise Exception(f"Party allocation failed: {error_text}")
    
    async def list_known_parties(self) -> List[Party]:
        """
        List all known parties on the ledger
        
        Returns:
            List of parties
        """
        url = f"{self.base_url}/v1/parties"
        
        async with aiohttp.ClientSession(timeout=self.timeout) as session:
            async with session.get(url) as response:
                if response.status == 200:
                    result = await response.json()
                    parties = [
                        Party(party=p.get("identifier"))
                        for p in result.get("result", [])
                    ]
                    
                    logger.info(f"Listed {len(parties)} known parties")
                    return parties
                else:
                    error_text = await response.text()
                    logger.error(f"List parties failed: {error_text}")
                    raise Exception(f"List parties failed: {error_text}")
    
    async def health_check(self) -> bool:
        """
        Check if Canton Ledger API is healthy
        
        Returns:
            True if healthy, False otherwise
        """
        url = f"{self.base_url}/health"
        
        try:
            async with aiohttp.ClientSession(timeout=self.timeout) as session:
                async with session.get(url) as response:
                    return response.status == 200
        except Exception as e:
            logger.error(f"Health check failed: {e}")
            return False


# Example usage
async def main():
    client = CantonLedgerClient()
    
    # Check health
    is_healthy = await client.health_check()
    print(f"Canton is healthy: {is_healthy}")
    
    # Allocate party
    alice = await client.allocate_party("alice", "Alice")
    print(f"Allocated party: {alice.party}")
    
    # Create an Account contract
    account_cid = await client.create_contract(
        template_id="Main:Account",
        arguments={
            "owner": alice.party,
            "accountId": "acc_alice_001",
            "accountType": "spot",
            "cashBalance": "100000.0",
            "reservedBalance": "0.0",
            "observers": []
        },
        party=alice.party
    )
    print(f"Created account contract: {account_cid.contract_id}")
    
    # Query active accounts
    accounts = await client.query_active_contracts(
        template_id="Main:Account",
        party=alice.party
    )
    print(f"Active accounts: {len(accounts)}")


if __name__ == "__main__":
    asyncio.run(main())
