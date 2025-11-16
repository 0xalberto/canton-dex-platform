"""
Configuration module
Settings for FastAPI application loaded from environment
"""

from pydantic_settings import BaseSettings
from typing import List

class Settings(BaseSettings):
    """Application settings"""
    
    # Application
    APP_NAME: str = "Canton DEX Trading API"
    VERSION: str = "1.0.0"
    DEBUG: bool = False
    ENVIRONMENT: str = "production"
    API_HOST: str = "0.0.0.0"
    API_PORT: int = 8000
    LOG_LEVEL: str = "INFO"
    
    # CORS
    CORS_ORIGINS: List[str] = [
        "http://localhost:3000",
        "http://localhost:8080",
        "https://trading.cantondex.local",
    ]
    ALLOWED_HOSTS: List[str] = ["*"]
    
    # Database
    DATABASE_URL: str = "postgresql+asyncpg://user:password@localhost:5432/cantondex"
    DATABASE_POOL_SIZE: int = 20
    DATABASE_POOL_OVERFLOW: int = 10
    DATABASE_POOL_RECYCLE: int = 3600
    
    # Cache
    REDIS_URL: str = "redis://localhost:6379/0"
    CACHE_TTL: int = 300  # 5 minutes
    
    # JWT
    JWT_SECRET_KEY: str = "your-secret-key-here-change-in-production"
    JWT_ALGORITHM: str = "HS256"
    JWT_ACCESS_TOKEN_EXPIRE_MINUTES: int = 15
    JWT_REFRESH_TOKEN_EXPIRE_DAYS: int = 7
    
    # Keycloak OAuth2
    KEYCLOAK_URL: str = "http://localhost:8180/auth"
    KEYCLOAK_REALM: str = "cantondex"
    KEYCLOAK_CLIENT_ID: str = "cantondex-api"
    KEYCLOAK_CLIENT_SECRET: str = "your-client-secret"
    
    # Canton
    CANTON_JSON_API_URL: str = "http://localhost:5000"
    CANTON_JSON_API_USER: str = "api-user"
    CANTON_JSON_API_PASSWORD: str = "api-password"
    
    # Rate Limiting
    RATE_LIMIT_ENABLED: bool = True
    RATE_LIMIT_DEFAULT: str = "100/minute"
    RATE_LIMIT_STRICT: str = "10/minute"  # For sensitive endpoints
    
    # Matching Engine
    MATCHING_ENGINE_URL: str = "http://localhost:50051"  # gRPC
    MATCHING_ENGINE_TIMEOUT: int = 5  # seconds
    
    # Settlement Service
    SETTLEMENT_SERVICE_URL: str = "http://localhost:8001"
    SETTLEMENT_SERVICE_TIMEOUT: int = 10
    
    # Risk Management
    RISK_SERVICE_URL: str = "http://localhost:8002"
    RISK_SERVICE_TIMEOUT: int = 5
    
    # Compliance Service
    COMPLIANCE_SERVICE_URL: str = "http://localhost:8003"
    COMPLIANCE_SERVICE_TIMEOUT: int = 5
    
    # Kafka
    KAFKA_BOOTSTRAP_SERVERS: str = "localhost:9092"
    KAFKA_TOPIC_ORDERS: str = "cantondex.orders"
    KAFKA_TOPIC_TRADES: str = "cantondex.trades"
    KAFKA_TOPIC_SETTLEMENTS: str = "cantondex.settlements"
    KAFKA_TOPIC_ALERTS: str = "cantondex.alerts"
    
    class Config:
        env_file = ".env"
        case_sensitive = True

settings = Settings()
