import { useEffect, useState } from 'react';
import { NewOrderModal } from '../components/modals/NewOrderModal';
import { OrderBook } from '../components/trading/OrderBook';
import { TradeHistory } from '../components/trading/TradeHistory';
import { tradingAPI } from '../services/api';
import { useAuth } from '../contexts/AuthContext';

interface StatCard {
  title: string;
  value: string;
  change: string;
  trend: 'up' | 'down';
  icon: string;
}

export default function Dashboard() {
  const { user } = useAuth();
  const [newOrderOpen, setNewOrderOpen] = useState(false);
  const [stats, setStats] = useState<StatCard[]>([
    { title: 'Total Volume', value: '$12.5M', change: '+15.3%', trend: 'up', icon: '📊' },
    { title: 'Active Orders', value: '24', change: '+8', trend: 'up', icon: '📝' },
    { title: 'Portfolio Value', value: '$845K', change: '+12.7%', trend: 'up', icon: '💼' },
    { title: 'P&L Today', value: '+$23.4K', change: '+5.2%', trend: 'up', icon: '💰' },
  ]);

  return (
    <div className="p-6 space-y-6 fade-in">
      {/* New Order Modal */}
      <NewOrderModal 
        isOpen={newOrderOpen}
        onClose={() => setNewOrderOpen(false)}
        onSuccess={() => {
          console.log('Order placed successfully!');
        }}
      />

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold gradient-text">Trading Dashboard</h1>
          <p className="text-gray-400 mt-1">Welcome back, ready to trade?</p>
        </div>
        <button 
          className="btn btn-primary"
          onClick={() => setNewOrderOpen(true)}
        >
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

        {/* Order Book - REAL DATA */}
        <OrderBook pair="BTC/USDT" depth={10} />
      </div>

      {/* Recent Trades - REAL DATA */}
      <TradeHistory pair="BTC/USDT" limit={15} />
    </div>
  );
}
