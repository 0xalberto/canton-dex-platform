"""
Wallet Authentication Routes
"""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
import logging

from wallet_integration import WalletAuth, create_nonce_message, wallet_login_flow

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/wallet", tags=["Wallet"])

wallet_auth = WalletAuth()


class NonceRequest(BaseModel):
    """Request nonce for wallet signature"""
    wallet_address: str


class LoginRequest(BaseModel):
    """Wallet login with signature"""
    wallet_address: str
    signature: str
    message: str


@router.post("/nonce")
async def get_nonce(request: NonceRequest):
    """
    Get a nonce message to sign with wallet
    
    Frontend flow:
    1. User clicks "Connect Wallet"
    2. Frontend calls this endpoint to get nonce message
    3. User signs message with MetaMask/WalletConnect
    4. Frontend sends signature to /wallet/login
    """
    try:
        message = create_nonce_message(request.wallet_address)
        
        return {
            "wallet_address": request.wallet_address,
            "message": message,
            "instructions": "Please sign this message with your wallet"
        }
    except Exception as e:
        logger.error(f"Failed to create nonce: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/login")
async def wallet_login(request: LoginRequest):
    """
    Login with wallet signature
    
    Verifies the signature and returns JWT token
    """
    try:
        result = await wallet_login_flow(
            address=request.wallet_address,
            signature=request.signature,
            message=request.message
        )
        
        if not result["success"]:
            raise HTTPException(status_code=401, detail=result.get("error"))
        
        return result
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Wallet login failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/balance/{wallet_address}")
async def get_wallet_balance(wallet_address: str):
    """Get wallet balance from blockchain"""
    try:
        balance = wallet_auth.get_wallet_balance(wallet_address)
        return balance
    except Exception as e:
        logger.error(f"Failed to get balance: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/verify-token")
async def verify_token(token: str):
    """Verify JWT token"""
    try:
        payload = wallet_auth.verify_jwt_token(token)
        
        if not payload:
            raise HTTPException(status_code=401, detail="Invalid or expired token")
        
        return {
            "valid": True,
            "wallet_address": payload.get("wallet_address"),
            "expires_at": payload.get("exp")
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Token verification failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))
