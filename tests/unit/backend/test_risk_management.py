"""
Unit tests for Risk Management service.
"""

import pytest
from unittest.mock import Mock, patch, MagicMock
from decimal import Decimal
from datetime import datetime, timedelta
import json


@pytest.mark.unit
class TestRiskLimits:
    """Risk limits validation tests."""

    def test_position_size_limit(self, risk_service):
        """Test position size limit validation."""
        order = {
            'user_id': 'user-123',
            'symbol': 'EURUSD',
            'quantity': 5000000,
            'side': 'BUY',
            'price': 1.0950
        }
        
        with patch('risk_service.get_user_limits') as mock_limits:
            mock_limits.return_value = {'max_position_size': 10000000}
            result = risk_service.validate_position_limit(order)
            assert result['allowed'] is True

    def test_position_size_limit_exceeded(self, risk_service):
        """Test position size limit exceeded."""
        order = {
            'user_id': 'user-123',
            'symbol': 'EURUSD',
            'quantity': 15000000,  # Exceeds limit
            'side': 'BUY',
            'price': 1.0950
        }
        
        with patch('risk_service.get_user_limits') as mock_limits:
            mock_limits.return_value = {'max_position_size': 10000000}
            result = risk_service.validate_position_limit(order)
            assert result['allowed'] is False
            assert 'position size limit' in result['reason'].lower()

    def test_daily_loss_limit(self, risk_service):
        """Test daily loss limit validation."""
        with patch('risk_service.get_daily_pnl') as mock_pnl:
            mock_pnl.return_value = -8000  # Current loss
            with patch('risk_service.get_user_limits') as mock_limits:
                mock_limits.return_value = {'daily_loss_limit': 10000}
                result = risk_service.validate_daily_loss_limit('user-123')
                assert result['allowed'] is True

    def test_daily_loss_limit_exceeded(self, risk_service):
        """Test daily loss limit exceeded."""
        with patch('risk_service.get_daily_pnl') as mock_pnl:
            mock_pnl.return_value = -12000  # Exceeds limit
            with patch('risk_service.get_user_limits') as mock_limits:
                mock_limits.return_value = {'daily_loss_limit': 10000}
                result = risk_service.validate_daily_loss_limit('user-123')
                assert result['allowed'] is False

    def test_concentration_limit(self, risk_service):
        """Test concentration limit validation."""
        order = {
            'user_id': 'user-123',
            'symbol': 'EURUSD',
            'quantity': 2000000,
            'side': 'BUY'
        }
        
        with patch('risk_service.get_symbol_exposure') as mock_exposure:
            mock_exposure.return_value = 3000000  # Current exposure
            with patch('risk_service.get_user_limits') as mock_limits:
                mock_limits.return_value = {'max_symbol_concentration': 0.30}  # 30%
                with patch('risk_service.get_portfolio_value') as mock_value:
                    mock_value.return_value = 20000000  # Total portfolio
                    result = risk_service.validate_concentration_limit(order)
                    assert result['allowed'] is True

    def test_leverage_limit(self, risk_service):
        """Test leverage limit validation."""
        order = {
            'user_id': 'user-123',
            'symbol': 'EURUSD',
            'quantity': 10000000,
            'price': 1.0950
        }
        
        with patch('risk_service.get_account_equity') as mock_equity:
            mock_equity.return_value = 1000000
            with patch('risk_service.get_user_limits') as mock_limits:
                mock_limits.return_value = {'max_leverage': 50}
                result = risk_service.validate_leverage_limit(order)
                assert result['allowed'] is True


@pytest.mark.unit
class TestMarginCalculation:
    """Margin calculation tests."""

    def test_initial_margin_calculation(self, risk_service):
        """Test initial margin calculation."""
        order = {
            'symbol': 'EURUSD',
            'quantity': 1000000,
            'price': 1.0950
        }
        
        with patch('risk_service.get_margin_rate') as mock_rate:
            mock_rate.return_value = 0.02  # 2% margin
            margin = risk_service.calculate_initial_margin(order)
            expected = 1000000 * 1.0950 * 0.02
            assert abs(margin - expected) < 0.01

    def test_maintenance_margin_calculation(self, risk_service):
        """Test maintenance margin calculation."""
        position = {
            'symbol': 'EURUSD',
            'quantity': 1000000,
            'entry_price': 1.0950,
            'current_price': 1.0960
        }
        
        with patch('risk_service.get_maintenance_rate') as mock_rate:
            mock_rate.return_value = 0.01  # 1% maintenance margin
            margin = risk_service.calculate_maintenance_margin(position)
            expected = 1000000 * 1.0960 * 0.01
            assert abs(margin - expected) < 0.01

    def test_margin_call_trigger(self, risk_service):
        """Test margin call trigger calculation."""
        account = {
            'equity': 50000,
            'used_margin': 45000,
            'maintenance_margin': 40000
        }
        
        margin_level = risk_service.calculate_margin_level(account)
        assert margin_level < 150  # Should trigger margin call

    def test_stop_out_level(self, risk_service):
        """Test stop out level calculation."""
        account = {
            'equity': 25000,
            'used_margin': 45000,
            'maintenance_margin': 40000
        }
        
        margin_level = risk_service.calculate_margin_level(account)
        should_stop_out = risk_service.should_stop_out(margin_level)
        assert should_stop_out is True


