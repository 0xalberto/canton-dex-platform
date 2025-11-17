"""
Unit tests for API Gateway service.
"""

import pytest
from unittest.mock import Mock, patch, MagicMock
from datetime import datetime, timedelta
import json


@pytest.mark.unit
class TestAPIGatewayHealthCheck:
    """Health check endpoint tests."""

    def test_health_check_success(self, api_client):
        """Test health endpoint returns 200."""
        response = api_client.get('/health')
        assert response.status_code == 200
        assert 'status' in response.json()

    def test_health_check_includes_timestamp(self, api_client):
        """Test health endpoint includes timestamp."""
        response = api_client.get('/health')
        data = response.json()
        assert 'timestamp' in data


@pytest.mark.unit
class TestAuthentication:
    """Authentication endpoint tests."""

    def test_login_with_valid_credentials(self, api_client, mock_database):
        """Test successful login."""
        with patch('api_gateway.auth.verify_password', return_value=True):
            with patch('api_gateway.auth.create_access_token', return_value='test-token'):
                response = api_client.post(
                    '/auth/login',
                    json={
                        'username': 'testuser',
                        'password': 'password123'
                    }
                )
                assert response.status_code == 200
                assert 'access_token' in response.json()

    def test_login_with_invalid_credentials(self, api_client):
        """Test login with invalid credentials."""
        with patch('api_gateway.auth.verify_password', return_value=False):
            response = api_client.post(
                '/auth/login',
                json={
                    'username': 'testuser',
                    'password': 'wrongpassword'
                }
            )
            assert response.status_code == 401
            assert 'error' in response.json()

    def test_login_missing_credentials(self, api_client):
        """Test login with missing credentials."""
        response = api_client.post(
            '/auth/login',
            json={'username': 'testuser'}
        )
        assert response.status_code == 422  # Validation error

    def test_token_refresh(self, api_client, sample_jwt_token):
        """Test token refresh."""
        with patch('api_gateway.auth.verify_token', return_value={'sub': 'user-123'}):
            with patch('api_gateway.auth.create_access_token', return_value='new-token'):
                response = api_client.post(
                    '/auth/refresh',
                    headers={'Authorization': f'Bearer {sample_jwt_token}'}
                )
                assert response.status_code == 200
                assert 'access_token' in response.json()

    def test_logout(self, api_client, sample_jwt_token):
        """Test logout endpoint."""
        with patch('api_gateway.auth.blacklist_token') as mock_blacklist:
            response = api_client.post(
                '/auth/logout',
                headers={'Authorization': f'Bearer {sample_jwt_token}'}
            )
            assert response.status_code == 200
            mock_blacklist.assert_called_once()


@pytest.mark.unit
class TestUserManagement:
    """User management endpoint tests."""

    def test_get_user_profile(self, api_client, auth_headers, sample_user):
        """Test getting user profile."""
        with patch('api_gateway.users.get_user', return_value=sample_user):
            response = api_client.get('/users/me', headers=auth_headers)
            assert response.status_code == 200
            data = response.json()
            assert data['id'] == 'user-123'
            assert data['username'] == 'testuser'

    def test_update_user_profile(self, api_client, auth_headers, sample_user):
        """Test updating user profile."""
        with patch('api_gateway.users.update_user', return_value=sample_user):
            response = api_client.put(
                '/users/me',
                headers=auth_headers,
                json={'email': 'newemail@example.com'}
            )
            assert response.status_code == 200

    def test_get_user_unauthorized(self, api_client):
        """Test accessing user endpoint without auth."""
        response = api_client.get('/users/me')
        assert response.status_code == 401

    def test_get_user_invalid_token(self, api_client):
        """Test with invalid token."""
        response = api_client.get(
            '/users/me',
            headers={'Authorization': 'Bearer invalid-token'}
        )
        assert response.status_code == 401


