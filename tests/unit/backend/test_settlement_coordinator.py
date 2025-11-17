"""
Unit tests for Settlement Coordinator service.
"""

import pytest
from unittest.mock import Mock, patch, MagicMock
from datetime import datetime, timedelta
import json


@pytest.mark.unit
class TestTradeSettlement:
    """Trade settlement tests."""

    def test_successful_settlement(self, settlement_service):
        """Test successful trade settlement."""
        trade = {
            'id': 'trade-123',
            'buy_order_id': 'buy-1',
            'sell_order_id': 'sell-1',
            'symbol': 'EURUSD',
            'quantity': 1000000,
            'price': 1.0950,
            'trade_date': '2024-01-15',
            'settlement_date': '2024-01-17',
            'status': 'MATCHED'
        }
        
        with patch('settlement_service.validate_trade') as mock_validate:
            mock_validate.return_value = True
            with patch('settlement_service.process_settlement') as mock_process:
                mock_process.return_value = {'status': 'SETTLED', 'settlement_id': 'settle-123'}
                result = settlement_service.settle_trade(trade)
                assert result['status'] == 'SETTLED'
                assert 'settlement_id' in result

    def test_settlement_validation_failure(self, settlement_service):
        """Test settlement validation failure."""
        invalid_trade = {
            'id': 'trade-123',
            'quantity': 0,  # Invalid quantity
            'price': -1.0950,  # Invalid price
        }
        
        with patch('settlement_service.validate_trade') as mock_validate:
            mock_validate.return_value = False
            result = settlement_service.settle_trade(invalid_trade)
            assert result['status'] == 'FAILED'
            assert 'validation' in result['reason'].lower()

    def test_partial_settlement(self, settlement_service):
        """Test partial trade settlement."""
        trade = {
            'id': 'trade-123',
            'quantity': 2000000,
            'settled_quantity': 1000000,
            'remaining_quantity': 1000000,
            'status': 'PARTIALLY_SETTLED'
        }
        
        with patch('settlement_service.process_partial_settlement') as mock_partial:
            mock_partial.return_value = {
                'status': 'PARTIALLY_SETTLED',
                'settled_quantity': 1500000,
                'remaining_quantity': 500000
            }
            result = settlement_service.settle_trade(trade)
            assert result['status'] == 'PARTIALLY_SETTLED'
            assert result['settled_quantity'] == 1500000

    def test_settlement_retry_mechanism(self, settlement_service):
        """Test settlement retry mechanism."""
        trade = {'id': 'trade-123', 'status': 'MATCHED'}
        
        with patch('settlement_service.process_settlement') as mock_process:
            # First attempt fails, second succeeds
            mock_process.side_effect = [
                Exception('Temporary failure'),
                {'status': 'SETTLED', 'settlement_id': 'settle-123'}
            ]
            result = settlement_service.settle_trade_with_retry(trade, max_retries=2)
            assert result['status'] == 'SETTLED'
            assert mock_process.call_count == 2


@pytest.mark.unit
class TestSettlementInstructions:
    """Settlement instructions tests."""

    def test_generate_settlement_instructions(self, settlement_service):
        """Test generating settlement instructions."""
        trade = {
            'id': 'trade-123',
            'buyer_account': 'ACC-001',
            'seller_account': 'ACC-002',
            'symbol': 'EURUSD',
            'quantity': 1000000,
            'price': 1.0950,
            'settlement_date': '2024-01-17'
        }
        
        instructions = settlement_service.generate_settlement_instructions(trade)
        assert len(instructions) == 2  # One for each party
        assert instructions[0]['account'] == 'ACC-001'
        assert instructions[1]['account'] == 'ACC-002'
        assert instructions[0]['amount'] != instructions[1]['amount']  # Different currencies

    def test_validate_settlement_instructions(self, settlement_service):
        """Test validating settlement instructions."""
        instructions = [
            {
                'account': 'ACC-001',
                'currency': 'EUR',
                'amount': 1000000,
                'direction': 'DEBIT'
            },
            {
                'account': 'ACC-001',
                'currency': 'USD',
                'amount': 1095000,
                'direction': 'CREDIT'
            }
        ]
        
        is_valid = settlement_service.validate_settlement_instructions(instructions)
        assert is_valid is True

    def test_invalid_settlement_instructions(self, settlement_service):
        """Test invalid settlement instructions."""
        invalid_instructions = [
            {
                'account': 'ACC-001',
                'currency': 'EUR',
                'amount': -1000000,  # Invalid negative amount
                'direction': 'DEBIT'
            }
        ]
        
        is_valid = settlement_service.validate_settlement_instructions(invalid_instructions)
        assert is_valid is False

    def test_settlement_instruction_routing(self, settlement_service):
        """Test routing settlement instructions to appropriate systems."""
        instruction = {
            'account': 'ACC-001',
            'currency': 'EUR',
            'amount': 1000000,
            'direction': 'DEBIT',
            'settlement_system': 'TARGET2'
        }
        
        with patch('settlement_service.route_to_settlement_system') as mock_route:
            mock_route.return_value = {'status': 'ROUTED', 'reference': 'REF-123'}
            result = settlement_service.route_instruction(instruction)
            assert result['status'] == 'ROUTED'
            mock_route.assert_called_once_with('TARGET2', instruction)


