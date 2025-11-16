import { useParams } from 'react-router-dom'
import { useMarketStore } from '@store/marketStore'

export default function MarketPage() {
  const { pair } = useParams<{ pair: string }>()
  const ticker = useMarketStore((state) => state.tickers.get(pair || 'BTC/USD'))

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">{pair || 'BTC/USD'} Market</h1>

      {ticker ? (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="card">
            <p className="text-sm text-gray-400">Current Price</p>
            <p className="text-3xl font-bold">${ticker.lastPrice.toFixed(2)}</p>
          </div>
          <div className="card">
            <p className="text-sm text-gray-400">24h Change</p>
            <p className={`text-3xl font-bold ${ticker.changePercent24h >= 0 ? 'text-success-500' : 'text-danger-500'}`}>
              {ticker.changePercent24h >= 0 ? '+' : ''}{ticker.changePercent24h.toFixed(2)}%
            </p>
          </div>
          <div className="card">
            <p className="text-sm text-gray-400">24h High/Low</p>
            <p className="text-lg font-semibold">
              ${ticker.high24h.toFixed(2)} / ${ticker.low24h.toFixed(2)}
            </p>
          </div>
          <div className="card">
            <p className="text-sm text-gray-400">24h Volume</p>
            <p className="text-lg font-semibold">{ticker.volume24h.toFixed(0)} BTC</p>
          </div>
        </div>
      ) : (
        <div className="card">
          <p className="text-gray-400">Loading market data...</p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="card">
          <div className="card-header">
            <h2 className="text-xl font-semibold">Chart</h2>
          </div>
          <div className="h-64 bg-dark-700 rounded flex items-center justify-center">
            <p className="text-gray-400">TradingView Chart Component</p>
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <h2 className="text-xl font-semibold">Order Book</h2>
          </div>
          <div className="grid grid-cols-2 gap-4 h-64">
            <div>
              <p className="text-sm text-success-500 font-semibold mb-2">Bids</p>
              <div className="space-y-1 text-xs">
                <p>1000 @ 45,250</p>
                <p>800 @ 45,200</p>
                <p>600 @ 45,150</p>
              </div>
            </div>
            <div>
              <p className="text-sm text-danger-500 font-semibold mb-2">Asks</p>
              <div className="space-y-1 text-xs">
                <p>600 @ 45,350</p>
                <p>800 @ 45,400</p>
                <p>1000 @ 45,450</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
