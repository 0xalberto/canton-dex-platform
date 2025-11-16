import { useAccountStore } from '@store/accountStore'

export default function PortfolioPage() {
  const assets = useAccountStore((state) => state.assets)

  const totalValue = assets.reduce((sum, asset) => sum + asset.valueUsd, 0)

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Portfolio</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="card">
          <p className="text-sm text-gray-400">Total Portfolio Value</p>
          <p className="text-3xl font-bold">${totalValue.toFixed(2)}</p>
        </div>
        <div className="card">
          <p className="text-sm text-gray-400">Total Assets</p>
          <p className="text-3xl font-bold">{assets.length}</p>
        </div>
        <div className="card">
          <p className="text-sm text-gray-400">Top Asset</p>
          <p className="text-2xl font-bold">
            {assets.length > 0
              ? `${assets.reduce((max, a) => (a.valueUsd > max.valueUsd ? a : max)).symbol}`
              : 'N/A'}
          </p>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <h2 className="text-xl font-semibold">Asset Holdings</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-dark-700">
              <tr>
                <th className="text-left py-2">Asset</th>
                <th className="text-right py-2">Balance</th>
                <th className="text-right py-2">Locked</th>
                <th className="text-right py-2">Available</th>
                <th className="text-right py-2">USD Value</th>
                <th className="text-right py-2">Allocation %</th>
              </tr>
            </thead>
            <tbody>
              {assets.map((asset) => (
                <tr key={asset.symbol} className="border-b border-dark-700 hover:bg-dark-700">
                  <td className="py-3 font-semibold">{asset.symbol}</td>
                  <td className="text-right">{asset.balance.toFixed(8)}</td>
                  <td className="text-right text-warning-500">{asset.locked.toFixed(8)}</td>
                  <td className="text-right">{asset.available.toFixed(8)}</td>
                  <td className="text-right font-semibold">${asset.valueUsd.toFixed(2)}</td>
                  <td className="text-right">
                    {totalValue > 0 ? ((asset.valueUsd / totalValue) * 100).toFixed(1) : 0}%
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