@pytest.mark.unit
class TestSettlementAccounting:
    """Settlement accounting tests."""

    def test_account_balance_update(self, accounting_service):
        """Test account balance updates during settlement."""
        settlement = {
            'account': 'ACC-001',
            'currency': 'EUR',
            'amount': 1000000,
            'direction': 'DEBIT'
        }
        
        with patch('accounting_service.get_balance') as mock_balance:
            mock_balance.return_value = 5000000  # Current balance
            with patch('accounting_service.update_balance') as mock_update:
                mock_update.return_value = 4000000  # New balance
                result = accounting_service.process_settlement(settlement)
                assert result['new_balance'] == 4000000
                mock_update.assert_called_once()

    def test_insufficient_balance_handling(self, accounting_service):
        """Test handling insufficient balance."""
        settlement = {
            'account': 'ACC-001',
            'currency': 'EUR',
            'amount': 10000000,  # More than available
            'direction': 'DEBIT'
        }
        
        with patch('accounting_service.get_balance') as mock_balance:
            mock_balance.return_value = 5000000  # Insufficient
            result = accounting_service.process_settlement(settlement)
            assert result['status'] == 'FAILED'
            assert 'insufficient balance' in result['reason'].lower()

    def test_multi_currency_settlement(self, accounting_service):
        """Test multi-currency settlement."""
        settlements = [
            {'account': 'ACC-001', 'currency': 'EUR', 'amount': 1000000, 'direction': 'DEBIT'},
            {'account': 'ACC-001', 'currency': 'USD', 'amount': 1095000, 'direction': 'CREDIT'},
        ]
        
        with patch('accounting_service.process_multi_currency') as mock_multi:
            mock_multi.return_value = {'status': 'COMPLETED', 'settlements': 2}
            result = accounting_service.process_multi_currency_settlement(settlements)
            assert result['status'] == 'COMPLETED'
            assert result['settlements'] == 2

    def test_settlement_reconciliation(self, accounting_service):
        """Test settlement reconciliation."""
        trade = {
            'id': 'trade-123',
            'buyer_settlements': [
                {'currency': 'EUR', 'amount': 1000000, 'direction': 'DEBIT'}
            ],
            'seller_settlements': [
                {'currency': 'USD', 'amount': 1095000, 'direction': 'CREDIT'}
            ]
        }
        
        reconciliation = accounting_service.reconcile_settlement(trade)
        assert reconciliation['balanced'] is True
        assert reconciliation['total_debits'] == reconciliation['total_credits']