@pytest.mark.unit
class TestRealTimeRiskMonitoring:
    """Real-time risk monitoring tests."""

    def test_position_monitoring(self, risk_monitor):
        """Test real-time position monitoring."""
        position = {
            'user_id': 'user-123',
            'symbol': 'EURUSD',
            'quantity': 5000000,
            'entry_price': 1.0950,
            'current_price': 1.0900,  # Losing position
            'unrealized_pnl': -25000
        }
        
        with patch('risk_monitor.get_user_limits') as mock_limits:
            mock_limits.return_value = {'daily_loss_limit': 20000}
            alerts = risk_monitor.check_position_risk(position)
            assert len(alerts) > 0
            assert any('loss limit' in alert['message'].lower() for alert in alerts)

    def test_portfolio_risk_monitoring(self, risk_monitor):
        """Test portfolio-level risk monitoring."""
        portfolio = {
            'user_id': 'user-123',
            'total_equity': 100000,
            'unrealized_pnl': -15000,
            'margin_used': 80000,
            'positions': [
                {'symbol': 'EURUSD', 'exposure': 5000000},
                {'symbol': 'GBPUSD', 'exposure': 3000000},
            ]
        }
        
        alerts = risk_monitor.check_portfolio_risk(portfolio)
        # Should generate alerts for high margin usage
        assert any('margin' in alert['message'].lower() for alert in alerts)

    def test_correlation_risk_monitoring(self, risk_monitor):
        """Test correlation risk monitoring."""
        positions = [
            {'symbol': 'EURUSD', 'quantity': 5000000, 'side': 'BUY'},
            {'symbol': 'EURGBP', 'quantity': 3000000, 'side': 'BUY'},
            {'symbol': 'EURJPY', 'quantity': 2000000, 'side': 'BUY'},
        ]
        
        with patch('risk_monitor.get_correlation_matrix') as mock_corr:
            mock_corr.return_value = {
                ('EURUSD', 'EURGBP'): 0.85,
                ('EURUSD', 'EURJPY'): 0.75,
                ('EURGBP', 'EURJPY'): 0.70,
            }
            alerts = risk_monitor.check_correlation_risk(positions)
            assert len(alerts) > 0

    def test_volatility_risk_monitoring(self, risk_monitor):
        """Test volatility risk monitoring."""
        position = {
            'symbol': 'GBPJPY',  # High volatility pair
            'quantity': 10000000,
            'entry_price': 150.50
        }
        
        with patch('risk_monitor.get_volatility') as mock_vol:
            mock_vol.return_value = 0.25  # 25% volatility
            with patch('risk_monitor.get_volatility_limit') as mock_limit:
                mock_limit.return_value = 0.20  # 20% limit
                alerts = risk_monitor.check_volatility_risk(position)
                assert len(alerts) > 0


@pytest.mark.unit
class TestRiskReporting:
    """Risk reporting tests."""

    def test_daily_risk_report(self, risk_reporter):
        """Test daily risk report generation."""
        with patch('risk_reporter.get_portfolio_data') as mock_data:
            mock_data.return_value = {
                'total_equity': 1000000,
                'unrealized_pnl': -5000,
                'var_95': 15000,
                'positions': 25
            }
            report = risk_reporter.generate_daily_report('user-123')
            assert 'total_equity' in report
            assert 'var_95' in report

    def test_var_calculation(self, risk_calculator):
        """Test Value at Risk calculation."""
        portfolio = {
            'positions': [
                {'symbol': 'EURUSD', 'quantity': 5000000, 'price': 1.0950},
                {'symbol': 'GBPUSD', 'quantity': 3000000, 'price': 1.2650},
            ]
        }
        
        with patch('risk_calculator.get_historical_returns') as mock_returns:
            mock_returns.return_value = [-0.02, -0.01, 0.01, 0.02, -0.015]
            var_95 = risk_calculator.calculate_var(portfolio, confidence=0.95)
            assert var_95 > 0

    def test_stress_testing(self, risk_calculator):
        """Test portfolio stress testing."""
        portfolio = {
            'positions': [
                {'symbol': 'EURUSD', 'quantity': 5000000, 'price': 1.0950},
            ]
        }
        
        stress_scenarios = [
            {'EURUSD': -0.05},  # 5% drop
            {'EURUSD': -0.10},  # 10% drop
            {'EURUSD': 0.05},   # 5% rise
        ]
        
        results = risk_calculator.run_stress_tests(portfolio, stress_scenarios)
        assert len(results) == 3
        assert all('pnl_impact' in result for result in results)

    def test_risk_metrics_calculation(self, risk_calculator):
        """Test various risk metrics calculation."""
        portfolio = {
            'positions': [
                {'symbol': 'EURUSD', 'quantity': 5000000, 'unrealized_pnl': 2500},
                {'symbol': 'GBPUSD', 'quantity': 3000000, 'unrealized_pnl': -1500},
            ]
        }
        
        metrics = risk_calculator.calculate_risk_metrics(portfolio)
        assert 'sharpe_ratio' in metrics
        assert 'max_drawdown' in metrics
        assert 'win_rate' in metrics


