import { useEffect, useState } from 'react';

interface StatCard {
  title: string;
  value: string;
  change: string;
  trend: 'up' | 'down';
  icon: string;
}

export default function Dashboard() {
  const [stats, setStats] = useState<StatCard[]>([
    { title: 'Total Volume', value: '$12.5M', change: '+15.3%', trend: 'up', icon: '📊' },
    { title: 'Active Orders', value: '24', change: '+8', trend: 'up', icon: '📝' },
    { title: 'Portfolio Value', value: '$845K', change: '+12.7%', trend: 'up', icon: '💼' },
    { title: 'P&L Today', value: '+$23.4K', change: '+5.2%', trend: 'up', icon: '💰' },
  ]);

  const recentTrades = [
    { pair: 'BTC/USDT', side: 'BUY', price: '45,234', amount: '0.5', time: '2m ago', status: 'filled' },
    { pair: 'ETH/USDT', side: 'SELL', price: '2,834', amount: '2.0', time: '5m ago', status: 'filled' },
    { pair: 'SOL/USDT', side: 'BUY', price: '108.5', amount: '10', time: '8m ago', status: 'pending' },
  ];

  return (
    <div className="p-6 space-y-6 fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold gradient-text">Trading Dashboard</h1>
          <p className="text-gray-400 mt-1">Welcome back, ready to trade?</p>
        </div>
        <button className="btn btn-primary">
          <span className="mr-2">+</span> New Order
        </button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, idx) => (
          <div
            key={idx}
            className="glass-card card-3d"
            style={{ animationDelay: `${idx * 0.1}s` }}
          >
            <div className="flex items-start justify-between mb-4">
              <div className="text-4xl">{stat.icon}</div>
              <span className={`badge ${stat.trend === 'up' ? 'badge-success' : 'badge-danger'}`}>
                {stat.change}
              </span>
            </div>
            <h3 className="text-gray-400 text-sm mb-1">{stat.title}</h3>
            <p className="text-2xl font-bold">{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Chart */}
        <div className="lg:col-span-2 chart-container" style={{ height: '400px' }}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">Price Chart</h2>
            <div className="flex gap-2">
              {['1H', '1D', '1W', '1M'].map((tf) => (
                <button
                  key={tf}
                  className="px-3 py-1 rounded-lg glass text-sm hover:bg-primary/20 transition-all"
                >
                  {tf}
                </button>
              ))}
            </div>
          </div>
          <div className="h-full flex items-center justify-center">
            <div className="text-center">
              <div className="text-6xl mb-4">📈</div>
              <p className="text-gray-400">Interactive chart will render here</p>
              <p className="text-sm text-gray-500 mt-2">Using lightweight-charts library</p>
            </div>
          </div>
        </div>

        {/* Order Book Preview */}
        <div className="glass-card">
          <h2 className="text-xl font-semibold mb-4">Order Book</h2>
          <div className="space-y-2">
            {/* Asks */}
            <div className="space-y-1">
              {[
                { price: '45,250', amount: '0.234', total: '10,596' },
                { price: '45,245', amount: '0.456', total: '20,632' },
                { price: '45,240', amount: '0.789', total: '35,694' },
              ].map((order, idx) => (
                <div key={idx} className="flex justify-between text-sm py-1 px-2 rounded hover:bg-red-500/10 transition-all">
                  <span className="text-red-400">{order.price}</span>
                  <span className="text-gray-400">{order.amount}</span>
                  <span className="text-gray-500">{order.total}</span>
                </div>
              ))}
            </div>
            
            {/* Spread */}
            <div className="py-2 px-3 glass rounded-lg text-center">
              <span className="text-green-400 font-semibold">45,235.00</span>
              <span className="text-gray-500 text-xs ml-2">Spread: 0.03%</span>
            </div>
            
            {/* Bids */}
            <div className="space-y-1">
              {[
                { price: '45,230', amount: '0.567', total: '25,635' },
                { price: '45,225', amount: '0.890', total: '40,250' },
                { price: '45,220', amount: '1.234', total: '55,821' },
              ].map((order, idx) => (
                <div key={idx} className="flex justify-between text-sm py-1 px-2 rounded hover:bg-green-500/10 transition-all">
                  <span className="text-green-400">{order.price}</span>
                  <span className="text-gray-400">{order.amount}</span>
                  <span className="text-gray-500">{order.total}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Recent Trades */}
      <div className="glass-card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">Recent Trades</h2>
          <button className="text-primary-light text-sm hover:text-primary transition-colors">
            View All →
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="table-modern">
            <thead>
              <tr>
                <th>Pair</th>
                <th>Side</th>
                <th>Price</th>
                <th>Amount</th>
                <th>Time</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {recentTrades.map((trade, idx) => (
                <tr key={idx}>
                  <td className="font-semibold">{trade.pair}</td>
                  <td>
                    <span className={`badge ${trade.side === 'BUY' ? 'badge-success' : 'badge-danger'}`}>
                      {trade.side}
                    </span>
                  </td>
                  <td className="font-mono">${trade.price}</td>
                  <td className="font-mono">{trade.amount}</td>
                  <td className="text-gray-400 text-sm">{trade.time}</td>
                  <td>
                    <span className={`badge ${trade.status === 'filled' ? 'badge-success' : 'badge-warning'}`}>
                      {trade.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
