"""
Unit tests for Matching Engine service.
"""

import pytest
from unittest.mock import Mock, patch, MagicMock
from decimal import Decimal
import json


@pytest.mark.unit
class TestOrderMatching:
    """Order matching logic tests."""

    def test_match_simple_orders(self, matching_engine):
        """Test matching two simple orders."""
        buy_order = {
            'id': 'buy-1',
            'symbol': 'EURUSD',
            'side': 'BUY',
            'quantity': 1000000,
            'price': 1.0950,
            'order_type': 'LIMIT',
        }
        sell_order = {
            'id': 'sell-1',
            'symbol': 'EURUSD',
            'side': 'SELL',
            'quantity': 1000000,
            'price': 1.0950,
            'order_type': 'LIMIT',
        }
        
        with patch('matching_engine.process_order') as mock_process:
            mock_process.return_value = {'trade_id': 'trade-1', 'status': 'FILLED'}
            result = matching_engine.match_orders(buy_order, sell_order)
            assert result['status'] == 'FILLED'

    def test_partial_fill(self, matching_engine):
        """Test partial order fill."""
        buy_order = {
            'id': 'buy-1',
            'symbol': 'EURUSD',
            'side': 'BUY',
            'quantity': 2000000,
            'price': 1.0950,
            'order_type': 'LIMIT',
        }
        sell_order = {
            'id': 'sell-1',
            'symbol': 'EURUSD',
            'side': 'SELL',
            'quantity': 1000000,
            'price': 1.0950,
            'order_type': 'LIMIT',
        }
        
        with patch('matching_engine.process_order') as mock_process:
            mock_process.return_value = {
                'trade_id': 'trade-1',
                'status': 'PARTIALLY_FILLED',
                'filled_quantity': 1000000,
                'remaining_quantity': 1000000
            }
            result = matching_engine.match_orders(buy_order, sell_order)
            assert result['status'] == 'PARTIALLY_FILLED'
            assert result['filled_quantity'] == 1000000

    def test_price_priority(self, matching_engine):
        """Test price priority in order matching."""
        orders = [
            {'id': 'buy-1', 'price': 1.0950, 'side': 'BUY'},
            {'id': 'buy-2', 'price': 1.0955, 'side': 'BUY'},  # Higher price
            {'id': 'buy-3', 'price': 1.0945, 'side': 'BUY'},
        ]
        
        with patch('matching_engine.get_order_book') as mock_book:
            mock_book.return_value = {'bids': orders}
            sorted_orders = matching_engine.sort_by_price_priority(orders, 'BUY')
            assert sorted_orders[0]['id'] == 'buy-2'  # Highest price first

    def test_time_priority(self, matching_engine):
        """Test time priority for same price orders."""
        orders = [
            {'id': 'buy-1', 'price': 1.0950, 'timestamp': 1000},
            {'id': 'buy-2', 'price': 1.0950, 'timestamp': 999},  # Earlier
            {'id': 'buy-3', 'price': 1.0950, 'timestamp': 1001},
        ]
        
        sorted_orders = matching_engine.sort_by_time_priority(orders)
        assert sorted_orders[0]['id'] == 'buy-2'  # Earliest first


