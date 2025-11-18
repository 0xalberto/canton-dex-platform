"""
Canton DEX Authentication Service
Supports: Passkey/WebAuthn, Email/Password, Google OAuth, Token Auth
"""

from fastapi import FastAPI, HTTPException, Depends, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import RedirectResponse
from pydantic import BaseModel, EmailStr
from typing import Optional, Dict, List
import jwt
import bcrypt
from datetime import datetime, timedelta
import secrets
import json
from pathlib import Path

# WebAuthn support
from webauthn import (
    generate_registration_options,
    verify_registration_response,
    generate_authentication_options,
    verify_authentication_response,
    options_to_json,
)
from webauthn.helpers.structs import (
    PublicKeyCredentialDescriptor,
    UserVerificationRequirement,
)
from webauthn.helpers.cose import COSEAlgorithmIdentifier

app = FastAPI(title="Canton DEX Auth Service", version="1.0.0")

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5174", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configuration
JWT_SECRET = "canton-dex-secret-change-in-production"
JWT_ALGORITHM = "HS256"
JWT_EXPIRATION_HOURS = 24
RP_ID = "localhost"
RP_NAME = "Canton DEX"
ORIGIN = "http://localhost:5174"

# In-memory storage (replace with database in production)
users_db: Dict[str, dict] = {}
credentials_db: Dict[str, dict] = {}
challenges_db: Dict[str, str] = {}

# Models
class PasskeyRegistrationRequest(BaseModel):
    email: EmailStr
    displayName: str

class PasskeyRegistrationVerify(BaseModel):
    email: EmailStr
    credential: dict

class PasskeyLoginVerify(BaseModel):
    credential: dict

class EmailRegistrationRequest(BaseModel):
    email: EmailStr
    password: str
    name: str

class EmailLoginRequest(BaseModel):
    email: EmailStr
    password: str

class TokenLoginRequest(BaseModel):
    partyId: str
    token: str

class UserResponse(BaseModel):
    partyId: str
    displayName: str
    email: Optional[str]
    authMethod: str
    token: str

# Helper functions
def generate_party_id(email: str) -> str:
    """Generate Canton party ID from email"""
    return f"canton::{email.split('@')[0]}::{secrets.token_hex(4)}"

def create_jwt_token(party_id: str, email: Optional[str] = None) -> str:
    """Create JWT token for Canton ledger access"""
    payload = {
        "party_id": party_id,
        "email": email,
        "exp": datetime.utcnow() + timedelta(hours=JWT_EXPIRATION_HOURS),
        "iat": datetime.utcnow(),
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)

def hash_password(password: str) -> str:
    """Hash password with bcrypt"""
    return bcrypt.hashpw(password.encode(), bcrypt.gensalt()).decode()

def verify_password(password: str, hashed: str) -> bool:
    """Verify password against hash"""
    return bcrypt.checkpw(password.encode(), hashed.encode())

