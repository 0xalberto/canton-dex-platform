import { useState, useEffect } from 'react';
import { DepositModal } from '../components/modals/DepositModal';
import { WithdrawModal } from '../components/modals/WithdrawModal';
import { useAuth } from '../contexts/AuthContext';
import { tradingAPI, Balance } from '../services/api';

export default function PortfolioPage() {
  const { user } = useAuth();
  const [depositModalOpen, setDepositModalOpen] = useState(false);
  const [withdrawModalOpen, setWithdrawModalOpen] = useState(false);
  const [balances, setBalances] = useState<Balance[]>([]);
  const [loading, setLoading] = useState(true);

  // Asset prices for display (in real app, fetch from market data API)
  const assetPrices: Record<string, number> = {
    'BTC': 92500,
    'ETH': 2834,
    'SOL': 108.5,
    'USDT': 1,
    'tTBILL': 10000,
  };

  // Load balances from API
  const loadBalances = async () => {
    if (!user?.partyId) return;

    try {
      setLoading(true);
      const data = await tradingAPI.getBalances(user.partyId);
      setBalances(data);
    } catch (error) {
      console.error('Failed to load balances:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBalances();
    // Refresh every 5 seconds
    const interval = setInterval(loadBalances, 5000);
    return () => clearInterval(interval);
  }, [user]);

  // Calculate total portfolio value
  const totalValue = balances.reduce((sum, balance) => {
    const price = assetPrices[balance.asset_symbol] || 0;
    const amount = parseFloat(balance.available) + parseFloat(balance.locked);
    return sum + (price * amount);
  }, 0);

  const handleModalSuccess = () => {
    loadBalances(); // Refresh balances after deposit/withdraw
  };

  return (
    <div className="p-6 space-y-6 fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold gradient-text">Portfolio</h1>
          <p className="text-gray-400 mt-1">Real-time balances from Canton DEX</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => setDepositModalOpen(true)}
            className="btn bg-green-500/20 hover:bg-green-500/30 text-green-400"
          >
            <span className="mr-2">+</span> Deposit
          </button>
          <button
            onClick={() => setWithdrawModalOpen(true)}
            className="btn bg-red-500/20 hover:bg-red-500/30 text-red-400"
          >
            <span className="mr-2">-</span> Withdraw
          </button>
        </div>
      </div>

      {/* Modals */}
      <DepositModal
        isOpen={depositModalOpen}
        onClose={() => setDepositModalOpen(false)}
        onSuccess={handleModalSuccess}
      />
      <WithdrawModal
        isOpen={withdrawModalOpen}
        onClose={() => setWithdrawModalOpen(false)}
        onSuccess={handleModalSuccess}
      />

      {/* Total Value Card */}
      <div className="glass-card">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-gray-400 text-sm mb-1">Total Portfolio Value</p>
            <p className="text-4xl font-bold gradient-text">
              {loading ? '...' : `$${totalValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
            </p>
          </div>
          <div className="text-right">
            <p className="text-gray-400 text-sm mb-1">Status</p>
            <p className="text-green-400 font-semibold">✓ Live</p>
          </div>
        </div>
      </div>

      {/* Balances Table */}
      <div className="glass-card">
        <h2 className="text-xl font-semibold mb-4">Asset Balances</h2>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="text-left text-sm text-gray-400 border-b border-gray-700">
                <th className="pb-3">Asset</th>
                <th className="pb-3 text-right">Available</th>
                <th className="pb-3 text-right">Locked (Orders)</th>
                <th className="pb-3 text-right">Total</th>
                <th className="pb-3 text-right">Value (USD)</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-gray-400">
                    <div className="flex items-center justify-center">
                      <div className="spinner w-6 h-6 mr-2"></div>
                      Loading balances from database...
                    </div>
                  </td>
                </tr>
              ) : balances.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center">
                    <div className="text-gray-400">
                      <p className="text-lg mb-2">No assets yet</p>
                      <p className="text-sm">Deposit funds to start trading!</p>
                    </div>
                  </td>
                </tr>
              ) : (
                balances.map((balance) => {
                  const price = assetPrices[balance.asset_symbol] || 0;
                  const totalQty = parseFloat(balance.available) + parseFloat(balance.locked);
                  const usdValue = price * totalQty;

                  return (
                    <tr key={balance.asset_symbol} className="border-b border-gray-700/50 hover:bg-gray-800/30 transition-colors">
                      <td className="py-4">
                        <div className="flex items-center">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-r from-primary to-secondary mr-3 flex items-center justify-center text-sm font-bold">
                            {balance.asset_symbol.charAt(0)}
                          </div>
                          <div>
                            <p className="font-semibold text-lg">{balance.asset_symbol}</p>
                            <p className="text-xs text-gray-500">${price.toLocaleString()}/unit</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 text-right">
                        <p className="font-mono text-sm text-green-400">
                          {parseFloat(balance.available).toFixed(6)}
                        </p>
                      </td>
                      <td className="py-4 text-right">
                        <p className="font-mono text-sm text-yellow-400">
                          {parseFloat(balance.locked).toFixed(6)}
                        </p>
                      </td>
                      <td className="py-4 text-right">
                        <p className="font-mono font-semibold">
                          {totalQty.toFixed(6)}
                        </p>
                      </td>
                      <td className="py-4 text-right">
                        <p className="font-semibold text-lg">
                          ${usdValue.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                        </p>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Legend */}
        {!loading && balances.length > 0 && (
          <div className="mt-4 pt-4 border-t border-gray-700">
            <div className="flex gap-6 text-xs text-gray-400">
              <div className="flex items-center">
                <span className="w-3 h-3 bg-green-400 rounded-full mr-2"></span>
                Available: Can be traded or withdrawn
              </div>
              <div className="flex items-center">
                <span className="w-3 h-3 bg-yellow-400 rounded-full mr-2"></span>
                Locked: Reserved for open orders
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Info Card */}
      <div className="glass-card bg-primary/10 border border-primary/20">
        <div className="flex items-start gap-3">
          <div className="text-2xl">ℹ️</div>
          <div>
            <p className="font-semibold text-primary-light mb-2">Real-Time Data</p>
            <p className="text-sm text-gray-300">
              Your balances are fetched directly from the PostgreSQL-backed trading service.
              All deposits, withdrawals, and trades are executed atomically using real database transactions.
            </p>
            <p className="text-xs text-gray-400 mt-2">
              Backend: FastAPI + PostgreSQL | Matching Engine: Price-Time Priority | Updates: Every 5s
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
