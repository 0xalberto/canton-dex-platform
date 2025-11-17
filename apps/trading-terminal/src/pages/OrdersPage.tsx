export default function OrdersPage() {
  const orders = [
    { id: '1', pair: 'BTC/USDT', type: 'Limit', side: 'BUY', price: '45,200', amount: '0.5', filled: '100%', status: 'Filled', time: '10m ago' },
    { id: '2', pair: 'ETH/USDT', type: 'Market', side: 'SELL', price: '2,850', amount: '2.0', filled: '100%', status: 'Filled', time: '25m ago' },
    { id: '3', pair: 'SOL/USDT', type: 'Limit', side: 'BUY', price: '108.0', amount: '10', filled: '45%', status: 'Partial', time: '1h ago' },
    { id: '4', pair: 'BTC/USDT', type: 'Stop', side: 'SELL', price: '44,000', amount: '0.3', filled: '0%', status: 'Open', time: '2h ago' },
  ];

  return (
    <div className="p-6 space-y-6 fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold gradient-text">Orders</h1>
          <p className="text-gray-400 mt-1">Manage your trading orders</p>
        </div>
        <button className="btn btn-primary">
          <span className="mr-2">+</span> New Order
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="glass rounded-xl p-2 inline-flex gap-2">
        {['All Orders', 'Open', 'Filled', 'Cancelled'].map((tab, idx) => (
          <button
            key={tab}
            className={`px-4 py-2 rounded-lg transition-all ${
              idx === 0
                ? 'bg-primary/20 text-white'
                : 'text-gray-400 hover:text-white hover:bg-white/5'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Orders Table */}
      <div className="glass-card">
        <div className="overflow-x-auto">
          <table className="table-modern">
            <thead>
              <tr>
                <th>Order ID</th>
                <th>Pair</th>
                <th>Type</th>
                <th>Side</th>
                <th>Price</th>
                <th>Amount</th>
                <th>Filled</th>
                <th>Status</th>
                <th>Time</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => (
                <tr key={order.id}>
                  <td className="font-mono text-primary-light">#{order.id}</td>
                  <td className="font-semibold">{order.pair}</td>
                  <td>
                    <span className="badge badge-warning">{order.type}</span>
                  </td>
                  <td>
                    <span className={`badge ${order.side === 'BUY' ? 'badge-success' : 'badge-danger'}`}>
                      {order.side}
                    </span>
                  </td>
                  <td className="font-mono">${order.price}</td>
                  <td className="font-mono">{order.amount}</td>
                  <td>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-2 bg-gray-700 rounded-full overflow-hidden">
                        <div
                          className={`h-full ${
                            order.filled === '100%' ? 'bg-green-500' : 'bg-yellow-500'
                          }`}
                          style={{ width: order.filled }}
                        ></div>
                      </div>
                      <span className="text-xs text-gray-400">{order.filled}</span>
                    </div>
                  </td>
                  <td>
                    <span className={`badge ${
                      order.status === 'Filled' ? 'badge-success' :
                      order.status === 'Partial' ? 'badge-warning' :
                      'badge-success'
                    }`}>
                      {order.status}
                    </span>
                  </td>
                  <td className="text-gray-400 text-sm">{order.time}</td>
                  <td>
                    {order.status === 'Open' || order.status === 'Partial' ? (
                      <button className="btn bg-red-500/20 hover:bg-red-500/30 text-red-400 text-sm px-3 py-1">
                        Cancel
                      </button>
                    ) : (
                      <button className="btn glass text-sm px-3 py-1">View</button>
                    )}
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