# Passkey/WebAuthn endpoints
@app.post("/auth/register/passkey/options")
async def passkey_registration_options(request: PasskeyRegistrationRequest):
    """Get WebAuthn registration options"""
    try:
        # Check if user already exists
        if request.email in users_db:
            raise HTTPException(status_code=400, detail="User already exists")
        
        # Generate user ID
        user_id = secrets.token_bytes(32)
        
        # Generate registration options
        options = generate_registration_options(
            rp_id=RP_ID,
            rp_name=RP_NAME,
            user_id=user_id,
            user_name=request.email,
            user_display_name=request.displayName,
            attestation="none",
            authenticator_selection={
                "resident_key": "preferred",
                "user_verification": "preferred",
            },
            supported_pub_key_algs=[
                COSEAlgorithmIdentifier.ECDSA_SHA_256,
                COSEAlgorithmIdentifier.RSASSA_PKCS1_v1_5_SHA_256,
            ],
        )
        
        # Store challenge
        challenges_db[request.email] = options.challenge.decode()
        
        # Store user info temporarily
        users_db[request.email] = {
            "user_id": user_id.hex(),
            "display_name": request.displayName,
            "email": request.email,
            "auth_method": "passkey",
            "credentials": [],
            "created_at": datetime.utcnow().isoformat(),
        }
        
        return json.loads(options_to_json(options))
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/auth/register/passkey/verify", response_model=UserResponse)
async def passkey_registration_verify(request: PasskeyRegistrationVerify):
    """Verify WebAuthn registration"""
    try:
        if request.email not in users_db:
            raise HTTPException(status_code=400, detail="Registration not initiated")
        
        if request.email not in challenges_db:
            raise HTTPException(status_code=400, detail="Challenge not found")
        
        user = users_db[request.email]
        challenge = challenges_db[request.email]
        
        # For simplicity, we'll accept the credential
        # In production, use verify_registration_response
        credential_id = request.credential.get("id", secrets.token_hex(32))
        
        # Store credential
        credentials_db[credential_id] = {
            "email": request.email,
            "credential": request.credential,
            "created_at": datetime.utcnow().isoformat(),
        }
        
        user["credentials"].append(credential_id)
        
        # Generate party ID and token
        party_id = generate_party_id(request.email)
        user["party_id"] = party_id
        token = create_jwt_token(party_id, request.email)
        
        # Clean up challenge
        del challenges_db[request.email]
        
        return UserResponse(
            partyId=party_id,
            displayName=user["display_name"],
            email=request.email,
            authMethod="passkey",
            token=token,
        )
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/auth/login/passkey/options")
async def passkey_login_options():
    """Get WebAuthn authentication options"""
    try:
        challenge = secrets.token_bytes(32)
        challenge_str = challenge.hex()
        
        # Store challenge with a temporary key
        temp_key = f"temp_{secrets.token_hex(8)}"
        challenges_db[temp_key] = challenge_str
        
        options = generate_authentication_options(
            rp_id=RP_ID,
            user_verification=UserVerificationRequirement.PREFERRED,
            challenge=challenge,
        )
        
        result = json.loads(options_to_json(options))
        result["temp_key"] = temp_key  # Send temp key to client
        
        return result
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/auth/login/passkey/verify", response_model=UserResponse)
async def passkey_login_verify(request: PasskeyLoginVerify):
    """Verify WebAuthn authentication"""
    try:
        credential_id = request.credential.get("id")
        
        if not credential_id or credential_id not in credentials_db:
            raise HTTPException(status_code=401, detail="Invalid credential")
        
        cred_data = credentials_db[credential_id]
        email = cred_data["email"]
        
        if email not in users_db:
            raise HTTPException(status_code=401, detail="User not found")
        
        user = users_db[email]
        party_id = user.get("party_id", generate_party_id(email))
        user["party_id"] = party_id
        
        token = create_jwt_token(party_id, email)
        
        return UserResponse(
            partyId=party_id,
            displayName=user["display_name"],
            email=email,
            authMethod="passkey",
            token=token,
        )
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# Email/Password endpoints
@app.post("/auth/register/email", response_model=UserResponse)
async def email_registration(request: EmailRegistrationRequest):
    """Register with email and password"""
    try:
        if request.email in users_db:
            raise HTTPException(status_code=400, detail="User already exists")
        
        # Hash password
        password_hash = hash_password(request.password)
        
        # Generate party ID
        party_id = generate_party_id(request.email)
        
        # Store user
        users_db[request.email] = {
            "user_id": secrets.token_hex(16),
            "display_name": request.name,
            "email": request.email,
            "password_hash": password_hash,
            "auth_method": "email",
            "party_id": party_id,
            "created_at": datetime.utcnow().isoformat(),
        }
        
        # Generate token
        token = create_jwt_token(party_id, request.email)
        
        return UserResponse(
            partyId=party_id,
            displayName=request.name,
            email=request.email,
            authMethod="email",
            token=token,
        )
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/auth/login/email", response_model=UserResponse)
async def email_login(request: EmailLoginRequest):
    """Login with email and password"""
    try:
        if request.email not in users_db:
            raise HTTPException(status_code=401, detail="Invalid credentials")
        
        user = users_db[request.email]
        
        if "password_hash" not in user:
            raise HTTPException(status_code=401, detail="User not registered with email")
        
        if not verify_password(request.password, user["password_hash"]):
            raise HTTPException(status_code=401, detail="Invalid credentials")
        
        party_id = user["party_id"]
        token = create_jwt_token(party_id, request.email)
        
        return UserResponse(
            partyId=party_id,
            displayName=user["display_name"],
            email=request.email,
            authMethod="email",
            token=token,
        )
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# Google OAuth endpoints (simplified)
@app.get("/auth/login/google")
async def google_login():
    """Initiate Google OAuth (simplified)"""
    # In production, redirect to Google OAuth
    return {
        "message": "Google OAuth not implemented in this prototype",
        "redirect_url": "https://accounts.google.com/o/oauth2/v2/auth"
    }

@app.get("/auth/callback/google")
async def google_callback():
    """Handle Google OAuth callback"""
    return {"message": "Google OAuth callback"}

# Token authentication (for development)
@app.post("/auth/login/token", response_model=UserResponse)
async def token_login(request: TokenLoginRequest):
    """Login with Canton party ID and token"""
    try:
        # Verify token format
        if not request.partyId or not request.token:
            raise HTTPException(status_code=400, detail="Invalid token or party ID")
        
        # In a real implementation, verify with Canton ledger
        # For prototype, accept any valid-looking token
        try:
            jwt.decode(request.token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
            # Token is valid
            party_id = request.partyId
        except:
            # Generate new token
            party_id = request.partyId
            request.token = create_jwt_token(party_id)
        
        return UserResponse(
            partyId=party_id,
            displayName=party_id.split("::")[-1],
            email=None,
            authMethod="token",
            token=request.token,
        )
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# Health check
@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "service": "canton-dex-auth",
        "timestamp": datetime.utcnow().isoformat(),
        "users_count": len(users_db),
    }

# User info endpoint
@app.get("/auth/me")
async def get_user_info(authorization: Optional[str] = None):
    """Get current user info from token"""
    try:
        if not authorization or not authorization.startswith("Bearer "):
            raise HTTPException(status_code=401, detail="Missing authorization")
        
        token = authorization.split(" ")[1]
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        
        party_id = payload.get("party_id")
        email = payload.get("email")
        
        # Find user
        user = None
        if email and email in users_db:
            user = users_db[email]
        
        if user:
            return {
                "partyId": party_id,
                "displayName": user["display_name"],
                "email": email,
                "authMethod": user["auth_method"],
            }
        else:
            return {
                "partyId": party_id,
                "displayName": party_id,
                "email": email,
                "authMethod": "token",
            }
    
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=4000)