@pytest.mark.unit
class TestOrderBook:
    """Order book management tests."""

    def test_add_order_to_book(self, order_book):
        """Test adding order to order book."""
        order = {
            'id': 'order-1',
            'symbol': 'EURUSD',
            'side': 'BUY',
            'quantity': 1000000,
            'price': 1.0950,
        }
        
        order_book.add_order(order)
        assert order['id'] in order_book.get_orders('EURUSD', 'BUY')

    def test_remove_order_from_book(self, order_book):
        """Test removing order from order book."""
        order = {
            'id': 'order-1',
            'symbol': 'EURUSD',
            'side': 'BUY',
            'quantity': 1000000,
            'price': 1.0950,
        }
        
        order_book.add_order(order)
        order_book.remove_order('order-1')
        assert order['id'] not in order_book.get_orders('EURUSD', 'BUY')

    def test_get_best_bid(self, order_book):
        """Test getting best bid price."""
        orders = [
            {'id': 'buy-1', 'price': 1.0950, 'side': 'BUY'},
            {'id': 'buy-2', 'price': 1.0955, 'side': 'BUY'},
            {'id': 'buy-3', 'price': 1.0945, 'side': 'BUY'},
        ]
        
        for order in orders:
            order_book.add_order(order)
        
        best_bid = order_book.get_best_bid('EURUSD')
        assert best_bid['price'] == 1.0955

    def test_get_best_ask(self, order_book):
        """Test getting best ask price."""
        orders = [
            {'id': 'sell-1', 'price': 1.0960, 'side': 'SELL'},
            {'id': 'sell-2', 'price': 1.0955, 'side': 'SELL'},
            {'id': 'sell-3', 'price': 1.0965, 'side': 'SELL'},
        ]
        
        for order in orders:
            order_book.add_order(order)
        
        best_ask = order_book.get_best_ask('EURUSD')
        assert best_ask['price'] == 1.0955

    def test_get_market_depth(self, order_book):
        """Test getting market depth."""
        buy_orders = [
            {'id': 'buy-1', 'price': 1.0950, 'quantity': 1000000, 'side': 'BUY'},
            {'id': 'buy-2', 'price': 1.0945, 'quantity': 2000000, 'side': 'BUY'},
        ]
        sell_orders = [
            {'id': 'sell-1', 'price': 1.0955, 'quantity': 1500000, 'side': 'SELL'},
            {'id': 'sell-2', 'price': 1.0960, 'quantity': 1000000, 'side': 'SELL'},
        ]
        
        for order in buy_orders + sell_orders:
            order_book.add_order(order)
        
        depth = order_book.get_market_depth('EURUSD', levels=2)
        assert len(depth['bids']) == 2
        assert len(depth['asks']) == 2


@pytest.mark.unit
class TestTradeExecution:
    """Trade execution tests."""

    def test_execute_trade(self, trade_executor):
        """Test trade execution."""
        trade = {
            'id': 'trade-1',
            'buy_order_id': 'buy-1',
            'sell_order_id': 'sell-1',
            'symbol': 'EURUSD',
            'quantity': 1000000,
            'price': 1.0950,
        }
        
        with patch('trade_executor.publish_trade_event') as mock_publish:
            result = trade_executor.execute_trade(trade)
            assert result['status'] == 'EXECUTED'
            mock_publish.assert_called_once()

    def test_trade_settlement(self, trade_executor):
        """Test trade settlement."""
        trade = {
            'id': 'trade-1',
            'status': 'EXECUTED',
            'settlement_date': '2024-01-15',
        }
        
        with patch('trade_executor.settle_trade') as mock_settle:
            mock_settle.return_value = {'status': 'SETTLED'}
            result = trade_executor.settle_trade(trade)
            assert result['status'] == 'SETTLED'

    def test_failed_trade_execution(self, trade_executor):
        """Test handling failed trade execution."""
        trade = {
            'id': 'trade-1',
            'buy_order_id': 'buy-1',
            'sell_order_id': 'sell-1',
        }
        
        with patch('trade_executor.execute_trade', side_effect=Exception('Settlement failed')):
            with pytest.raises(Exception):
                trade_executor.execute_trade(trade)


