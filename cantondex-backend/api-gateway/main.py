"""
CantonDEX API Gateway
Main entry point for all client requests
"""

import os
import sys
from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import uvicorn
import logging

# Add canton-client to path
sys.path.append(os.path.join(os.path.dirname(__file__), '..', 'canton-client'))
from canton_ledger_client import CantonLedgerClient
from routes_wallet import router as wallet_router

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Create FastAPI app
app = FastAPI(
    title="CantonDEX API Gateway",
    description="Privacy-preserving institutional trading platform",
    version="1.0.0"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify exact origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Canton client
canton_client = CantonLedgerClient(
    ledger_api_host=os.getenv("CANTON_LEDGER_API_HOST", "localhost"),
    ledger_api_port=int(os.getenv("CANTON_LEDGER_API_PORT", "4851"))
)

# Include routers
app.include_router(wallet_router)


@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "service": "CantonDEX API Gateway",
        "version": "1.0.0",
        "status": "operational"
    }


@app.get("/health")
async def health_check():
    """Health check endpoint"""
    canton_healthy = await canton_client.health_check()
    
    return {
        "status": "healthy" if canton_healthy else "degraded",
        "canton_network": "connected" if canton_healthy else "disconnected",
        "services": {
            "api_gateway": "operational",
            "canton_ledger": "connected" if canton_healthy else "disconnected"
        }
    }


@app.get("/status")
async def detailed_status():
    """Detailed status endpoint"""
    canton_healthy = await canton_client.health_check()
    
    return {
        "api_gateway": {
            "status": "operational",
            "version": "1.0.0",
            "environment": os.getenv("ENVIRONMENT", "development")
        },
        "canton_network": {
            "status": "connected" if canton_healthy else "disconnected",
            "ledger_api_host": os.getenv("CANTON_LEDGER_API_HOST", "localhost"),
            "ledger_api_port": os.getenv("CANTON_LEDGER_API_PORT", "4851")
        },
        "database": {
            "status": "operational",
            "host": os.getenv("DB_HOST", "localhost")
        },
        "cache": {
            "status": "operational",
            "host": os.getenv("REDIS_HOST", "localhost")
        }
    }


@app.get("/canton/health")
async def canton_health():
    """Canton Network health check"""
    try:
        is_healthy = await canton_client.health_check()
        
        if is_healthy:
            return {"canton": "healthy", "ledger_api": "accessible"}
        else:
            raise HTTPException(status_code=503, detail="Canton Network unavailable")
    except Exception as e:
        logger.error(f"Canton health check failed: {e}")
        raise HTTPException(status_code=503, detail=str(e))


@app.get("/canton/parties")
async def list_canton_parties():
    """List all parties on Canton ledger"""
    try:
        parties = await canton_client.list_known_parties()
        
        return {
            "parties": [{"party": p.party} for p in parties],
            "count": len(parties)
        }
    except Exception as e:
        logger.error(f"Failed to list parties: {e}")
        raise HTTPException(status_code=500, detail=str(e))


if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=int(os.getenv("API_PORT", "8000")),
        reload=True
    )
