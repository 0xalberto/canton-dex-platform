# CantonDEX Testing & Quality Assurance Guide

**Version**: 1.0
**Last Updated**: 2024-11-16
**Owner**: QA Team

## Quick Start

```bash
# Run all tests
pytest tests/ -v

# Run only unit tests
pytest tests/unit -v

# Run with coverage
pytest tests/ --cov=cantondex-backend --cov-report=html

# Run E2E tests
npm run test:e2e

# Run security tests
snyk test
semgrep --config=p/security-audit .
```

## Test Structure

```
tests/
├── conftest.py              # Shared fixtures and configuration
├── requirements-test.txt    # Test dependencies
├── pytest.ini              # Pytest configuration
├── unit/
│   ├── backend/
│   │   ├── test_api_gateway.py        # API Gateway tests
│   │   ├── test_matching_engine.py    # Matching Engine tests
│   │   ├── test_risk_management.py    # Risk Management tests
│   │   ├── test_settlement.py         # Settlement tests
│   │   ├── test_compliance.py         # Compliance tests
│   │   └── test_notification.py       # Notification tests
│   ├── frontend/
│   │   ├── components/                # React component tests
│   │   ├── hooks/                     # Custom hooks tests
│   │   └── utils/                     # Utility function tests
│   └── contracts/
│       └── daml_tests/                # Daml contract tests
├── integration/
│   ├── test_api_integration.py        # API integration tests
│   ├── test_service_integration.py    # Service-to-service tests
│   └── test_database_integration.py   # Database tests
├── e2e/
│   ├── cypress.config.js              # Cypress configuration
│   ├── specs/
│   │   ├── user_flows.cy.js           # User flow tests
│   │   ├── trading_flows.cy.js        # Trading flow tests
│   │   └── admin_flows.cy.js          # Admin flow tests
│   ├── fixtures/                      # Test data
│   └── support/                       # Cypress helpers
├── performance/
│   ├── locustfile.py                  # Load test scenarios
│   ├── stress.py                      # Stress test scenarios
│   └── endurance.py                   # Soak test scenarios
├── security/
│   ├── auth_tests.py                  # Authentication tests
│   ├── injection_tests.py             # SQL injection tests
│   ├── xss_tests.py                   # XSS vulnerability tests
│   └── cse_tests.py                   # CSRF tests
└── compliance/
    ├── kyc_tests.py                   # KYC compliance tests
    ├── aml_tests.py                   # AML compliance tests
    ├── surveillance_tests.py           # Trade surveillance tests
    └── audit_tests.py                 # Audit trail tests
```

## Running Tests

### Unit Tests (Local Development)

```bash
# Install dependencies
pip install -r tests/requirements-test.txt

# Run all unit tests
pytest tests/unit -v

# Run specific test file
pytest tests/unit/backend/test_api_gateway.py -v

# Run specific test class
pytest tests/unit/backend/test_api_gateway.py::TestAuthentication -v

# Run specific test
pytest tests/unit/backend/test_api_gateway.py::TestAuthentication::test_login_with_valid_credentials -v

# Run with coverage
pytest tests/unit --cov=cantondex-backend --cov-report=html --cov-report=term-missing

# Run with debugging
pytest tests/unit -v --pdb  # Drop into debugger on failure

# Run with markers
pytest tests/unit -m "not slow" -v  # Skip slow tests
pytest tests/unit -m "smoke" -v     # Run smoke tests only
```

### Integration Tests

```bash
# Start test infrastructure
docker-compose -f docker-compose.test.yml up -d

# Run integration tests
pytest tests/integration -v

# Run specific service integration
pytest tests/integration/test_api_integration.py -v

# Stop infrastructure
docker-compose -f docker-compose.test.yml down -v
```

### E2E Tests

```bash
# Start the application
npm run dev &
docker-compose up -d

# Run Cypress tests (interactive mode)
npm run test:e2e:open

# Run Cypress tests (headless mode)
npm run test:e2e

# Run specific test file
npx cypress run --spec="tests/e2e/specs/user_flows.cy.js"

# Run with specific browser
npx cypress run --browser chrome
npx cypress run --browser firefox
```