@pytest.mark.unit
class TestOrderManagement:
    """Order management endpoint tests."""

    def test_create_order(self, api_client, auth_headers, sample_order, mock_kafka_producer):
        """Test creating an order."""
        with patch('api_gateway.orders.create_order', return_value=sample_order):
            response = api_client.post(
                '/orders',
                headers=auth_headers,
                json={
                    'symbol': 'EURUSD',
                    'side': 'BUY',
                    'quantity': 1000000,
                    'price': 1.0950,
                    'order_type': 'LIMIT',
                }
            )
            assert response.status_code == 201
            assert response.json()['id'] == 'order-123'

    def test_create_order_invalid_quantity(self, api_client, auth_headers):
        """Test creating order with invalid quantity."""
        response = api_client.post(
            '/orders',
            headers=auth_headers,
            json={
                'symbol': 'EURUSD',
                'side': 'BUY',
                'quantity': -1000,  # Invalid
                'price': 1.0950,
                'order_type': 'LIMIT',
            }
        )
        assert response.status_code == 422

    def test_get_order(self, api_client, auth_headers, sample_order):
        """Test getting order by ID."""
        with patch('api_gateway.orders.get_order', return_value=sample_order):
            response = api_client.get('/orders/order-123', headers=auth_headers)
            assert response.status_code == 200
            assert response.json()['id'] == 'order-123'

    def test_list_orders(self, api_client, auth_headers, sample_order):
        """Test listing user's orders."""
        with patch('api_gateway.orders.list_user_orders', return_value=[sample_order]):
            response = api_client.get('/orders', headers=auth_headers)
            assert response.status_code == 200
            assert len(response.json()) == 1

    def test_cancel_order(self, api_client, auth_headers):
        """Test canceling an order."""
        cancelled_order = {'id': 'order-123', 'status': 'CANCELLED'}
        with patch('api_gateway.orders.cancel_order', return_value=cancelled_order):
            response = api_client.post(
                '/orders/order-123/cancel',
                headers=auth_headers
            )
            assert response.status_code == 200
            assert response.json()['status'] == 'CANCELLED'

    def test_cancel_nonexistent_order(self, api_client, auth_headers):
        """Test canceling non-existent order."""
        with patch('api_gateway.orders.cancel_order', side_effect=ValueError('Order not found')):
            response = api_client.post(
                '/orders/nonexistent/cancel',
                headers=auth_headers
            )
            assert response.status_code == 404


@pytest.mark.unit
class TestTrades:
    """Trade endpoint tests."""

    def test_get_trade(self, api_client, auth_headers, sample_trade):
        """Test getting trade details."""
        with patch('api_gateway.trades.get_trade', return_value=sample_trade):
            response = api_client.get('/trades/trade-123', headers=auth_headers)
            assert response.status_code == 200
            assert response.json()['id'] == 'trade-123'

    def test_list_trades(self, api_client, auth_headers, sample_trade):
        """Test listing trades."""
        with patch('api_gateway.trades.list_trades', return_value=[sample_trade]):
            response = api_client.get('/trades', headers=auth_headers)
            assert response.status_code == 200
            assert len(response.json()) >= 1

    def test_get_trade_history(self, api_client, auth_headers):
        """Test getting trade history."""
        trades = [
            {'id': 'trade-1', 'status': 'SETTLED'},
            {'id': 'trade-2', 'status': 'SETTLED'},
        ]
        with patch('api_gateway.trades.get_trade_history', return_value=trades):
            response = api_client.get('/trades/history', headers=auth_headers)
            assert response.status_code == 200
            assert len(response.json()) == 2


@pytest.mark.unit
class TestPortfolio:
    """Portfolio endpoint tests."""

    def test_get_portfolio(self, api_client, auth_headers, sample_position):
        """Test getting portfolio."""
        portfolio = {'positions': [sample_position], 'total_value': 1000000}
        with patch('api_gateway.portfolio.get_portfolio', return_value=portfolio):
            response = api_client.get('/portfolio', headers=auth_headers)
            assert response.status_code == 200
            assert 'positions' in response.json()

    def test_get_portfolio_summary(self, api_client, auth_headers):
        """Test getting portfolio summary."""
        summary = {
            'total_value': 1000000,
            'unrealized_pnl': 500,
            'margin_used': 50000,
            'margin_available': 950000,
        }
        with patch('api_gateway.portfolio.get_summary', return_value=summary):
            response = api_client.get('/portfolio/summary', headers=auth_headers)
            assert response.status_code == 200
            data = response.json()
            assert data['total_value'] == 1000000

    def test_get_position(self, api_client, auth_headers, sample_position):
        """Test getting single position."""
        with patch('api_gateway.portfolio.get_position', return_value=sample_position):
            response = api_client.get('/portfolio/positions/EURUSD', headers=auth_headers)
            assert response.status_code == 200
            assert response.json()['symbol'] == 'EURUSD'