@pytest.mark.unit
class TestSettlementRisk:
    """Settlement risk management tests."""

    def test_counterparty_risk_assessment(self, settlement_risk):
        """Test counterparty risk assessment."""
        trade = {
            'id': 'trade-123',
            'counterparty_a': 'BANK-001',
            'counterparty_b': 'BANK-002',
            'amount': 10000000,
            'settlement_date': '2024-01-17'
        }
        
        with patch('settlement_risk.get_counterparty_rating') as mock_rating:
            mock_rating.side_effect = ['AAA', 'BBB']  # Different ratings
            risk_assessment = settlement_risk.assess_counterparty_risk(trade)
            assert 'risk_score' in risk_assessment
            assert risk_assessment['risk_level'] in ['LOW', 'MEDIUM', 'HIGH']

    def test_settlement_exposure_calculation(self, settlement_risk):
        """Test settlement exposure calculation."""
        trades = [
            {'counterparty': 'BANK-001', 'amount': 5000000, 'settlement_date': '2024-01-17'},
            {'counterparty': 'BANK-001', 'amount': 3000000, 'settlement_date': '2024-01-17'},
            {'counterparty': 'BANK-002', 'amount': 2000000, 'settlement_date': '2024-01-17'},
        ]
        
        exposure = settlement_risk.calculate_settlement_exposure(trades, '2024-01-17')
        assert exposure['BANK-001'] == 8000000
        assert exposure['BANK-002'] == 2000000

    def test_settlement_limit_monitoring(self, settlement_risk):
        """Test settlement limit monitoring."""
        exposure = {'BANK-001': 15000000}
        
        with patch('settlement_risk.get_settlement_limits') as mock_limits:
            mock_limits.return_value = {'BANK-001': 10000000}
            violations = settlement_risk.check_settlement_limits(exposure)
            assert len(violations) == 1
            assert violations[0]['counterparty'] == 'BANK-001'

    def test_pre_settlement_risk_check(self, settlement_risk):
        """Test pre-settlement risk checks."""
        trade = {
            'id': 'trade-123',
            'counterparty': 'BANK-001',
            'amount': 5000000,
            'settlement_date': '2024-01-17'
        }
        
        with patch('settlement_risk.assess_counterparty_risk') as mock_assess:
            mock_assess.return_value = {'risk_level': 'LOW', 'approved': True}
            result = settlement_risk.pre_settlement_check(trade)
            assert result['approved'] is True


@pytest.mark.unit
class TestSettlementReporting:
    """Settlement reporting tests."""

    def test_daily_settlement_report(self, settlement_reporter):
        """Test daily settlement report generation."""
        date = '2024-01-17'
        
        with patch('settlement_reporter.get_settlements_by_date') as mock_settlements:
            mock_settlements.return_value = [
                {'id': 'settle-1', 'amount': 1000000, 'status': 'COMPLETED'},
                {'id': 'settle-2', 'amount': 2000000, 'status': 'COMPLETED'},
                {'id': 'settle-3', 'amount': 500000, 'status': 'FAILED'},
            ]
            report = settlement_reporter.generate_daily_report(date)
            assert report['total_settlements'] == 3
            assert report['completed_settlements'] == 2
            assert report['failed_settlements'] == 1
            assert report['total_amount'] == 3500000

    def test_settlement_status_report(self, settlement_reporter):
        """Test settlement status report."""
        with patch('settlement_reporter.get_pending_settlements') as mock_pending:
            mock_pending.return_value = [
                {'id': 'settle-1', 'due_date': '2024-01-17', 'amount': 1000000},
                {'id': 'settle-2', 'due_date': '2024-01-18', 'amount': 2000000},
            ]
            report = settlement_reporter.generate_status_report()
            assert len(report['pending_settlements']) == 2
            assert report['total_pending_amount'] == 3000000

    def test_counterparty_settlement_report(self, settlement_reporter):
        """Test counterparty settlement report."""
        counterparty = 'BANK-001'
        
        with patch('settlement_reporter.get_counterparty_settlements') as mock_settlements:
            mock_settlements.return_value = [
                {'amount': 1000000, 'status': 'COMPLETED'},
                {'amount': 2000000, 'status': 'COMPLETED'},
                {'amount': 500000, 'status': 'PENDING'},
            ]
            report = settlement_reporter.generate_counterparty_report(counterparty)
            assert report['counterparty'] == counterparty
            assert report['total_volume'] == 3500000
            assert report['completion_rate'] > 0.5

    def test_settlement_performance_metrics(self, settlement_reporter):
        """Test settlement performance metrics."""
        with patch('settlement_reporter.get_settlement_metrics') as mock_metrics:
            mock_metrics.return_value = {
                'average_settlement_time': 2.5,  # hours
                'success_rate': 0.98,
                'stp_rate': 0.95,  # Straight-through processing
                'exception_rate': 0.02
            }
            metrics = settlement_reporter.get_performance_metrics()
            assert metrics['success_rate'] > 0.95
            assert metrics['average_settlement_time'] < 4.0