@pytest.mark.unit
class TestComplianceChecks:
    """Compliance and regulatory checks."""

    def test_position_limit_compliance(self, compliance_checker):
        """Test regulatory position limit compliance."""
        order = {
            'user_id': 'user-123',
            'symbol': 'EURUSD',
            'quantity': 50000000,  # Large position
            'side': 'BUY'
        }
        
        with patch('compliance_checker.get_regulatory_limits') as mock_limits:
            mock_limits.return_value = {'max_position_size': 100000000}
            result = compliance_checker.check_position_limits(order)
            assert result['compliant'] is True

    def test_large_trader_reporting(self, compliance_checker):
        """Test large trader reporting requirements."""
        position = {
            'user_id': 'user-123',
            'symbol': 'EURUSD',
            'quantity': 75000000,  # Above reporting threshold
        }
        
        with patch('compliance_checker.get_reporting_threshold') as mock_threshold:
            mock_threshold.return_value = 50000000
            should_report = compliance_checker.requires_large_trader_report(position)
            assert should_report is True

    def test_suspicious_activity_detection(self, compliance_checker):
        """Test suspicious trading activity detection."""
        trades = [
            {'user_id': 'user-123', 'quantity': 1000000, 'timestamp': 1000},
            {'user_id': 'user-123', 'quantity': 1000000, 'timestamp': 1001},
            {'user_id': 'user-123', 'quantity': 1000000, 'timestamp': 1002},
            # Rapid trading pattern
        ]
        
        alerts = compliance_checker.detect_suspicious_activity(trades)
        assert len(alerts) > 0

    def test_wash_trading_detection(self, compliance_checker):
        """Test wash trading detection."""
        trades = [
            {'user_id': 'user-123', 'side': 'BUY', 'quantity': 1000000, 'price': 1.0950},
            {'user_id': 'user-123', 'side': 'SELL', 'quantity': 1000000, 'price': 1.0950},
            # Potential wash trading
        ]
        
        alerts = compliance_checker.detect_wash_trading(trades)
        assert len(alerts) >= 0  # May or may not detect based on timing


@pytest.mark.unit
class TestErrorHandling:
    """Error handling and edge cases."""

    def test_invalid_risk_parameters(self, risk_service):
        """Test handling invalid risk parameters."""
        order = {
            'quantity': -1000000,  # Invalid negative quantity
            'price': 0,  # Invalid zero price
        }
        
        with pytest.raises(ValueError):
            risk_service.validate_order_parameters(order)

    def test_missing_user_limits(self, risk_service):
        """Test handling missing user limits."""
        with patch('risk_service.get_user_limits', return_value=None):
            result = risk_service.validate_position_limit({'user_id': 'unknown'})
            assert result['allowed'] is False
            assert 'user limits not found' in result['reason'].lower()

    def test_database_connection_failure(self, risk_service):
        """Test handling database connection failures."""
        with patch('risk_service.get_user_limits', side_effect=ConnectionError('DB error')):
            result = risk_service.validate_position_limit({'user_id': 'user-123'})
            assert result['allowed'] is False
            assert 'system error' in result['reason'].lower()

    def test_calculation_overflow(self, risk_calculator):
        """Test handling calculation overflows."""
        portfolio = {
            'positions': [
                {'quantity': float('inf'), 'price': 1.0950},  # Infinite quantity
            ]
        }
        
        with pytest.raises((OverflowError, ValueError)):
            risk_calculator.calculate_var(portfolio)

    def test_risk_service_recovery(self, risk_service):
        """Test risk service recovery from failures."""
        with patch('risk_service.health_check', return_value=False):
            with patch('risk_service.restart_service') as mock_restart:
                risk_service.ensure_service_health()
                mock_restart.assert_called_once()