### Performance Tests

```bash
# Load testing with Locust
locust -f tests/performance/locustfile.py --headless -u 100 -r 10 -t 5m

# Stress testing
locust -f tests/performance/stress.py --headless -u 500 -r 50 -t 10m

# Endurance testing (soak test - 24 hours)
locust -f tests/performance/endurance.py --headless -u 50 -r 5 -t 24h
```

### Security Tests

```bash
# Dependency scanning
snyk test --severity-threshold=high

# Static analysis
semgrep --config=p/security-audit .
bandit -r cantondex-backend

# Container scanning
trivy fs .

# Manual penetration testing
# OWASP ZAP
docker run -t owasp/zap2docker-stable zap-baseline.py -t http://localhost:3000

# Burp Suite
# Use burp suite professional for advanced testing
```

### Compliance Tests

```bash
# Run compliance tests
pytest tests/compliance -v

# Run specific compliance suite
pytest tests/compliance/test_kyc_workflow.py -v
```

## Test Coverage

### Current Coverage Targets

| Component | Target | Minimum |
|-----------|--------|---------|
| API Gateway | 85% | 80% |
| Matching Engine | 90% | 85% |
| Risk Management | 80% | 75% |
| Settlement | 85% | 80% |
| Compliance | 85% | 80% |
| Frontend | 80% | 75% |
| Contracts (Daml) | 90% | 85% |

### View Coverage Reports

```bash
# Generate HTML report
pytest tests/ --cov=cantondex-backend --cov-report=html

# Open in browser
open htmlcov/index.html

# View terminal report
pytest tests/ --cov=cantondex-backend --cov-report=term-missing
```

## Writing Tests

### Unit Test Example

```python
import pytest
from unittest.mock import Mock, patch

@pytest.mark.unit
class TestUserService:
    """Tests for user service."""

    def test_create_user(self, sample_user, mock_database):
        """Test creating a user."""
        with patch('users.db', mock_database):
            result = users.create_user(sample_user)
            assert result.id == sample_user['id']
            mock_database.execute.assert_called_once()

    @pytest.mark.parametrize('email', [
        'valid@example.com',
        'another.valid@example.com',
    ])
    def test_validate_email(self, email):
        """Test email validation."""
        assert users.validate_email(email) is True
```

### Integration Test Example

```python
import pytest

@pytest.mark.integration
class TestAPIIntegration:
    """Integration tests for API."""

    def test_create_order_end_to_end(self, api_client, auth_headers):
        """Test creating order through API."""
        response = api_client.post(
            '/orders',
            headers=auth_headers,
            json={
                'symbol': 'EURUSD',
                'side': 'BUY',
                'quantity': 1000000,
                'price': 1.0950,
            }
        )
        assert response.status_code == 201
        assert 'id' in response.json()
```

### E2E Test Example

```javascript
describe('Order Creation Flow', () => {
  it('should create an order successfully', () => {
    cy.login();
    cy.visit('/trading');

    cy.get('[data-testid="symbol-input"]').type('EURUSD');
    cy.get('[data-testid="quantity-input"]').type('1000000');
    cy.get('[data-testid="price-input"]').type('1.0950');
    cy.get('[data-testid="submit-button"]').click();

    cy.get('[data-testid="success-message"]').should('exist');
  });
});
```

## CI/CD Integration

Tests are automatically run on:
- **Every commit**: Unit tests, linting
- **Every PR**: All unit + integration tests
- **Merge to main**: Full test suite including E2E
- **Nightly**: Performance and security tests
- **Weekly**: Extended stress and compliance tests

### GitHub Actions Workflows

```yaml
# View test results
- Push to branch → GitHub Actions runs test.yml
- PR created → Runs linting + unit + integration
- Merge to main → Runs everything + E2E
- View results → Actions tab in GitHub
```

