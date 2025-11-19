import React, { useState, useEffect } from 'react';
import { tradingAPI, OrderBook as OrderBookData } from '../../services/api';

interface OrderBookProps {
  pair?: string;
  depth?: number;
}

export const OrderBook: React.FC<OrderBookProps> = ({ 
  pair = 'BTC/USDT',
  depth = 10
}) => {
  const [orderBook, setOrderBook] = useState<OrderBookData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch order book data
  const fetchOrderBook = async () => {
    try {
      setError(null);
      const data = await tradingAPI.getOrderBook(pair, depth);
      setOrderBook(data);
      setLoading(false);
    } catch (err: any) {
      console.error('Failed to fetch order book:', err);
      setError(err.message);
      setLoading(false);
    }
  };

  // Initial fetch + polling every 1 second
  useEffect(() => {
    fetchOrderBook();
    
    const interval = setInterval(fetchOrderBook, 1000);
    
    return () => clearInterval(interval);
  }, [pair, depth]);

  if (loading && !orderBook) {
    return (
      <div className="glass-card h-full">
        <h2 className="text-xl font-semibold mb-4">Order Book - {pair}</h2>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="spinner w-8 h-8 mx-auto mb-2"></div>
            <p className="text-gray-400 text-sm">Loading order book...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error && !orderBook) {
    // If 404, show empty order book state instead of error
    if (error.includes('404') || error.includes('not found')) {
      return (
        <div className="glass-card h-full">
          <h2 className="text-xl font-semibold mb-4">Order Book - {pair}</h2>
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <p className="text-gray-400 text-lg mb-2">📊 Empty Order Book</p>
              <p className="text-gray-500 text-sm mb-4">No orders available for {pair}</p>
              <p className="text-gray-600 text-xs">Orders will appear here when traders place them</p>
            </div>
          </div>
        </div>
      );
    }
    return (
      <div className="glass-card h-full">
        <h2 className="text-xl font-semibold mb-4">Order Book - {pair}</h2>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <p className="text-red-400 mb-2">Failed to load order book</p>
            <p className="text-gray-500 text-sm">{error}</p>
            <button 
              onClick={fetchOrderBook}
              className="btn btn-primary mt-4"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  const spread = orderBook && orderBook.asks.length > 0 && orderBook.bids.length > 0
    ? (parseFloat(orderBook.asks[0].price) - parseFloat(orderBook.bids[0].price)).toFixed(2)
    : '0.00';

  return (
    <div className="glass-card h-full flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold">Order Book - {pair}</h2>
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-500">Live</span>
          <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
        </div>
      </div>

      {/* Column Headers */}
      <div className="grid grid-cols-3 gap-2 text-xs text-gray-400 mb-2 px-2">
        <div className="text-left">Price ({pair.split('/')[1]})</div>
        <div className="text-right">Amount ({pair.split('/')[0]})</div>
        <div className="text-right">Total</div>
      </div>

      <div className="flex-1 overflow-y-auto space-y-1">
        {/* Asks (Sell Orders) - Red */}
        <div className="space-y-1">
          {orderBook && orderBook.asks.length > 0 ? (
            orderBook.asks.slice(0, depth).reverse().map((ask, idx) => {
              const total = (parseFloat(ask.price) * parseFloat(ask.quantity)).toFixed(2);
              return (
                <div 
                  key={idx}
                  className="grid grid-cols-3 gap-2 text-sm py-1 px-2 rounded hover:bg-red-500/10 transition-all cursor-pointer relative"
                >
                  <div className="text-red-400 font-mono">{parseFloat(ask.price).toFixed(2)}</div>
                  <div className="text-gray-300 text-right font-mono">{parseFloat(ask.quantity).toFixed(6)}</div>
                  <div className="text-gray-500 text-right font-mono text-xs">{total}</div>
                  {/* Volume bar */}
                  <div 
                    className="absolute inset-0 bg-red-500/5 rounded"
                    style={{ 
                      width: `${Math.min(parseFloat(ask.quantity) * 10, 100)}%`,
                      zIndex: -1 
                    }}
                  />
                </div>
              );
            })
          ) : (
            <div className="text-center text-gray-500 text-sm py-4">
              No sell orders
            </div>
          )}
        </div>

        {/* Spread Indicator */}
        <div className="py-2 px-2 bg-gray-800/50 rounded-lg my-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-gray-400">Spread</span>
            <span className="text-gray-300 font-semibold">{spread} {pair.split('/')[1]}</span>
          </div>
        </div>

        {/* Bids (Buy Orders) - Green */}
        <div className="space-y-1">
          {orderBook && orderBook.bids.length > 0 ? (
            orderBook.bids.slice(0, depth).map((bid, idx) => {
              const total = (parseFloat(bid.price) * parseFloat(bid.quantity)).toFixed(2);
              return (
                <div 
                  key={idx}
                  className="grid grid-cols-3 gap-2 text-sm py-1 px-2 rounded hover:bg-green-500/10 transition-all cursor-pointer relative"
                >
                  <div className="text-green-400 font-mono">{parseFloat(bid.price).toFixed(2)}</div>
                  <div className="text-gray-300 text-right font-mono">{parseFloat(bid.quantity).toFixed(6)}</div>
                  <div className="text-gray-500 text-right font-mono text-xs">{total}</div>
                  {/* Volume bar */}
                  <div 
                    className="absolute inset-0 bg-green-500/5 rounded"
                    style={{ 
                      width: `${Math.min(parseFloat(bid.quantity) * 10, 100)}%`,
                      zIndex: -1 
                    }}
                  />
                </div>
              );
            })
          ) : (
            <div className="text-center text-gray-500 text-sm py-4">
              No buy orders
            </div>
          )}
        </div>
      </div>

      {/* Footer Info */}
      <div className="mt-4 pt-3 border-t border-gray-700 text-xs text-gray-500">
        <div className="flex justify-between">
          <span>Updated: {new Date().toLocaleTimeString()}</span>
          <span>{(orderBook?.bids.length || 0) + (orderBook?.asks.length || 0)} orders</span>
        </div>
      </div>
    </div>
  );
};