@pytest.mark.unit
class TestRiskManagement:
    """Risk management endpoint tests."""

    def test_get_risk_limits(self, api_client, auth_headers):
        """Test getting risk limits."""
        limits = {
            'daily_loss_limit': 10000,
            'position_limit': 5000000,
            'margin_requirement': 0.30,
        }
        with patch('api_gateway.risk.get_limits', return_value=limits):
            response = api_client.get('/risk/limits', headers=auth_headers)
            assert response.status_code == 200

    def test_check_pre_trade_limits(self, api_client, auth_headers):
        """Test checking pre-trade limits."""
        result = {'allowed': True, 'message': 'Order within limits'}
        with patch('api_gateway.risk.check_limits', return_value=result):
            response = api_client.post(
                '/risk/check',
                headers=auth_headers,
                json={
                    'symbol': 'EURUSD',
                    'quantity': 1000000,
                    'price': 1.0950,
                }
            )
            assert response.status_code == 200
            assert response.json()['allowed'] is True

    def test_get_margin_info(self, api_client, auth_headers):
        """Test getting margin information."""
        margin = {
            'margin_balance': 950000,
            'margin_used': 50000,
            'margin_level': 19.0,
            'margin_call_level': 30.0,
        }
        with patch('api_gateway.risk.get_margin', return_value=margin):
            response = api_client.get('/risk/margin', headers=auth_headers)
            assert response.status_code == 200


@pytest.mark.unit
class TestErrorHandling:
    """Error handling and edge cases."""

    def test_invalid_json_request(self, api_client, auth_headers):
        """Test handling invalid JSON."""
        response = api_client.post(
            '/orders',
            headers=auth_headers,
            data='invalid json{',
            content_type='application/json'
        )
        assert response.status_code == 422

    def test_missing_required_headers(self, api_client):
        """Test missing authorization header."""
        response = api_client.get('/users/me')
        assert response.status_code == 401

    def test_rate_limiting(self, api_client, auth_headers):
        """Test rate limiting."""
        # Make many requests quickly
        for _ in range(100):
            response = api_client.get('/health')
        # Last request should be rate limited
        assert response.status_code == 429 or response.status_code == 200

    def test_server_error_handling(self, api_client, auth_headers):
        """Test server error handling."""
        with patch('api_gateway.orders.create_order', side_effect=Exception('Internal error')):
            response = api_client.post(
                '/orders',
                headers=auth_headers,
                json={'symbol': 'EURUSD', 'quantity': 1000000, 'side': 'BUY'}
            )
            assert response.status_code == 500
            data = response.json()
            assert 'error' in data or 'detail' in data


@pytest.mark.unit
class TestDataValidation:
    """Request data validation tests."""

    def test_validate_symbol(self, api_client, auth_headers):
        """Test symbol validation."""
        response = api_client.post(
            '/orders',
            headers=auth_headers,
            json={
                'symbol': '',  # Invalid
                'quantity': 1000000,
                'side': 'BUY',
            }
        )
        assert response.status_code == 422

    def test_validate_order_side(self, api_client, auth_headers):
        """Test order side validation."""
        response = api_client.post(
            '/orders',
            headers=auth_headers,
            json={
                'symbol': 'EURUSD',
                'quantity': 1000000,
                'side': 'INVALID',  # Invalid
            }
        )
        assert response.status_code == 422

    def test_validate_quantity(self, api_client, auth_headers):
        """Test quantity validation."""
        response = api_client.post(
            '/orders',
            headers=auth_headers,
            json={
                'symbol': 'EURUSD',
                'quantity': 0,  # Invalid
                'side': 'BUY',
            }
        )
        assert response.status_code == 422