@pytest.mark.unit
class TestRiskChecks:
    """Risk management checks tests."""

    def test_position_limit_check(self, risk_manager):
        """Test position limit validation."""
        order = {
            'user_id': 'user-1',
            'symbol': 'EURUSD',
            'quantity': 10000000,  # Large position
            'side': 'BUY',
        }
        
        with patch('risk_manager.get_position_limit', return_value=5000000):
            result = risk_manager.check_position_limit(order)
            assert result['allowed'] is False
            assert 'position limit' in result['reason'].lower()

    def test_margin_requirement_check(self, risk_manager):
        """Test margin requirement validation."""
        order = {
            'user_id': 'user-1',
            'symbol': 'EURUSD',
            'quantity': 1000000,
            'price': 1.0950,
        }
        
        with patch('risk_manager.get_available_margin', return_value=10000):
            with patch('risk_manager.calculate_margin_required', return_value=50000):
                result = risk_manager.check_margin_requirement(order)
                assert result['allowed'] is False

    def test_daily_loss_limit_check(self, risk_manager):
        """Test daily loss limit validation."""
        with patch('risk_manager.get_daily_pnl', return_value=-15000):
            with patch('risk_manager.get_daily_loss_limit', return_value=10000):
                result = risk_manager.check_daily_loss_limit('user-1')
                assert result['allowed'] is False

    def test_concentration_risk_check(self, risk_manager):
        """Test concentration risk validation."""
        order = {
            'user_id': 'user-1',
            'symbol': 'EURUSD',
            'quantity': 1000000,
        }
        
        with patch('risk_manager.get_symbol_exposure', return_value=8000000):
            with patch('risk_manager.get_concentration_limit', return_value=10000000):
                result = risk_manager.check_concentration_risk(order)
                assert result['allowed'] is True


@pytest.mark.unit
class TestPerformance:
    """Performance and latency tests."""

    def test_order_processing_latency(self, matching_engine):
        """Test order processing latency."""
        import time
        
        order = {
            'id': 'order-1',
            'symbol': 'EURUSD',
            'side': 'BUY',
            'quantity': 1000000,
            'price': 1.0950,
        }
        
        start_time = time.time()
        with patch('matching_engine.process_order') as mock_process:
            mock_process.return_value = {'status': 'PROCESSED'}
            matching_engine.process_order(order)
        end_time = time.time()
        
        latency = (end_time - start_time) * 1000  # Convert to milliseconds
        assert latency < 10  # Should process within 10ms

    def test_throughput(self, matching_engine):
        """Test order processing throughput."""
        orders = []
        for i in range(100):
            orders.append({
                'id': f'order-{i}',
                'symbol': 'EURUSD',
                'side': 'BUY' if i % 2 == 0 else 'SELL',
                'quantity': 1000000,
                'price': 1.0950,
            })
        
        import time
        start_time = time.time()
        
        with patch('matching_engine.process_order') as mock_process:
            mock_process.return_value = {'status': 'PROCESSED'}
            for order in orders:
                matching_engine.process_order(order)
        
        end_time = time.time()
        throughput = len(orders) / (end_time - start_time)
        assert throughput > 1000  # Should process >1000 orders/second


@pytest.mark.unit
class TestErrorHandling:
    """Error handling tests."""

    def test_invalid_order_format(self, matching_engine):
        """Test handling invalid order format."""
        invalid_order = {'invalid': 'data'}
        
        with pytest.raises(ValueError):
            matching_engine.validate_order(invalid_order)

    def test_duplicate_order_id(self, order_book):
        """Test handling duplicate order IDs."""
        order = {
            'id': 'order-1',
            'symbol': 'EURUSD',
            'side': 'BUY',
            'quantity': 1000000,
            'price': 1.0950,
        }
        
        order_book.add_order(order)
        
        with pytest.raises(ValueError):
            order_book.add_order(order)  # Same order ID

    def test_order_book_corruption_recovery(self, order_book):
        """Test recovery from order book corruption."""
        with patch('order_book.validate_integrity', return_value=False):
            with patch('order_book.rebuild_from_backup') as mock_rebuild:
                order_book.check_and_recover()
                mock_rebuild.assert_called_once()

    def test_network_failure_handling(self, matching_engine):
        """Test handling network failures."""
        order = {
            'id': 'order-1',
            'symbol': 'EURUSD',
            'side': 'BUY',
            'quantity': 1000000,
            'price': 1.0950,
        }
        
        with patch('matching_engine.publish_event', side_effect=ConnectionError('Network error')):
            # Should handle gracefully and retry
            result = matching_engine.process_order_with_retry(order)
            assert result is not None