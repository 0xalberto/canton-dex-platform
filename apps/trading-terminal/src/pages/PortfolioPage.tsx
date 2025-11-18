import { useState } from 'react';
import { DepositModal } from '../components/modals/DepositModal';
import { WithdrawModal } from '../components/modals/WithdrawModal';
import { usePortfolioStore } from '../store/portfolioStore';

export default function PortfolioPage() {
  const [depositModalOpen, setDepositModalOpen] = useState(false);
  const [withdrawModalOpen, setWithdrawModalOpen] = useState(false);

  const { assets, totalValue, transactions } = usePortfolioStore();
  const assetsList = Object.values(assets);

  return (
    <div className="p-6 space-y-6 fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold gradient-text">Portfolio</h1>
          <p className="text-gray-400 mt-1">Manage your digital assets</p>
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
        onSuccess={() => {
          console.log('Deposit successful!');
        }}
      />
      <WithdrawModal 
        isOpen={withdrawModalOpen} 
        onClose={() => setWithdrawModalOpen(false)}
        onSuccess={() => {
          console.log('Withdrawal successful!');
        }}
      />

      {/* Total Value Card */}
      <div className="glass-card card-3d relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full blur-3xl"></div>
        <div className="relative">
          <p className="text-gray-400 mb-2">Total Portfolio Value</p>
          <h2 className="text-5xl font-bold gradient-text mb-4">
            ${totalValue.toLocaleString()}
          </h2>
          <div className="flex items-center gap-6">
            <div className="flex items-center">
              <span className="badge badge-success text-lg px-4 py-2">
                +15.7% Today
              </span>
            </div>
            <div className="text-sm text-gray-400">
              <span>24h Volume: </span>
              <span className="text-white font-semibold">$12.5M</span>
            </div>
          </div>
        </div>
      </div>

      {/* Assets Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {assetsList.map((asset, idx) => (
          <div
            key={asset.symbol}
            className="glass-card card-3d"
            style={{ animationDelay: `${idx * 0.1}s` }}
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-xl pulse-glow">
                  {asset.symbol.substring(0, 1)}
                </div>
                <div>
                  <h3 className="font-bold">{asset.symbol}</h3>
                  <p className="text-xs text-gray-400">{asset.name}</p>
                </div>
              </div>
            </div>
            <div className="space-y-2">
              <div>
                <p className="text-gray-400 text-sm">Balance</p>
                <p className="text-xl font-bold">{asset.balance}</p>
              </div>
              <div>
                <p className="text-gray-400 text-sm">Value</p>
                <p className="text-xl font-bold">{asset.value}</p>
              </div>
              <div className={`badge ${
                asset.trend === 'up' ? 'badge-success' : 
                asset.trend === 'down' ? 'badge-danger' : 
                'badge-warning'
              }`}>
                {asset.change}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Asset Allocation Chart */}
      <div className="glass-card">
        <h2 className="text-xl font-semibold mb-4">Asset Allocation</h2>
        <div className="h-64 flex items-center justify-center">
          <div className="text-center">
            <div className="text-6xl mb-4">📊</div>
            <p className="text-gray-400">Asset allocation pie chart</p>
            <p className="text-sm text-gray-500 mt-2">Using recharts or chart.js</p>
          </div>
        </div>
      </div>

      {/* Recent Transactions */}
      <div className="glass-card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">Recent Transactions</h2>
          <button className="text-primary-light text-sm hover:text-primary transition-colors">
            View All →
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="table-modern">
            <thead>
              <tr>
                <th>Asset</th>
                <th>Type</th>
                <th>Amount</th>
                <th>Time</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {transactions.slice(0, 10).length > 0 ? (
                transactions.slice(0, 10).map((tx) => {
                  const timeAgo = Math.floor((Date.now() - tx.timestamp) / 1000 / 60);
                  const timeStr = timeAgo < 60 ? `${timeAgo}m ago` : timeAgo < 1440 ? `${Math.floor(timeAgo / 60)}h ago` : `${Math.floor(timeAgo / 1440)}d ago`;
                  return (
                    <tr key={tx.id}>
                      <td className="font-semibold">{tx.asset}</td>
                      <td>
                        <span className={`badge ${
                          tx.type === 'Deposit' ? 'badge-success' : 
                          tx.type === 'Withdraw' ? 'badge-danger' : 
                          'badge-warning'
                        }`}>
                          {tx.type}
                        </span>
                      </td>
                      <td className={`font-mono ${tx.amount.startsWith('+') ? 'text-green-400' : 'text-red-400'}`}>
                        {tx.amount}
                      </td>
                      <td className="text-gray-400 text-sm">{timeStr}</td>
                      <td>
                        <span className={`badge ${
                          tx.status === 'Completed' ? 'badge-success' : 'badge-warning'
                        }`}>
                          {tx.status}
                        </span>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={5} className="text-center text-gray-400 py-8">
                    No transactions yet. Make your first deposit!
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
