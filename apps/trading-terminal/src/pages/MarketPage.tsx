import { useParams } from 'react-router-dom';

export default function MarketPage() {
  const { pair } = useParams<{ pair: string }>();

  return (
    <div className="p-6 space-y-6 fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold gradient-text">{pair?.replace('-', '/')}</h1>
          <p className="text-gray-400 mt-1">Trade with privacy & security</p>
        </div>
        <div className="flex items-center gap-4">
          <div>
            <p className="text-sm text-gray-400">Last Price</p>
            <p className="text-2xl font-bold text-green-400">$45,234.50</p>
          </div>
          <div>
            <p className="text-sm text-gray-400">24h Change</p>
            <p className="text-2xl font-bold text-green-400">+2.4%</p>
          </div>
        </div>
      </div>

      {/* Trading Interface */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Chart Section */}
        <div className="lg:col-span-3 space-y-6">
          <div className="chart-container h-96">
            <div className="h-full flex items-center justify-center">
              <div className="text-center">
                <div className="text-6xl mb-4">📈</div>
                <p className="text-gray-400">TradingView-style chart</p>
              </div>
            </div>
          </div>

          {/* Order Form */}
          <div className="glass-card">
            <div className="grid grid-cols-2 gap-6">
              {/* Buy Form */}
              <div>
                <h3 className="text-lg font-semibold mb-4 text-green-400">Buy {pair?.split('-')[0]}</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm text-gray-400 mb-2">Price</label>
                    <input type="number" className="input-modern" placeholder="45,234.50" />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-400 mb-2">Amount</label>
                    <input type="number" className="input-modern" placeholder="0.5" />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-400 mb-2">Total</label>
                    <input type="number" className="input-modern" placeholder="22,617.25" disabled />
                  </div>
                  <button className="btn bg-green-500/20 hover:bg-green-500/30 text-green-400 w-full">
                    Buy {pair?.split('-')[0]}
                  </button>
                </div>
              </div>

              {/* Sell Form */}
              <div>
                <h3 className="text-lg font-semibold mb-4 text-red-400">Sell {pair?.split('-')[0]}</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm text-gray-400 mb-2">Price</label>
                    <input type="number" className="input-modern" placeholder="45,234.50" />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-400 mb-2">Amount</label>
                    <input type="number" className="input-modern" placeholder="0.5" />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-400 mb-2">Total</label>
                    <input type="number" className="input-modern" placeholder="22,617.25" disabled />
                  </div>
                  <button className="btn bg-red-500/20 hover:bg-red-500/30 text-red-400 w-full">
                    Sell {pair?.split('-')[0]}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Order Book */}
        <div className="glass-card h-fit">
          <h3 className="text-lg font-semibold mb-4">Order Book</h3>
          <div className="space-y-2">
            {/* Asks */}
            {[
              { price: '45,250', amount: '0.234' },
              { price: '45,245', amount: '0.456' },
              { price: '45,240', amount: '0.789' },
            ].map((order, idx) => (
              <div key={idx} className="flex justify-between text-sm py-1">
                <span className="text-red-400">{order.price}</span>
                <span className="text-gray-400">{order.amount}</span>
              </div>
            ))}
            <div className="py-2 text-center font-bold text-green-400">45,235.00</div>
            {/* Bids */}
            {[
              { price: '45,230', amount: '0.567' },
              { price: '45,225', amount: '0.890' },
              { price: '45,220', amount: '1.234' },
            ].map((order, idx) => (
              <div key={idx} className="flex justify-between text-sm py-1">
                <span className="text-green-400">{order.price}</span>
                <span className="text-gray-400">{order.amount}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