@pytest.mark.unit
class TestSettlementIntegration:
    """Settlement system integration tests."""

    def test_swift_integration(self, swift_connector):
        """Test SWIFT message integration."""
        settlement_instruction = {
            'message_type': 'MT103',
            'sender': 'BANKGB2L',
            'receiver': 'BANKUS33',
            'amount': 1000000,
            'currency': 'USD',
            'reference': 'TXN-123'
        }
        
        with patch('swift_connector.send_message') as mock_send:
            mock_send.return_value = {'status': 'SENT', 'reference': 'SWIFT-123'}
            result = swift_connector.send_settlement_instruction(settlement_instruction)
            assert result['status'] == 'SENT'
            assert 'reference' in result

    def test_correspondent_bank_integration(self, correspondent_service):
        """Test correspondent bank integration."""
        settlement = {
            'currency': 'EUR',
            'amount': 1000000,
            'beneficiary_bank': 'DEUTDEFF',
            'correspondent_bank': 'CHASDEFX'
        }
        
        with patch('correspondent_service.route_settlement') as mock_route:
            mock_route.return_value = {'status': 'ROUTED', 'route': 'CORRESPONDENT'}
            result = correspondent_service.process_settlement(settlement)
            assert result['status'] == 'ROUTED'

    def test_central_bank_integration(self, central_bank_service):
        """Test central bank system integration."""
        rtgs_instruction = {
            'system': 'TARGET2',
            'amount': 5000000,
            'currency': 'EUR',
            'sender_bic': 'BANKDEFF',
            'receiver_bic': 'BANKFR2P'
        }
        
        with patch('central_bank_service.submit_rtgs') as mock_rtgs:
            mock_rtgs.return_value = {'status': 'ACCEPTED', 'rtgs_reference': 'RTGS-123'}
            result = central_bank_service.submit_instruction(rtgs_instruction)
            assert result['status'] == 'ACCEPTED'

    def test_nostro_account_management(self, nostro_service):
        """Test nostro account management."""
        account = 'NOSTRO-USD-001'
        
        with patch('nostro_service.get_balance') as mock_balance:
            mock_balance.return_value = 10000000
            with patch('nostro_service.check_funding_requirement') as mock_funding:
                mock_funding.return_value = {'funding_needed': False}
                result = nostro_service.validate_settlement_capacity(account, 5000000)
                assert result['sufficient_funds'] is True


@pytest.mark.unit
class TestErrorHandling:
    """Error handling and edge cases."""

    def test_settlement_timeout_handling(self, settlement_service):
        """Test handling settlement timeouts."""
        trade = {'id': 'trade-123', 'settlement_date': '2024-01-17'}
        
        with patch('settlement_service.process_settlement') as mock_process:
            mock_process.side_effect = TimeoutError('Settlement timeout')
            result = settlement_service.settle_trade(trade)
            assert result['status'] == 'TIMEOUT'
            assert 'timeout' in result['reason'].lower()

    def test_network_failure_recovery(self, settlement_service):
        """Test recovery from network failures."""
        trade = {'id': 'trade-123'}
        
        with patch('settlement_service.process_settlement') as mock_process:
            mock_process.side_effect = [
                ConnectionError('Network error'),
                {'status': 'SETTLED'}
            ]
            result = settlement_service.settle_trade_with_retry(trade)
            assert result['status'] == 'SETTLED'

    def test_invalid_settlement_data(self, settlement_service):
        """Test handling invalid settlement data."""
        invalid_trade = {
            'id': None,  # Invalid ID
            'amount': 'invalid',  # Invalid amount
            'settlement_date': 'invalid-date'  # Invalid date
        }
        
        with pytest.raises(ValueError):
            settlement_service.validate_trade_data(invalid_trade)

    def test_settlement_system_unavailable(self, settlement_service):
        """Test handling settlement system unavailability."""
        trade = {'id': 'trade-123'}
        
        with patch('settlement_service.check_system_availability') as mock_check:
            mock_check.return_value = False
            result = settlement_service.settle_trade(trade)
            assert result['status'] == 'DEFERRED'
            assert 'system unavailable' in result['reason'].lower()

    def test_data_corruption_detection(self, settlement_service):
        """Test detection and handling of data corruption."""
        trade = {'id': 'trade-123', 'checksum': 'invalid'}
        
        with patch('settlement_service.verify_data_integrity') as mock_verify:
            mock_verify.return_value = False
            result = settlement_service.settle_trade(trade)
            assert result['status'] == 'FAILED'
            assert 'data integrity' in result['reason'].lower()