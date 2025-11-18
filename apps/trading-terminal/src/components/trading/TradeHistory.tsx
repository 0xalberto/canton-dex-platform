import React, { useState, useEffect } from 'react';
import { tradingAPI, Trade } from '../../services/api';

interface TradeHistoryProps {
  pair?: string;
  limit?: number;
}

export const TradeHistory: React.FC<TradeHistoryProps> = ({ 
  pair = 'BTC/USDT',
  limit = 20
}) => {
  const [trades, setTrades] = useState<Trade[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch trades
  const fetchTrades = async () => {
    try {
      setError(null);
      const data = await tradingAPI.getTrades(pair, limit);
      setTrades(data);
      setLoading(false);
    } catch (err: any) {
      console.error('Failed to fetch trades:', err);
      setError(err.message);
      setLoading(false);
    }
  };

  // Initial fetch + polling every 2 seconds
  useEffect(() => {
    fetchTrades();
    
    const interval = setInterval(fetchTrades, 2000);
    
    return () => clearInterval(interval);
  }, [pair, limit]);

  // Format timestamp
  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit', 
      second: '2-digit' 
    });
  };

  // Time ago format
  const timeAgo = (timestamp: string) => {
    const now = new Date().getTime();
    const tradeTime = new Date(timestamp).getTime();
    const diff = Math.floor((now - tradeTime) / 1000);
    
    if (diff < 60) return `${diff}s ago`;
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
  };

  if (loading && trades.length === 0) {
    return (
      <div className="glass-card h-full">
        <h2 className="text-xl font-semibold mb-4">Recent Trades - {pair}</h2>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="spinner w-8 h-8 mx-auto mb-2"></div>
            <p className="text-gray-400 text-sm">Loading trades...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="glass-card h-full flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold">Recent Trades - {pair}</h2>
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-500">Live</span>
          <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
        </div>
      </div>

      {error && trades.length === 0 ? (
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <p className="text-red-400 mb-2">Failed to load trades</p>
            <p className="text-gray-500 text-sm">{error}</p>
            <button 
              onClick={fetchTrades}
              className="btn btn-primary mt-4"
            >
              Retry
            </button>
          </div>
        </div>
      ) : trades.length === 0 ? (
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <p className="text-gray-400 text-lg mb-2">No trades yet</p>
            <p className="text-gray-500 text-sm">Place orders to see matched trades here</p>
          </div>
        </div>
      ) : (
        <>
          {/* Column Headers */}
          <div className="grid grid-cols-4 gap-2 text-xs text-gray-400 mb-2 px-2">
            <div className="text-left">Price</div>
            <div className="text-right">Amount</div>
            <div className="text-right">Time</div>
            <div className="text-right">Side</div>
          </div>

          {/* Trades List */}
          <div className="flex-1 overflow-y-auto space-y-1">
            {trades.map((trade, idx) => {
              const isBuy = trade.maker_side === 'SELL'; // If maker was selling, taker was buying
              const sideColor = isBuy ? 'text-green-400' : 'text-red-400';
              const bgColor = isBuy ? 'hover:bg-green-500/5' : 'hover:bg-red-500/5';
              
              return (
                <div 
                  key={trade.trade_id || idx}
                  className={`grid grid-cols-4 gap-2 text-sm py-2 px-2 rounded ${bgColor} transition-all`}
                >
                  <div className={`font-mono ${sideColor}`}>
                    {parseFloat(trade.price).toFixed(2)}
                  </div>
                  <div className="text-gray-300 text-right font-mono">
                    {parseFloat(trade.quantity).toFixed(6)}
                  </div>
                  <div className="text-gray-500 text-right text-xs">
                    {timeAgo(trade.matched_at)}
                  </div>
                  <div className={`text-right text-xs font-semibold ${sideColor}`}>
                    {isBuy ? 'BUY' : 'SELL'}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Footer Info */}
          <div className="mt-4 pt-3 border-t border-gray-700">
            <div className="flex items-center justify-between text-xs text-gray-500">
              <span>Last update: {new Date().toLocaleTimeString()}</span>
              <span>{trades.length} recent trades</span>
            </div>
            {trades.length > 0 && (
              <div className="mt-2 text-xs text-gray-500">
                <span className="text-primary-light">Status:</span> {trades[0].settlement_status}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};
