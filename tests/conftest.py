"""
Pytest configuration and shared fixtures for all tests.
"""

import os
import pytest
from typing import Generator
import asyncio
from unittest.mock import Mock, AsyncMock, patch
import json

# Add project root to path
import sys
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'cantondex-backend'))


@pytest.fixture(scope="session")
def event_loop():
    """Create an event loop for async tests."""
    loop = asyncio.get_event_loop_policy().new_event_loop()
    yield loop
    loop.close()


@pytest.fixture
def mock_env():
    """Set up mock environment variables."""
    env_vars = {
        'DATABASE_URL': 'postgresql://test:test@localhost:5432/cantondex_test',
        'REDIS_URL': 'redis://localhost:6379/0',
        'KAFKA_BOOTSTRAP_SERVERS': 'localhost:9092',
        'JWT_SECRET_KEY': 'test-secret-key',
        'ENVIRONMENT': 'test',
        'LOG_LEVEL': 'DEBUG',
    }

    with patch.dict(os.environ, env_vars):
        yield env_vars


@pytest.fixture
def mock_database():
    """Mock database connection."""
    db = Mock()
    db.execute = Mock(return_value=Mock())
    db.commit = Mock()
    db.rollback = Mock()
    db.close = Mock()
    yield db


@pytest.fixture
def mock_redis():
    """Mock Redis client."""
    redis = Mock()
    redis.get = Mock(return_value=None)
    redis.set = Mock(return_value=True)
    redis.delete = Mock(return_value=1)
    redis.exists = Mock(return_value=0)
    redis.close = Mock()
    yield redis


@pytest.fixture
def mock_kafka_producer():
    """Mock Kafka producer."""
    producer = Mock()
    producer.send = AsyncMock(return_value=Mock(topic='test', partition=0, offset=0))
    producer.flush = Mock()
    producer.close = Mock()
    yield producer


@pytest.fixture
def sample_user():
    """Sample user data."""
    return {
        'id': 'user-123',
        'username': 'testuser',
        'email': 'test@example.com',
        'status': 'active',
        'kyc_status': 'verified',
        'roles': ['trader'],
    }


@pytest.fixture
def sample_order():
    """Sample order data."""
    return {
        'id': 'order-123',
        'user_id': 'user-123',
        'symbol': 'EURUSD',
        'side': 'BUY',
        'quantity': 1000000,
        'price': 1.0950,
        'order_type': 'LIMIT',
        'status': 'PENDING',
        'created_at': '2024-01-01T12:00:00Z',
    }


@pytest.fixture
def sample_trade():
    """Sample trade data."""
    return {
        'id': 'trade-123',
        'buyer_id': 'user-123',
        'seller_id': 'user-456',
        'symbol': 'EURUSD',
        'quantity': 1000000,
        'price': 1.0950,
        'status': 'SETTLED',
        'executed_at': '2024-01-01T12:00:00Z',
    }


@pytest.fixture
def sample_position():
    """Sample position data."""
    return {
        'id': 'pos-123',
        'user_id': 'user-123',
        'symbol': 'EURUSD',
        'quantity': 1000000,
        'entry_price': 1.0950,
        'current_price': 1.0955,
        'unrealized_pnl': 50.00,
        'created_at': '2024-01-01T12:00:00Z',
    }


@pytest.fixture
def sample_jwt_token():
    """Sample JWT token."""
    return 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ1c2VyLTEyMyIsImlhdCI6MTcwNDExMDAwMH0.test'


@pytest.fixture
def api_client():
    """FastAPI test client."""
    try:
        from fastapi.testclient import TestClient
        from api_gateway.main import app
        return TestClient(app)
    except ImportError:
        pytest.skip("FastAPI not installed")


@pytest.fixture
def auth_headers(sample_jwt_token):
    """Authorization headers with JWT token."""
    return {
        'Authorization': f'Bearer {sample_jwt_token}',
        'Content-Type': 'application/json',
    }


@pytest.fixture(autouse=True)
def reset_mocks():
    """Reset all mocks before each test."""
    yield
    # Cleanup can be added here if needed


# Pytest configuration
def pytest_configure(config):
    """Configure pytest."""
    config.addinivalue_line(
        "markers", "unit: mark test as a unit test"
    )
    config.addinivalue_line(
        "markers", "integration: mark test as an integration test"
    )
    config.addinivalue_line(
        "markers", "e2e: mark test as an end-to-end test"
    )
    config.addinivalue_line(
        "markers", "performance: mark test as a performance test"
    )
    config.addinivalue_line(
        "markers", "security: mark test as a security test"
    )
    config.addinivalue_line(
        "markers", "slow: mark test as slow"
    )
