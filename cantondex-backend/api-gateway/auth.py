"""
Authentication and Authorization module
JWT tokens, OAuth2 integration, RBAC implementation
"""

from datetime import datetime, timedelta
from typing import Optional, List
from enum import Enum

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthCredentials
import jwt
from pydantic import BaseModel
import httpx

from config import settings

# Security scheme
security = HTTPBearer()

class Role(str, Enum):
    """User roles"""
    ADMIN = "admin"
    TRADER = "trader"
    VIEWER = "viewer"
    REGULATOR = "regulator"

class TokenType(str, Enum):
    """Token types"""
    ACCESS = "access"
    REFRESH = "refresh"

class TokenPayload(BaseModel):
    """JWT token payload"""
    sub: str  # user_id
    user_email: str
    roles: List[Role]
    token_type: TokenType
    iat: datetime
    exp: datetime

class UserInfo(BaseModel):
    """User information"""
    user_id: str
    email: str
    roles: List[Role]
    name: str
    kyc_status: str  # pending, approved, rejected
    
def create_access_token(
    user_id: str,
    email: str,
    roles: List[Role],
    expires_delta: Optional[timedelta] = None,
) -> str:
    """
    Create JWT access token
    
    Args:
        user_id: User ID
        email: User email
        roles: User roles
        expires_delta: Token expiration time
    
    Returns:
        Encoded JWT token
    """
    if expires_delta is None:
        expires_delta = timedelta(
            minutes=settings.JWT_ACCESS_TOKEN_EXPIRE_MINUTES
        )
    
    expire = datetime.utcnow() + expires_delta
    payload = {
        "sub": user_id,
        "user_email": email,
        "roles": [r.value for r in roles],
        "token_type": TokenType.ACCESS.value,
        "iat": datetime.utcnow(),
        "exp": expire,
    }
    
    token = jwt.encode(
        payload,
        settings.JWT_SECRET_KEY,
        algorithm=settings.JWT_ALGORITHM,
    )
    
    return token

def create_refresh_token(user_id: str) -> str:
    """
    Create JWT refresh token
    
    Args:
        user_id: User ID
    
    Returns:
        Encoded JWT token
    """
    expire = datetime.utcnow() + timedelta(
        days=settings.JWT_REFRESH_TOKEN_EXPIRE_DAYS
    )
    payload = {
        "sub": user_id,
        "token_type": TokenType.REFRESH.value,
        "exp": expire,
    }
    
    token = jwt.encode(
        payload,
        settings.JWT_SECRET_KEY,
        algorithm=settings.JWT_ALGORITHM,
    )
    
    return token

async def verify_token(credentials: HTTPAuthCredentials) -> TokenPayload:
    """
    Verify and decode JWT token
    
    Args:
        credentials: HTTP bearer credentials
    
    Returns:
        Token payload
    
    Raises:
        HTTPException: If token is invalid
    """
    try:
        payload = jwt.decode(
            credentials.credentials,
            settings.JWT_SECRET_KEY,
            algorithms=[settings.JWT_ALGORITHM],
        )
        
        token_payload = TokenPayload(
            sub=payload["sub"],
            user_email=payload["user_email"],
            roles=[Role(r) for r in payload["roles"]],
            token_type=TokenType(payload["token_type"]),
            iat=datetime.fromtimestamp(payload["iat"]),
            exp=datetime.fromtimestamp(payload["exp"]),
        )
        
        return token_payload
        
    except jwt.ExpiredSignatureError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token expired",
        )
    except jwt.InvalidTokenError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token",
        )

async def get_current_user(
    credentials: HTTPAuthCredentials = Depends(security),
) -> UserInfo:
    """
    Get current authenticated user
    
    Args:
        credentials: HTTP bearer credentials
    
    Returns:
        User information
    """
    token_payload = await verify_token(credentials)
    
    # In production, fetch from database
    return UserInfo(
        user_id=token_payload.sub,
        email=token_payload.user_email,
        roles=token_payload.roles,
        name="User Name",
        kyc_status="approved",
    )

def require_role(*allowed_roles: Role):
    """
    Dependency to require specific roles
    
    Args:
        allowed_roles: List of allowed roles
    
    Returns:
        Dependency function
    """
    async def role_checker(user: UserInfo = Depends(get_current_user)):
        if not any(role in user.roles for role in allowed_roles):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Insufficient permissions",
            )
        return user
    
    return role_checker

async def introspect_keycloak_token(token: str) -> dict:
    """
    Introspect token with Keycloak
    
    Args:
        token: JWT token to introspect
    
    Returns:
        Token introspection response
    """
    url = f"{settings.KEYCLOAK_URL}/realms/{settings.KEYCLOAK_REALM}/protocol/openid-connect/token/introspect"
    
    async with httpx.AsyncClient() as client:
        response = await client.post(
            url,
            auth=(settings.KEYCLOAK_CLIENT_ID, settings.KEYCLOAK_CLIENT_SECRET),
            data={
                "token": token,
            },
        )
        
        return response.json()

async def oauth_login(username: str, password: str) -> dict:
    """
    Login via Keycloak OAuth2
    
    Args:
        username: Username
        password: Password
    
    Returns:
        Token response
    """
    url = f"{settings.KEYCLOAK_URL}/realms/{settings.KEYCLOAK_REALM}/protocol/openid-connect/token"
    
    async with httpx.AsyncClient() as client:
        response = await client.post(
            url,
            data={
                "client_id": settings.KEYCLOAK_CLIENT_ID,
                "client_secret": settings.KEYCLOAK_CLIENT_SECRET,
                "username": username,
                "password": password,
                "grant_type": "password",
            },
        )
        
        return response.json()
