import { useEffect } from 'react'
import { useAccountStore } from '@store/accountStore'
import { useOrderStore } from '@store/orderStore'
import { useMarketStore } from '@store/marketStore'
import { accountService } from '@services/accountService'
import { orderService } from '@services/orderService'
import { marketService } from '@services/marketService'

export default function Dashboard() {
  const account = useAccountStore((state) => state.account)
  const assets = useAccountStore((state) => state.assets)
  const orders = useOrderStore((state) => state.orders)
  const trades = useOrderStore((state) => state.trades)

  useEffect(() => {
    const loadData = async () => {
      try {
        const [accountData, assetsData, openOrders, tradesData, pairs] = await Promise.all([
          accountService.getAccount(),
          accountService.getAssets(),
          orderService.getOpenOrders(),
          orderService.getTrades(undefined, 10, 0),
          marketService.getMarketPairs(),
        ])

        useAccountStore.setState({ account: accountData, assets: assetsData })
        useOrderStore.setState({ orders: openOrders, trades: tradesData.data })
        useMarketStore.setState({ pairs })
      } catch (error) {
        console.error('Failed to load dashboard data:', error)
      }
    }

    loadData()
  }, [])

  const totalPortfolioValue = assets.reduce((sum, asset) => sum + asset.valueUsd, 0)

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Dashboard</h1>

      {/* Portfolio Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="card">
          <p className="text-sm text-gray-400">Portfolio Value</p>
          <p className="text-2xl font-bold">${totalPortfolioValue.toFixed(2)}</p>
        </div>
        <div className="card">
          <p className="text-sm text-gray-400">24h Change</p>
          <p className="text-2xl font-bold text-success-500">+2.45%</p>
        </div>
        <div className="card">
          <p className="text-sm text-gray-400">Open Orders</p>
          <p className="text-2xl font-bold">{orders.length}</p>
        </div>
        <div className="card">
          <p className="text-sm text-gray-400">Total Trades</p>
          <p className="text-2xl font-bold">{trades.length}</p>
        </div>
      </div>

      {/* Assets Overview */}
      <div className="card">
        <div className="card-header">
          <h2 className="text-xl font-semibold">Assets</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-dark-700">
              <tr>
                <th className="text-left py-2">Asset</th>
                <th className="text-right py-2">Balance</th>
                <th className="text-right py-2">Locked</th>
                <th className="text-right py-2">Value USD</th>
              </tr>
            </thead>
            <tbody>
              {assets.slice(0, 5).map((asset) => (
                <tr key={asset.symbol} className="border-b border-dark-700">
                  <td className="py-2">{asset.symbol}</td>
                  <td className="text-right">{asset.balance.toFixed(8)}</td>
                  <td className="text-right">{asset.locked.toFixed(8)}</td>
                  <td className="text-right">${asset.valueUsd.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Open Orders */}
      <div className="card">
        <div className="card-header">
          <h2 className="text-xl font-semibold">Open Orders</h2>
        </div>
        {orders.length === 0 ? (
          <p className="text-gray-400">No open orders</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-dark-700">
                <tr>
                  <th className="text-left py-2">Pair</th>
                  <th className="text-left py-2">Side</th>
                  <th className="text-right py-2">Quantity</th>
                  <th className="text-right py-2">Price</th>
                  <th className="text-left py-2">Status</th>
                </tr>
              </thead>
              <tbody>
                {orders.slice(0, 5).map((order) => (
                  <tr key={order.id} className="border-b border-dark-700">
                    <td className="py-2">{order.pair}</td>
                    <td className={order.side === 'buy' ? 'text-success-500' : 'text-danger-500'}>
                      {order.side.toUpperCase()}
                    </td>
                    <td className="text-right">{order.quantity}</td>
                    <td className="text-right">${order.price?.toFixed(2) || 'Market'}</td>
                    <td className="text-left">{order.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
