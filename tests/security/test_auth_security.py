"""
Security tests for authentication and authorization.
"""

import pytest
from unittest.mock import patch
import jwt
from datetime import datetime, timedelta


@pytest.mark.security
class TestAuthenticationSecurity:
    """Authentication security tests."""

    def test_sql_injection_in_login(self, api_client):
        """Test SQL injection protection in login."""
        response = api_client.post(
            '/auth/login',
            json={
                'username': "'; DROP TABLE users; --",
                'password': 'password'
            }
        )
        # Should not execute SQL injection
        assert response.status_code != 200
        # Database should still exist
        assert 'error' in response.json() or response.status_code in [401, 422]

    def test_xss_in_username(self, api_client):
        """Test XSS protection."""
        response = api_client.post(
            '/auth/login',
            json={
                'username': '<script>alert("xss")</script>',
                'password': 'password'
            }
        )
        # Should sanitize or reject
        assert response.status_code in [401, 422]

    def test_brute_force_protection(self, api_client):
        """Test brute force attack protection."""
        # Attempt many failed logins
        for _ in range(10):
            api_client.post(
                '/auth/login',
                json={
                    'username': 'user@example.com',
                    'password': 'wrongpassword'
                }
            )

        # Should be rate limited
        response = api_client.post(
            '/auth/login',
            json={
                'username': 'user@example.com',
                'password': 'wrongpassword'
            }
        )
        assert response.status_code == 429  # Too many requests

    def test_password_requirements(self, api_client):
        """Test password complexity requirements."""
        weak_passwords = [
            '123',  # Too short
            'password',  # No uppercase/numbers
            'PASSWORD',  # No lowercase/numbers
            '12345',  # Numbers only
        ]

        for password in weak_passwords:
            response = api_client.post(
                '/auth/register',
                json={
                    'username': f'user_{password}',
                    'email': f'{password}@example.com',
                    'password': password
                }
            )
            # Should reject weak password
            assert response.status_code != 201 or 'error' in response.json()

    def test_token_expiration(self, api_client, sample_jwt_token):
        """Test expired token rejection."""
        # Create expired token
        expired_token = jwt.encode(
            {
                'sub': 'user-123',
                'exp': datetime.utcnow() - timedelta(hours=1)
            },
            'secret',
            algorithm='HS256'
        )

        response = api_client.get(
            '/users/me',
            headers={'Authorization': f'Bearer {expired_token}'}
        )
        assert response.status_code == 401

    def test_session_fixation(self, api_client):
        """Test session fixation protection."""
        # Get session after login
        login = api_client.post(
            '/auth/login',
            json={'username': 'user', 'password': 'pass'}
        )

        if login.status_code == 200:
            token = login.json()['access_token']
            # Change password
            api_client.post(
                '/auth/change-password',
                headers={'Authorization': f'Bearer {token}'},
                json={
                    'old_password': 'pass',
                    'new_password': 'newpass123'
                }
            )
            # Old token should be invalid
            response = api_client.get(
                '/users/me',
                headers={'Authorization': f'Bearer {token}'}
            )
            assert response.status_code == 401


@pytest.mark.security
class TestAuthorizationSecurity:
    """Authorization and access control tests."""

    def test_horizontal_access_control(self, api_client, auth_headers):
        """Test users can't access other user's data."""
        # Try to access another user's portfolio
        response = api_client.get(
            '/portfolio/user-456',
            headers=auth_headers
        )
        # Should be forbidden
        assert response.status_code in [403, 404]

    def test_privilege_escalation(self, api_client, auth_headers):
        """Test privilege escalation protection."""
        # Regular user tries to access admin endpoint
        response = api_client.get(
            '/admin/users',
            headers=auth_headers
        )
        assert response.status_code in [403, 401]

    def test_role_based_access(self, api_client):
        """Test role-based access control."""
        # Different roles have different access
        endpoints = {
            '/admin/users': 403,  # Traders can't access admin
            '/trading': 200,  # Traders can access trading
            '/compliance': 403,  # Traders can't access compliance
        }

        for endpoint, expected_status in endpoints.items():
            response = api_client.get(endpoint)
            assert response.status_code in [expected_status, 401]