### Local CI Simulation

```bash
# Run same tests as CI locally
./scripts/run-ci-tests.sh

# Run specific CI job
./scripts/run-ci-tests.sh backend-unit-tests
./scripts/run-ci-tests.sh security-scanning
```

## Test Data Management

### Test Fixtures

```python
# Use provided fixtures in conftest.py
def test_order_creation(api_client, auth_headers, sample_order):
    """Test using sample order fixture."""
    response = api_client.post('/orders', headers=auth_headers, json=sample_order)
    assert response.status_code == 201
```

### Generating Test Data

```bash
# Generate test data using factories
python -m scripts.generate_test_data --count 1000

# Reset test database
./scripts/reset-test-db.sh

# Load test snapshot
./scripts/load-test-snapshot.sh production-snapshot-20240101.sql
```

## Debugging Tests

### Print Debug Information

```python
def test_order_flow(api_client, auth_headers):
    """Test with debugging."""
    response = api_client.post('/orders', headers=auth_headers, json=order_data)

    # Print for debugging
    print(f"Status: {response.status_code}")
    print(f"Body: {response.json()}")

    assert response.status_code == 201
```

### Debug with Pytest

```bash
# Drop into debugger on failure
pytest tests/unit -v --pdb

# Drop into debugger on every test
pytest tests/unit -v --pdb-trace

# Print output even on success
pytest tests/unit -v -s

# Print variable details
pytest tests/unit -v --tb=long
```

### Debug Cypress Tests

```bash
# Interactive mode (test runner UI)
npm run test:e2e:open

# Debug in browser
cy.debug()
cy.pause()  # Pause execution

# Print to console
cy.log('My message')
```

## Performance Profiling

```bash
# Profile Rust code
cargo flamegraph --bin matching-engine

# Profile Python code
python -m cProfile -o profile.prof cantondex-backend/api_gateway/main.py

# View profile results
snakeviz profile.prof
```

## Reporting Test Results

### Generate Reports

```bash
# HTML report
pytest tests/ --html=report.html --self-contained-html

# XML report (for CI)
pytest tests/ --junit-xml=junit.xml

# JSON report
pytest tests/ --json-report --json-report-file=report.json
```

### View Coverage in IDE

- **VS Code**: Install Coverage Gutters extension
- **PyCharm**: Run tests with coverage in IDE
- **CI Dashboard**: View on GitHub Actions

## Best Practices

### DO ✅

- Write tests early (TDD)
- Test one thing per test
- Use descriptive test names
- Mock external dependencies
- Keep tests independent
- Use fixtures for common setup
- Run tests locally before pushing
- Review test coverage reports
- Document complex test scenarios
- Use markers (unit, integration, e2e)

### DON'T ❌

- Test implementation details
- Create interdependent tests
- Use hardcoded values
- Skip flaky tests (fix them)
- Ignore test failures
- Write tests without assertions
- Create slow unit tests
- Leave debugger statements
- Skip security tests
- Commit broken tests

## Troubleshooting

### Flaky Tests

```bash
# Re-run flaky test multiple times
pytest tests/unit -v --count=10 -k "test_name"

# Increase timeout for slow environment
pytest tests/ -v --timeout=300
```

### Database Connection Issues

```bash
# Check database is running
docker-compose -f docker-compose.test.yml ps

# Reset database
docker-compose -f docker-compose.test.yml down -v
docker-compose -f docker-compose.test.yml up
```

### Port Already in Use

```bash
# Find process using port
lsof -i :8000

# Kill process
kill -9 <PID>
```

## Resources

- [Pytest Documentation](https://docs.pytest.org/)
- [Cypress Documentation](https://docs.cypress.io/)
- [Daml Testing Guide](https://docs.daml.com/)
- [OWASP Testing Guide](https://owasp.org/www-project-web-security-testing-guide/)
- [Performance Testing Guide](https://www.load-testing.com/)

## Contact

For testing questions or issues, contact the QA team.

---

**Last Updated**: 2024-11-16
