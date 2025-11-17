"""
Crypto Wallet Integration
Supports MetaMask, WalletConnect, and other Web3 wallets
"""

import os
import logging
from typing import Optional, Dict
from datetime import datetime, timedelta
import jwt
from eth_account.messages import encode_defunct
from web3 import Web3

logger = logging.getLogger(__name__)


class WalletAuth:
    """
    Wallet-based authentication for crypto users
    """
    
    def __init__(self):
        self.w3 = Web3(Web3.HTTPProvider(
            os.getenv("WEB3_PROVIDER_URL", "https://mainnet.infura.io/v3/YOUR-PROJECT-ID")
        ))
        self.jwt_secret = os.getenv("JWT_SECRET", "your-secret-key-change-in-production")
        self.jwt_algorithm = "HS256"
        self.token_expiry_hours = 24
        
        logger.info("Wallet authentication initialized")
    
    def verify_signature(
        self,
        address: str,
        message: str,
        signature: str
    ) -> bool:
        """
        Verify that the signature matches the message and address
        
        Args:
            address: Ethereum address (0x...)
            message: Original message that was signed
            signature: Signature from wallet
            
        Returns:
            True if signature is valid
        """
        try:
            # Encode message
            message_hash = encode_defunct(text=message)
            
            # Recover address from signature
            recovered_address = self.w3.eth.account.recover_message(
                message_hash,
                signature=signature
            )
            
            # Compare addresses (case-insensitive)
            is_valid = recovered_address.lower() == address.lower()
            
            if is_valid:
                logger.info(f"Valid signature from {address}")
            else:
                logger.warning(f"Invalid signature for {address}")
            
            return is_valid
            
        except Exception as e:
            logger.error(f"Signature verification failed: {e}")
            return False
    
    def generate_jwt_token(
        self,
        wallet_address: str,
        user_data: Optional[Dict] = None
    ) -> str:
        """
        Generate JWT token for authenticated wallet
        
        Args:
            wallet_address: Ethereum address
            user_data: Optional additional user data
            
        Returns:
            JWT token string
        """
        payload = {
            "wallet_address": wallet_address.lower(),
            "iat": datetime.utcnow(),
            "exp": datetime.utcnow() + timedelta(hours=self.token_expiry_hours)
        }
        
        if user_data:
            payload.update(user_data)
        
        token = jwt.encode(payload, self.jwt_secret, algorithm=self.jwt_algorithm)
        
        logger.info(f"Generated JWT token for {wallet_address}")
        return token
    
    def verify_jwt_token(self, token: str) -> Optional[Dict]:
        """
        Verify and decode JWT token
        
        Args:
            token: JWT token string
            
        Returns:
            Decoded token payload or None if invalid
        """
        try:
            payload = jwt.decode(
                token,
                self.jwt_secret,
                algorithms=[self.jwt_algorithm]
            )
            
            return payload
            
        except jwt.ExpiredSignatureError:
            logger.warning("Token expired")
            return None
        except jwt.InvalidTokenError as e:
            logger.error(f"Invalid token: {e}")
            return None
    
    def get_wallet_balance(self, address: str) -> Dict:
        """
        Get wallet balance from blockchain
        
        Args:
            address: Ethereum address
            
        Returns:
            Balance information
        """
        try:
            # Get ETH balance
            balance_wei = self.w3.eth.get_balance(address)
            balance_eth = self.w3.from_wei(balance_wei, 'ether')
            
            return {
                "address": address,
                "balance_eth": float(balance_eth),
                "balance_wei": int(balance_wei),
                "currency": "ETH"
            }
            
        except Exception as e:
            logger.error(f"Failed to get balance: {e}")
            return {
                "address": address,
                "balance_eth": 0.0,
                "balance_wei": 0,
                "error": str(e)
            }


# FastAPI integration
def create_nonce_message(wallet_address: str) -> str:
    """
    Create a nonce message for wallet signature
    
    This message should be signed by the user's wallet to prove ownership
    
    Args:
        wallet_address: Ethereum address
        
    Returns:
        Message to be signed
    """
    timestamp = int(datetime.utcnow().timestamp())
    
    return f"""
Welcome to CantonDEX!

Please sign this message to verify your wallet ownership.

Wallet: {wallet_address}
Timestamp: {timestamp}
Nonce: {os.urandom(16).hex()}

This signature will not trigger any blockchain transaction or cost any gas fees.
""".strip()


# Example usage
async def wallet_login_flow(address: str, signature: str, message: str) -> Dict:
    """
    Complete wallet login flow
    
    1. Verify signature
    2. Generate JWT token
    3. Return authentication result
    
    Args:
        address: Wallet address
        signature: Signed message
        message: Original message
        
    Returns:
        Authentication result with token
    """
    wallet_auth = WalletAuth()
    
    # Verify signature
    is_valid = wallet_auth.verify_signature(address, message, signature)
    
    if not is_valid:
        return {
            "success": False,
            "error": "Invalid signature"
        }
    
    # Generate JWT token
    token = wallet_auth.generate_jwt_token(wallet_address=address)
    
    # Get wallet balance
    balance = wallet_auth.get_wallet_balance(address)
    
    return {
        "success": True,
        "token": token,
        "wallet_address": address,
        "balance": balance,
        "expires_in": wallet_auth.token_expiry_hours * 3600  # seconds
    }