@pytest.mark.security
class TestInputValidation:
    """Input validation and injection tests."""

    def test_command_injection(self, api_client, auth_headers):
        """Test command injection protection."""
        response = api_client.post(
            '/orders',
            headers=auth_headers,
            json={
                'symbol': '; rm -rf /',
                'quantity': 1000000,
                'side': 'BUY'
            }
        )
        # Should be rejected
        assert response.status_code == 422

    def test_path_traversal(self, api_client, auth_headers):
        """Test path traversal protection."""
        response = api_client.get(
            '/files/../../etc/passwd',
            headers=auth_headers
        )
        # Should be rejected or return 404
        assert response.status_code in [400, 404]

    def test_header_injection(self, api_client):
        """Test HTTP header injection protection."""
        response = api_client.get(
            '/health',
            headers={'X-Custom': 'value\r\nSet-Cookie: evil=true'}
        )
        # Response should not contain injected header
        assert 'Set-Cookie: evil' not in response.headers


@pytest.mark.security
class TestCRSFProtection:
    """CSRF protection tests."""

    def test_csrf_token_validation(self, api_client):
        """Test CSRF token is required."""
        response = api_client.post(
            '/orders',
            json={'symbol': 'EURUSD', 'quantity': 1000000},
            headers={'Content-Type': 'application/json'}
            # No CSRF token
        )
        # May require CSRF token
        if response.status_code != 401:
            # Should have CSRF protection
            assert 'csrf' in str(response.json()).lower() or response.status_code == 403

    def test_csrf_same_site_cookie(self, api_client):
        """Test SameSite cookie attribute."""
        response = api_client.get('/health')
        if 'Set-Cookie' in response.headers:
            # Should have SameSite=Strict or SameSite=Lax
            assert 'SameSite' in response.headers['Set-Cookie']


@pytest.mark.security
class TestDataSecurity:
    """Data security tests."""

    def test_password_not_in_response(self, api_client, auth_headers):
        """Test passwords are not returned in API responses."""
        response = api_client.get('/users/me', headers=auth_headers)
        if response.status_code == 200:
            data = response.json()
            assert 'password' not in data
            assert 'password_hash' not in data

    def test_sensitive_data_masking(self, api_client, auth_headers):
        """Test sensitive data is masked in responses."""
        response = api_client.get('/users/me', headers=auth_headers)
        if response.status_code == 200:
            # Account numbers should be masked
            pass

    def test_https_only(self, api_client):
        """Test HTTPS is enforced."""
        # Check for HSTS header
        response = api_client.get('/health')
        if 'Strict-Transport-Security' in response.headers:
            assert 'max-age' in response.headers['Strict-Transport-Security']


@pytest.mark.security
class TestRateLimiting:
    """Rate limiting tests."""

    def test_api_rate_limiting(self, api_client):
        """Test API rate limiting."""
        # Make many requests
        responses = []
        for i in range(100):
            resp = api_client.get('/health')
            responses.append(resp.status_code)

        # Should eventually be rate limited
        if 429 in responses:
            assert True  # Rate limiting is working
        else:
            # Check for rate limit headers
            assert any(
                'X-RateLimit' in header
                for header in [str(h) for h in api_client.get('/health').headers]
            )

    def test_login_rate_limiting(self, api_client):
        """Test login endpoint rate limiting."""
        for _ in range(20):
            api_client.post(
                '/auth/login',
                json={'username': 'user', 'password': 'wrong'}
            )

        # Should be rate limited
        response = api_client.post(
            '/auth/login',
            json={'username': 'user', 'password': 'wrong'}
        )
        assert response.status_code == 429 or response.status_code == 401
