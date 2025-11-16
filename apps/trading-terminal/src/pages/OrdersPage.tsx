import { useOrderStore } from '@store/orderStore'

export default function OrdersPage() {
  const orders = useOrderStore((state) => state.orders)
  const openOrders = orders.filter((o) => o.status === 'open' || o.status === 'partially_filled')

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Orders</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="card">
          <p className="text-sm text-gray-400">Open Orders</p>
          <p className="text-3xl font-bold">{openOrders.length}</p>
        </div>
        <div className="card">
          <p className="text-sm text-gray-400">Total Orders</p>
          <p className="text-3xl font-bold">{orders.length}</p>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <h2 className="text-xl font-semibold">Open Orders</h2>
        </div>
        {openOrders.length === 0 ? (
          <p className="text-gray-400 py-4">No open orders</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-dark-700">
                <tr>
                  <th className="text-left py-2">Pair</th>
                  <th className="text-left py-2">Side</th>
                  <th className="text-left py-2">Type</th>
                  <th className="text-right py-2">Quantity</th>
                  <th className="text-right py-2">Price</th>
                  <th className="text-right py-2">Filled</th>
                  <th className="text-left py-2">Status</th>
                  <th className="text-left py-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {openOrders.map((order) => (
                  <tr key={order.id} className="border-b border-dark-700 hover:bg-dark-700">
                    <td className="py-3">{order.pair}</td>
                    <td
                      className={
                        order.side === 'buy' ? 'text-success-500 font-semibold' : 'text-danger-500 font-semibold'
                      }
                    >
                      {order.side.toUpperCase()}
                    </td>
                    <td>{order.type}</td>
                    <td className="text-right">{order.quantity}</td>
                    <td className="text-right">${order.price?.toFixed(2) || 'Market'}</td>
                    <td className="text-right">{order.filledQuantity}</td>
                    <td>{order.status}</td>
                    <td>
                      <button className="text-danger-500 text-xs hover:text-danger-400">Cancel</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="card">
        <div className="card-header">
          <h2 className="text-xl font-semibold">Order History</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-dark-700">
              <tr>
                <th className="text-left py-2">Pair</th>
                <th className="text-left py-2">Side</th>
                <th className="text-right py-2">Quantity</th>
                <th className="text-right py-2">Price</th>
                <th className="text-left py-2">Status</th>
                <th className="text-left py-2">Created</th>
              </tr>
            </thead>
            <tbody>
              {orders
                .filter((o) => o.status === 'filled' || o.status === 'cancelled')
                .map((order) => (
                  <tr key={order.id} className="border-b border-dark-700 hover:bg-dark-700">
                    <td className="py-3">{order.pair}</td>
                    <td className={order.side === 'buy' ? 'text-success-500' : 'text-danger-500'}>
                      {order.side.toUpperCase()}
                    </td>
                    <td className="text-right">{order.quantity}</td>
                    <td className="text-right">${order.price?.toFixed(2)}</td>
                    <td>{order.status}</td>
                    <td>{new Date(order.createdAt).toLocaleString()}</td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
